//
// Таймер 3.0
// Контроллер "Меню"
//

angular.module("TimerwoodApp.controllers")	
	.controller("MenuCtrl", ["$scope", "$rootScope", "PetrovStorage", "Storage", function($scope, $rootScope, PetrovStorage, Storage) {
		$scope.recent = [
			{value: 1},
			{value: 2},
			{value: 3},
			{value: 4},
			{value: 5}
		];
		var settings = angular.fromJson(localStorage.getItem("Timerwood-Settings"));
		if(!settings) {
			$scope.settings = {
				dateRecent: $scope.recent[1],
				taskRecent: $scope.recent[1]
			}
		} else {
			$scope.settings = {
				dateRecent: $scope.recent[settings.dateRecent.value-1],
				taskRecent: $scope.recent[settings.taskRecent.value-1],
			}
		}
		$scope.$watch("settings.dateRecent", function(newval, oldval) {
			$rootScope.dateRecent = newval.value;
			saveSettings();
		});
		$scope.$watch("settings.taskRecent", function(newval, oldval) {
			$rootScope.taskRecent = newval.value;
			saveSettings();
		});

		// шорткаты
		$scope.$watch("menu", function(newval, oldval) {
			$rootScope.menu = newval;
		});
		$rootScope.$watch("menu", function(newval, oldval) {
			$scope.menu = newval;
		});
		$scope.$watch("help", function(newval, oldval) {
			$rootScope.help = newval;
		});
		$scope.$watch("notes", function(newval, oldval) {
			$rootScope.notes = newval;
		});
		$scope.$on("shortcut:H", function() { $scope.help = !$scope.help; });
		$scope.$on("shortcut:M", function() { $scope.menu = !$scope.menu; });
		$scope.$on("shortcut:N", function() { $scope.notes = !$scope.notes; });

		// синхронизация
		$scope.currentAccount = PetrovStorage.account ? PetrovStorage.account : "локальный";
		$rootScope.currentAccount = PetrovStorage.account;
		$scope.exportAccount = "";
		$scope.checkSubmit = function(event) {
			if(event.keyCode == 13) {
				exportCurrentData($scope.exportAccount);
			}
		}
		$scope.submitExport = function() {
			exportCurrentData($scope.exportAccount);
		}

		// попапы
		$scope.showPopup = false;

		function saveSettings() {
			localStorage.setItem("Timerwood-Settings", angular.toJson($scope.settings));
		}

		function exportCurrentData(account) {
			// очистить
			$scope.exportAccount = "";
			// проверяем чего понаписали
			if(account == PetrovStorage.account) {
				$scope.popupMessage = "Глупо экспортировать текущие даные в текущий же аккаунт...";
				$scope.cancelAction = "";
				$scope.okAction = "ладно";
				$scope.okCallback = function() {};
				$scope.showPopup = true;
			} else if(!account || account == "") {
				// хотим заменить локальный аккаунт
				// вывести предупреждение
				$scope.popupMessage = "Вы собираетесь заменить все записи 'локального' аккаунта записями аккаунта " + PetrovStorage.account + "?";
				$scope.cancelAction = "ошибочка вышла";
				$scope.okAction = "точняк";
				$scope.okCallback = function() { 
					Storage.saveLocal(account); 
					$scope.popupMessage = "Удача сопутствовала вам. Перейти в 'локальный' аккаунт?";
					$scope.cancelAction = "не надо";
					$scope.okAction = "да";
					$scope.okCallback = function() {
						location.href = location.href.split("?")[0] + (account ? ("?"+account) : "");
					};
					$scope.showPopup = true;
				}
				$scope.showPopup = true;
			} else {
				// хотим заменить удалённый аккаунт, 
				// вывести предупреждение
				$scope.popupMessage = "Вы собираетесь заменить все записи аккаунта " + account + 
					" записями " + (PetrovStorage.account ? "" : "'локального'") + " аккаунта " + 
					(PetrovStorage.account ? PetrovStorage.account : "") + "?";
				$scope.cancelAction = "ошибочка вышла";
				$scope.okAction = "точняк";
				$scope.okCallback = function() {
					Storage.saveLocal(account);
					Storage.saveRemote(account).then(function() {
						$scope.popupMessage = "Успех благоволит вам. А не желаете ли сразу и перейти в аккаунт " + account + "?";
						$scope.cancelAction = "не стоит";
						$scope.okAction = "извольте";
						$scope.okCallback = function() {
							location.href = location.href.split("?")[0] + (account ? ("?"+account) : "");
						};
						$scope.showPopup = true;
					});
				}
				$scope.showPopup = true;
			}
		}

	}]);