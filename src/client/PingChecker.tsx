import React, { useState } from 'react';

import { Button } from '@material-ui/core';

import ping from './ping';

const PING_HOST = 'rehearse20.sijben.dev'

const PingChecker = () => {
    const [isPinging, setIsPingBusy] = useState(false);
  const [averagePing, setAveragePing] = useState(0);

  const startPing = () => {
    setIsPingBusy(true);
    setAveragePing(undefined);
    ping(PING_HOST).then(results => {
      setIsPingBusy(false);
      setAveragePing(results.avg);
    });
  };

  return (
    <div>
      Check network latency:
      <Button onClick={startPing}>Start</Button>
      {isPinging  ? 'Measuring ...' : ''}
      {averagePing ? `${averagePing} msec.` : ''}
    </div>
  );
};

export default PingChecker;
