import child_process from 'child_process';
import React, { useEffect, useState } from 'react';
import { Button, withStyles } from '@material-ui/core';

import AudioLatencyExplanation from './AudioLatencyExplanation';

const styles = {
  message: {
    marginLeft: '5px',
  },
  latencyGood: {
    color: 'lightgreen',
  },
  latencyOk: {},
  latencyBad: {
    color: 'red',
  },
};

function grepLatency(data) {
  const result = [];
  const re = /latency (\d+)ms/gm;
  let match;
  while ((match = re.exec(data))) {
    result.push(match[1]);
  }
  return result;
}

function average(ary): number {
  const sum = ary.reduce((cum, l) => (cum += parseInt(l, 10)), 0);
  const avg = Math.ceil(sum / ary.length);
  return avg;
}

let output; // useState does not work :(

const AudioLatencyChecker = ({ classes }) => {
  const [isExplanationOpen, setExplanationOpen] = useState(false);
  const [isTesting, setTesting] = useState(false);
  const [child, setChild] = useState(null);
  const [latency, setLatency] = useState(0);

  useEffect(() => {
    return () => {
      if (child) {
        child.kill();
      }
    };
  }, [child]);

  const showExpanation = () => setExplanationOpen(true);
  const onCancel = () => setExplanationOpen(false);
  const onConfirm = () => {
    setExplanationOpen(false);
    startTesting();
  };

  const startTesting = () => {
    setLatency(0);
    setTesting(true);
    output = '';
    const child = child_process.spawn('alsabat', ['--roundtriplatency']);
    child.stdout.on('data', (msg) => {
      console.log('stdout:', msg.toString());
      output += msg.toString();
    });
    child.stderr.on('data', (msg) => {
      console.log(msg.toString());
    });
    child.on('close', () => {
      setTesting(false);
      const latencies = grepLatency(output);
      console.log('Measured latencies:', latencies);
      setLatency(average(latencies));
    });
  };

  const latencyClass = (latency) => {
    if (latency < 15) return classes.latencyGood;
    if (latency < 25) return classes.latencyOk;
    return classes.latencyBad;
  };

  return (
    <div>
      Check audio device latency:
      <div>
        <Button variant="contained" size="small" onClick={showExpanation}>
          Start
        </Button>
        <span className={classes.message}>
          {isTesting ? 'Measuring ...' : ''}
          <span className={latencyClass(latency)}>
            {latency ? `${latency} msec.` : ''}
          </span>
        </span>
      </div>
      <AudioLatencyExplanation
        open={isExplanationOpen}
        onCancel={onCancel}
        onConfirm={onConfirm}
      ></AudioLatencyExplanation>
    </div>
  );
};

export default withStyles(styles)(AudioLatencyChecker);
