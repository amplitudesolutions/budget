'use strict';

// Declare app level module which depends on views, and components
angular.module('myApp', [
  'ngRoute',
  'myApp.dashboard',
  'myApp.login',
  'myApp.list',
  'myApp.version',
  'ngMaterial',
  'firebase'
])

// lo dash, that way you can use Dependency injection.
.constant('_', window._)
.run(['$rootScope', '$location', function ($rootScope, $location) {
  	$rootScope._ = window._;

  	$rootScope.$on("$routeChangeError", function(event, next, previous, error) {
	  	// We can catch the error thrown when the $requireAuth promise is rejected
	  	// and redirect the user back to the home page
	  	if (error === "AUTH_REQUIRED") {
	   		$location.path("/login");
	  	}
	});
}])

.config(['$routeProvider', function($routeProvider) {
  	$routeProvider.otherwise({redirectTo: '/dashboard'});
}])

.controller('NavigationCtrl', ['$scope', '$location', 'user', 'Auth', function($scope, $location, user, Auth) {
	Auth.$onAuth(function(authData) {
		$scope.signedIn = user.get();
	});
	

	$scope.logout = function() {
		user.logout();
		$location.path("/login");
	}
}])

.factory('getDBUrl', ['$location', function($location) {
	var dbURL = null;
	if ($location.host() == 'localhost') {
		// DEV DB
    	dbURL = "https://mybudgetdev.firebaseio.com";
	} else if ($location.host() == 'mybudget.firebaseapp.com') {
		dbURL = "https://mybudget.firebaseio.com";
	}
	
	return {path: dbURL};
}])

.factory('Auth', ['$firebaseAuth', 'getDBUrl', function($firebaseAuth, getDBUrl) {
    var ref = new Firebase(getDBUrl.path);
    return $firebaseAuth(ref);
  }
])

.factory('user', ['$q', 'Auth', function($q, Auth) {

	return {
		get: function() {
			return Auth.$getAuth();
		},
		login: function(user) {
			var deferred = $q.defer();

			Auth.$authWithPassword(user).then(function(authData) {
				deferred.resolve(authData);
			}).catch(function(error) {
				deferred.reject(error);
			});

			return deferred.promise;
		},
		logout: function() {
			return Auth.$unauth();
		},
		create: function(user) {
			var deferred = $q.defer();

			Auth.$createUser(user).then(function(userData) {
				deferred.resolve(userData);
			}).catch(function(error){
				deferred.reject(error);
			});

			return deferred.promise;
		}
	}
}])


;