import child_process from 'child_process';

export default function ping(target) {
  return new Promise((resolve) => {
    let min, avg, max;
    const child = child_process.spawn('ping', [target, '-c', '10', '-A']);
    child.stdout.on('data', function (msg) {
      msg = msg.toString();
      console.log(`"${msg}"`);
      const match = msg.match(
        /rtt min\/avg\/max\/mdev = ([\d.]+)\/([\d.]+)\/([\d.]+)\/([\d.]+) ms/
      );
      if (match) {
        console.log('match', match)
        min = parseFloat(match[1]);
        avg = parseFloat(match[2]);
        max = parseFloat(match[3]);
      }
    });
    child.on('close', () => resolve({ min, avg, max }));
  });
}
