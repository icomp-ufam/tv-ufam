angular.module("icomptvApp")
  .controller("PubVideosViewCtrl", function(
    $scope,
    $filter,
    $http,
    $location,
    AppLogSvc,
    ToastSvc,
    $window,
    $timeout
  ) {
    AppLogSvc.log("PubVideosViewCtrl iniciado.");

    $scope.program = {};

    $scope.app = "Visualizar programa";
  });