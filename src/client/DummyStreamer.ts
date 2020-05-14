import { ChildProcess, spawn } from 'child_process';
import * as path from 'path';

import * as rtppacket from '../lib/rtppacket';

class DummyStreamer {
  ticker: NodeJS.Timeout;
  streamers: Map<string, ChildProcess>;

  constructor() {
    this.streamers = new Map();
  }

  startSending(id, localPort, remoteAddress, remotePort, ssrc?) {
    const child = this.trx(localPort, remoteAddress, remotePort, ssrc);
    child.on('close', (code) => {
      console.log(`trx exited with code ${code}`);
      this.streamers.delete(id);
      console.log('streamers:', this.streamers.keys());
    });

    this.streamers.set(id, child);
    console.log('streamers:', this.streamers.keys());
  }

  stopSending(id, address?) {
    const streamer = this.streamers.get(id);
    if (streamer) {
      streamer.kill();
    } else {
      console.log('??? No trx child?');
    }
  }

  stop() {
    this.streamers.forEach((child, id) => {
      this.stopSending(id);
    })
  }

  trx(localPort, remoteAddress, remotePort, ssrc) {
    return spawn('node', [
      path.join(__dirname, 'trx', 'dummy_trx.js'),
      localPort,
      remoteAddress,
      remotePort,
      ssrc,
    ]);
  }
}

export default DummyStreamer;
