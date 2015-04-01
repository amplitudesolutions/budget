'use strict';

angular.module('myApp.dashboard', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/dashboard', {
    templateUrl: 'dashboard/dashboard.html',
    controller: 'DashboardCtrl'
  });
}])

.controller('DashboardCtrl', ['$scope','$mdDialog', '$filter', 'transactions', function($scope, $mdDialog, $filter, transactions) {
	$scope.months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	$scope.filteredMonths = [];

	$scope.transactions = transactions.get();

	//Used for the Mark Recurring Dialog.
	var today = new Date();
	$scope.starts = $filter('date')(today, 'MM/dd/yyyy');

	// var currentMonth = today.getMonth();

	$scope.displayMonths = function(selectedMonth) {
		// Need to figure out how to handle it, if current month is 0 (Jan), need to display Dec and Feb.
		$scope.filteredMonths = $scope.months.slice(selectedMonth - 1, selectedMonth + 2);
	}

	$scope.displayMonths(today.getMonth());

	var total = 0;
	$scope.calculateTotal = function(index) {
		if (item.type === 'W') {
			//Withdrawal
			$scope.transactions[index].total -= item.amount;
		} else {
			//Deposit 'D'
			total += item.amount;
		}
		return total;
	}

	$scope.addNewTransaction = function($event) {
		var parentEl = angular.element(document.body);
      	
      	$mdDialog.show({
        	parent: parentEl,
	        targetEvent: $event,
	        templateUrl: 'dashboard/addtransaction.tmpl.html',
			controller: DialogController
      	});
		
		function DialogController($scope, $mdDialog) {				
			$scope.addTransaction = function() {
				transactions.add($scope.newTransaction).then(function(result) {
					$mdDialog.hide();
				});
			}
        
        	$scope.cancelDialog = function() {
        		$mdDialog.hide();
        	}
      	}
	}

	$scope.addAndMarkComplete = function() {
		$scope.newTransaction.complete = true;
		$scope.addTransaction();
	};

	$scope.cancelNewTransaction = function() {
		$scope.isAddingNewTransaction = false;
		$scope.newTransaction = {};
	}

	$scope.markComplete = function(transaction) {
		transactions.setComplete(transaction);
	}

	$scope.setRecurring = function($event) {
		var parentEl = angular.element(document.body);
	       $mdDialog.show({
	         parent: parentEl,
	         targetEvent: $event,
	         template:
	           '<md-dialog aria-label="List dialog">' +
	           '  <md-content>'+
	           '	<md-select placeholder="Repeats" ng-model="time">'+
	           '		<md-option value="weekly">Weekly</md-option>'+
	           '		<md-option value="biweekly">Bi Weekly</md-option>'+
	           '		<md-option value="monthly">Monthly</md-option>'+
	           '	</md-select>'+
	           '	<md-input-container>'+
	           '		<label>Starts</label>'+
	           '		<input ng-model="items">'+
	           '	</md-input-container>'+
	           '	<p>Repeats Monthly on day until</p>'+
	           '  </md-content>' +
	           '  <div class="md-actions">' +
	           '	<md-button ng-click="cancelDialog()">'+
	           '		Cancel'+
	           '	</md-button>'+
	           '    <md-button ng-click="closeDialog()">' +
	           '      Set' +
	           '    </md-button>' +
	           '  </div>' +
	           '</md-dialog>',
	         locals: {
	           items: $scope.starts
	         },
	         controller: DialogController
	      });
	      function DialogController(scope, $mdDialog, items) {
	        scope.items = items;
	        scope.closeDialog = function() {
	          $mdDialog.hide();
	        }
	        scope.cancelDialog = function() {
	        	$mdDialog.hide();
	        }
	      }
	}

}])

.filter('getTransactionsByMonth', function() {
	return function(items, month) {
		var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
		var filtered = [];
		for (var i = 0; i < items.length; i++) {
			var item = items[i];
			var date = new Date(item.date);

			if (months[date.getUTCMonth()] === month) {
				filtered.push(item);
			}
		}

		return filtered;
	};
})

.factory('getDBUrl', ['$location', function($location) {
	var dbURL = null;
	if ($location.host() == 'localhost' || $location.host() == 'mybudget.firebaseapp.com') {
		// DEV DB
    	dbURL = "https://mybudget.firebaseio.com";
	} else if ($location.host() == 'mybudget.firebaseapp.com') {
		dbURL = "https://mybudget.firebaseio.com";
	}
	
	return {path: dbURL};
}])

.factory('transactions', ['$q', '$firebaseArray', 'getDBUrl', function($q, $firebaseArray, getDBUrl) {
	var baseRef = new Firebase(getDBUrl.path);
	var transactionRef = baseRef.child("transactions");
	var transactions = $firebaseArray(transactionRef);

	var recurring = [
		{id: 1, date: 1426748400000, description: 'Rent', amount: 1500, type: 'W', repeats: 'monthly'}
	];

	return {
		get: function() {
			return transactions;
		},
		add: function(transaction) {
			var deferred = $q.defer();

			transactions.$add(transaction).then(function(ref){
				deferred.resolve(transaction);	
			})			

			return deferred.promise;
		},
		setComplete: function(transaction) {
			var deferred = $q.defer();

			transaction.complete = !transaction.complete;
			transactions.$save(transaction);

			return deferred.promise;
		},
		setRecurring: function(transaction, details) {

		}
	}
}])
;