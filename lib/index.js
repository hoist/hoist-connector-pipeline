'use strict';
var BBPromise = require('bluebird');
var ConnectorProxy = require('./proxy');

function ConnectorPipeline(HoistContext) {
  this.Context = HoistContext;
}


ConnectorPipeline.prototype = {
  loadConnector: function (type,key) {
    return BBPromise.try(function(){
      return new ConnectorProxy(this.Context,key,key);
    },[],this);
  }
};



var creator = function (HoistContext) {
  return new ConnectorPipeline(HoistContext || require('hoist-context'));
};


creator.Pipeline = ConnectorPipeline;

module.exports = creator;
