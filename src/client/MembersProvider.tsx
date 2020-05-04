import React, { useState } from 'react';
import PropTypes from 'prop-types';
import membersContext, { Member } from './membersContext';

const MembersProvider = (props) => {
  const [members, setMembers] = useState([]);

  const addMember = (member: Member) => {
    const updated = [...members, member];
    console.log('addMember:', members, updated);
    setMembers(updated);
  };

  const removeMember = (member: Member) => {
    const updated = members.filter((m) => m.id !== member.id);
    console.log('removeMember:', members, updated);
    setMembers(updated);
  };

  return (
    <membersContext.Provider value={{ members, addMember, removeMember }}>
      {props.children}
    </membersContext.Provider>
  );
};

MembersProvider.propTypes = {
  children: PropTypes.node,
};

export default MembersProvider;
