'use strict';
import config from 'config';
import path from 'path';
import errors from '@hoist/errors';
import Authorization from './authorization';
import fs from 'fs';
import redisLock from 'redis-lock';
import redis from 'redis';
import redisSentinel from 'redis-sentinel-client';
import moment from 'moment';
import {
  filter,
  isFunction
}
from 'lodash';
import {
  BouncerToken
}
from '@hoist/model';
import logger from '@hoist/logger';

function createRedisClient() {
  if (config.has('Hoist.redis.clustered') && config.get('Hoist.redis.clustered')) {
    return redisSentinel.createClient({
      host: config.get('Hoist.redis.host'),
      port: config.get('Hoist.redis.port'),
      masterName: config.get('Hoist.redis.masterName')
    });
  } else {
    return redis.createClient(config.get('Hoist.redis.port'), config.get('Hoist.redis.host'));
  }
}

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

  _refreshCredentials() {

    //reload the connector settings to see if they've been refreshed
    //only one server will go into this step at a time
    let refreshed;
    let client;
    return Promise.resolve()
      .then(() => {
        if (!this._bouncerToken) {
          throw new Error('Connector is not authorized');
        }
        client = createRedisClient();
        return new Promise((resolve) => {
          redisLock(client)(`connector-refresh-${this._connectorSetting._id}`, 10000, (done) => {
            refreshed = done;
            resolve();
          });
        });
      }).then(() => {
        return BouncerToken.findOneAsync({
          _id: this._bouncerToken._id
        });
      }).then((latestBouncerToken) => {
        if (moment(latestBouncerToken.updatedAt).isSame(moment(this._bouncerToken.updatedAt))) {
          //rely on inbuilt update to credentials
          return this._connector._refreshCredentials();
        } else {
          return this.authorize(latestBouncerToken);
        }
      }).then(() => {
        refreshed();
        if (client) {
          client.quit();
        }
      }).catch((err) => {
        this._logger.error(err);
        this._logger.alert(err);
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
  init(context) {
    return Promise.resolve()
      .then(() => {
        let ConnectorType = require(this._connectorPath);
        if (ConnectorType.default && isFunction(ConnectorType.default)) {
          ConnectorType = ConnectorType.default;
        }
        this._connector = new ConnectorType(this._settings);
        if (this._connector.refreshCredentials) {
          this._connector._refreshCredentials = this._connector.refreshCredentials;
          this._connector.refreshCredentials = () => {
            return this._refreshCredentials();
          };
        }
        let methods = filter(Object.getOwnPropertyNames(Object.getPrototypeOf((this._connector))), (property) => {
          if (property.startsWith('_') || property === 'receiveBounce' || this[property] || property === 'constructor') {
            return false;
          } else {
            return true;
          }
        });
        this._logger.info({
          connector: this._connector,
          methods
        }, 'mapping methods');
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
        this._bouncerToken = bouncerToken;
        return this._connector.authorize(new Authorization(bouncerToken));
      }).then(() => {
        return this;
      });
    } else {
      this._bouncerToken = token;
      return Promise.resolve(this._connector.authorize(token))
        .then(() => {
          return this;
        });
    }
  }
}

export
default ConnectorProxy;

/**
 * @external {ConnectorSetting} https://github.com/hoist/hoist-model/blob/master/lib/models/connector_setting.js
 */
/**
 * @external {Context} https://github.com/hoist/hoist-context/blob/master/lib/index.js
 */
