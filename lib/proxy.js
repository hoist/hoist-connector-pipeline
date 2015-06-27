'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _lodash = require('lodash');

var _hoistModel = require('@hoist/model');

var _hoistLogger = require('@hoist/logger');

var _hoistLogger2 = _interopRequireDefault(_hoistLogger);

var config = require('config');
var path = require('path');
var errors = require('@hoist/errors');
var Authorization = require('./authorization');
var fs = require('fs');

/**
 * a proxy class to the underlying connector
 */

var ConnectorProxy = (function () {
  /**
   * setup the connector proxy described by the {@link ConnectorSetting} object
   * @param {ConnectorSetting} connectorSetting - the settings for the underlying connector
   */

  function ConnectorProxy(connectorSetting) {
    _classCallCheck(this, ConnectorProxy);

    this._logger = _hoistLogger2['default'].child({
      cls: this.constructor.name,
      applicationId: connectorSetting.application,
      connectorKey: connectorSetting.key
    });
    this._connectorSetting = connectorSetting;
    var connectorsPath = path.resolve(config.get('Hoist.connectors.path'));
    var connectorPath = path.join(connectorsPath, connectorSetting.connectorType, config.get('Hoist.connectors.currentDirectoryName'));
    this._connectorPath = fs.realpathSync(connectorPath);
    this._settings = this._connectorSetting.settings;
  }

  _createClass(ConnectorProxy, [{
    key: 'init',

    /**
     * initialize this proxy instance
     * @param {Context} context - the current context
     * @returns {Promise<ConnectorProxy>} - this proxy object to allow chaining
     */
    value: function init(context) {
      var _this = this,
          _arguments = arguments;

      return Promise.resolve().then(function () {
        var ConnectorType = require(_this._connectorPath);
        _this._connector = new ConnectorType(_this._settings);
        var methods = (0, _lodash.filter)((0, _lodash.functions)(_this._connector), function (property) {
          if (property.startsWith('_') || property === 'receiveBounce' || _this[property]) {
            return false;
          } else {
            return true;
          }
        });
        methods.forEach(function (method) {
          /**
           * also has all methods of underlying connector
           */
          _this[method] = function () {
            _this._logger.info('proxying method ' + method);
            if (typeof _this._connector[method] !== 'function') {
              throw new errors.connector.request.UnsupportedError(method + ' method unsupported');
            }
            return _this._connector[method].apply(_this._connector, _arguments);
          };
        });
        if (context.bucket && context.bucket.meta && context.bucket.meta.authToken && context.bucket.meta.authToken[_this._connectorSetting.key]) {
          return _this.authorize(context.bucket.meta.authToken[_this._connectorSetting.key])['catch'](function (err) {
            _this._logger.error(err);
            if (err instanceof errors.connector.request.InvalidError) {
              return _this;
            } else {
              throw err;
            }
          });
        } else {
          return _this;
        }
      });
    }
  }, {
    key: 'authorize',

    /**
     * authorize the underlying connector
     * @param {Authorization|String} token - either the authorization object or a bouncer token key
     * @returns {Promise<ConnectorProxy>} - this
     */
    value: function authorize(token) {
      var _this2 = this;

      if (typeof this._connector.authorize !== 'function') {
        return Promise.resolve(this);
      }
      if (typeof token === 'string') {
        return _hoistModel.BouncerToken.findOneAsync({
          key: token
        }).then(function (bouncerToken) {
          if (!bouncerToken) {
            throw new errors.connector.request.InvalidError('the authorization token provided is not valid');
          }
          return _this2._connector.authorize(new Authorization(bouncerToken));
        }).then(function () {
          return _this2;
        });
      } else {
        return Promise.resolve(this._connector.authorize(token)).then(function () {
          return _this2;
        });
      }
    }
  }]);

  return ConnectorProxy;
})();

exports['default'] = ConnectorProxy;

/**
 * @external {ConnectorSetting} https://github.com/hoist/hoist-model/blob/master/lib/models/connector_setting.js
 */
/**
 * @external {Context} https://github.com/hoist/hoist-context/blob/master/lib/index.js
 */
module.exports = exports['default'];
//# sourceMappingURL=proxy.js.map