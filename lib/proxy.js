  'use strict';
  var BBPromise = require('bluebird');
  var config = require('config');
  var path = require('path');
  var errors = require('hoist-errors');
  var Context = require('./context');
  var Model = require('./model');
  var logger = require('hoist-logger');

  function ConnectorProxy(context, settings, ConnectorType) {
    this.context = context;
    this.settings = settings;
    this.connector = new ConnectorType(settings);
  }

  ConnectorProxy.prototype.get = function () {
    logger.info('in connector-pipeline get');
    return this.connector.get.apply(this.connector, arguments);
  };

  ConnectorProxy.prototype.put = function () {
    logger.info('in connector-pipeline put');
    return this.connector.put.apply(this.connector, arguments);
  };
  ConnectorProxy.prototype.post = function () {
    logger.info('in connector-pipeline post');
    return this.connector.post.apply(this.connector, arguments);
  };

  ConnectorProxy.loadConnector = function (type) {
    return BBPromise.try(function () {
      var connectorsPath = path.resolve(config.get('Hoist.connectors.path'));
      return require(path.join(connectorsPath, type, config.get('Hoist.connectors.currentDirectoryName')));
    }).catch(function (err) {
      /* istanbul ignore else */
      if (err.code === 'MODULE_NOT_FOUND') {
        throw new errors.connector.request.InvalidError(type + ' is not a valid connector type');
      } else {
        throw err;
      }
    });
  };
  ConnectorProxy.getSettings = function (context, type, key) {
    return Model.instance().ConnectorSetting.findOneAsync({
      key: key,
      connectorType: type,
      environment: context.environment || 'live',
      application: context.application._id
    });
  };

  module.exports = function (type, key, callback) {
    return Context.instance().get()
      .then(function (context) {
        return ConnectorProxy.loadConnector(type).then(function (Connector) {
          return ConnectorProxy.getSettings(context, type, key).then(function (settings) {
            if (!settings) {
              throw new errors.connector.request.InvalidError('no settings found with the key ' + key);
            }
            return new ConnectorProxy(context, settings.settings, Connector);
          });
        });
      }).nodeify(callback);
  };
  module.exports.ConnectorProxy = ConnectorProxy;
