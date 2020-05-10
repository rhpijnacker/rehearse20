import child_process from 'child_process';

interface PingResults {
  min: number;
  avg: number;
  max: number;
}

export default function ping(target): Promise<PingResults> {
  return new Promise((resolve) => {
    let min, avg, max;
    const args =
      process.platform === 'win32'
        ? [target, '-n', '10']
        : [target, '-c', '10', '-A'];
    const child = child_process.spawn('ping', args);
    child.stdout.on('data', function (msg) {
      msg = msg.toString();
      console.log(`"${msg}"`);
      if (process.platform === 'win32') {
        const match = msg.match(
          /Minimum = (\d+)ms, Maximum = (\d+)ms, Average = (\d+)ms/
        );
        if (match) {
          min = parseInt(match[1]);
          max = parseInt(match[2]);
          avg = parseInt(match[3]);
        }
      } else {
        const match = msg.match(
          /rtt min\/avg\/max\/mdev = ([\d.]+)\/([\d.]+)\/([\d.]+)\/([\d.]+) ms/
        );
        if (match) {
          min = parseFloat(match[1]);
          avg = parseFloat(match[2]);
          max = parseFloat(match[3]);
        }
      }
    });
    child.on('close', () => resolve({ min, avg, max }));
  });
}
