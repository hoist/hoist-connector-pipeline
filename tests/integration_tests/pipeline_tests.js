'use strict';
import Pipeline from '../../lib/pipeline';
import {
  ConnectorSetting, Application, Bucket, BouncerToken
}
from '@hoist/model';
import Context from '@hoist/context';
import sinon from 'sinon';
import {
  expect
}
from 'chai';
import TestConnector from '../fixtures/test_connectors/test_connector/lib/connector';
/** @test {ConnectorPipeline} */
describe('ConnectorPipeline', () => {
  let application = new Application({
    _id: 'application-id'
  });

  let bucket = new Bucket({
    meta: {
      authToken: {
        'connector-key': 'bouncer-token'
      }
    }
  });
  let bouncerToken = new BouncerToken({
    key: 'bouncer-token'
  });
  let settings = new ConnectorSetting({
    connectorType: 'test_connector',
    key: 'connector-key'
  });
  let pipeline;
  before(() => {
    Context.set(context);
    context.bucket = bucket;
    context.application = application;
    sinon.stub(ConnectorSetting, 'findOneAsync').returns(Promise.resolve(settings));
    sinon.stub(BouncerToken, 'findOneAsync').returns(Promise.resolve(bouncerToken));
    pipeline = new Pipeline();
  });
  after(() => {
    ConnectorSetting.findOneAsync.restore();
    BouncerToken.findOneAsync.restore();
  });

  /** @test {ConnectorPipeline#loadConnector} */
  describe('ConnectorPipeline#loadConnector', () => {
    let connector;
    before(() => {
      sinon.spy(TestConnector.prototype, 'authorize');
      return pipeline.loadConnector('connector-key').then((c) => {
        connector = c;
      });
    });
    after(() => {
      TestConnector.prototype.authorize.restore();
    });
    it('returns a connector', () => {
      return expect(connector).to.exist;
    });
    it('maps connector functions', () => {
      return expect(connector).to.respondTo('myMethod');
    });
    it('calls authorize on underlying connector', () => {
      return expect(TestConnector.prototype.authorize).to.have.been.calledWith(sinon.match((auth) => {
        return expect(auth._token).to.eql(bouncerToken);
      }));
    });
  });
});
