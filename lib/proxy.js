  'use strict';
  var BBPromise = require('bluebird');
  var config = require('config');
  var path = require('path');
  var errors = require('hoist-errors');
  var Context = require('./context');
  var Model = require('./model');
  var logger = require('hoist-logger');
  var Authorization = require('./authorization');
  var fs = require('fs');


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
  ConnectorProxy.prototype.authorize = function (token) {
    return Model.instance().BouncerToken.findOneAsync({
      key: token
    }).bind(this).then(function (bouncerToken) {
      if (!bouncerToken) {
        throw new errors.connector.InvalidError('the authorization token provided is not valid');
      }
      return this.connector.authorize(new Authorization(bouncerToken));
    }).then(function () {
      return this;
    });
  };
  ConnectorProxy.loadConnector = function (type) {
    return BBPromise.try(function () {
      var connectorsPath = path.resolve(config.get('Hoist.connectors.path'));
      var connectorPath = path.join(connectorsPath, type, config.get('Hoist.connectors.currentDirectoryName'));
      connectorPath = fs.realpathSync(connectorPath);
      return require(connectorPath);
    }).catch(function (err) {
      /* istanbul ignore else */
      if (err.code === 'ENOENT') {
        throw new errors.connector.request.InvalidError(type + ' is not a valid connector type');
      } else {
        throw err;
      }
    });
  };
  ConnectorProxy.getSettings = function (context, key) {
    return Model.instance().ConnectorSetting.findOneAsync({
      key: key,
      environment: context.environment || 'live',
      application: context.application._id
    });
  };

  module.exports = function (key, callback) {
    return Context.instance().get()
      .then(function (context) {
        return ConnectorProxy.getSettings(context, key).then(function (settings) {
          if (!settings) {
            throw new errors.connector.request.InvalidError('no settings found with the key ' + key);
          }
          return ConnectorProxy.loadConnector(settings.connectorType).then(function (Connector) {
            return new ConnectorProxy(context, settings.settings, Connector);
          }).then(function (connectorProxy) {
            /* istanbul ignore next */
            if (context.bucket &&
              context.bucket.meta &&
              context.bucket.meta.authToken &&
              context.bucket.meta.authToken[key]) {
              return connectorProxy.authorize(context.bucket.meta.authToken[key])
                .catch(function (err) {
                  if (err instanceof errors.connector.InvalidError) {
                    return connectorProxy;
                  } else {
                    throw err;
                  }
                });
            } else if (context.user &&
              context.user.meta &&
              context.user.meta.authToken &&
              context.user.meta.authToken[key]) {
              return connectorProxy.authorize(context.user.meta.authToken[key])
                .catch(function (err) {
                  if (err instanceof errors.connector.InvalidError) {
                    return connectorProxy;
                  } else {
                    throw err;
                  }
                });
            } else {
              return connectorProxy;
            }
          });
        });
      }).nodeify(callback);
  };
  module.exports.ConnectorProxy = ConnectorProxy;
