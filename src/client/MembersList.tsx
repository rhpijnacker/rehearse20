import React from 'react';
import { connect } from 'react-redux';

import { List, ListItem, Paper } from '@material-ui/core';

const MemberList = ({ members }) => {
  return (
    <Paper>
      <List>
        {members.map((member) => (
          <ListItem key={member.id}>{member.name}</ListItem>
        ))}
      </List>
    </Paper>
  );
};

const mapStateToProps = (state) => ({
  members: state.members,
});

export default connect(mapStateToProps)(MemberList);
