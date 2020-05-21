import child_process from 'child_process';
import React, { useEffect, useState } from 'react';

const AudioLatencyTest = (props) => {
  const { show, onCompleted } = props;
  const [output, setOutput] = useState('');

  useEffect(() => {
    setOutput('');
    const child = child_process.spawn('alsabat', ['--roundtriplatency']);
    child.stdout.on('data', (msg) => {
      console.log(msg.toString());
      setOutput(output + msg.toString());
    });
    child.stderr.on('data', (msg) => {
      console.log(msg.toString());
    });

    const timer = setTimeout(() => onCompleted(15), 5000);
    return () => {
      clearTimeout(timer);
      child.kill();
    };
  }, [show]);

  return <div>{output}</div>;
};

export default AudioLatencyTest;
