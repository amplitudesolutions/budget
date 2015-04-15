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

.controller('DashboardCtrl', ['$scope','$mdDialog', '$filter', 'transactions', function($scope, $mdDialog, $filter, transactions) {
	$scope.months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	$scope.filteredMonths = [];

	transactions.get().then(function(transData) {
		console.log(transData);
		$scope.transactions = transData;	
	});
	$scope.balances = transactions.getBalances();
	//$scope.openingBalance = transactions.getOpeningBalance();

	transactions.getOpeningBalance().then(function(ref) {
		$scope.openingBalance = ref;	
	})
	
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

	$scope.removeTransaction = function(transaction) {
		transactions.delete(transaction).then(function(result) {
			//do toast message here.
		});
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

.filter('getTotal', [function(){
	return function(data, key) {

	}
}])

.filter('getTransactionsByMonth', ['$filter', function($filter) {
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

		// Default to previous month
		var itemsToDisplay = -1;
		var date = new Date();
		if (months[date.getUTCMonth()] === month ) {
			itemsToDisplay = 9999;
		} else if (months[date.getUTCMonth()+1] === month){
			//Next Month
			itemsToDisplay = 1;
		}

		return $filter('limitTo')(filtered, itemsToDisplay, 0);
	};
}])

.factory('transactions', ['$q', '$firebaseArray', '$firebaseObject', 'getDBUrl', 'user', function($q, $firebaseArray, $firebaseObject, getDBUrl, user) {
	var baseRef = new Firebase(getDBUrl.path + '/' + user.get().uid);
	var transactionRef = baseRef.child("transactions");
	var optionsRef = baseRef.child("options");
	var transactions = $firebaseArray(transactionRef);
	var options = $firebaseObject(optionsRef);

	var recurring = [
		{id: 1, date: 1426748400000, description: 'Rent', amount: 1500, type: 'W', repeats: 'monthly'}
	];

	var balanceArray = {};

	function calculateBalance() {
		//Loop through all transactions, calculating the balance.
		//Create a refereance array for the balance.
		var openingBalance = 0;
		var previousTransaction = '';
		options.$loaded().then(function() {
			openingBalance = options.startingbalance;

			angular.forEach(transactions, function(key, val) {
				//console.log(key);
				if (previousTransaction === '') {
					if (key.type === 'W') {
						balanceArray[key.$id] = parseFloat(openingBalance) - parseFloat(key.amount);
					} else if (key.type === 'D') {
						balanceArray[key.$id] = parseFloat(openingBalance) + parseFloat(key.amount);
					}
				} else {
					if (key.type === 'W') {
						balanceArray[key.$id] = parseFloat(balanceArray[previousTransaction]) - parseFloat(key.amount); 
					} else if (key.type === 'D') {
						balanceArray[key.$id] = parseFloat(balanceArray[previousTransaction]) + parseFloat(key.amount);
					}
				}
				previousTransaction = key.$id;
				//console.log(balanceArray['-JlsYsQ8v5o17jXXk9Ok']);
				//balanceArray[key.$id] = key.amount + openingBalance; 
			});
			//console.log(balanceArray);	
		});
				

		//var balances = { -askejerer: {balance: 1232.22}, -asdsaewer: {2322.23} }
	}

	return {
		get: function() {
			var deferred = $q.defer();
			calculateBalance();
			deferred.resolve(transactions);
			return deferred.promise;
		},
		getOpeningBalance: function() {
			var deferred = $q.defer();
			
			options.$loaded().then(function() {
				deferred.resolve(options.startingbalance);
			});
			return deferred.promise;
		},
		getBalances: function() {
			return balanceArray;
		},
		add: function(transaction) {
			var deferred = $q.defer();

			transactions.$add(transaction).then(function(ref) {
				deferred.resolve(ref);	
			});

			return deferred.promise;
		},
		delete: function(transaction) {
			var deferred = $q.defer();
			
			transactions.$remove(transaction).then(function(ref) {
				deferred.resolve(ref);
			});

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