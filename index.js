'use strict'

var asyncMap = require('pull-async-map-done');

module.exports = function promiseMapDone(mapCb, doneCb) {
  if(!mapCb) {
    mapCb = function(data) { return Promise.resolve(data); }
  }

  return asyncMap(
    function map(data, cb) {
      Promise.resolve(mapCb(data))
        .then(function(d) { cb(null, d); })
        .catch(function(e) { cb(e); });
    },
    function done(err, cb) {
      if(doneCb) {
        Promise.resolve(doneCb(err))
          .then(function(d) { cb(null, d); })
          .catch(function(e) { cb(e); });
      } else {
        return cb(err);
      }
    });
}
