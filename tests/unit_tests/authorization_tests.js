'use strict';
import Authorization from '../../src/authorization';
import {
  BouncerToken
}
from '@hoist/model';
import {
  expect
}
from 'chai';
import sinon from 'sinon';


describe('Authorization', function () {
  var _token;
  var _authorization;
  before(function () {
    _token = new BouncerToken({
      state: {
        key: 'value'
      }
    });
    _authorization = new Authorization(_token);
  });
  describe('get', function () {
    it('returns existing values', function () {
      return expect(_authorization.get('key'))
        .to.eql('value');
    });
    it('returns null for non present values', function () {
      return expect(_authorization.get('other'))
        .to.not.exist;
    });
  });
  describe('set', function () {
    before(function (done) {
      sinon.stub(_token, 'saveAsync').returns(Promise.resolve([_token]));
      _authorization.set('new', 'new_value', done);
    });
    after(function () {
      _token.saveAsync.restore();
    });
    it('sets value in state', function () {
      return expect(_token.state.new).to.eql('new_value');
    });
    it('calls save', function () {
      return expect(_token.saveAsync).to.have.been.called;
    });
  });
  describe('delete', function () {
    before(function (done) {
      sinon.stub(_token, 'saveAsync').returns(Promise.resolve([_token]));
      _token.state.deletable = 'deletable_value';
      _authorization.delete('deletable', done);
    });
    after(function () {
      _token.saveAsync.restore();
    });
    it('sets value in state', function () {
      return expect(_token.state.deletable).to.not.exist;
    });
    it('calls save', function () {
      return expect(_token.saveAsync).to.have.been.called;
    });
  });
});
