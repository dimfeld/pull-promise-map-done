# pull-promise-map-done

This is based on the async-map through stream from the core pull-stream module, but it is designed to work with promise-returning functions and also incorporates a done callback. Either the map or the done callbacks may be omitted.

```
var asyncMap = require('pull-promise-map-done');

asyncMap(
    function map(data) {
        return promiseReturningFunction(data);
    },
    function done(err) {
        if(err) {
            return promiseReturningErrorReporter(err);
        }
    }
)
```