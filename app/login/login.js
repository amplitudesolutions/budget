'use strict';

angular.module('myApp.login', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/login', {
    templateUrl: 'login/login.html',
    controller: 'LoginCtrl',
    resolve: {
	    // controller will not be loaded until $waitForAuth resolves
	    // Auth refers to our $firebaseAuth wrapper in the example above
	    "currentAuth": ["Auth", function(Auth) {
	      // $waitForAuth returns a promise so the resolve waits for it to complete
	      return Auth.$waitForAuth();
	    }]
  	}
  });
}])

.controller('LoginCtrl', ['$scope', '$location', 'user', function($scope, $location, user) {
	$scope.user = '';

	$scope.signInClick = function() {
		user.login($scope.user).then(function(userObj) {
			//$location.path("/dashboard");
			window.location.href = "#/dashboard"
		}).catch(function(error) {
			console.log(error);
		});
	}

	$scope.createAccountClick = function() {

	}
}]);