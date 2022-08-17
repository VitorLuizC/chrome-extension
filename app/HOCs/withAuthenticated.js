import React, { Component } from 'react';
import store from '../store';

/**
 * @typedef {import('react').ComponentType<TProps>} ComponentType
 * @template TProps
 */

/**
 * @param {ComponentType<TProps & { authenticated: boolean }>} Wrapped
 * @returns {ComponentType<TProps>}
 * @template TProps
 */
function withAuthenticated(Wrapped) {
  return class extends Component {
    constructor(props) {
      super(props);

      this.state = {
        authenticated: Boolean(store.state.appkey && store.state.usertoken),
      };
    }

    componentDidMount() {
      this.unsubscribe = store.subscribe((state) => {
        this.setState({
          authenticated: Boolean(state.appkey && state.usertoken),
        });
      });
    }

    componentWillUnmount() {
      if (!this.unsubscribe) return;

      this.unsubscribe();
    }

    render() {
      /** @type {TProps & { authenticated: boolean }} */
      const props = Object.assign({}, this.props, {
        authenticated: this.state.authenticated,
      });

      return <Wrapped {...props} />;
    }
  };
}

export default withAuthenticated;
