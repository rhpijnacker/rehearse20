import React, { useState } from 'react';

import { Button, withStyles } from '@material-ui/core';

import ping from './ping';

const PING_HOST = 'rehearse20.sijben.dev';

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

const PingChecker = ({ classes }) => {
  const [isPinging, setIsPingBusy] = useState(false);
  const [averagePing, setAveragePing] = useState(0);

  const startPing = () => {
    setIsPingBusy(true);
    setAveragePing(undefined);
    ping(PING_HOST).then((results) => {
      setIsPingBusy(false);
      setAveragePing(results.avg);
    });
  };

  const pingClass = (ping) => {
    if (ping < 10) return classes.latencyGood;
    if (ping < 20) return classes.latencyOk;
    return classes.latencyBad;
  };

  return (
    <div>
      Check network latency:
      <div>
        <Button variant="contained" size="small" onClick={startPing}>
          Start
        </Button>
        <span className={classes.message}>
          {isPinging ? 'Measuring ...' : ''}
          <span className={pingClass(averagePing)}>
            {averagePing ? `${averagePing} msec.` : ''}
          </span>
        </span>
      </div>
    </div>
  );
};

export default withStyles(styles)(PingChecker);
