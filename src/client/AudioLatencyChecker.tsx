import React, { useState } from 'react';
import { Button, withStyles } from '@material-ui/core';

import AudioLatencyExplanation from './AudioLatencyExplanation';
import AudioLatencyTest from './AudioLatencyTest';

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

const AudioLatencyChecker = ({ classes }) => {
  const [isExplanationOpen, setExplanationOpen] = useState(false);
  const [isTesting, setTesting] = useState(false);
  const [latency, setLatency] = useState(0);

  const showExpanation = () => setExplanationOpen(true);
  const onCancel = () => setExplanationOpen(false);
  const onConfirm = () => {
    setExplanationOpen(false);
    setLatency(0);
    setTesting(true);
  };

  const onCompleted = (latency) => {
    setTesting(false);
    setLatency(latency);
  };

  return (
    <div>
      Check audio device latency:
      <div>
        <Button variant="contained" size="small" onClick={showExpanation}>
          Start
        </Button>
        <span>{latency ? `${latency} msec.` : ''}</span>
        <AudioLatencyExplanation
          open={isExplanationOpen}
          onCancel={onCancel}
          onConfirm={onConfirm}
        ></AudioLatencyExplanation>
        <AudioLatencyTest
          show={isTesting}
          onCompleted={onCompleted}
        ></AudioLatencyTest>
      </div>
    </div>
  );
};

export default withStyles(styles)(AudioLatencyChecker);
