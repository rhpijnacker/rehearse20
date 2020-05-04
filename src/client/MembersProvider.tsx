import React from 'react';
import membersContext, { Member } from './membersContext';

const MembersProvider = (props) => {
  const [members, setMembers] = React.useState([]);

  const addMember = (member: Member) => {
    setMembers([...members, member]);
  };

  const removeMember = (member: Member) => {
    setMembers(members.filter((m) => m.id !== member.id));
  };

  return (
    <membersContext.Provider value={{ members, addMember, removeMember }}>
      {props.children}
    </membersContext.Provider>
  );
};

export default MembersProvider;
