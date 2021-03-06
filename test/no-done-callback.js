// This is based on the async-map test in pull-stream.

var pull = require('pull-stream')
var Spec = require('pull-spec')
var tape =  require('tape')
var asyncMap = require('../');
tape('async-map', function (t) {

  pull(
    pull.count(),
    pull.take(21),
    asyncMap(function (data) {
      return Promise.resolve(data + 1);
    }),
    pull.collect(function (err, ary) {
      console.log(ary)
      t.equal(ary.length, 21)
      t.end()
    })
  )
})

tape('abort async map', function (t) {
  var err = new Error('abort')
  t.plan(2)

  var read = pull(
    pull.infinite(),
    asyncMap(function (data, cb) {
      return new Promise(function(resolve, reject) {
        setImmediate(resolve, data);
      });
    })
  )

  read(null, function (end) {
    if(!end) throw new Error('expected read to end')
    t.ok(end, "read's callback")
  })

  read(err, function (end) {
    if(!end) throw new Error('expected abort to end')
    t.ok(end, "Abort's callback")
    t.end()
  })

})

tape('abort async map (async source)', function (t) {
  var err = new Error('abort')
  t.plan(2)

  var read = pull(
    function(err, cb) {
      setImmediate(function() {
        if (err) return cb(err)
        cb(null, 'x')
      })
    },
    asyncMap(function (data, cb) {
      return new Promise(function(resolve, reject) {
        setImmediate(resolve, data);
      });
    })
  )

  read(null, function (end) {
    if(!end) throw new Error('expected read to end')
    t.ok(end, "read's callback")
  })

  read(err, function (end) {
    if(!end) throw new Error('expected abort to end')
    t.ok(end, "Abort's callback")
    t.end()
  })

})
tape('asyncMap aborts when map errors', function (t) {
  t.plan(2)
  var ERR = new Error('abort')
  pull(
    pull.values([1,2,3], function (err) {
      console.log('on abort')
      t.equal(err, ERR, 'abort gets error')
      t.end()
    }),
    asyncMap(function (data) {
      return Promise.reject(ERR);
    }),
    pull.collect(function (err) {
      t.equal(err, ERR, 'collect gets error')
    })
  )
})

tape("async map should pass its own error", function (t) {
  var i = 0
  var error = new Error('error on last call')

  pull(
    function (end, cb) {
      end ? cb(true) : cb(null, i+1)
    },
    asyncMap(function (data, cb) {
      return new Promise(function(resolve, reject) {
        setTimeout(function () {
          if(++i < 5) resolve(data)
          else {
            reject(error)
          }
        }, 100)
      });
    }),
    pull.collect(function (err, five) {
      t.equal(err, error, 'should return err')
      t.deepEqual(five, [1,2,3,4], 'should skip failed item')
      t.end()
    })
  )
})

tape('spec without callbacks', function(t) {
  t.doesNotThrow(function() {
    pull(
      Spec(pull.values([1, 2, 3])),
      asyncMap(function(data, cb) {
        return Promise.resolve(data);
      })
    )
  });

  t.end();
});

tape('without map function', function(t) {
  pull(
    pull.count(),
    pull.take(21),
    asyncMap(),
    pull.collect(function(err, ary) {
      console.log(ary)
      t.equal(ary.length, 21)
      t.end()
    })
  );
});

tape('map function throws synchronous error', function(t) {
  t.plan(2)
  var ERR = new Error('abort')
  pull(
    pull.values([1, 2, 3], function(err) {
      console.log('on abort')
      t.equal(err, ERR, 'abort gets error')
    }),
    asyncMap(function(data) {
      throw ERR;
    }),
    pull.collect(function(err) {
      t.equal(err, ERR, 'collect gets error')
    })
  )
});
