'use strict';
import ConnectorPipeline from '../../src/pipeline';
import ConnectorProxy from '../../src/proxy';
import {
  expect
}
from 'chai';
import sinon from 'sinon';
import {
  ConnectorSetting,
  Application
}
from '@hoist/model';
import Context from '@hoist/context';


describe('ConnectorPipeline', function () {
  describe('.loadConnector', function () {
    let context = new Context();
    let application = new Application({
      _id: 'app-id',
      runscope: {
        bucket: 'runscope-bucket'
      }
    });
    let connectorSetting = new ConnectorSetting({
      connectorType: 'test_connector',
      settings: {

      }
    });
    let result;
    before(() => {
      context.application = application;
      sinon.stub(Context, 'get').returns(Promise.resolve(context));
      sinon.stub(ConnectorSetting, 'findOneAsync').returns(Promise.resolve(connectorSetting));
      sinon.stub(ConnectorProxy.prototype, 'init').returns(Promise.resolve(null));
      let pipeline = new ConnectorPipeline();
      return pipeline.loadConnector('key').then((p) => {
        result = p;
      });
    });

    it('loads the correct settings', () => {
      return expect(ConnectorSetting.findOneAsync).to.have.been.calledWith({
        key: 'key',
        environment: 'live',
        application: 'app-id'
      });
    });
    it('maps runscope settings', () => {
      return expect(connectorSetting.settings.runscopeBucket).to.eql('runscope-bucket');
    });
    it('returns a ConnectorProxy', () => {
      return expect(result).to.be.instanceOf(ConnectorProxy);
    });
    it('passes settings to connector proxy', () => {
      return expect(result._connectorSetting).to.eql(connectorSetting);
    });
    it('passes context to connector proxy', () => {
      return expect(ConnectorProxy.prototype.init).to.have.been.calledWith(context);
    });
  });
});
