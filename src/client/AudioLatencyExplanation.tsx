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
            To start the audio latency test, plugin a headset in the audio
            output and keep it (really) close the the microphone. A number of
            audio pulses will be played, that will be recorded by the microphone
            to measure the latency.
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
