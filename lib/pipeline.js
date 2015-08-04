'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _proxy = require('./proxy');

var _proxy2 = _interopRequireDefault(_proxy);

var _hoistContext = require('@hoist/context');

var _hoistContext2 = _interopRequireDefault(_hoistContext);

var _hoistModel = require('@hoist/model');

var _hoistErrors = require('@hoist/errors');

var _hoistErrors2 = _interopRequireDefault(_hoistErrors);

var _hoistLogger = require('@hoist/logger');

var _hoistLogger2 = _interopRequireDefault(_hoistLogger);

var _Authorization = require('./Authorization');

var _Authorization2 = _interopRequireDefault(_Authorization);

/**
 * Pipeline object for interaction with connectors
 */

var ConnectorPipeline = (function () {
  /**
   * create a new ConnectorPipeline object
   */

  function ConnectorPipeline() {
    _classCallCheck(this, ConnectorPipeline);

    this._logger = _hoistLogger2['default'].child({
      cls: this.constructor.name
    });
  }

  _createClass(ConnectorPipeline, [{
    key: '_loadSettings',
    value: function _loadSettings(key, context) {
      return _hoistModel.ConnectorSetting.findOneAsync({
        key: key,
        environment: context.environment || 'live',
        application: context.application._id
      }).then(function (settings) {
        if (!settings) {
          throw new _hoistErrors2['default'].connector.request.InvalidError('no settings found with the key ' + key);
        }
        if (context.application && context.application.runscope && context.application.runscope.bucket) {
          settings.settings.runscopeBucket = context.application.runscope.bucket;
        }
        return settings;
      });
    }
  }, {
    key: 'loadConnector',

    /**
     * load the connector identified by the key
     * @param {string} key - the unique key identifer for the connector
     * @returns {Promise<ConnectorProxy>} - a connector proxy
     */
    value: function loadConnector(key) {
      var _this = this;

      return Promise.resolve().then(function () {
        return _hoistContext2['default'].get().then(function (context) {
          return _this._loadSettings(key, context).then(function (settings) {
            var proxy = new _proxy2['default'](settings);
            return proxy.init(context).then(function () {
              return proxy;
            });
          });
        });
      });
    }
  }]);

  return ConnectorPipeline;
})();

exports.Authorization = _Authorization2['default'];
exports['default'] = ConnectorPipeline;
//# sourceMappingURL=pipeline.js.map