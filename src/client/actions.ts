export const ADD_MEMBER = 'ADD_MEMBER';
export const REMOVE_MEMBER = 'REMOVE_MEMBER';
export const CLEAR_MEMBERS = 'CLEAR_MEMBERS';

export const addMember = (member) => ({
  type: ADD_MEMBER,
  member,
});

export const removeMember = (member) => ({
  type: REMOVE_MEMBER,
  member,
});

export const clearMembers = () => ({ type: CLEAR_MEMBERS });
