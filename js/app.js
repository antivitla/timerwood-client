
//
// Таймер 3.0
//

// app
angular.module("TimerwoodApp", ["TimerwoodApp.controllers", "TimerwoodApp.services", "TimerwoodApp.filters", "TimerwoodApp.directives"]);
angular.module("TimerwoodApp.controllers", []);
angular.module("TimerwoodApp.services", []);
angular.module("TimerwoodApp.filters", []);
angular.module("TimerwoodApp.directive", []);

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
	.controller("HelpCtrl", ["$scope", "$rootScope", function($scope, $rootScope) {

		// если первый раз, показываем приветствие
		if(localStorage.getItem("Timerwood-hideGreetingPopup") === null) {
			$rootScope.hideGreetingPopup = true;
			$rootScope.greetingPopup = true;
			localStorage.setItem("Timerwood-hideGreetingPopup", true);
		} else {
			$rootScope.hideGreetingPopup = localStorage.getItem("Timerwood-hideGreetingPopup") == "false" ? false : true;
			$rootScope.greetingPopup = !$rootScope.hideGreetingPopup;
		}

		// если что, сохраняем показывание или нет приветствия при загрузке
		$rootScope.$watch("hideGreetingPopup", function(val, oldval) {
			localStorage.setItem("Timerwood-hideGreetingPopup", val);
		});

		// переключение показывать или нет приветствие
		$rootScope.save = function(val) {
			$rootScope.hideGreetingPopup = val;
		};

		// дальше делаем хакинг антиангуларовский...
		// а может и ангуларовский
		$rootScope.help = false;
		$scope.toggleHelp = function() {
			$rootScope.help = !$rootScope.help;
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
