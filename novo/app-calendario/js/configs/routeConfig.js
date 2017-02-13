angular.module("icomptvApp")
  .config(function(
    $routeProvider
  ) {

    $routeProvider.when("/account/publisher/videos/calendar", {
      templateUrl: "view/account/publisher/PubVideosCalendarTpl.html",
      controller: "PubVideosCalendarCtrl"
    });

    $routeProvider.when("/account/publisher/videos/insert", {
      templateUrl: "view/account/publisher/PubVideosInsertTpl.html",
      controller: "PubVideosInsertCtrl"
    });

    $routeProvider.when("/account/publisher/videos/view", {
      templateUrl: "view/account/publisher/PubVideosViewTpl.html",
      controller: "PubVideosViewCtrl"
    });


    $routeProvider.otherwise({
      redirectTo: "/account/publisher/videos/calendar"
    });
  });