'use strict';
require('../bootstrap');
var ConnectorProxy = require('../../lib/proxy').ConnectorProxy;
var expect = require('chai').expect;
var errors = require('hoist-errors');
var BBPromise = require('bluebird');
var sinon = require('sinon');
var HoistContext = require('hoist-context');
var ConnectorSetting = require('hoist-model').ConnectorSetting;

describe('Proxy', function () {
  describe('constructor', function () {
    describe('with valid type and key', function () {

    });
    describe('with an invalid type', function () {

    });
    describe('with an invalid key', function () {

    });
  });
  describe('.loadConnector', function () {
    it('returns module', function () {
      return expect(ConnectorProxy.loadConnector('test_connector'))
        .to.eventually.become(require('../fixtures/test_connectors/test_connector'));
    });
    it('throws if module not found', function () {
      return expect(ConnectorProxy.loadConnector('no-connector'))
        .to.be.rejectedWith(errors.connector.request.InvalidError, 'no-connector is not a valid connector type');
    });
  });
  describe('.getSettings', function () {
    var connectorSetting = new ConnectorSetting();
    var application = {
      _id: 'appid'
    };

    var result;
    before(function () {
      var context = new HoistContext();
      context.application = application;
      context.environment = 'dev';
      sinon.stub(ConnectorSetting, 'findOneAsync').returns(BBPromise.resolve(connectorSetting));

      result = ConnectorProxy.getSettings(context, 'type', 'key');
    });
    after(function () {
      ConnectorSetting.findOneAsync.restore();
    });
    it('returns the connector settings', function () {
      return expect(result).to.become(connectorSetting);
    });
    it('loads with correct params', function () {
      return expect(ConnectorSetting.findOneAsync)
        .to.have.been.calledWith({
          application: 'appid',
          environment: 'dev',
          type: 'type',
          key: 'key'
        });
    });
  });
});
