import * as actions from './actions';
import { combineReducers } from 'redux';

const members = (state = [], action) => {
  switch (action.type) {
    case actions.ADD_MEMBER:
      return [...state, action.member];
    case actions.REMOVE_MEMBER:
      return state.filter((member) => member.id !== action.member.id);
    case actions.CLEAR_MEMBERS:
      return [];
    default:
      return state;
  }
};

export default combineReducers({ members });
