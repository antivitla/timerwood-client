//
// Таймер 3.0
// Контроллер вида "Дата"
//
 
angular.module("TimerwoodApp.controllers")
	.controller("DateViewCtrl", ["$scope", "$rootScope", "$filter", "Days", function($scope, $rootScope, $filter, Days) {
		$scope.days = Days.entries; 

		// фильтруем недавнее
		$scope.recentCount = 2; // сколько дней в недавние запихнуть
		$scope.recent = function(day) {
			return $scope.days.indexOf(day) > $scope.recentCount-1 ? false : true;
		};
		$scope.excludeRecent = function(day) {
			return $scope.days.indexOf(day) > $scope.recentCount-1 ? true : false;
		};

		// // пересоздаем себя если на нас переключили
		// $scope.$on("view-changed", function(event, view) {
		// 	if(view == "date") {
		// 		Days.restore();
		// 	}
		// });

		/*

		При нажатии на таск (или на группу) мы добавляем его в таймер - для продолжения работы. при этом мы можем жать на один из узлов - и тогда добавится соотв. структуры таск. Но вопрос - добавлять ли сразу подзадачу или записывать в сам таск, даже если у него есть подзадачи

		Можем редактировать - там появится поле названия задачи (в реальности изменятся все соотв. названия сгруппированные для этого дня). Может редактировать время... но видимо как-то хитро надо - показать опять же список временных промежутков - и их можно редактировать каждый отдельно

		*/

		$scope.start = function(details) {
			var newDetails = angular.copy(details);
			$rootScope.$broadcast("startNewTask", {
				taskDetails: newDetails
			});
		}

		$scope.edit = function(task) {
			task.editDuration = $filter("filterMillisecondsTo")(task.getDuration(), "h m");
			task.editDetails = angular.copy(task.details);
			this.$broadcast("editLastItem");
		}

		$scope.cancel = function(task) {}

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

		$scope.delete = function(task) {
			// если это единственная задача в день, удаляем день
			if(task.parentDay.tasks.length <= 1) {
				task.parentDay.parentDays.removeDayEntry(task.parentDay);
			}
			// в противном случае просто удаляем таск 
			else {
				task.parentDay.removeTaskEntry(task);
			}
		}

		$scope.save = function(task) {
			// проходимся по каждой записи и переименовываем сначала
			for(var i = 0; i < task.time.length; i++) {
				task.time[i].details = task.editDetails;				
			}
			Days.storage.broadcastUpdateDetails(task.time);

			// проверяем, вдруг есть с таким же именем задача в дне, сливаем в одну
			var day = task.parentDay;
			var found = false;
			for(var j = 0; j < day.tasks.length; j++) {
				// не забыть пропустить текущий таск
				if(angular.toJson(task.details) == angular.toJson(day.tasks[j].details) && task != day.tasks[j]) {
					// попался
					// мы хотим всё добавить в самый последний таск
					if(day.tasks.indexOf(task) > i) {
						// все время таска переносим в текущий
						task.time = task.time.concat(day.tasks[j].time);
						// найденный удаляем
						day.tasks.splice(day.tasks.indexOf(day.tasks[j]), 1);
					} else {
						// все время текущего таска переносим в найденный
						day.tasks[j].time = day.tasks[j].time.concat(task.time);
						// текущий удаляем
						day.tasks.splice(day.tasks.indexOf(task), 1);						
					}
				}
			}

			// теперь сохраняем длительность (если её меняли)
			if(Boolean(task.editDuration)) {

				var newDuration = $filter("filterDurationStringToMilliseconds")(task.editDuration, " ");

				var delta = newDuration - task.getDuration();
				// если новая (суммарная) длительность больше старой, прибавляем время
				if(delta > 0) {
					task.time[0].stop.setTime(task.time[0].stop.getTime() + delta);
				}
				// если новая (суммарная) длительность меньше старой, имеем геморой..
				else if(delta < 0) {
					// если разница меньше чем длительность последней записи, отнимаем от неё
					if(delta < task.time[0].getDuration()) {
						task.time[0].stop.setTime(task.time[0].stop.getTime() + delta);
					}
					// если больше, вычитаем длительность последней. записи и удаляем её и оставшееся отнимаем от предыдущей (ТУДУ)
				}
				else {
					// не номер а жопа (NaN) или нет изменений (ничего не делаем)
				}
			}

			// сохраняем и на выход
			Days.storage.save();
			return true;
		}

		// переключаем на Хранилище и ищем соотв. записи
		$scope.filterStorageView = function(task) {
			$rootScope.$broadcast("change-view", "storage");
			var dateFilter = $filter("filterDateTo")(task.parentDay.date, "dd.mm.yyyy");
			var query = angular.copy(task.details);
			query.unshift(dateFilter);
			console.log(query);
			$rootScope.$broadcast("filter-storage-entries", query);
		}

		$scope.filterStorageViewByDate = function(date) {
			$rootScope.$broadcast("change-view", "storage");
			var dateFilter = [$filter("filterDateTo")(date, "dd.mm.yyyy")];
			console.log(dateFilter);
			$rootScope.$broadcast("filter-storage-entries", dateFilter);
		}
	}]);