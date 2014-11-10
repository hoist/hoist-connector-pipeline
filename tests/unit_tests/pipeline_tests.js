'use strict';
require('../bootstrap');
var connectorPipeline = require('../../lib')();
var ConnectorProxy = require('../../lib/proxy').ConnectorProxy;
var expect = require('chai').expect;
describe('ConnectorPipeline', function () {
  describe('.loadConnector', function () {
    var proxy;
    before(function (done) {
      require('hoist-context').namespace.run(function () {
        connectorPipeline.loadConnector('type', 'key').then(function (connector) {
          proxy = connector;
          done();
        });
      });

    });
    it('returns a connector proxy', function () {
      return expect(proxy).to.be.instanceOf(ConnectorProxy);
    });
  });
});
