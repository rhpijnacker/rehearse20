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

const trx = (state = {}, action) => {
  const current = state[action.id] || {};
  // console.log(current);
  switch (action.type) {
    case actions.START_RECVING:
      return {
        ...state,
        [action.id]: {
          ...current,
          rxPort: action.port || current.rxPort,
          isRecving: true,
        },
      };
    case actions.STOP_RECVING:
      return {
        ...state,
        [action.id]: {
          ...current,
          isRecving: false,
        },
      };
    case actions.START_SENDING:
      return {
        ...state,
        [action.id]: {
          ...current,
          txAddress: action.address || current.txAddress,
          txPort: action.port || current.txPort,
          isSending: true,
        },
      };
    case actions.STOP_SENDING:
      return {
        ...state,
        [action.id]: {
          ...current,
          isSending: false,
        },
      };
    default:
      return state;
  }
};

const trxParameters = (state = '', action) => {
  switch (action.type) {
    case actions.SET_TRX_PARAMETERS:
      return action.trxParameters;
    default:
      return state;
  }
};

const volume = (state = { isMuted: false }, action) => {
  switch (action.type) {
    case actions.MUTE_MICROPHONE:
      return { isMuted: true };
    case actions.UNMUTE_MICROPHONE:
      return { isMuted: false };
    case actions.TOGGLE_MICROPHONE:
      return { isMuted: !state.isMuted };
    default:
      return state;
  }
};

export default combineReducers({ members, trx, trxParameters, volume });
