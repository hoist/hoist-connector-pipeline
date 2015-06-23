'use strict';
var model = require('../../lib/model');
var expect = require('chai').expect;

describe('model', function () {
  it('returns @hoist/model', function () {
    expect(model.instance()).to.eql(require('@hoist/model'));
  });
  it('is overridable', function () {
    var obj = {};
    model.set({});
    expect(model.instance()).to.eql(obj);
    model.set(require('@hoist/model'));
  });
  after(function () {
    model.set(require('@hoist/model'));
  });
});
