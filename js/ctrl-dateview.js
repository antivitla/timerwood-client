//
// Таймер 3.0
// Контроллер "Дата"
//
 
angular.module("TimerwoodApp.controllers")
	.controller("DateViewCtrl", ["$scope", "$rootScope", "$filter", "Days", "Storage", "$timeout", function($scope, $rootScope, $filter, Days, Storage, $timeout) {

		// записи хронологии дней
		$scope.days = Days.days;

		// разделение на недавнее и всё остальное (меняем в опциях)
		$scope.recentCount = 2;
		$rootScope.$watch("dateRecent", function(newval, oldval) {
			$scope.recentCount = newval;
		});
		$scope.recent = function(day) {
			return $scope.days.indexOf(day) > $scope.recentCount-1 ? false : true;
		};
		$scope.excludeRecent = function(day) {
			return $scope.days.indexOf(day) > $scope.recentCount-1 ? true : false;
		};
		$scope.getRecentDaysButtonText = function() {
			var text = "";
			var date = $scope.days[$scope.recentCount];
			if(!date) date = new Date();
			else date = date.getDate();

			var day = $filter("filterDateTo")(date, "d");
			var month = $filter("filterDateTo")(date, "M");
			if($scope.recentDates) {
				text = "Скрыть ранние даты";
			} else {
				text = day + " " + month + " и более ранние";
			}
			return text;
		};

		// при нажатии на таск мы добавляем его в таймер (стартуем)
		$scope.start = function(task) {
			$rootScope.$broadcast("start-task", angular.copy(task.time[0].details));
		}

		// можем редактировать
		// поле название задачи (в реальности изменятся все сгруппированные под ним
		// задачи). можно редактировать время - но как-то хитро надо...

		$scope.edit = function(task) {
			task.editDate = $filter("filterDateTo")(task.time[0].start, "dd.mm.yyyy");
			task.editDetails = angular.copy(task.time[0].details);
			// сообщаем спецдирективам чтоб выделило содержимое инпута
			var entryScope = this;
			$timeout(function() {
				entryScope.$broadcast("editLastItem");
			},1);
		}

		// отмена редактирования
		$scope.cancel = function(task) {};

		// проверка enter'а и esc
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

		// удаляем таск (а в реальности все сгруппированные под ним записи хранилища)
		$scope.delete = function(task) {
			Storage.batchRemoveEntries(task.time.slice(0));
		}

		// сохраняем изменения (в реальности апдейтим записи хранилища)
		$scope.save = function(task) {
			// во-первых название задачи, а во-вторых дата
			Storage.batchUpdateEntries(task.time.slice(0), { 
				details: task.editDetails, 
				startDate: $filter("updateDateFromDateString")(new Date(task.time[0].start), task.editDate, ".") });
		}



		// 
		// Фильтруем в хранилище задачи
		//

		$scope.filterStorageViewByTask = function(task) {
			$rootScope.$broadcast("change-view", "storage");
			var dateFilter = $filter("filterDateTo")(task.parent.getDate(), "dd.mm.yyyy");
			var query = angular.copy(task.time[0].details);
			query.unshift(dateFilter);
			$rootScope.$broadcast("filter-storage-entries", query);
		}

		$scope.filterStorageViewByDate = function(date) {
			console.log(date);
			$rootScope.$broadcast("change-view", "storage");
			var dateFilter = [$filter("filterDateTo")(new Date(date), "dd.mm.yyyy")];
			$rootScope.$broadcast("filter-storage-entries", dateFilter);
		}

		$scope.editDurationInStorage = function(task) {
			$scope.filterStorageViewByTask(task);
			$rootScope.$broadcast("edit-storage-entry", { entry: task.time[0], field: "duration" });
		}

		
		// 
		// Цена
		//

		if(!$rootScope.price) {
			$rootScope.price = {
				hour: (localStorage.getItem("Timerwood-price-hour") == "null" || !localStorage.getItem("Timerwood-price-hour") ? "" : localStorage.getItem("Timerwood-price-hour"))
			}
		}
		$scope.price = $rootScope.price;
		$scope.$watch("price.hour", function(val, oldval) {
			localStorage.setItem("Timerwood-price-hour", val ? val : "");
		});
		$scope.getPrice = function(ms) { return parseInt(ms * parseInt($scope.price.hour) / (60*60*1000));	};

	}]);