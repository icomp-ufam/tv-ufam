angular.module("icomptvApp")
  .service('ToastSvc', function(
    AppLogSvc
  ) {

    function warn (message) {
      Materialize.toast(message, 5000, 'yellow darken-1');
    }

    function success (message) {
      Materialize.toast(message, 5000, 'light-green');
    }

    function error (message) {
      Materialize.toast(message, 5000, 'red darken-1');
    }

    function info (message) {
      Materialize.toast(message, 5000, 'light-blue');
    }

    return {
      success: success,
      error: error,
      info: info,
      warn: warn
    };
  });