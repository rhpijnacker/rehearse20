import React from 'react';

import { IconButton, ListItem, Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import {
  CallMade,
  CallReceived,
  VolumeOff,
  VolumeUp,
} from '@material-ui/icons';

const useStyles = makeStyles({
  box: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  alignRight: {
    // alignSelf: 'flex-end',
    marginLeft: 'auto',
  },
});

const MemberItem = ({ member, trx, onVolumeClick }) => {
  const classes = useStyles();

  const isRecving = trx.isRecving || false;
  const isSending = trx.isSending || false;

  const onClick = () => {
    onVolumeClick(member.id);
  };

  return (
    <ListItem>
      <div className={classes.box}>
        <IconButton onClick={onClick}>
          {isRecving ? <VolumeUp /> : <VolumeOff />}
        </IconButton>
        {member.name}
        <Box component="span" className={classes.alignRight}>
          <CallReceived color={isRecving ? 'primary' : 'error'}></CallReceived>
          <CallMade color={isSending ? 'primary' : 'error'}></CallMade>
        </Box>
      </div>
    </ListItem>
  );
};

export default MemberItem;
