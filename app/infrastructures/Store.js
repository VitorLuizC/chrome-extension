// @ts-check

import Storage from './Storage';

/**
 * @template {{ [key: string]: any }} TState
 * @template {{ type: string, payload: any }} TAction
 */
class Store {
  /**
   * @param {(state: TState, action: TAction) => TState} reducer
   * @param {Partial<TState>} initialState
   */
  constructor(reducer, initialState) {
    this.reducer = reducer;

    this.state = /** @type {TState} */ (initialState);

    this._subscriptions = [];

    /** @type {Promise<void>} */
    this.initialization = new Promise((resolve) => {
      this._markAsInitialized = resolve;
    });
  }

  /**
   * Initializes the synchronization between the store and the storage.
   * @param {string} key
   * @returns {Promise<void>}
   */
  init(key) {
    if (this.storage) return this.initialization

    this.storage = /** @type {Storage<TState>} */ (
      new Storage(key, this.state)
    );

    this._unsubscribe = this.storage.subscribe(this._updateState);

    /** @type {Promise<void>} */
    return this.storage.load().then((state) => {
      this._updateState(state);
      this._markAsInitialized();
    });
  }

  /**
   * Subscribes into the store, and returns a function to unsubscribe.
   * @param {(state: TState) => void} handler
   * @returns {() => void}
   */
  subscribe(handler) {
    this._subscriptions.push(handler);

    return () => {
      const index = this._subscriptions.indexOf(handler);

      if (index === -1) return;

      this._subscriptions.splice(index, 1);
    };
  }

  /**
   * Updates the state and runs the subscriptions' handlers.
   * @param {TState} state
   */
  _updateState(state) {
    this.state = state;
    this._subscriptions.map((handler) => handler(state));
  }

  /**
   * Dispatches an action to the store.
   * @param {TAction} action
   */
  dispatch(action) {
    if (!this.storage) return;

    this.storage.update((state) => {
      const newState = this.reducer(state, action);
      this._updateState(newState);
      return newState;
    });
  }
}

export default Store;
