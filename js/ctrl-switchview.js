//
// Таймер 3.0
// Контроллер переключения вида
//
 
angular.module("TimerwoodApp.controllers")
	.controller("SwitchViewCtrl", ["$scope", "$rootScope", "Storage", function($scope, $rootScope, Storage) {
		$scope.storage = Storage.entries;
		
		$scope.currentView = window.localStorage ? (window.localStorage.getItem("Timerwood-view") ? window.localStorage.getItem("Timerwood-view") : "task") : "task"; // date, storage, task

		// переключаем вид по просьбе
		var views = ["storage", "date", "task"];
		$scope.$on("change-view", function(event, data) {
			if(views.indexOf(data) > -1) {
				$scope.currentView = data;
			} else {
				console.log("Неправильный вид попросили поменять!", data);
			}
		});

		// следим за изменением вида
		$scope.$watch("currentView", updateView);
		function updateView() {
			if(window.localStorage)  {
				window.localStorage.setItem("Timerwood-view", $scope.currentView);
			}
			// Нам нужно передать в таймер состояние переключателя
			$rootScope.$broadcast("view-changed", $scope.currentView);
		}
	}]);