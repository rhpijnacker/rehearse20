import * as child_process from 'child_process';

const TRX = 'trx'; // trx|gst-python

class TrxStreamer {
  streamers: any;
  rx: any;
  tx: any;

  constructor() {
    // { <id>: { rx: <ChildProcess>, tx: <ChildProcess> }, ... }
    this.streamers = {};
    if (TRX == 'trx') {
      this.rx = this.trxRx;
      this.tx = this.trxTx;
    } else {
      this.rx = this.gstPyRx;
      this.tx = this.gstPyTx;
    }
  }

  startReceiving(id, address, port) {
    const child = this.rx(address, port);
    this.streamers[id] = { rx: child, ...this.streamers[id] };
    console.log(this.streamers);
    child.on('close', (code) => {
      console.log(`rx exited with code ${code}`);
      this.streamers[id].rx = undefined;
      this.cleanup();
      console.log(this.streamers);
    });
  }

  stopReceiving(id, address = '') {
    const child = this.streamers[id].rx;
    if (child) {
      child.kill();
    } else {
      console.log('??? No rx child?');
    }
  }

  startSending(id, address, port) {
    const child = this.tx(address, port);
    this.streamers[id] = { tx: child, ...this.streamers[id] };
    console.log(this.streamers);
    child.on('close', (code) => {
      console.log(`tx exited with code ${code}`);
      this.streamers[id].tx = undefined;
      this.cleanup();
      console.log(this.streamers);
    });
  }

  stopSending(id, address = '') {
    const child = this.streamers[id].tx;
    if (child) {
      child.kill();
    } else {
      console.log('??? No tx child?');
    }
  }

  stop() {
    Object.keys(this.streamers).forEach((key) => {
      this.stopReceiving(key);
      this.stopSending(key);
    });
  }

  cleanup() {
    const ids = Object.keys(this.streamers).filter((id) => {
      const streams = this.streamers[id];
      return streams.rx || streams.tx;
    });
    this.streamers = ids.reduce((accum, id) => {
      accum[id] = this.streamers[id];
      return accum;
    }, {});
  }

  trxRx(address, port) {
    console.log(`${__dirname}/trx/rx`, ['-m', 2, '-j', 4, '-p', port]);
    return child_process.spawn(`${__dirname}/trx/rx`, [
      '-m',
      2,
      '-j',
      4,
      '-p',
      port,
    ]);
  }

  trxTx(address, port) {
    console.log(`${__dirname}/trx/tx`, ['-m', 2, '-j', 4, '-p', port]);
    return child_process.spawn(`${__dirname}/trx/tx`, [
      '-c',
      1,
      '-m',
      2,
      '-h',
      address,
      '-p',
      port,
    ]);
  }

  gstPyRx(address, port) {
    console.log('python3', [`${__dirname}/trx/rx.py`, address, port]);
    return child_process.spawn('python3', [
      `${__dirname}/trx/rx.py`,
      address,
      port,
    ]);
  }
  gstPyTx(address, port) {
    console.log('python3', [`${__dirname}/trx/tx.py`, address, port]);
    return child_process.spawn('python3', [
      `${__dirname}/trx/tx.py`,
      address,
      port,
    ]);
  }
}

export default TrxStreamer;
