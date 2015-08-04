'use strict';
import ConnectorProxy from './proxy';
import Context from '@hoist/context';
import {
  ConnectorSetting
}
from '@hoist/model';
import Errors from '@hoist/errors';
import logger from '@hoist/logger';
import Authorization from './Authorization';
/**
 * Pipeline object for interaction with connectors
 */
class ConnectorPipeline {
  /**
   * create a new ConnectorPipeline object
   */
  constructor() {
    this._logger = logger.child({
      cls: this.constructor.name
    });
  }
  _loadSettings(key, context) {
      return ConnectorSetting.findOneAsync({
          key: key,
          environment: context.environment || 'live',
          application: context.application._id
        })
        .then((settings) => {
          if (!settings) {
            throw new Errors.connector.request.InvalidError('no settings found with the key ' + key);
          }
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
  loadConnector(key) {
    return Promise.resolve().then(() => {
      return Context.get()
        .then((context) => {
          return this._loadSettings(key, context)
            .then((settings) => {
              var proxy = new ConnectorProxy(settings);
              return proxy.init(context).then(() => {
                return proxy;
              });
            });
        });

    });
  }
}
export {
  Authorization as Authorization
};

export default ConnectorPipeline;
