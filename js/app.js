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

//
// Контроллер подвала
//

angular.module("TimerwoodApp.controllers")	
	.controller("FooterCtrl", ["$scope", "Storage", function($scope, Storage) {
		$scope.storage = Storage.entries;
	}]);
