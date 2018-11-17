"use strict";
var app = angular.module("webApp", [
    'ui.router',
    'ui.bootstrap',
    'ngStorage'
    ]);

app.config(['$stateProvider', '$urlRouterProvider', '$httpProvider', '$locationProvider', function($stateProvider, $urlRouterProvider, $httpProvider, $locationProvider) {
   $locationProvider.hashPrefix('');
   $stateProvider
   .state('/', {
    cache: false,
    url :"/",
    templateUrl: "app/pages/home/home.html",
    controller: "homeCtrl"
})
.state('/addQuestion', {
    cache: false,
    url :"/addquestion",
    templateUrl: "app/pages/home/addQuestion.html",
    controller: "homeCtrl"
})
.state('/addvenue', {
    cache: false,
    url :"/addvenue",
    templateUrl: "app/pages/venue/addVenue.html",
    controller: "venueCtrl"
});;

$urlRouterProvider.otherwise("/");
$locationProvider.html5Mode({
  enabled: false,
  requireBase: true
});


}]); //config fuction
