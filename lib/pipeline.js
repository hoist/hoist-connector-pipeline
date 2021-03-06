'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Authorization = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _proxy = require('./proxy');

var _proxy2 = _interopRequireDefault(_proxy);

var _context = require('@hoist/context');

var _context2 = _interopRequireDefault(_context);

var _model = require('@hoist/model');

var _errors = require('@hoist/errors');

var _errors2 = _interopRequireDefault(_errors);

var _logger = require('@hoist/logger');

var _logger2 = _interopRequireDefault(_logger);

var _authorization = require('./authorization');

var _authorization2 = _interopRequireDefault(_authorization);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Pipeline object for interaction with connectors
 */

var ConnectorPipeline = function () {
  /**
   * create a new ConnectorPipeline object
   */

  function ConnectorPipeline() {
    _classCallCheck(this, ConnectorPipeline);

    this._logger = _logger2.default.child({
      cls: this.constructor.name
    });
  }

  _createClass(ConnectorPipeline, [{
    key: '_loadSettings',
    value: function _loadSettings(key, context) {
      return _model.ConnectorSetting.findOneAsync({
        key: key,
        environment: context.environment || 'live',
        application: context.application._id
      }).then(function (settings) {
        if (!settings) {
          throw new _errors2.default.connector.request.InvalidError('no settings found with the key ' + key);
        }
        settings.settings = settings.settings || {};
        settings.settings.applicationId = context.application.id;
        settings.settings.applicationName = context.application.name;
        if (context.application && context.application.runscope && context.application.runscope.bucket) {
          settings.settings.runscopeBucket = context.application.runscope.bucket;
        }
        return settings;
      });
    }

    /**
     * load the connector identified by the key
     * @param {string} key - the unique key identifer for the connector
     * @returns {Promise<ConnectorProxy>} - a connector proxy
     */

  }, {
    key: 'loadConnector',
    value: function loadConnector(key) {
      var _this = this;

      return Promise.resolve().then(function () {
        return _context2.default.get().then(function (context) {
          return _this._loadSettings(key, context).then(function (settings) {
            var proxy = new _proxy2.default(settings);
            return proxy.init(context).then(function () {
              return proxy;
            });
          });
        });
      });
    }
  }]);

  return ConnectorPipeline;
}();

exports.Authorization = _authorization2.default;
exports.default = ConnectorPipeline;
//# sourceMappingURL=pipeline.js.map
