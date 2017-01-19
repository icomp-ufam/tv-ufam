angular.module("icomptvApp")
  .config(function(
    $routeProvider
  ) {

    $routeProvider.when("/account/publisher/videos/calendar", {
      templateUrl: "view/account/publisher/PubVideosCalendarTpl.html",
      controller: "PubVideosCalendarCtrl"
    });
    $routeProvider.otherwise({
      redirectTo: "/account/publisher/videos/calendar"
    });
  });