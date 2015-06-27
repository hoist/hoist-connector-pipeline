'use strict';
import ConnectorProxy from '../../lib/proxy';
import {
  expect
}
from 'chai';
import path from 'path';
/** @test {ConnectorProxy} */
describe('Proxy', function () {
  let proxy;
  before(() => {
    proxy = new ConnectorProxy({
      application: 'app-id',
      connectorType: 'test_connector',
      settings: {
        setting: true
      }
    });
  });
  /** @test {ConnectorProxy#constructor} */
  describe('contructor', () => {
    it('sets up logger', () => {
      return expect(proxy._logger).to.exist;
    });
    it('saves path to connector', () => {
      return expect(proxy._connectorPath).to.eql(path.resolve(__dirname, '../fixtures/test_connectors/test_connector'));
    });
    it('saves settings', () => {
      return expect(proxy._settings).to.eql({
        setting: true
      });
    });
  });
  //** @test {ConnectorProxy#init} */
  describe('ConnectorProxy#init', () => {

  });
});
