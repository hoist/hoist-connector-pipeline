'use strict';

function ConnectorPipeline(HoistContext) {
  this.Context = HoistContext;
}


ConnectorPipeline.prototype = {
  loadConnector: function () {

  }
};



var creator = function (HoistContext) {
  return new ConnectorPipeline(HoistContext || require('hoist-context'));
};


creator.Pipeline = ConnectorPipeline;

module.exports = creator;
