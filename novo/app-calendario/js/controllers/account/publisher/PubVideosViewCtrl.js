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

    $desc = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec dictum sapien tortor, vel feugiat eros dapibus eget. Vestibulum ligula quam, commodo eget commodo ut, auctor in elit. Aenean mattis tincidunt lectus, vel dictum neque convallis in. Aliquam posuere tortor vel augue dictum cursus. Proin commodo neque quis sapien sodales, sed mollis magna congue. Etiam in turpis eu ante condimentum scelerisque vel nec tortor. Sed sed odio non justo dictum iaculis vitae a magna. Proin cursus sed sapien vehicula molestie. Donec nulla ex, ornare in fermentum luctus, feugiat in magna. Sed at luctus leo. Nullam tempor pellentesque metus, sed gravida diam sodales vitae. Vivamus posuere eu ligula non dignissim. Vivamus eu quam ante. Quisque finibus sollicitudin justo a congue. Integer ut commodo lacus.";

    $scope.programa = {inic: "13:00", term: "13:45", tit: "Hello World!", desc: $desc};

    $scope.app = "Visualizar programa";
  });