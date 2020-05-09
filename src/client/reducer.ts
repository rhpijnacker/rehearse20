import * as actions from './actions';
import { combineReducers } from 'redux';

export interface TrxState {
  rxPort: number;
  txPort: number;
  txAddress: string;
  isRecving: boolean;
  isSending: boolean;
};

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

const initialTrxState: TrxState = {
  txAddress: "",
  txPort: 0,
  rxPort: 0,
  isRecving: false,
  isSending: false
};

const trx = (state = [], action) => {
  const current = state[action.id] || initialTrxState;
  console.log("trx", action, state, current);
  switch (action.type) {
    case actions.ADD_MEMBER:
      return {
        ...state,
        [action.member.id]: {
          ...current
        }
      };
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

export const reducer = combineReducers({ members, trx, volume });

export type RootState = ReturnType<typeof reducer>;
