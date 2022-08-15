import moment from 'moment';
import Store from './infrastructures/Store';

/** @typedef {string | number} Id */

/**
 * @typedef {object} User
 * @property {Id} id
 */

/**
 * @typedef {Object} Task
 * @property {Id} id
 * @property {string} title
 */

const initialState = {
  reminderEnabled: true,
  reminderTimeInMinutes: 30,

  /** @type {'active' | 'locked' | 'idle'} */
  lastMachineStatus: 'active',

  /** @type {Id | null} */
  trackedTask: null,
  autoPauseResume: false,

  /** @type {Task | null} */
  is_working_on: null,
  reminder: moment().toISOString(),

  /** @type {User | null} */
  user: null,
  appkey: null,
  usertoken: null,
};

/** @typedef {typeof initialState} State */

/**
 * @param {State} state
 * @param {*} action
 * @returns {State}
 */
function reducer(state, action) {
  switch (action.type) {
    case 'STOP_TRACKING_TASK':
      return Object.assign({}, state, {
        trackedTask: null,
      });
    case 'TOGGLE_TRACKING_TASK':
      return Object.assign({}, state, {
        trackedTask:
          state.trackedTask === action.payload ? null : action.payload,
      });

    case 'SET_USER':
      return Object.assign({}, state, {
        user: action.payload,
      });

    case 'SET_WORKING_ON_TASK':
      return Object.assign({}, state, {
        is_working_on: action.payload,
      });

    case 'SET_REMINDER':
      return Object.assign({}, state, {
        reminder: moment(action.payload).toISOString(),
      });

    case 'SET_MACHINE_STATUS':
      return Object.assign({}, state, {
        lastMachineStatus: action.payload,
      });

    case 'UPDATE_OPTIONS': {
      const updatedState = Object.assign({}, state, {
        appkey: action.payload.appkey,
        usertoken: action.payload.usertoken,
        reminderEnabled: action.payload.reminderEnabled,
        reminderTimeInMinutes: action.payload.reminderTimeInMinutes,
        autoPauseResume: action.payload.autoPauseResume,
      });

      if (!action.payload.autoPauseResume) {
        updatedState.lastMachineStatus = 'active';
        updatedState.trackedTask = null;
      }

      return updatedState;
    }

    default:
      return state;
  }
}

const store = new Store(reducer, initialState);

store.init('options');

export default store;
