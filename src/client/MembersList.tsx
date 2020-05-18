import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { List, Paper } from '@material-ui/core';
import * as actions from './actions';
import MemberItem from './MemberItem';

const MemberList = () => {
  const members = useSelector((state) => state.members);
  const trxs = useSelector((state) => state.trx);
  const dispatch = useDispatch();

  const onVolumeClick = (id) => {
    console.log('volume click');
    const isRecving = trxs[id].isRecving;
    if (isRecving) {
      dispatch(actions.stopRecving(id));
    } else {
      dispatch(actions.startRecving(id));
    }
  };

  return (
    <Paper>
      <List>
        {members.length === 0
          ? 'Waiting for others to join...'
          : members.map((member) => {
              const trx = trxs[member.id];
              return (
                <MemberItem
                  key={member.id}
                  member={member}
                  trx={trx}
                  onVolumeClick={onVolumeClick}
                />
              );
            })}
      </List>
    </Paper>
  );
};

export default MemberList;
