'use strict';
var config = require('config');
var path = require('path');
var errors = require('@hoist/errors');
var Authorization = require('./authorization');
var fs = require('fs');
import {
  filter, functions
}
from 'lodash';
import {
  BouncerToken
}
from '@hoist/model';
import logger from '@hoist/logger';


/**
 * a proxy class to the underlying connector
 */
class ConnectorProxy {
  /**
   * setup the connector proxy described by the {@link ConnectorSetting} object
   * @param {ConnectorSetting} connectorSetting - the settings for the underlying connector
   */
  constructor(connectorSetting) {
    this._logger = logger.child({
      cls: this.constructor.name,
      applicationId: connectorSetting.application,
      connectorKey: connectorSetting.key
    });
    this._connectorSetting = connectorSetting;
    let connectorsPath = path.resolve(config.get('Hoist.filePaths.connectors'));
    let connectorPath = path.join(connectorsPath, connectorSetting.connectorType, 'current');
    this._connectorPath = fs.realpathSync(connectorPath);
    this._settings = this._connectorSetting.settings;
  }

  /**
   * initialize this proxy instance
   * @param {Context} context - the current context
   * @returns {Promise<ConnectorProxy>} - this proxy object to allow chaining
   */
  init(context) {
    return Promise.resolve()
      .then(() => {
        let ConnectorType = require(this._connectorPath);
        this._connector = new ConnectorType(this._settings);
        let methods = filter(functions(this._connector), (property) => {
          if (property.startsWith('_') || property === 'receiveBounce' || this[property]) {
            return false;
          } else {
            return true;
          }
        });
        methods.forEach((method) => {
          /**
           * also has all methods of underlying connector
           */
          this[method] = (...params) => {
            this._logger.info('proxying method ' + method);
            if (typeof this._connector[method] !== 'function') {
              let methodType = typeof this._connector[method];
              this._logger.warn({
                methodType
              }, 'tried to call an unsupported method');
              throw new errors.connector.request.UnsupportedError(method + ' method unsupported');
            }
            return this._connector[method].apply(this._connector, params);
          };
        });
        if (context.bucket &&
          context.bucket.meta &&
          context.bucket.meta.authToken &&
          context.bucket.meta.authToken[this._connectorSetting.key]) {
          return this.authorize(context.bucket.meta.authToken[this._connectorSetting.key])
            .catch((err) => {
              this._logger.error(err);
              if (err instanceof errors.connector.request.InvalidError) {
                return this;
              } else {
                throw err;
              }
            });
        } else {
          return this;
        }
      });
  }

  /**
   * authorize the underlying connector
   * @param {Authorization|String} token - either the authorization object or a bouncer token key
   * @returns {Promise<ConnectorProxy>} - this
   */
  authorize(token) {
    if (typeof this._connector.authorize !== 'function') {
      return Promise.resolve(this);
    }
    if (typeof token === 'string') {
      return BouncerToken.findOneAsync({
        key: token
      }).then((bouncerToken) => {
        if (!bouncerToken) {
          throw new errors.connector.request.InvalidError('the authorization token provided is not valid');
        }
        return this._connector.authorize(new Authorization(bouncerToken));
      }).then(() => {
        return this;
      });
    } else {
      return Promise.resolve(this._connector.authorize(token))
        .then(() => {
          return this;
        });
    }
  }
}

export default ConnectorProxy;

/**
 * @external {ConnectorSetting} https://github.com/hoist/hoist-model/blob/master/lib/models/connector_setting.js
 */
/**
 * @external {Context} https://github.com/hoist/hoist-context/blob/master/lib/index.js
 */
