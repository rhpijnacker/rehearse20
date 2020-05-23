import { ChildProcess, spawn } from 'child_process';
import * as path from 'path';
import * as dgram from 'dgram';

interface StreamerData {
  localPort: number;
  remoteAddress: number;
  remotePort: number;
  ssrc: Number;
}

class MediaStreamer {
  streamers: Map<string, StreamerData>;
  child: ChildProcess;
  timer: NodeJS.Timeout;
  extra: string;

  constructor() {
    this.streamers = new Map();
  }

  startSending(id, localPort, remoteAddress, remotePort, ssrc, extra = '') {
    this.streamers.set(id, {
      localPort,
      remoteAddress,
      remotePort,
      ssrc,
    });
    this.restartTrx(extra);
  }

  stopSending(id, address?) {
    const wasPresent = this.streamers.delete(id);
    if (wasPresent) {
      this.restartTrx(this.extra);
    }
  }

  stop() {
    this.stopTrx();
  }

  restartTrx(extraParams) {
    this.stopTrx();
    this.extra = extraParams;
    this.startTrx();
  }

  startTrx() {
    this.child = this.trx();
    if (this.child) {
      this.child.on('close', (code) => {
        console.log(`trx exited with code ${code}`);
      });
      this.timer = setInterval(() => this.child.kill('SIGUSR1'), 5000);
    }
  }

  stopTrx() {
    if (this.child) {
      this.child.kill();
      this.child = null;
    } else {
      console.log('??? No trx child?');
    }
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  trx() {
    let clientStrings = [...this.streamers.entries()].map(
      ([id, streamer]) =>
        `${streamer.ssrc}@${streamer.localPort}!${streamer.remoteAddress}:${streamer.remotePort}`
    );
    console.log(path.join(__dirname, 'trx', 'trx'), [
      '-x',
      clientStrings.join(','),
      ...this.extra.split(' '),
    ]);
    const child = spawn(path.join(__dirname, 'trx', 'trx'), [
      '-X',
      clientStrings.join(','),
      ...this.extra.split(' '),
    ]);
    child.stdout.on('data', (data) => console.log(data.toString()));
    child.stderr.on('data', (data) => console.error(data.toString()));
    return child;
  }

  restart(extraParams: string) {
    // need to make shallow copy first :/
    [...this.streamers.entries()].forEach(([id, streamer]) => {
      this.stopSending(id);
      this.startSending(
        id,
        streamer.localPort,
        streamer.remoteAddress,
        streamer.remotePort,
        streamer.ssrc,
        extraParams
      );
    });
  }
}

export default MediaStreamer;
