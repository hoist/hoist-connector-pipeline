'use strict';
var BBPromise = require('bluebird');
var ConnectorProxy = require('./proxy');
var Context = require('./context');

function ConnectorPipeline() {


}


ConnectorPipeline.prototype = {
  loadConnector: function (type, key) {
    return BBPromise.try(function () {
      return new ConnectorProxy(key, key);
    }, [], this);
  }
};



var creator = function (HoistContext) {
  /* istanbul ignore next */
  if (HoistContext) {

    Context.set(HoistContext);
  }
  return new ConnectorPipeline();
};


creator.Pipeline = ConnectorPipeline;

module.exports = creator;
