#!/usr/bin/env python3

import gi
gi.require_version('Gst', '1.0')
from gi.repository import Gst, GLib
Gst.init(None)

class RTPReceiver(object):

    def __init__(self, link_config, audio_interface):
        self.link_config = link_config
        self.audio_interface = audio_interface

        self.build_pipeline()

    def run(self):
        self.pipeline.set_state(Gst.State.PLAYING)
        Gst.debug_bin_to_dot_file(self.pipeline, Gst.DebugGraphDetails.ALL, 'rx-graph')
        print('Listening for stream on %s:%i' % (self.link_config.receiver_host, self.link_config.port))

    def loop(self):
        try:
            self.main_loop = GLib.MainLoop()
            self.main_loop.run()
        except Exception as e:
            print('Encountered a problem in the MainLoop, tearing down the pipeline: %s' % e)
            self.pipeline.set_state(Gst.State.NULL)

    def build_pipeline(self):
        self.pipeline = Gst.Pipeline.new('rx')
        
        self.started = False
        bus = self.pipeline.get_bus()
        
        self.transport = self.build_transport()
        self.decoder = self.build_decoder()
        self.output = self.build_audio_interface()

        self.pipeline.add(self.transport)
        self.pipeline.add(self.decoder)
        self.pipeline.add(self.output)
        self.transport.link(self.decoder)
        self.decoder.link(self.output)

        bus.add_signal_watch()
        bus.connect('message', self.on_message)

    def build_audio_interface(self):
        print('Building audio output bin')
        bin = Gst.Bin.new('audio')

        # Audio output
        if self.audio_interface.type == 'auto':
            sink = Gst.ElementFactory.make('autoaudiosink')
        elif self.audio_interface.type == 'alsa':
            sink = Gst.ElementFactory.make('alsasink')
            sink.set_property('device', self.audio_interface.alsa_device)
            sink.set_property('buffer-time', self.audio_interface.buffer_time * 1000)
            sink.set_property('sync', False) # True
        elif self.audio_interface.type == 'jack':
            sink = Gst.ElementFactory.make('jackaudiosink')
            if self.audio_interface.jack_auto:
                sink.set_property('connect', 'auto')
            else:
                sink.set_property('connect', 'none')
            sink.set_property('name', self.audio_interface.jack_name)
            sink.set_property('client-name', self.audio_interface.jack_name)
            if self.audio_interface.jack_port_pattern:
                sink.set_property('port-pattern', self.audio_interface.jack_port_pattern)
        elif self.audio_interface.type == 'pulse':
            sink = Gst.ElementFactory.make('pulsesink')
            sink.set_property('buffer-time', self.audio_interface.buffer_time * 1000)
            sink.set_property('sync', False) # True
        elif self.audio_interface.type == 'test':
            sink = Gst.ElementFactory.make('fakesink')

        bin.add(sink)
        
        # Audio resampling and conversion
        resample = Gst.ElementFactory.make('audioresample')
        resample.set_property('quality', 9)
        bin.add(resample)

        convert = Gst.ElementFactory.make('audioconvert')
        bin.add(convert)

        # Our level monitor, also used for continuous audio
        level = Gst.ElementFactory.make('level')
        level.set_property('message', True)
        level.set_property('interval', 1000000000)
        bin.add(level)

        resample.link(convert)
        convert.link(level)
        level.link(sink)        

        bin.add_pad(Gst.GhostPad.new('sink', resample.get_static_pad('sink')))

        return bin

    def build_decoder(self):
        print('Building decoder bin')
        bin = Gst.Bin.new('decoder')

        # Decoding and depayloading
        if self.link_config.encoding == 'opus':
            decoder = Gst.ElementFactory.make('opusdec', 'decoder')
            decoder.set_property('use-inband-fec', True)  # FEC
            decoder.set_property('plc', True)  # Packet loss concealment
            depayloader = Gst.ElementFactory.make(
                'rtpopusdepay', 'depayloader')
        elif self.link_config.encoding == 'pcm':
            depayloader = Gst.ElementFactory.make(
                'rtpL16depay', 'depayloader')
        else:
            print('Unknown encoding type %s' % self.link_config.encoding)
        
        bin.add(depayloader)

        bin.add_pad(Gst.GhostPad.new('sink', depayloader.get_static_pad('sink')))

        if 'decoder' in locals():
            bin.add(decoder)
            depayloader.link(decoder)
            bin.add_pad(Gst.GhostPad.new('src', decoder.get_static_pad('src')))
        else:
            bin.add_pad(Gst.GhostPad.new('src', depayloader.get_static_pad('src')))

        return bin

    def build_transport(self):
        print('Building RTP transport bin')
        bin = Gst.Bin.new('transport')

        caps = self.link_config.caps # get('caps').replace('\\', '')
        udpsrc_caps = Gst.Caps.from_string(caps)
        
        # Where audio comes in
        udpsrc = Gst.ElementFactory.make('udpsrc', 'udpsrc')
        udpsrc.set_property('port', self.link_config.port)
        udpsrc.set_property('caps', udpsrc_caps)
        udpsrc.set_property('timeout', 3000000000)
        udpsrc.set_property('do-timestamp', False)
        udpsrc.set_property('retrieve-sender-address', False)
        # if self.link_config.multicast:
            # udpsrc.set_property('auto_multicast', True)
            # udpsrc.set_property('multicast_group', self.link_config.receiver_host)
            # self.logger.info('Multicast mode enabled')
        bin.add(udpsrc)

        rtpbin = Gst.ElementFactory.make('rtpbin', 'rtpbin')
        rtpbin.set_property('latency', self.link_config.jitter_buffer)
        rtpbin.set_property('autoremove', True)
        rtpbin.set_property('do-lost', True)
        rtpbin.set_property('buffer-mode', 0) # 0 = none
        bin.add(rtpbin)

        udpsrc.link_pads('src', rtpbin, 'recv_rtp_sink_0')

        valve = Gst.ElementFactory.make('valve', 'valve')
        bin.add(valve)
        
        bin.add_pad(Gst.GhostPad.new('src', valve.get_static_pad('src')))
        # Attach callbacks for dynamic pads (RTP output) and busses
        rtpbin.connect('pad-added', self.rtpbin_pad_added)

        return bin

    # Our RTPbin won't give us an audio pad till it receives, so we need to
    # attach it here
    def rtpbin_pad_added(self, obj, pad):
        valve = self.transport.get_by_name('valve')
        rtpbin = self.transport.get_by_name('rtpbin')

        # Unlink first.
        rtpbin.unlink(valve)
        # Relink
        rtpbin.link(valve)

    def on_message(self, bus, message):
        if message.type == Gst.MessageType.ELEMENT:
            struct = message.get_structure()
            if struct != None:
                if struct.get_name() == 'level':
                    if self.started is False:
                        self.started = True
                        if len(struct.get_value('peak')) == 1:
                            print('Receiving mono audio transmission')
                        else:
                            print('Receiving stereo audio transmission')
                    else:
                        if len(struct.get_value('peak')) == 1:
                            print('Level: %.2f' % struct.get_value('peak')[0])
                        else:
                            print('Levels: L %.2f R %.2f' % (struct.get_value('peak')[0], struct.get_value('peak')[1]))

                if struct.get_name() == 'GstUDPSrcTimeout':
                    # Gst.debug_bin_to_dot_file(self.pipeline, Gst.DebugGraphDetails.ALL, 'rx-graph')                    
                    # Only UDP source configured to emit timeouts is the audio input
                    print('No data received for 3 seconds!')
                    if self.started:
                        print('Shutting down receiver for restart')
                        self.pipeline.set_state(Gst.State.NULL)
                        self.main_loop.quit()
        return True

if __name__ == '__main__':
    class AudioInterface(object):
        def __init__(self):
            self.interface_name = 'default'
            # self.type = 'auto'
            # self.type = 'alsa'
            self.alsa_device = 'hw:0'
            self.type = 'pulse'
            self.buffer_time = 6

    class Config(object):
        def __init__(self):
            self.encoding = 'opus'
            self.receiver_host = '192.168.2.6'
            self.port = 51350
            self.jitter_buffer = 4 # 40 ms
#            self.caps = 'application/x-rtp, media=(string)audio, clock-rate=(int)48000, encoding-name=(string)OPUS, sprop-maxcapturerate=(string)48000, sprop-stereo=(string)0, payload=(int)96, encoding-params=(string)2'
            self.caps = 'application/x-rtp, media=(string)audio, clock-rate=(int)48000, encoding-name=(string)OPUS, sprop-stereo=(string)0'

    receiver = RTPReceiver(Config(), AudioInterface())
    receiver.run()
    receiver.loop()
