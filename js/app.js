//
// Таймер 3.0
// приложение

// 
// сборка angular модулей
// 

angular.module("TimerwoodApp", ["TimerwoodApp.controllers", "TimerwoodApp.services", "TimerwoodApp.filters", "TimerwoodApp.directives"]);
angular.module("TimerwoodApp.controllers", []);
angular.module("TimerwoodApp.services", []);
angular.module("TimerwoodApp.filters", []);
angular.module("TimerwoodApp.directive", []);

// Хак для dropbox редиректа
// angular.module("TimerwoodApp")
// 	.config(['$locationProvider', function($locationProvider) {
//     	$locationProvider.html5Mode(false);
//     	$locationProvider.hashPrefix("!"); 
//     }]);

//
// Контроллер подвала
//

angular.module("TimerwoodApp.controllers")	
	.controller("FooterCtrl", ["$scope", "Storage", function($scope, Storage) {
		$scope.storage = Storage.entries;
	}]);

//
// Контроллер меню
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
					$scope.popupMessage = "Удача сопутствовала вам";
					$scope.cancelAction = "";
					$scope.okAction = "хорошо";
					$scope.okCallback = function() {};
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
						$scope.popupMessage = "Успех благоволит вам";
						$scope.cancelAction = "";
						$scope.okAction = "хорошо";
						$scope.okCallback = function() {};
						$scope.showPopup = true;
					});
				}
				$scope.showPopup = true;
			}
		}

	}]);

//
// Контроллер попапов
//

angular.module("TimerwoodApp.controllers")	
	.controller("PopupCtrl", ["$scope", "$rootScope", function($scope, $rootScope) {
		$scope.close = function(popup) {
			$rootScope[popup] = false;
		}
	}]);


//
// Хелперы
//

function openDialog(opts) { // text, okText, okFunc, okArgs, cancelText) {
	var dialog = $("<div id='auto-dialog' class='dialog'>"+
		"<article " + (opts.width? "style='width: "+opts.width+"px;'" : "") + ">" +
		opts.html +
		"<p>&nbsp;</p>"+
		"<p style='text-align: center;'>" + 
		(opts.ok ? ("<a class='ok'>" + opts.ok + "</a> &emsp; ") : "") + 
		"<a class='cancel'>" + (opts.cancel ? opts.cancel : "Отмена") + "</a>" + 
		"</p>" + 
		"</article>"+
		"</div>");
	$("body").append(dialog);
	dialog.find("a.ok").on("click", function() {
		if(opts.success) {
			opts.success(opts.args);
		}
		dialog.remove();
	});
	dialog.find("a.cancel").on("click", function() {
		if(opts.fail) {
			opts.fail();
		}
		dialog.remove();
	});
}

function popupInfo(text) {
	openDialog({
		html: "<p style='text-align: center'>"+text+"</p>",
		ok: "Ок",
		width: 450
	});
}
