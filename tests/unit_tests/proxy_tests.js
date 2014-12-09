'use strict';
require('../bootstrap');
var ConnectorProxy = require('../../lib/proxy').ConnectorProxy;
var expect = require('chai').expect;
var errors = require('hoist-errors');
var BBPromise = require('bluebird');
var sinon = require('sinon');
var HoistContext = require('hoist-context');
var ConnectorSetting = require('hoist-model').ConnectorSetting;
var BouncerToken = require('hoist-model').BouncerToken;
var Authorization = require('../../lib/authorization');

describe('Proxy', function () {
  describe('constructor helper', function () {
    describe('with valid key', function () {
      var settings = {
        key: 'value'
      };
      var connectorSetting = new ConnectorSetting({
        settings: settings,
        connectorType: 'type'
      });
      var result;
      var module = {
        name: 'module'
      };
      var moduleConstructor = sinon.stub().returns(module);

      before(function (done) {
        sinon.stub(ConnectorProxy, 'loadConnector').returns(BBPromise.resolve(moduleConstructor));
        sinon.stub(ConnectorProxy, 'getSettings').returns(BBPromise.resolve(connectorSetting));
        require('../../lib/proxy')('key', function (err, connectorProxy) {
          result = connectorProxy;
          done();
        });
      });
      after(function () {
        ConnectorProxy.loadConnector.restore();
        ConnectorProxy.getSettings.restore();
      });
      it('returns connectorProxy', function () {
        expect(result)
          .to.be.instanceOf(ConnectorProxy);
      });
      it('has connector', function () {
        expect(result.connector).to.eql(module);
      });
      it('calls module constructor correctly', function () {
        expect(moduleConstructor)
          .to.be.calledWith(settings);
      });
    });
    describe('with an invalid key', function () {
      var error;
      before(function (done) {
        sinon.stub(ConnectorProxy, 'getSettings').returns(BBPromise.resolve(null));
        require('../../lib/proxy')('key', function (err) {
          error = err;
          done();
        });
      });
      after(function () {
        ConnectorProxy.getSettings.restore();
      });
      it('rejects', function () {
        expect(error)
          .to.be.instanceOf(errors.connector.request.InvalidError)
          .and.have.property('message', 'no settings found with the key key');
      });
    });
  });
  describe('#get', function () {
    var ConnectorType = require('../fixtures/test_connectors/test_connector');
    var _promise = BBPromise.resolve(null);
    var _result;
    before(function () {
      sinon.stub(ConnectorType.prototype, 'get').returns(_promise);
      var proxy = new ConnectorProxy({
        application: {
          _id: 'id'
        }
      }, {
        key: 'value'
      }, ConnectorType);
      _result = proxy.get('/path/to/call');
    });
    it('passes params through', function () {
      expect(ConnectorType.prototype.get)
        .to.have.been.calledWith('/path/to/call');
    });
    it('returns promise', function () {
      expect(_result).to.eql(_promise);
    });
  });
  describe('#put', function () {
    var ConnectorType = require('../fixtures/test_connectors/test_connector');
    var _promise = BBPromise.resolve(null);
    var _result;
    before(function () {
      sinon.stub(ConnectorType.prototype, 'put').returns(_promise);
      var proxy = new ConnectorProxy({
        application: {
          _id: 'id'
        }
      }, {
        key: 'value'
      }, ConnectorType);
      _result = proxy.put('/path/to/call', 'data');
    });
    it('passes params through', function () {
      expect(ConnectorType.prototype.put)
        .to.have.been.calledWith('/path/to/call', 'data');
    });
    it('returns promise', function () {
      expect(_result).to.eql(_promise);
    });
  });
  describe('#post', function () {
    var ConnectorType = require('../fixtures/test_connectors/test_connector');
    var _promise = BBPromise.resolve(null);
    var _result;
    before(function () {
      sinon.stub(ConnectorType.prototype, 'post').returns(_promise);
      var proxy = new ConnectorProxy({
        application: {
          _id: 'id'
        }
      }, {
        key: 'value'
      }, ConnectorType);
      _result = proxy.post('/path/to/call', 'data');
    });
    it('passes params through', function () {
      expect(ConnectorType.prototype.post)
        .to.have.been.calledWith('/path/to/call', 'data');
    });
    it('returns promise', function () {
      expect(_result).to.eql(_promise);
    });
  });
  describe('#authorize', function () {
    var ConnectorType = require('../fixtures/test_connectors/test_connector');
    var _promise = BBPromise.resolve(null);
    var token = new BouncerToken({});
    var _result;
    before(function () {
      sinon.stub(ConnectorType.prototype, 'authorize').returns(_promise);
      var proxy = new ConnectorProxy({
        application: {
          _id: 'id'
        }
      }, {
        key: 'value'
      }, ConnectorType);
      sinon.stub(BouncerToken, 'findOneAsync').withArgs({
        key: 'token'
      }).returns(BBPromise.resolve(token));
      _result = proxy.authorize('token');
    });
    after(function () {
      BouncerToken.findOneAsync.restore();
      ConnectorType.prototype.authorize.restore();
    });
    it('passes a new authorization to connector', function () {
      expect(ConnectorType.prototype.authorize)
        .to.have.been.calledWith(sinon.match(function (authorize) {
          expect(authorize).to.be.instanceOf(Authorization);
          expect(authorize._token).to.eql(token);
          return true;
        }));
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
      result = ConnectorProxy.getSettings(context, 'key');
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
          key: 'key'
        });
    });
  });
});
