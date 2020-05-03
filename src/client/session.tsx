import React from 'react';
import ReactDOM from 'react-dom';
// import  './SocketConnection';

const urlParams = new URLSearchParams(window.location.search);
const name = urlParams.get('name');

const Session = () => {
  return (
    <div>
      <h1>Rehearse 2.0</h1>
      <div className="greeting">Hi {name}</div>
      We are in session!
    </div>
  );
};

ReactDOM.render(<Session />, document.getElementById('root'));
