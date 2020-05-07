import React from 'react';
import { IconButton } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Mic, MicOff } from '@material-ui/icons';
import { useDispatch, useSelector } from 'react-redux';

import * as actions from './actions';

const useStyles = makeStyles({
  centerContent: {
    display: 'flex',
    justifyContent: 'center',
    width: '100%'
  }
});

const VolumeControl = () => {
  const classes = useStyles();
  const volume = useSelector((state) => state.volume);
  const dispatch = useDispatch();

  return (
    <div className={classes.centerContent}>
    <IconButton onClick={() => dispatch(actions.toggleMicrophone())}>
      {volume.isMuted ? (
        <MicOff fontSize="large"></MicOff>
      ) : (
        <Mic fontSize="large"></Mic>
      )}
    </IconButton></div>
  );
};

export default VolumeControl;
