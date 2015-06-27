'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

/**
 * accessor class for authorization over a {@link BouncerToken}
 */

var Authorization = (function () {
  /**
   *@param {BouncerToken} token - the underlying bouncer token
   */

  function Authorization(token) {
    _classCallCheck(this, Authorization);

    this._token = token;
  }

  _createClass(Authorization, [{
    key: 'set',

    /**
     * set and save a value against the bouncer token
     * @param {string} key - the key to save against
     * @param {object} value - the value to save
     * @param {function(auth:Authorization)} [callback] - a callback to call after data is saved
     * @returns {Promise<Authorization} - return the authorization once data has been saved
     */
    value: function set(key, value, callback) {
      var _this = this;

      this._token.state[key] = value;
      this._token.markModified('state');
      return _bluebird2['default'].resolve(this._token.saveAsync().then(function () {
        return _this;
      })).nodeify(callback);
    }
  }, {
    key: 'get',

    /**
     * get a value associated with a key
     * @param {String} key - the key that the value is saved against
     * @returns {object}
     */
    value: function get(key) {
      return this._token.state[key];
    }
  }, {
    key: 'delete',

    /**
     * delete a key in a bouncer token
     * @param {string} key - the key to save against
     * @param {function(auth:Authorization)} [callback] - a callback to call after data is deleted
     * @returns {Promise<Authorization} - return the authorization once data has been deleted
     */
    value: function _delete(key, callback) {
      var _this2 = this;

      delete this._token.state[key];
      this._token.markModified('state');
      return _bluebird2['default'].resolve(this._token.saveAsync().then(function () {
        return _this2;
      })).nodeify(callback);
    }
  }]);

  return Authorization;
})();

exports['default'] = Authorization;
module.exports = exports['default'];
//# sourceMappingURL=authorization.js.map