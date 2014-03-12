//
// Таймер 3.0
// Контроллер "Хранилище"
//
 
angular.module("TimerwoodApp.controllers")
	.controller("StorageViewCtrl", ["$scope", "Storage", "$rootScope", "$filter", "$timeout", function($scope, Storage, $rootScope, $filter, $timeout) {
		$scope.entries = Storage.entries; // массив записей Хранилища

		/*

		При нажатии на название таска - подставляем его в контрол таймера (в поле ввода) и стартуем его.
		типа либо:
		timer.add(task.details)
		timer.start(task.details)

		Так же, мы можем редактировать название таска и его длительность/время старта. это апдейтит определенную запись хранилища (а оно заставляет перерисовывать все остальные виды)

		нам нужно передать в таймер название задачи по которой кликнули

		*/

		$scope.start = function(details) {
			var newDetails = angular.copy(details);
			$rootScope.$broadcast("startNewTask", {
				taskDetails: newDetails
			});
		}

		$scope.delete = function(entry) {
			Storage.removeEntry(entry);
		}

		$scope.edit = function(entry) {
			entry.editDate = $filter("filterDateTo")(entry.start, "dd.mm.yyyy");
			entry.editStart = $filter("filterDateTo")(entry.start, "hh:mm");
			entry.editDetails = angular.copy(entry.details);
			entry.editDuration = $filter("filterMillisecondsTo")(entry.stop - entry.start, "h m");
			// следим за изменением начала и пересчитываем длительность
			entry.editStartWatcher = this.$watch("entry.editStart", function() {
				var newStart = $filter("updateDateFromDayTimeString")(new Date(entry.start), entry.editStart, ":");
				entry.editDuration = $filter("filterMillisecondsTo")(entry.stop - newStart, "h m");
			});
			entry.editDateWatcher = this.$watch("entry.editDate", function() {
				var newDate = $filter("updateDateFromDateString")(new Date(entry.start), entry.editDate, ".");
				entry.editDuration = $filter("filterMillisecondsTo")(entry.stop - newDate, "h m");
			})
			// сообщаем спецдирективам чтоб выделило содержимое инпута
			var entryScope = this;
			$timeout(function() {
				entryScope.$broadcast("editLastItem");
			},1);
		}

		$scope.cancel = function(entry) {
			entry.editStartWatcher();
			entry.editDateWatcher();
		};

		$scope.save = function(entry) {
			entry.details = entry.editDetails;
			// тут непростая задача
			// если мы меняем дату начала - то дата конца так как та же, длительность возрастает
			// если мы меняем время начала - то же самое
			// если же мы поменяли и/или длительность... нужно вычислить текущие отображаемые значения длительности и начала
			$filter("updateDateFromDayTimeString")(entry.start, entry.editStart, ":");
			$filter("updateDateFromDateString")(entry.start, entry.editDate, ".");
			// длительность
			var duration = $filter("filterDurationStringToMilliseconds")(entry.editDuration, " ");
			entry.stop = new Date(entry.start.getTime() + duration);
			// Шубись эврибади!
			Storage.broadcastUpdateDetails();
			// сохраняем и на выход
			Storage.save();
			return true;
		}

		$scope.checkSubmit = function(event, entry, scope) {
			if(event.keyCode == 13) {
				var result = $scope.save(entry);
				if(result) scope.status = 'view';
			}
			// hit Esc
			else if(event.keyCode == 27) {
				scope.status = 'view';
			}
		}

		// фильтр записей
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

		// фильтруем записи по просьбе
		$scope.$on("filter-storage-entries", function(event, query) {
			$scope.search = query;
		});

		// при переключении на нас, фокус на фильтр и очищаем при переключении куда-то ещё
		$scope.$on("view-changed", function(event, view) {
			if(view != "storage") {
				$scope.search = null;
			} else {
				$scope.$broadcast("editLastItemOnSwitchView");				
			}
		});
	}]);