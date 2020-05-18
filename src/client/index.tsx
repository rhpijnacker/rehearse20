import React, { useState } from 'react';
import ReactDOM from 'react-dom';

import {
  Button,
  Container,
  CssBaseline,
  Link,
  TextField,
  Typography,
} from '@material-ui/core';
import {
  createMuiTheme,
  makeStyles,
  ThemeProvider,
} from '@material-ui/core/styles';
import * as color from '@material-ui/core/colors';

const theme = createMuiTheme({
  palette: { type: 'dark', primary: { main: color.lightBlue['300'] } },
});

const useStyles = makeStyles((theme) => ({
  paper: {
    marginTop: theme.spacing(8),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  form: {
    width: '100%', // Fix IE 11 issue.
    marginTop: theme.spacing(1),
  },
  submit: {},
}));

const urlParams = new URLSearchParams(window.location.search);
console.log(urlParams.get('name'), urlParams.get('sessionId'));

const Index = () => {
  const classes = useStyles();

  const [name, setName] = useState(urlParams.get('name') || '');
  const [sessionId, setSessionId] = useState(urlParams.get('sessionId') || '');
  const [isSubmitAllowed, setSubmitAllowed] = useState(!!name && !!sessionId);

  const onNameChange = (event) => {
    const value = event.target.value;
    setName(value);
    setSubmitAllowed(!!value && !!sessionId);
  };

  const onSessionIdChange = (event) => {
    const value = event.target.value;
    setSessionId(value);
    setSubmitAllowed(!!value && !!name);
  };

  const onSubmit = (event) => {
    event.preventDefault();
    navigateToSession();
  };

  const navigateToSession = () => {
    if (name) {
      location.href = `session.html?name=${name}&sessionId=${sessionId}`;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="xs">
        <div className={classes.paper}>
          <CssBaseline />
          <Typography component="h1" variant="h5">
            Join session
          </Typography>
          <form className={classes.form} onSubmit={onSubmit}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Your name"
              id="name"
              name="name"
              value={name}
              autoComplete="given-name"
              autoFocus
              onChange={onNameChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Session ID"
              id="sessionId"
              name="sessionId"
              value={sessionId}
              onChange={onSessionIdChange}
            />
            <Button
              disabled={!isSubmitAllowed}
              type="submit"
              fullWidth
              className={classes.submit}
            >
              Enter
            </Button>
          </form>
          <Link href="settings.html">Settings</Link>
        </div>
      </Container>
    </ThemeProvider>
  );
};

ReactDOM.render(<Index />, document.getElementById('root'));
