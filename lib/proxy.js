'use strict';
var BBPromise = require('bluebird');

function ConnectorProxy() {

}

ConnectorProxy.loadConnector = function(){

};
ConnectorProxy.getAuth = function(){

};

module.exports = function (Context, type, key, callback) {
  return Context.get()
    .then(function (context) {
      return BBPromise.all([
        ConnectorProxy.loadConnector(type),
        ConnectorProxy.getAuth(context, type, key)
      ]).spread(function (connector, auth) {
        return new ConnectorProxy(context, connector, auth);
      });
    }).nodeify(callback);
};
module.exports.ConnectorProxy = ConnectorProxy;
