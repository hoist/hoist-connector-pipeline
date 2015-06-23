'use strict';
var HoistContext = require('@hoist/context');

module.exports = {
  set: function (Context) {
    HoistContext = Context;
  },
  instance: function () {
    return HoistContext;
  }
};
