//
// Таймер 3.0
// Контроллер "Задачи"
//
 
angular.module("TimerwoodApp.controllers")
	.controller("TasksViewCtrl", ["$scope", "$rootScope", "Tasks", "Storage", function($scope, $rootScope, Tasks, Storage) {

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
			task.remove();
			// и из хранилища
			Storage.batchRemoveEntries(task.collectEntries());
		};

		// сохранение изменений
		$scope.save = function(task) {
			task.remove();
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

		// деньги
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

		//
		// Хелперы
		//

		function recursiveBatchUpdateStorageEntries(task, changes) {
			//
		}

		// Генерим случайное имя		
		function generateName() {
			if(window.funnyPhrase) { return funnyPhrase(); } 
			else { return "Задача " + new Date().getTime(); }
		}


		// фильтруем недавнее

		// // При нажатии на таск, стартуем его
		// $scope.start = function(task) {
		// 	$rootScope.$broadcast("start-task", {
		// 		taskDetails: restoreDetails(task)
		// 	});
		// }

		// // создаём под-таск
		// $scope.subTask = function(task) {
		// 	$rootScope.$broadcast("start-subtask", {
		// 		taskDetails: restoreDetails(task)
		// 	});
		// }

		// // начало редактирования
		// $scope.edit = function(task) {
		// 	// во первых нужно показать полное имя к пути, не только текущего уровня
		// 	task.path = restoreDetails(task);
		// 	// потом сохранить старое имя
		// 	task.oldName = task.name;
		// 	// ну и
		// 	this.$broadcast("editLastItem");
		// }

		// // отмена
		// $scope.cancel = function(task) {
		// 	task.name = task.oldName;
		// }

		// // сохранить
		// $scope.save = function(task) {
		// 	console.log("save");
		// 	// теоретически мы должны переименовать не только сам таск, но и его подтаски...
		// 	task.name = task.path[task.path.length-1];
		// 	recursiveRenameDetailsPart(task, task.path);
		// 	Tasks.storage.save();
		// 	//Tasks.restore();
		// 	return true;
		// }

		// // ловим enter 
		// $scope.checkSubmit = function(event, task, scope) {
		// 	if(event.keyCode == 13) {
		// 		var result = $scope.save(task);
		// 		if(result) scope.status = 'view';
		// 	}
		// 	// hit Esc
		// 	else if(event.keyCode == 27) {
		// 		scope.status = 'view';
		// 	}
		// }

		// // переключаем на Хранилище и ищем соотв. записи
		// $scope.filterStorageView = function(task) {
		// 	$rootScope.$broadcast("change-view", "storage");
		// 	$rootScope.$broadcast("filter-storage-entries", restoreDetails(task));
		// }

		// // временно - деньги
		// if(!$rootScope.price) {
		// 	$rootScope.price = {
		// 		hour: localStorage.getItem("Timerwood-price-hour")
		// 	}
		// }
		// $scope.price = $rootScope.price;
		// $scope.$watch("price.hour", function(val, oldval) {
		// 	localStorage.setItem("Timerwood-price-hour", val);
		// });
		// $scope.getPrice = function(ms) {
		// 	return parseInt(ms * parseInt($scope.price.hour) / (60*60*1000));
		// }

		// /* Хелперы */
		// function restoreDetails(task) {
		// 	// пытаемся взять детали сразу из одной из временных промежутков
		// 	var details = task.time.length > 0 ? angular.copy(task.time[0].details) : [];
		// 	if(details.length == 0) {
		// 		// если время пустое, придется по родителями собирать детали
		// 		var node = task;
		// 		while(node) {
		// 			details.unshift(node.name);
		// 			node = node.parent;
		// 			if(node.isRoot) break;
		// 		}
		// 	}
		// 	console.log(details);
		// 	return details;
		// }
		// function recursiveRenameDetailsPart(task, path) {
		// 	renameTaskTimeDetails(task, path);
		// 	var newPath = angular.copy(path);
		// 	for(var i = 0; i < task.children.length; i++) {
		// 		var childPath = angular.copy(path);
		// 		childPath.push(task.children[i].name);
		// 		recursiveRenameDetailsPart(task.children[i], childPath);
		// 	}
		// }
		// function renameTaskTimeDetails(task, path) {
		// 	for(var i = 0; i < task.time.length; i++) {
		// 		task.time[i].details = angular.copy(path);
		// 	}
		// }
	}]);