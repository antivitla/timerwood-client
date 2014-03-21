//
// Таймер 3.0
// Контроллер таймера
//

angular.module("TimerwoodApp.controllers")
	.controller('TimerCtrl', ["$scope", "$rootScope", "TimerClock", "Storage", "$timeout", function($scope, $rootScope, TimerClock, Storage, $timeout) {
		
		// Состояние таймера		
		$scope.info = TimerClock.info;

		// Название задачи
		$scope.details = [];
		$scope.placeholder = generateName();

		// Тексты UI
		$scope.toggleTip = {
			"started" : "Остановить таймер",
			"stopped" : "Запустить таймер"
		};

		// Вкл/Выкл таймера
		$scope.status = "stopped";
		$scope.toggle = function() {
			if($scope.status == "stopped") { startTimer(); }
			else { stopTimer(); }
		};

		// Сохраняем отредактированное название задачи
		var wait;
		$scope.save = function(event) {
			// если нажали Enter
			if(event.which == 13) {
				$scope.toggle();
			}
			// а если не enter, но таймер уже бежит, апдейтим название таска в хранилище
			else if($scope.status == "started") {
				if(wait) $timeout.cancel(wait);
				wait = $timeout(function() { 
					Storage.updateEntry(currentEntry, { details: angular.copy($scope.details) });
				}, 1000);
			}
		}


		//
		// Private
		//

		var currentEntry = {};

		// Переключение таймера
		function startTimer(details) {
			// останавливаем если бежали
			stopTimer();
			// есть логика генерации имени
			// если детали заданы, сохраняем их
			if(details) { $scope.details = angular.copy(details); }
			else {
				// если же нет и нет нормальных деталей, используем плейсхолдер
				if(!($scope.details.length > 0)) {
					$scope.details = [$scope.placeholder];
					$scope.placeholder = generateName();
				}
			}
			// заносим новую запись в хранилище и запоминаем ссылку на неё
			currentEntry = Storage.addEntry({
				start: new Date(),
				stop: new Date(),
				details: angular.copy($scope.details)
			});
			$scope.status = "started";
			TimerClock.start();
		}
		function stopTimer() {
			$scope.status = "stopped";
			TimerClock.stop();
		}

		// Генерим случайное имя		
		function generateName() {
			if(window.funnyPhrase) { return funnyPhrase(); } 
			else { return "Задача " + new Date().getTime(); }
		}


		//
		// Events
		//

		// Кто-то хочет запустить таймер и даёт название (детали) таска
		$scope.$on("start-task", function(event, details) {			
			startTimer(details);
			// внутренняя оповещалка чтоб выделить последнюю задачу
			$timeout(function() { $scope.$broadcast("editLastItem"); }, 50);
		});

		// Апдейтим запись хранилища каждые 15 секунд
		var delay = new Date();
		$scope.$on("timer-tick", function() {
			if((new Date()).getTime() - delay.getTime() >= 15000) {
				Storage.updateEntry(currentEntry, { stop: $scope.info.stop });
				delay = new Date();
			}
		});

		// Кто-то поменял параметры бегущего сейчас таска
		$scope.$on("storage-add-entry", function(event, entry) {
			if(entry == currentEntry) {
				$scope.details = angular.copy(entry.details);
				$scope.info.start = new Date(entry.start);
			}
		})

	}]);