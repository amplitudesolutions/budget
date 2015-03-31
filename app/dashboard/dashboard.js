'use strict';

angular.module('myApp.dashboard', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/dashboard', {
    templateUrl: 'dashboard/dashboard.html',
    controller: 'DashboardCtrl'
  });
}])

.controller('DashboardCtrl', ['$scope','$mdDialog', '$filter', 'transactions', function($scope, $mdDialog, $filter, transactions) {
	$scope.transactions = transactions.get();
	$scope.newTransaction = {};
	$scope.isAddingNewTransaction = false;

	//Used for the Mark Recurring Dialog.
	var today = new Date();
	$scope.starts = $filter('date')(today, 'MM/dd/yyyy');

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

	$scope.addNewTransaction = function() {
		$scope.isAddingNewTransaction = true;
	}

	$scope.cancelNewTransaction = function() {
		$scope.isAddingNewTransaction = false;
		$scope.newTransaction = {};
	}

	$scope.markComplete = function(transaction) {
		transactions.setComplete(transaction);
	}

	$scope.addTransaction = function() {
		transactions.add($scope.newTransaction).then(function(result) {
			$scope.newTransaction = {};
		});
	}

	$scope.addAndMarkComplete = function() {
		$scope.newTransaction.complete = true;
		$scope.addTransaction();
	};

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

.factory('transactions', ['$q', function($q) {
	var transactions = [
		//Store date in milliseconds
		{id: 1, date: 1425196800000, description: 'Borrow from XXX', amount: 5000, type: 'D', complete: false},
		{id: 5, date: 1426316400000, description: 'Car Payment', amount: 650, type: 'W', complete: true},
		{id: 2, date: 1425196800000, description: 'Rent', amount: 1500, type: 'W', complete: true},
		{id: 3, date: 1425196800000, description: 'Condo Fees', amount: 214.50, type: 'W', complete: false},
		{id: 6, date: 1426748400000, description: 'Car Insurance', amount: 105.34, type: 'W', complete: false}
	];

	var recurring = [
		{id: 1, date: 1426748400000, description: 'Rent', amount: 1500, type: 'W', repeats: 'monthly'}
	];

	return {
		get: function() {
			return transactions;
		},
		add: function(transaction) {
			var deferred = $q.defer();

			//convert to milliseconds
			transaction.date = new Date(transaction.date).getTime();

			transactions.push(transaction);
			deferred.resolve(transaction);

			return deferred.promise;
		},
		setComplete: function(transaction) {
			var deferred = $q.defer();

			// Mark item as complete, set complete = true;
			transactions.forEach(function (item) {
				if (transaction.id === item.id) {
					item.complete = !item.complete;
					deferred.resolve(item);
				}
			});

			return deferred.promise;

		},
		setRecurring: function(transaction, details) {

		}
	}
}])
;