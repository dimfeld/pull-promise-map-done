'use strict'

var asyncMap = require('pull-async-map-done');

module.exports = function promiseMapDone(mapCb, doneCb) {
  var map;
  if(mapCb) {
    map = function map(data, cb) {
      try {
        Promise.resolve(mapCb(data))
          .then(function(d) { cb(null, d); })
          .catch(function(e) { cb(e); });
      } catch(e) {
        cb(e);
      }
    }
  } else {
    map = function map(data, cb) { cb(null, data); };
  }

  return asyncMap(map,
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
