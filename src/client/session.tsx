import React from 'react';
import ReactDOM from 'react-dom';

import { Container, CssBaseline, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import MembersList from './MembersList';
import MembersProvider from './MembersProvider';
import SocketConnection from './SocketConnection';

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
    <MembersProvider>
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
      </Container>
      <SocketConnection />
    </MembersProvider>
  );
};

ReactDOM.render(<Session />, document.getElementById('root'));
