import React from 'react';
import ReactDOM from 'react-dom';
import { applyMiddleware, createStore } from 'redux';
import { Provider } from 'react-redux';
import { createLogger } from 'redux-logger';

import { Container, CssBaseline, Typography } from '@material-ui/core';
import {
  createMuiTheme,
  makeStyles,
  ThemeProvider,
} from '@material-ui/core/styles';

import MembersList from './MembersList';
import SocketConnection from './SocketConnection';
import VolumeControl from './VolumeControl';
import { reducer } from './reducer';

const logger = createLogger({ collapsed: true });
const store = createStore(reducer, applyMiddleware(logger));

const theme = createMuiTheme({ palette: { type: 'dark' } });
const useStyles = makeStyles((theme) => ({
  paper: {
    marginTop: theme.spacing(8),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  greeting: {},
}));

const urlParams = new URLSearchParams(window.location.search);
const name = urlParams.get('name');

const Session = () => {
  const classes = useStyles();
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <Container maxWidth="xs">
          <div className={classes.paper}>
            <CssBaseline />
            <Typography component="h1" variant="h5">
              Rehearse 2.0
            </Typography>
            <div className={classes.greeting}>Hi {name}</div>
            We are in session!
          </div>
          <MembersList></MembersList>
          <VolumeControl></VolumeControl>
        </Container>
        <SocketConnection store={store} />
      </ThemeProvider>
    </Provider>
  );
};

ReactDOM.render(<Session />, document.getElementById('root'));
