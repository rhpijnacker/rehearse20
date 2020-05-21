import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@material-ui/core';

const AudioLatencyExplanation = (props) => {
  const { open, onCancel, onConfirm } = props;

  return (
    <div>
      <Dialog
        open={open}
        onClose={onCancel}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {'Audio latency test'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Connect an audio cable from the line-out to the line-in.
            <br />
            Or, plug a headset in the line-out and keep it (really) close the
            the microphone.
            <br />
            <br />A number of audio pulses will be played, which will be
            recorded by the microphone to measure the latency.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={onConfirm} color="primary" autoFocus>
            Start
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AudioLatencyExplanation;
