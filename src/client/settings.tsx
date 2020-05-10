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

import PingChecker from './PingChecker';

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

const Settings = () => {
  const classes = useStyles();

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="xl">
        <CssBaseline />
        <PingChecker />
        <Link href="index.html">&lt; Back</Link>
      </Container>
    </ThemeProvider>
  );
};

ReactDOM.render(<Settings />, document.getElementById('root'));
