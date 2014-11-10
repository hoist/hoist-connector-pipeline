'use strict';
var BBPromise = require('bluebird');
var config = require('config');
var path = require('path');
var errors = require('hoist-errors');
var Context = require('./context');
var Model = require('./model');

function ConnectorProxy() {

}

ConnectorProxy.loadConnector = function (type) {
  return BBPromise.try(function () {
    var connectorsPath = config.get('Hoist.connectors.path');
    return require(path.resolve(connectorsPath, type));
  }).catch(function (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      throw new errors.connector.request.InvalidError(type + ' is not a valid connector type');
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
      return BBPromise.all([
        ConnectorProxy.loadConnector(type),
        ConnectorProxy.getSettings(context, type, key)
      ]).spread(function (Connector, settings) {
        return new ConnectorProxy(context, settings, Connector);
      });
    }).nodeify(callback);
};
module.exports.ConnectorProxy = ConnectorProxy;
