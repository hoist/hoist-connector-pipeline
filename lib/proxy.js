'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _config = require('config');

var _config2 = _interopRequireDefault(_config);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _errors = require('@hoist/errors');

var _errors2 = _interopRequireDefault(_errors);

var _authorization = require('./authorization');

var _authorization2 = _interopRequireDefault(_authorization);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _redisLock = require('redis-lock');

var _redisLock2 = _interopRequireDefault(_redisLock);

var _redis = require('redis');

var _redis2 = _interopRequireDefault(_redis);

var _redisSentinelClient = require('redis-sentinel-client');

var _redisSentinelClient2 = _interopRequireDefault(_redisSentinelClient);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _lodash = require('lodash');

var _model = require('@hoist/model');

var _logger = require('@hoist/logger');

var _logger2 = _interopRequireDefault(_logger);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function createRedisClient() {
  if (_config2.default.has('Hoist.redis.clustered') && _config2.default.get('Hoist.redis.clustered')) {
    return _redisSentinelClient2.default.createClient({
      host: _config2.default.get('Hoist.redis.host'),
      port: _config2.default.get('Hoist.redis.port'),
      masterName: _config2.default.get('Hoist.redis.masterName')
    });
  } else {
    return _redis2.default.createClient(_config2.default.get('Hoist.redis.port'), _config2.default.get('Hoist.redis.host'));
  }
}

/**
 * a proxy class to the underlying connector
 */

var ConnectorProxy = function () {

  /**
   * setup the connector proxy described by the {@link ConnectorSetting} object
   * @param {ConnectorSetting} connectorSetting - the settings for the underlying connector
   */

  function ConnectorProxy(connectorSetting) {
    _classCallCheck(this, ConnectorProxy);

    this._logger = _logger2.default.child({
      cls: this.constructor.name,
      applicationId: connectorSetting.application,
      connectorKey: connectorSetting.key
    });
    this._connectorSetting = connectorSetting;
    var connectorsPath = _path2.default.resolve(_config2.default.get('Hoist.filePaths.connectors'));
    var connectorPath = _path2.default.join(connectorsPath, connectorSetting.connectorType, 'current');
    this._connectorPath = _fs2.default.realpathSync(connectorPath);
    this._settings = this._connectorSetting.settings;
  }

  _createClass(ConnectorProxy, [{
    key: '_refreshCredentials',
    value: function _refreshCredentials() {
      var _this = this;

      //reload the connector settings to see if they've been refreshed
      //only one server will go into this step at a time
      var refreshed = void 0;
      var client = void 0;
      return Promise.resolve().then(function () {
        if (!_this._bouncerToken) {
          throw new Error('Connector is not authorized');
        }
        client = createRedisClient();
        return new Promise(function (resolve) {
          (0, _redisLock2.default)(client)('connector-refresh-' + _this._connectorSetting._id, 10000, function (done) {
            refreshed = done;
            resolve();
          });
        });
      }).then(function () {
        return _model.BouncerToken.findOneAsync({
          _id: _this._bouncerToken._id
        });
      }).then(function (latestBouncerToken) {
        if ((0, _moment2.default)(latestBouncerToken.updatedAt).isSame((0, _moment2.default)(_this._bouncerToken.updatedAt))) {
          //rely on inbuilt update to credentials
          return _this._connector._refreshCredentials();
        } else {
          return _this.authorize(latestBouncerToken);
        }
      }).then(function () {
        refreshed();
        if (client) {
          client.quit();
        }
      }).catch(function (err) {
        _this._logger.error(err);
        _this._logger.alert(err);
        if (client) {
          client.quit();
          throw err;
        }
      });
    }

    /**
     * initialize this proxy instance
     * @param {Context} context - the current context
     * @returns {Promise<ConnectorProxy>} - this proxy object to allow chaining
     */

  }, {
    key: 'init',
    value: function init(context) {
      var _this2 = this;

      return Promise.resolve().then(function () {
        var ConnectorType = require(_this2._connectorPath);
        _this2._connector = new ConnectorType(_this2._settings);
        if (_this2._connector.refreshCredentials) {
          _this2._connector._refreshCredentials = _this2._connector.refreshCredentials;
          _this2._connector.refreshCredentials = function () {
            return _this2._refreshCredentials();
          };
        }
        var methods = (0, _lodash.filter)(Object.getOwnPropertyNames(Object.getPrototypeOf(_this2._connector)), function (property) {
          if (property.startsWith('_') || property === 'receiveBounce' || _this2[property] || property === 'constructor') {
            return false;
          } else {
            return true;
          }
        });
        _this2._logger.info({
          connector: _this2._connector,
          methods: methods
        }, 'mapping methods');
        methods.forEach(function (method) {
          /**
           * also has all methods of underlying connector
           */
          _this2[method] = function () {
            for (var _len = arguments.length, params = Array(_len), _key = 0; _key < _len; _key++) {
              params[_key] = arguments[_key];
            }

            _this2._logger.info('proxying method ' + method);
            if (typeof _this2._connector[method] !== 'function') {
              var methodType = _typeof(_this2._connector[method]);
              _this2._logger.warn({
                methodType: methodType
              }, 'tried to call an unsupported method');
              throw new _errors2.default.connector.request.UnsupportedError(method + ' method unsupported');
            }
            return _this2._connector[method].apply(_this2._connector, params);
          };
        });
        if (context.bucket && context.bucket.meta && context.bucket.meta.authToken && context.bucket.meta.authToken[_this2._connectorSetting.key]) {
          return _this2.authorize(context.bucket.meta.authToken[_this2._connectorSetting.key]).catch(function (err) {
            _this2._logger.error(err);
            if (err instanceof _errors2.default.connector.request.InvalidError) {
              return _this2;
            } else {
              throw err;
            }
          });
        } else {
          return _this2;
        }
      });
    }

    /**
     * authorize the underlying connector
     * @param {Authorization|String} token - either the authorization object or a bouncer token key
     * @returns {Promise<ConnectorProxy>} - this
     */

  }, {
    key: 'authorize',
    value: function authorize(token) {
      var _this3 = this;

      if (typeof this._connector.authorize !== 'function') {
        return Promise.resolve(this);
      }
      if (typeof token === 'string') {
        return _model.BouncerToken.findOneAsync({
          key: token
        }).then(function (bouncerToken) {
          if (!bouncerToken) {
            throw new _errors2.default.connector.request.InvalidError('the authorization token provided is not valid');
          }
          _this3._bouncerToken = bouncerToken;
          return _this3._connector.authorize(new _authorization2.default(bouncerToken));
        }).then(function () {
          return _this3;
        });
      } else {
        this._bouncerToken = token;
        return Promise.resolve(this._connector.authorize(token)).then(function () {
          return _this3;
        });
      }
    }
  }]);

  return ConnectorProxy;
}();

exports.default = ConnectorProxy;

/**
 * @external {ConnectorSetting} https://github.com/hoist/hoist-model/blob/master/lib/models/connector_setting.js
 */
/**
 * @external {Context} https://github.com/hoist/hoist-context/blob/master/lib/index.js
 */
//# sourceMappingURL=proxy.js.map
