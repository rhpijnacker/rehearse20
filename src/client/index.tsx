import React, { useState } from 'react';
import ReactDOM from 'react-dom';

const Index = () => {
  const [name, setName] = useState('');

  const onKeyUp = (event) => {
    console.log(event.target.value);
    if (event.key === 'Enter') {
      navigateToSession();
    } else {
      setName(event.target.value);
    }
  };

  const onClick = () => navigateToSession();

  const navigateToSession = () => {
    if (name) {
      location.href = `session.html?name=${name}`;
    }
  };

  return (
    <div>
      <h1>Rehearse 2.0</h1>
      <label>
        Your name: <input type="text" onKeyUp={onKeyUp}></input>
      </label>
      <button disabled={!name} onClick={onClick}>
        Enter
      </button>
    </div>
  );
};

ReactDOM.render(<Index />, document.getElementById('root'));
