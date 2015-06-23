'use strict';
var HoistModel = require('@hoist/model');

module.exports = {
  set: function (Model) {
    HoistModel = Model;
  },
  instance: function () {
    return HoistModel;
  }
};
