angular.module("icomptvApp")
  .service('AppLogSvc', function(
    $timeout,
    $window
  ) {
    var _log = function(string) {
      if (true) {
        console.log(string);
      }
    }
    var _logObj = function(string, obj) {
      if (true) {
        var msg = string + "\n\n";
        $timeout(function() {
          angular.forEach(obj, function(value, key) {
            msg = msg + key + ' : ' + value + "\n";
          });
          console.log(msg);
        });
      }
    }
    var _error = function(message) {
      if (true) {
        console.error(message);
      }
    }
    return {
      log: _log,
      error: _error,
      logObj: _logObj
    };
  });