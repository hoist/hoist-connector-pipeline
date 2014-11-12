  'use strict';
var BBPromise = require('bluebird');
var config = require('config');
var path = require('path');
var errors = require('hoist-errors');
var Context = require('./context');
var Model = require('./model');

function ConnectorProxy(context, settings, ConnectorType) {
  this.context = context;
  this.settings = settings;
  this.connector = new ConnectorType(settings);
}

ConnectorProxy.prototype.get = function () {
  return this.connector.get.apply(this.connector, arguments);
};

ConnectorProxy.loadConnector = function (type) {
  return BBPromise.try(function () {
    var connectorsPath = path.join(config.get('Hoist.connectors.path'),config.get('Hoist.connectors.currentDirectoryName'));
    return require(path.resolve(connectorsPath, type));
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
    type: type,
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
          return new ConnectorProxy(context, settings, Connector);
        });
      });
    }).nodeify(callback);
};
module.exports.ConnectorProxy = ConnectorProxy;
