import * as actions from './actions';
import { combineReducers } from 'redux';

const members = (state = [], action) => {
  switch (action.type) {
    case actions.ADD_MEMBER:
      return [...state, action.member];
    case actions.REMOVE_MEMBER:
      const result = state.filter((member) => member.id !== action.member.id);
      return result;
    default:
      return state;
  }
};

export default combineReducers({ members });
