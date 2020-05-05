import React, { useContext } from 'react';
import membersContext from './membersContext';

const MemberList = () => {
  const { members } = useContext(membersContext);

  console.log('MemberList', members.map((m) => m.name));
  return (
    <ul>
      {members.map((member) => (
        <li key={member.id}>{member.name}</li>
      ))}
    </ul>
  );
};

export default MemberList;