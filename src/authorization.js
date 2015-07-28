'use strict';
import Bluebird from 'bluebird';

/**
 * accessor class for authorization over a {@link BouncerToken}
 */
class Authorization {
  /**
   *@param {BouncerToken} token - the underlying bouncer token
   */
  constructor(token) {
    this._token = token;
  }

  /**
   * set and save a value against the bouncer token
   * @param {string} key - the key to save against
   * @param {object} value - the value to save
   * @param {function(auth:Authorization)} [callback] - a callback to call after data is saved
   * @returns {Promise<Authorization} - return the authorization once data has been saved
   */
  set(key, value, callback) {
    this._token.state[key] = value;
    this._token.markModified('state');
    return Bluebird.resolve(
        this._token.saveAsync()
        .then(() => {
          return this;
        }))
      .nodeify(callback);
  }

  /**
   * get a value associated with a key
   * @param {String} key - the key that the value is saved against
   * @returns {object}
   */
  get(key) {
    return this._token.state[key];
  }

  /**
   * delete a key in a bouncer token
   * @param {string} key - the key to save against
   * @param {function(auth:Authorization)} [callback] - a callback to call after data is deleted
   * @returns {Promise<Authorization} - return the authorization once data has been deleted
   */
  delete(key, callback) {
    delete this._token.state[key];
    this._token.markModified('state');
    return Bluebird.resolve(
        this._token.saveAsync()
        .then(() => {
          return this;
        }))
      .nodeify(callback);
  }
}

export default Authorization;
