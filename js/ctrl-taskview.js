//
// Таймер 3.0
// Контроллер вида "Задачи"
//
 
angular.module("TimerwoodApp.controllers")
	.controller("TasksViewCtrl", ["$scope", "$rootScope", "Tasks", function($scope, $rootScope, Tasks) {
		$scope.tasks = Tasks.entries;
		// фильтруем недавнее
		$scope.recentCount = 2; // сколько дней в недавние запихнуть
		$scope.recent = function(task) {
			return $scope.tasks.indexOf(task) > $scope.recentCount-1 ? false : true;
		};
		$scope.excludeRecent = function(task) {
			return $scope.tasks.indexOf(task) > $scope.recentCount-1 ? true : false;
		};

		// При нажатии на таск, стартуем его
		$scope.start = function(task) {
			$rootScope.$broadcast("startNewTask", {
				taskDetails: restoreDetails(task)
			});
		}

		// создаём под-таск
		$scope.subTask = function(task) {
			$rootScope.$broadcast("startNewSubTask", {
				taskDetails: restoreDetails(task)
			});
		}

		// начало редактирования
		$scope.edit = function(task) {
			// во первых нужно показать полное имя к пути, не только текущего уровня
			task.path = restoreDetails(task);
			// потом сохранить старое имя
			task.oldName = task.name;
			// ну и
			this.$broadcast("editLastItem");
		}

		// отмена
		$scope.cancel = function(task) {
			task.name = task.oldName;
		}

		// сохранить
		$scope.save = function(task) {
			console.log("save");
			// теоретически мы должны переименовать не только сам таск, но и его подтаски...
			task.name = task.path[task.path.length-1];
			recursiveRenameDetailsPart(task, task.path);
			Tasks.storage.save();
			Tasks.restore();
			return true;
		}

		// ловим enter 
		$scope.checkSubmit = function(event, task, scope) {
			if(event.keyCode == 13) {
				var result = $scope.save(task);
				if(result) scope.status = 'view';
			}
			// hit Esc
			else if(event.keyCode == 27) {
				scope.status = 'view';
			}
		}

		// переключаем на Хранилище и ищем соотв. записи
		$scope.filterStorageView = function(task) {
			$rootScope.$broadcast("change-view", "storage");
			$rootScope.$broadcast("filter-storage-entries", restoreDetails(task));
		}

		// временно - деньги
		if(!$rootScope.price) {
			$rootScope.price = {
				hour: localStorage.getItem("Timerwood-price-hour")
			}
		}
		$scope.price = $rootScope.price;
		$scope.$watch("price.hour", function(val, oldval) {
			localStorage.setItem("Timerwood-price-hour", val);
		});
		$scope.getPrice = function(ms) {
			return parseInt(ms * parseInt($scope.price.hour) / (60*60*1000));
		}

		/* Хелперы */
		function restoreDetails(task) {
			// пытаемся взять детали сразу из одной из временных промежутков
			var details = task.time.length > 0 ? angular.copy(task.time[0].details) : [];
			if(!(details.length > 0)) {
				// если время пустое, придется по родителями собирать детали
				var node = task;
				while(node) {
					details.unshift(node.name);
					node = node.parent;
				}
			}
			return details;
		}
		function recursiveRenameDetailsPart(task, path) {
			renameTaskTimeDetails(task, path);
			var newPath = angular.copy(path);
			for(var i = 0; i < task.children.length; i++) {
				var childPath = angular.copy(path);
				childPath.push(task.children[i].name);
				recursiveRenameDetailsPart(task.children[i], childPath);
			}
		}
		function renameTaskTimeDetails(task, path) {
			for(var i = 0; i < task.time.length; i++) {
				task.time[i].details = angular.copy(path);
			}
		}
	}]);