'use strict';

// Declare app level module which depends on views, and components
angular.module('myApp', [
  'ngRoute',
  'myApp.dashboard',
  'myApp.view2',
  'myApp.version',
  'ngMaterial'
])

// lo dash, that way you can use Dependency injection.
.constant('_', window._)
.run(function ($rootScope) {
  $rootScope._ = window._;
})

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.otherwise({redirectTo: '/dashboard'});
}])
;