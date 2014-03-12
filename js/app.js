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
// Контроллер помощи
//

angular.module("TimerwoodApp.controllers")	
	.controller("DropboxSyncCtrl", ["$scope", "DropboxClient", "$rootScope", function($scope, DropboxClient, $rootScope) {
		$scope.connected = false;
		$scope.dropboxName = "Unknown";

		// проверяем, вдруг авторизованы, выводим инфу
		DropboxClient.info().then(function(i) {
			$scope.connected = true;
			$scope.dropboxName = i.display_name;
		});

		$scope.connect = function() {
			DropboxClient.connect();
		}
		$scope.disconnect = function() {
			DropboxClient.disconnect().then(function() {
				$scope.connected = false;
				$scope.dropboxName = "Unknown";
			});
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
