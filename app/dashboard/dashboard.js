'use strict';

angular.module('myApp.dashboard', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/dashboard', {
    templateUrl: 'dashboard/dashboard.html',
    controller: 'DashboardCtrl',
    resolve: {
	    // controller will not be loaded until $waitForAuth resolves
	    // Auth refers to our $firebaseAuth wrapper in the example above
	    "currentAuth": ["Auth", function(Auth) {
	      // $waitForAuth returns a promise so the resolve waits for it to complete]\
	      return Auth.$requireAuth();
	    }]
	}
  });
}])

.controller('DashboardCtrl', ['$scope', '$location','$mdDialog', '$mdToast', 'lists', 'transactions', function($scope, $location, $mdDialog, $mdToast, lists, transactions) {
	$scope.lists = lists.get();

	lists.get().then(function(listData) {
		$scope.lists = listData;	
	});
	
	$scope.createNewList = function($event) {
		var parentEl = angular.element(document.body);
      	
      	$mdDialog.show({
        	parent: parentEl,
	        targetEvent: $event,
	        templateUrl: 'dashboard/addlist.tmpl.html',
			controller: DialogController
      	});
		
		function DialogController($scope, $mdDialog) {				
			$scope.saveList = function() {
				lists.add($scope.newList).then(function(result) {
					$mdDialog.hide();
				});
			}
        
        	$scope.cancelDialog = function() {
        		$mdDialog.hide();
        	}
      	}
	};

	$scope.selectList = function(list) {
		$location.path("/list/" + list.$id);
	};

	$scope.deleteList = function(list, ev) {
		var confirm = $mdDialog.confirm()
			//.parent(angular.element(document.body))
			.title('')
			.content('Would you like to delete this list?')
			.ariaLabel('')
			.ok('Yes')
			.cancel('No')
			.targetEvent(ev);
		$mdDialog.show(confirm).then(function() {
			lists.delete(list);
		});
	};

}])

.factory('lists', ['$q', '$firebaseArray', '$firebaseObject', 'getDBUrl', 'user', function($q, $firebaseArray, $firebaseObject, getDBUrl, user) {
	var baseRef = new Firebase(getDBUrl.path + '/' + user.get().uid);
	var listRef = baseRef.child("lists");
	var lists = $firebaseArray(listRef);

	return {
		get: function() {
			var deferred = $q.defer();
			
			deferred.resolve(lists);
			return deferred.promise;
		},
		add: function(list) {
			var deferred = $q.defer();

			lists.$add(list).then(function(ref) {
				deferred.resolve(ref);	
			});

			return deferred.promise;
		},
		select: function(list) {

		},
		edit: function(list) {
			var deferred = $q.defer();
       	
        	transactions[transactions.$indexFor(transaction.$id)] = transaction;

			transactions.$save(transaction).then(function(ref) {
				deferred.resolve(ref);	
			});

			return deferred.promise;	
		},
		delete: function(list) {
			var deferred = $q.defer();
			
			lists.$remove(list).then(function(ref) {
				deferred.resolve(ref);
			});

			return deferred.promise;
		},
	}
}])

;