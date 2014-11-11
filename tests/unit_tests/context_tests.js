'use strict';
var context = require('../../lib/context');
var expect = require('chai').expect;

describe('context', function () {
  it('returns hoist-context', function () {
    expect(context.instance()).to.eql(require('hoist-context'));
  });
  it('is overridable', function () {
    var obj = {};
    context.set({});
    expect(context.instance()).to.eql(obj);
    context.set(require('hoist-context'));
  });
  after(function () {
    context.set(require('hoist-context'));
  });
});
