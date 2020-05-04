import React from 'react';

export interface Member {
  id: string;
  name: string;
}

export default React.createContext({
  members: [],
  addMember: undefined,
  removeMember: undefined
});
