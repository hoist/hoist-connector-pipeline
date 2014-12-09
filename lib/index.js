'use strict';
var BBPromise = require('bluebird');
var connectorProxy = require('./proxy');
var Context = require('./context');
var Model = require('./model');

function ConnectorPipeline() {


}


ConnectorPipeline.prototype = {
  loadConnector: function (key) {
    return BBPromise.try(function () {
      return connectorProxy(key);
    }, [], this);
  }
};



var creator = function (HoistContext, HoistModel) {
  /* istanbul ignore next */
  if (HoistContext) {

    Context.set(HoistContext);
  }
  /* istanbul ignore next */
  if (HoistModel) {
    Model.set(HoistModel);
  }
  return new ConnectorPipeline();
};


creator.Pipeline = ConnectorPipeline;

module.exports = creator;
