//
// Таймер 3.0
// Контроллер "Хранилище"
//
 
angular.module("TimerwoodApp.controllers")
	.controller("StorageViewCtrl", ["$scope", "Storage", "$rootScope", "$filter", "$timeout", function($scope, Storage, $rootScope, $filter, $timeout) {
		
		// Записи Хранилища (показываем)
		$scope.entries = Storage.entries; 

		// можем стартовать таймер при нажатии на задачу
		$scope.start = function(details) {
			$rootScope.$broadcast("start-task", angular.copy(details));
		}

		//
		// UI редактирования
		//

		// удалить запись
		$scope.delete = function(entry) {
			Storage.removeEntry(entry);
		}

		// подготовка редактирования
		$scope.edit = function(entry) {
			entry.editDate = $filter("filterDateTo")(entry.start, "dd.mm.yyyy");
			entry.editStart = $filter("filterDateTo")(entry.start, "hh:mm");
			entry.editDetails = angular.copy(entry.details);
			entry.editDuration = $filter("filterMillisecondsTo")(entry.stop - entry.start, "h m");
			// следим за изменением времени начала (обратное соответствие длительности чтоб показывать)
			entry.editStartWatcher = this.$watch("entry.editStart", function() {
				var newStart = $filter("updateDateFromDayTimeString")(new Date(entry.start), entry.editStart, ":");
				entry.editDuration = $filter("filterMillisecondsTo")(entry.stop - newStart, "h m");
			});
			// сообщаем спецдирективам чтоб выделило содержимое инпута
			var entryScope = this;
			$timeout(function() {
				entryScope.$broadcast("editLastItem");
			},10);
		}

		// отмена редактирования
		$scope.cancel = function(entry) {
			entry.editStartWatcher();
		};

		// конец редактирования по enter и esc
		$scope.checkSubmit = function(event, entry, scope) {
			// enter
			if(event.keyCode == 13) {
				var result = $scope.save(entry);
				scope.status = 'view';
			}
			// esc
			else if(event.keyCode == 27) {
				scope.status = 'view';
			}
		}

		// сохраняем результат в хранилище
		$scope.save = function(entry) {
			var date = new Date(entry.start);
			date = $filter("updateDateFromDayTimeString")(date, entry.editStart, ":");
			date = $filter("updateDateFromDateString")(date, entry.editDate, ".");
			var duration = $filter("filterDurationStringToMilliseconds")(entry.editDuration, " ");
			var details = angular.copy(entry.editDetails);
			delete entry.editStart;
			delete entry.editDate;
			delete entry.editDuration;
			delete entry.editDetails;
			entry.editStartWatcher();
			delete entry.editStartWatcher;
			// проверяем изменения, и апдейтим хранилище
			Storage.updateEntry(entry, {
				start: date,
				stop: new Date(date.getTime() + duration),
				details: details
			});
		}

		//
		// фильтр записей
		//

		// основная функция фильтрации (по любым параметрам записи)
		$scope.searchTags = function(entry) {
			if(!$scope.search) return true;
			else {
				var query = angular.copy($scope.search);
				var entryDetails = angular.toJson(entry.details).toLowerCase();
				var entryDate = ("0"+entry.start.getDate()).slice(-2)+"."
					+("0"+(entry.start.getMonth()+1)).slice(-2)+"."
					+(entry.start.getFullYear());
				for(var i = 0; i < query.length; i++) {
					while(query[i][0] == " ") query[i] = query[i].slice(1);
					if(!(entryDetails.search(query[i].toLowerCase()) >= 0 || entryDate.search(query[i].toLowerCase()) >= 0)) return false;
				}
				return true;
			}
		}

		// фильтруем записи по просьбе других видов
		$scope.$on("filter-storage-entries", function(event, query) {
			$scope.search = query;
		});

		// при переключении на вид хранилища, фокус клавы ставим на фильтр
		$scope.$on("view-changed", function(event, view) {
			if(view != "storage") {
				//$scope.$broadcast("editLastItemOnSwitchView");
				$scope.search = "";
			}
		});

		$scope.$on("edit-storage-entry", function(event, data) {
			console.log(data, $scope);
			if(data.field == "duration") {
				$scope.$broadcast("startEdit", "duration");
			}
		})

	}]);