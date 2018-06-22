// Test with done callback that returns data

var pull = require('pull-stream')
var Spec = require('pull-spec');
var tape = require('tape')
var asyncMap = require('../');
tape('normal case with done callback returning data', function(t) {
  var doneCalled = false;

  pull(
    pull.count(),
    pull.take(21),
    asyncMap(function(data) {
        return Promise.resolve(data + 1);
      },
      function done(err, cb) {
        t.equal(err, null, 'done callback has null err');
        doneCalled = true;
        return Promise.resolve(100);
      }
    ),
    pull.collect(function(err, ary) {
      console.log(ary)
      t.equal(ary.length, 22)
      t.equal(doneCalled, true, 'done called');
      t.end()
    })
  )
})

tape('normal case with async done callback returning data', function(t) {
  var doneCalled = false;

  pull(
    pull.count(),
    pull.take(21),
    asyncMap(function(data) {
        return Promise.resolve(data + 1)
      },
      function done(err, cb) {
        t.equal(err, null, 'done callback has null err');
        doneCalled = true;
        return Promise.resolve(100);
      }
    ),
    pull.collect(function(err, ary) {
      console.log(ary)
      t.equal(ary.length, 22)
      t.equal(doneCalled, true, 'done called');
      t.end()
    })
  )
})

tape('abort async map', function(t) {
  var err = new Error('abort')
  t.plan(2)

  var read = pull(
    pull.infinite(),
    asyncMap(function(data) {
      return new Promise(function(resolve, reject) {
        setImmediate(function() {
          resolve(data)
        });
      });
      },
      function done(err) {
        return new Promise(function(resolve, reject) {
          setImmediate(function() {
            resolve(100)
          });
        });
      }
    )
  )

  read(null, function(end) {
    if(!end) throw new Error('expected read to end')
    t.ok(end, "read's callback")
  })

  read(err, function(end) {
    if(!end) throw new Error('expected abort to end')
    t.equal(end, err, "Abort's callback")
  })

})

tape('abort async map (async source)', function(t) {
  var err = new Error('abort')
  t.plan(2)

  var read = pull(
    function(err, cb) {
      setImmediate(function() {
        if(err) return cb(err)
        cb(null, 'x')
      })
    },
    asyncMap(function(data) {
        return new Promise(function(resolve, reject) {
          setImmediate(resolve, data);
        });
      },
      function done(err) {
        return new Promise(function(resolve, reject) {
          setImmediate(resolve, 100);
        });
      }
    ),
  )

  read(null, function(end) {
    if(!end) throw new Error('expected read to end')
    t.ok(end, "read's callback")
  })

  read(err, function(end) {
    if(!end) throw new Error('expected abort to end')
    t.equal(end, err, "Abort's callback")
  })

})
tape('asyncMap aborts when map errors', function(t) {
  t.plan(3)
  var ERR = new Error('abort')
  pull(
    pull.values([1, 2, 3], function(err) {
      console.log('on abort')
      t.equal(err, ERR, 'abort gets error')
    }),
    asyncMap(function(data, cb) {
        return Promise.reject(ERR)
      },
      function done(err, cb) {
        t.equal(err, ERR, 'done callback gets error');
        return Promise.resolve();
      }),
    pull.collect(function(err) {
      t.equal(err, ERR, 'collect gets error')
    })
  )
})

tape("async map should pass its own error", function(t) {
  var i = 0
  var error = new Error('error on last call')

  pull(
    function(end, cb) {
      end ? cb(true) : cb(null, i + 1)
    },
    asyncMap(function(data, cb) {
      return new Promise(function(resolve, reject) {
        setTimeout(function() {
          if(++i < 5) resolve(data)
          else {
            reject(error)
          }
        }, 100)
      });
    },
      function done(err, cb) {
        t.equal(err, error, 'done callback gets error');
        return Promise.resolve(100);
      }),
    pull.collect(function(err, five) {
      t.equal(err, error, 'should return err')
      t.deepEqual(five, [1, 2, 3, 4], 'should skip failed item')
      t.end()
    })
  )
})

tape('spec with normal done callback', function(t) {
  t.doesNotThrow(function() {
    pull(
      Spec(pull.values([1, 2, 3])),
      asyncMap(
        function(data) { return Promise.resolve(data); },
        function(err) { return Promise.resolve(); }
      ),
      pull.collect(function(err, data) {
        t.notOk(err, 'no error');
        t.end();
      })
    )
  });
});

tape('spec with normal done callback (async)', function(t) {
  t.doesNotThrow(function() {
    pull(
      Spec(pull.values([1, 2, 3])),
      asyncMap(
        function(data, cb) { return Promise.resolve(data); },
        function(err, cb) { return Promise.resolve(100); }
      ),
      pull.collect(function(err, data) {
        t.notOk(err, 'no error');
        t.deepEqual(data, [1, 2, 3, 100]);
        t.end();
      })
    )
  });

});

tape('spec when done callback throws an error', function(t) {
  var ERR = new Error('error');
  t.doesNotThrow(function() {
    pull(
      Spec(pull.values([1, 2, 3])),
      asyncMap(function(data, cb) {
        return Promise.resolve(data);
      },
        function(err, cb) {
          return Promise.reject(ERR);
        }
      ),
      pull.collect(function(err, data) {
        t.equal(err, ERR, 'error is passed through');
        t.end();
      })
    )
  });
});

tape('spec when done callback throws an error (async)', function(t) {
  var ERR = new Error('error');
  t.doesNotThrow(function() {
    pull(
      Spec(pull.values([1, 2, 3])),
      asyncMap(function(data, cb) {
        return new Promise(function(resolve, reject) {
          setImmediate(resolve, data);
        })
      },
        function(err, cb) {
          return new Promise(function(resolve, reject) {
            setImmediate(reject, ERR);
          })
        }
      ),
      pull.collect(function(err, data) {
        t.equal(err, ERR, 'error is passed through');
        t.end();
      })
    )
  });
});

tape('without map function', function(t) {
  pull(
    pull.count(),
    pull.take(21),
    asyncMap(null, function(err, cb) {
      return Promise.resolve(100);
    }),
    pull.collect(function(err, ary) {
      console.log(ary)
      t.equal(ary.length, 22)
      t.end()
    })
  );
});
