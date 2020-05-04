import React, { useState } from 'react';
import ReactDOM from 'react-dom';

import {
  Button,
  Container,
  CssBaseline,
  TextField,
  Typography,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

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

const Index = () => {
  const classes = useStyles();

  const [name, setName] = useState('');
  const [isSubmitAllowed, setSubmitAllowed] = useState(false);

  const onChange = (event) => {
    const value = event.target.value;
    setName(value);
    setSubmitAllowed(!!value);
  };

  const onSubmit = (event) => {
    event.preventDefault();
    navigateToSession();
  };

  const navigateToSession = () => {
    if (name) {
      location.href = `session.html?name=${name}`;
    }
  };

  return (
    <Container maxWidth="xs">
      <div className={classes.paper}>
        <CssBaseline />
        <Typography component="h1" variant="h5">
          Join session
        </Typography>
        <form className={classes.form} onSubmit={onSubmit}>
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            label="Your name"
            id="name"
            name="name"
            autoComplete="given-name"
            autoFocus
            onChange={onChange}
          />
          <Button
            disabled={!isSubmitAllowed}
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            className={classes.submit}
          >
            Enter
          </Button>
        </form>
      </div>
    </Container>
  );
};

ReactDOM.render(<Index />, document.getElementById('root'));
