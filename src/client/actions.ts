export const ADD_MEMBER = 'ADD_MEMBER';
export const REMOVE_MEMBER = 'REMOVE_MEMBER';

export const addMember = (member) => ({
  type: ADD_MEMBER,
  member,
});

export const removeMember = (member) => ({
  type: REMOVE_MEMBER,
  member,
});
