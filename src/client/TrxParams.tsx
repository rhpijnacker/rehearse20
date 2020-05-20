import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Button, TextField } from '@material-ui/core';

import * as actions from './actions';

const Settings = () => {
  const [trxParams, setTrxParams] = useState('');
  const dispatch = useDispatch();

  const onChange = (event) => {
    const value = event.target.value;
    setTrxParams(value);
  };

  const onKeyUp = (event) => {
    if (event.keyCode === 13) {
      onApply();
      event.target.blur();
    }
  };

  const onApply = () => {
    dispatch(actions.setTrxParameters(trxParams));
  };

  return (
    <div>
      <TextField
        margin="normal"
        fullWidth
        label="Trx parameters"
        id="trx-params"
        variant="outlined"
        name="trx-params"
        value={trxParams}
        onChange={onChange}
        onKeyUp={onKeyUp}
      />
      <Button type="button" fullWidth onClick={onApply}>
        Apply
      </Button>
    </div>
  );
};

export default Settings;
