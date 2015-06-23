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
			window.location.href = "#/dashboard";
		}).catch(function(error) {
			// Need to show error message on screen indicating error. ie) Bad username or password
			$scope.userErrorCaught = false;
			$scope.passwordErrorCaught = false;
			$scope.userError = '';
			$scope.passwordError = '';

			switch(error.code) {
				case "INVALID_EMAIL":
					$scope.userErrorCaught = true;
					$scope.userError = "Email address does not exist";
					break;
				case "INVALID_PASSWORD":
					$scope.passwordErrorCaught = true;
					$scope.passwordError = "Password is invalid, please try again";
					break;
				case "INVALID_USER":
					$scope.userErrorCaught = true;
					$scope.userError = "Email address does not exist";
					break;
				default:
					console.log(error);
			}

		});
	}

	$scope.createAccountClick = function() {
		user.create($scope.user).then(function(userObj) {
			user.login($scope.user).then(function(userObj) {
				//$location.path("/dashboard");
				window.location.href = "#/dashboard";
			});
			// Need to Add Error Handling
		});
	}
}]);