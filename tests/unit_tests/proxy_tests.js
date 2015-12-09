'use strict';
import ConnectorProxy from '../../src/proxy';
import {
  expect
}
from 'chai';
import path from 'path';
import sinon from 'sinon';
import TestConnector from '../fixtures/test_connectors/test_connector/current/lib/connector';
import Authorization from '../../src/authorization';
import {
  BouncerToken
}
from '@hoist/model';
import moment from 'moment';

/** @test {ConnectorProxy} */
describe('Proxy', function () {
  let proxy;
  before(() => {
    proxy = new ConnectorProxy({
      application: 'app-id',
      connectorType: 'test_connector',
      settings: {
        setting: true
      },
      key: 'myconnector'
    });
  });
  /** @test {ConnectorProxy#constructor} */
  describe('contructor', () => {
    it('sets up logger', () => {
      return expect(proxy._logger).to.exist;
    });
    it('saves path to connector', () => {
      return expect(proxy._connectorPath).to.eql(path.resolve(__dirname, '../fixtures/test_connectors/test_connector/current'));
    });
    it('saves settings', () => {
      return expect(proxy._settings).to.eql({
        setting: true
      });
    });
  });
  //** @test {ConnectorProxy#init} */
  describe('ConnectorProxy#init', () => {
    describe('with no bucket', () => {
      let result;
      before(() => {
        sinon.stub(proxy, '_refreshCredentials').returns(Promise.resolve());
        return proxy.init({

        }).then((r) => {
          result = r;
        });
      });
      after(() => {
        proxy._refreshCredentials.restore();
        delete proxy._connector;
        delete proxy.get;
        delete proxy.delete;
        delete proxy.myMethod;
        delete proxy.post;
        delete proxy.put;
      });
      it('returns a connectorproxy', () => {
        return expect(result).to.be.instanceOf(ConnectorProxy);
      });
      it('saves underlying connector', () => {
        return expect(proxy._connector).to.be.instanceOf(TestConnector);
      });
      it('maps connector methods', () => {
        return expect(proxy).to.respondTo('myMethod');
      });
      it('proxies refreshCredentials', () => {
        return proxy._connector.refreshCredentials()
          .then(() => {
            return expect(proxy._refreshCredentials).to.have.been.called;
          });
      });
      it('remaps original refreshCredetials', () => {
        return expect(proxy._connector).to.respondTo('_refreshCredentials');
      });

    });
    describe('with authorized bucket', () => {
      let result;
      before(() => {

        sinon.stub(proxy, 'authorize').returns(Promise.resolve(proxy));
        return proxy.init({
          bucket: {
            meta: {
              authToken: {
                'myconnector': 'token'
              }
            }
          }
        }).then((r) => {
          result = r;
        });
      });
      after(() => {
        delete proxy._connector;
        delete proxy.get;
        delete proxy.delete;
        delete proxy.myMethod;
        delete proxy.post;
        delete proxy.put;
        proxy.authorize.restore();
      });
      it('returns a connectorproxy', () => {
        return expect(result).to.be.instanceOf(ConnectorProxy);
      });
      it('authorizes the proxy', () => {
        return expect(proxy.authorize).to.have.been.called;
      });
    });

  });

  //** @test {ConnectorProxy#_refreshCredentials} */
  describe('ConnectorProxy#_refreshCredentials', () => {
    before(() => {
      proxy._connector = {
        _refreshCredentials: sinon.stub().returns(Promise.resolve())
      };
      sinon.stub(proxy, 'authorize').returns(Promise.resolve());
    });
    after(() => {
      delete proxy._connector;
      proxy.authorize.restore();
    });
    describe('if bouncer token in db has been refreshed', () => {
      let bouncerTokenFromDb;
      before(() => {
        proxy._bouncerToken = new BouncerToken({
          updatedAt: moment().add(-1, 'days').toDate()
        });
        bouncerTokenFromDb = new BouncerToken({
          updatedAt: moment().toDate()
        });
        sinon.stub(BouncerToken, 'findOneAsync').returns(Promise.resolve(bouncerTokenFromDb));
        return proxy._refreshCredentials();
      });
      after(() => {
        BouncerToken.findOneAsync.restore();
      });
      it('calls authorize with new bouncer token', () => {
        return expect(proxy.authorize).to.have.been.calledWith(bouncerTokenFromDb);
      });
      it('doesn\'t call refresh on connector', () => {
        return expect(proxy._connector._refreshCredentials).to.have.not.been.called;
      });
    });
  });

  //** @test {ConnectorProxy#authorize} */
  describe('ConnectorProxy#authorize', () => {
    describe('if connector has not authorize method', () => {
      let originalAuthorize;
      let result;
      let connector = new TestConnector();
      before(() => {
        originalAuthorize = connector.authorize;
        connector.authorize = undefined;
        proxy._connector = connector;
        return proxy.authorize('token').then((r) => {
          result = r;
        });

      });
      after(() => {
        connector.authorize = originalAuthorize;
        delete proxy._connector;
      });
      it('returns the proxy object', () => {
        return expect(result).to.eql(proxy);
      });
    });
    describe('if token is a string', () => {
      let result;
      let connector = new TestConnector();
      let bouncerToken = new BouncerToken();
      before(() => {
        sinon.stub(connector, 'authorize').returns(Promise.resolve(proxy));
        sinon.stub(BouncerToken, 'findOneAsync').returns(Promise.resolve(bouncerToken));
        proxy._connector = connector;
        return proxy.authorize('token').then((r) => {
          result = r;
        });

      });
      after(() => {
        connector.authorize.restore();
        BouncerToken.findOneAsync.restore();
        delete proxy._connector;
      });
      it('passes the bouncer token to the connector', () => {
        return expect(connector.authorize)
          .to.have.been.calledWith(sinon.match((auth) => {
            return expect(auth._token).to.eql(bouncerToken);
          }));
      });
      it('uses the string as the token lookup', () => {
        return expect(BouncerToken.findOneAsync)
          .to.have.been.calledWith({
            key: 'token'
          });
      });
      it('returns the proxy', () => {
        return expect(result).to.eql(proxy);
      });
    });
    describe('if token is an Auth object', () => {
      let result;
      let connector = new TestConnector();
      let bouncerToken = new BouncerToken();
      let authorization = new Authorization(bouncerToken);
      before(() => {
        sinon.stub(connector, 'authorize').returns(Promise.resolve(proxy));
        proxy._connector = connector;
        return proxy.authorize(authorization).then((r) => {
          result = r;
        });

      });
      after(() => {
        connector.authorize.restore();
        delete proxy._connector;
      });
      it('passes the bouncer token to the connector', () => {
        return expect(connector.authorize)
          .to.have.been.calledWith(authorization);
      });
      it('returns the proxy', () => {
        return expect(result).to.eql(proxy);
      });
    });
  });
});
