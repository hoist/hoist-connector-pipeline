'use strict';
require('../bootstrap');
var connectorPipeline = require('../../lib')();
var ConnectorProxy = require('../../lib/proxy').ConnectorProxy;
var expect = require('chai').expect;
var sinon = require('sinon');
var BBPromise = require('bluebird');
var ConnectorSetting = require('hoist-model').ConnectorSetting;

describe('ConnectorPipeline', function () {
  describe('.loadConnector', function () {
    var proxy;
    var TestConnector = function () {

    };
    var connectorSetting = new ConnectorSetting({
      connectorType: 'type'
    });
    before(function (done) {

      sinon.stub(ConnectorProxy, 'getSettings').returns(BBPromise.resolve(connectorSetting));
      sinon.stub(ConnectorProxy, 'loadConnector').returns(BBPromise.resolve(TestConnector));
      require('hoist-context').namespace.run(function () {
        connectorPipeline.loadConnector('key').then(function (connector) {
          proxy = connector;
          done();
        }).catch(done);
      });

    });
    after(function () {
      ConnectorProxy.loadConnector.restore();
      ConnectorProxy.getSettings.restore();
    });
    it('returns a connector proxy', function () {
      return expect(proxy).to.be.instanceOf(ConnectorProxy);
    });
  });
});
