import React from 'react';
import { connect } from 'react-redux';

const MemberList = ({ members }) => {
  return (
    <ul>
      {members.map((member) => (
        <li key={member.id}>{member.name}</li>
      ))}
    </ul>
  );
};

const mapStateToProps = (state) => ({
  members: state.members,
});

export default connect(mapStateToProps)(MemberList);
