import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { List, Paper } from '@material-ui/core';
import { RootState } from './reducer';
import * as actions from './actions';
import MemberItem from './MemberItem';


const MemberList = () => {
  const members = useSelector((state: RootState) => state.members);
  const trxs = useSelector((state: RootState) => state.trx);
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
        {members.map((member) => {
          const trx = trxs[member.id];
          console.log('member', member, 'trx', trx);
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
