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
	.controller("MenuCtrl", ["$scope", "$rootScope", "PetrovStorage", function($scope, $rootScope, PetrovStorage) {

		//
		// Настройки последних дней и задач
		//

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
				taskRecent: $scope.recent[1],
				currentAccount: ""
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

		//
		// Шорткаты
		//

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

		//
		// Юзер, аккаунты, перенос данных таймера
		//

		$scope.settings.currentAccount = PetrovStorage.account;


		//
		// Хелперы
		//

		function saveSettings() {
			localStorage.setItem("Timerwood-Settings", angular.toJson($scope.settings));
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
