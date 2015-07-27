'use strict';

angular.module('myApp.list', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/list/:selectedList', {
    templateUrl: 'list/list.html',
    controller: 'ListCtrl',
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

.controller('ListCtrl', ['$scope','$mdDialog', '$filter', '$mdToast', '$routeParams', 'transactions', function($scope, $mdDialog, $filter, $mdToast, $routeParams, transactions) {
	$scope.months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	$scope.filteredMonths = [];
	var selectedList = $routeParams.selectedList;

	transactions.get(selectedList).then(function(transData) {
	//console.log(transData);
		$scope.transactions = transData;

		$scope.transactions.$watch(function(){
			$scope.balances = transactions.getBalances(selectedList);
		});
	});

	$scope.balances = transactions.getBalances(selectedList);

	transactions.getOpeningBalance(selectedList).then(function(ref) {
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

	$scope.showToast = function(content) {
		$mdToast.show($mdToast.simple()
			.content(content)
			.action('UNDO'));
			//.parent();
	};

	$scope.removeTransaction = function(transaction) {
		transactions.delete(transaction, selectedList).then(function(result) {
			$scope.showToast('Item Deleted');
			//do toast message here.
		});
	};

	$scope.addNewTransaction = function($event) {
		var parentEl = angular.element(document.body);
      	
      	$mdDialog.show({
        	parent: parentEl,
	        targetEvent: $event,
	        templateUrl: 'list/addtransaction.tmpl.html',
			controller: DialogController,
			locals: {list: selectedList}
      	});
		
		function DialogController($scope, $mdDialog, list) {
			$scope.saveTransaction = function() {
				transactions.add($scope.newTransaction, list).then(function(result) {
					$mdDialog.hide();
				});
			}
        
        	$scope.cancelDialog = function() {
        		$mdDialog.hide();
        	}
      	}
	};

	$scope.editTransaction = function($event, transaction) {
		var parentEl = angular.element(document.body);

		var editTransaction = angular.copy(transaction);
      	
      	$mdDialog.show({
        	parent: parentEl,
	        targetEvent: $event,
	        templateUrl: 'list/addtransaction.tmpl.html',
			controller: DialogController,
			locals: {transaction: editTransaction, list: selectedList}
      	});
		
		function DialogController($scope, $mdDialog, transaction, list) {				
			$scope.newTransaction = transaction;

			$scope.saveTransaction = function() {
				transactions.edit($scope.newTransaction, list).then(function(result) {
					$mdDialog.hide();
				});
			}
        
        	$scope.cancelDialog = function() {
        		$mdDialog.hide();
        	}
      	}	
	};

	$scope.addAndMarkComplete = function() {
		$scope.newTransaction.complete = true;
		$scope.addTransaction();
	};

	$scope.cancelNewTransaction = function() {
		$scope.isAddingNewTransaction = false;
		$scope.newTransaction = {};
	};

	$scope.markComplete = function(transaction) {
		transactions.setComplete(transaction, selectedList);
		var content = '';
		if (transaction.complete) {
			content = "Marked Complete";
		} else {
			content = "Marked Uncomplete";
		}
		$scope.showToast(content);
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
	};
}])

.filter('getTransactionsByMonth', ['$filter', function($filter) {
	return function(items, month) {
		var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
		var filtered = [];
		items = $filter('orderBy')(items,'date');

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

.factory('transactions', ['$q', '$filter', '$firebaseArray', '$firebaseObject', 'getDBUrl', 'user', function($q, $filter, $firebaseArray, $firebaseObject, getDBUrl, user) {
	var baseRef = new Firebase(getDBUrl.path + '/' + user.get().uid);
	// var transactionRef = baseRef.child("transactions");
	// var optionsRef = baseRef.child("options");
	// var transactions = $firebaseArray(transactionRef);
	// var options = $firebaseObject(optionsRef);

	var recurring = [
		{id: 1, date: 1426748400000, description: 'Rent', amount: 1500, type: 'W', repeats: 'monthly'}
	];

	var balanceArray = {};

	function calculateBalance(list) {
		//Loop through all transactions, calculating the balance.
		//Create a refereance array for the balance.
		var openingBalance = 0;
		var previousTransaction = '';

		var options = $firebaseObject(baseRef.child('lists/' + list + '/options'));
		var transactions = $firebaseArray(baseRef.child('lists/' + list + '/transactions'));
		options.$loaded().then(function() {
			openingBalance = options.startingbalance;
			transactions.$loaded().then(function() {
				angular.forEach($filter('orderBy')(transactions, ['date', 'order']), function(key, val) {
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
				});
			});
		});

		return balanceArray;
	};

	return {
		get: function(list) {
			var deferred = $q.defer();
			var transactions = $firebaseArray(baseRef.child('lists/' + list + '/transactions'));

			calculateBalance(list);
			
			deferred.resolve(transactions);
			return deferred.promise;
		},
		getOpeningBalance: function(list) {
			var deferred = $q.defer();
			var options = $firebaseObject(baseRef.child('lists/' + list + 'options'));
			
			options.$loaded().then(function() {
				deferred.resolve(options.startingbalance);
			});
			return deferred.promise;
		},
		getBalances: function(list) {
			return calculateBalance(list);
		},
		add: function(transaction, list) {
			var deferred = $q.defer();

			var transactions = $firebaseArray(baseRef.child('lists/' + list + '/transactions'));

			baseRef.child('lists/' + list + "/transactions").orderByChild("date").equalTo(transaction.date).once("value", function(data) {
				transaction.order = data.numChildren();
				transactions.$add(transaction).then(function(ref) {
					deferred.resolve(ref);	
				});				
			});

			return deferred.promise;
		},
		edit: function(transaction, list) {
			var deferred = $q.defer();
			
			var transactions = $firebaseArray(baseRef.child('lists/' + list + '/transactions'));

			transactions.$loaded().then(function() {
				transactions[transactions.$indexFor(transaction.$id)] = transaction;
				transactions.$save(transaction).then(function(ref) {
					deferred.resolve(ref);	
				}).catch(function(error) {
					console.log(error);
				});
			});

			return deferred.promise;	
		},
		delete: function(transaction, list) {
			var deferred = $q.defer();
			
			var transactions = $firebaseArray(baseRef.child('lists/' + list + '/transactions'));
			transactions.$loaded().then(function() {
				transactions.$remove(transactions[transactions.$indexFor(transaction.$id)]).then(function(ref) {
					deferred.resolve(ref);
				}).catch(function(error) {
					console.log(error);
				});
			});
			
			return deferred.promise;
		},
		setComplete: function(transaction, list) {
			var deferred = $q.defer();

			var transactions = $firebaseArray(baseRef.child('lists/' + list + '/transactions'));
			transaction.complete = !transaction.complete;
			transactions.$save(transaction);

			return deferred.promise;
		},
		setRecurring: function(transaction, details) {

		}
	}
}])
;