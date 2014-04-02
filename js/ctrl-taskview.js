//
// Таймер 3.0
// Контроллер "Задачи"
//
 
angular.module("TimerwoodApp.controllers")
	.controller("TasksViewCtrl", ["$scope", "$rootScope", "Tasks", "Storage", "$filter", function($scope, $rootScope, Tasks, Storage, $filter) {

		// первичных список проектов
		$scope.tasks = Tasks.children;


		// разделение на недавнее и всё остальное (меняем в опциях)
		$scope.recentCount = 2;
		$rootScope.$watch("taskRecent", function(newval, oldval) {
			$scope.recentCount = newval;
		});
		$scope.recentCount = 2; // сколько дней в недавние запихнуть
		$scope.recent = function(task) {
			return $scope.tasks.indexOf(task) > $scope.recentCount-1 ? false : true;
		};
		$scope.excludeRecent = function(task) {
			return $scope.tasks.indexOf(task) > $scope.recentCount-1 ? true : false;
		};
		$scope.getRecentTasksButtonText = function() {
			var text = "";
			var other = $scope.tasks.length - $scope.recentCount;
			if($scope.recentTasks) {
				if(other == 1) {
					text = "Скрыть последний проект";
				} else {
					text = "Скрыть остальные " + other + " " + $filter("numberEnding")("проект", other, "ов");
				}
			} else {
				if(other == 1) {
					text = "Показать ещё один проект";
				} else {
					text = "Показать остальные " + other + " " + $filter("numberEnding")("проект", other, "ов");
				}
			}
			return text;
		};


		// можем стартовать таск
		$scope.start = function(task) {
			$rootScope.$broadcast("start-task", task.restoreDetails());
		};

		// или под-таск
		$scope.subTask = function(task) {
			$rootScope.$broadcast("start-task", task.restoreDetails().concat([generateName()]) );
		};

		// редактировать мы можем имя (структурируя таким образом)
		$scope.edit = function(task) {
			task.path = angular.copy(task.restoreDetails());
			//
			// по-мелочи сигналим директивам
			this.$broadcast("editLastItem");
		}

		// отмена редактирования
		$scope.cancel = function(task) {
			//
		};

		// удаление
		$scope.delete = function(task) {
			// а что я парюсь, ведь удаляется целиком таск
			// и потом сортируется, скажем
			var id = task.parent.children.indexOf(task);
			if(id == -1) {
				alert("задачи сломались");
			} 
			task.parent.children.splice(id, 1);
			delete task.parent[task.name];
			// и из хранилища
			Storage.batchRemoveEntries(task.collectEntries());
		};

		// сохранение изменений
		$scope.save = function(task) {
			Storage.batchUpdateEntries(task.collectEntries(), {
				detailsNewPart: task.path,
				detailsStopDepth: task.depth
			});
			return true;
		}

		// ждем enter и esc
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

		// фильтруем записи в хранилище
		$scope.filterStorageView = function(task) {
			$rootScope.$broadcast("change-view", "storage");
			$rootScope.$broadcast("filter-storage-entries", task.restoreDetails());
		}

		$scope.editDurationInStorage = function(task) {
			$scope.filterStorageView(task);
			$rootScope.$broadcast("edit-storage-entry", { entry: task.time[0], field: "duration" });
		}

		// деньги
		if(!$rootScope.price) {
			$rootScope.price = {
				hour: (localStorage.getItem("Timerwood-price-hour") == "null" || !localStorage.getItem("Timerwood-price-hour") ? "" : localStorage.getItem("Timerwood-price-hour"))
			}
		}
		$scope.price = $rootScope.price;
		$scope.$watch("price.hour", function(val, oldval) {
			localStorage.setItem("Timerwood-price-hour", val ? val : "");
		});
		$scope.getPrice = function(ms) {
			return parseInt(ms * parseInt($scope.price.hour) / (60*60*1000));
		}

		//
		// Хелперы
		//

		// Генерим случайное имя		
		function generateName() {
			if(window.funnyPhrase) { return funnyPhrase(); } 
			else { return "Задача " + new Date().getTime(); }
		}

	}]);