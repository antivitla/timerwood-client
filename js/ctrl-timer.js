//
// Таймер 3.0
// Контроллер таймера
//

angular.module("TimerwoodApp.controllers")
	.controller('TimerCtrl', ["$scope", "$rootScope", "TimerClock", "Storage", "$timeout", function($scope, $rootScope, TimerClock, Storage, $timeout) {
		// Состояние таймера		
		$scope.info = TimerClock.info;

		// название задачи
		$scope.details = []; //[(window.funnyPhrase ? window.funnyPhrase() : "Задача "+(new Date()).getTime()*Math.random())];
		$scope.funnytask = (window.funnyPhrase ? window.funnyPhrase() : "Задача "+(new Date()).getTime()*Math.random());

		// Ссылка на текущую запись в Хранилище
		var currentEntry = {};

		// Тексты UI
		$scope.typeTip = {
			"simple" : "С возможностью создавать иерархию задач",
			"complex" : ""
		};
		$scope.toggleTip = {
			"started" : "Остановить таймер",
			"stopped" : "Запустить таймер"
		};


		/*

		Наш таймер ведет себя по-разному в зависимости от выбранного режима отображения. Например если выбрано хранилище, то изменяем название для одной записи и отображаем её время. если выбран режим по дням, то отображаем сумму времени в этот день и если редактируем название, то для всех сгруппированных задач (сразу несколько в хранилище). 

		Аналогично для проектного вида.

		Делаем через события.

		*/

		// Кто-то хочет запустить таймер и даёт название (детали) таска
		$scope.$on("startNewTask", function(event, data) {
			// если мы стоим, то просто подменить детали и запустить
			if($scope.status == "stopped") {
				$scope.details = data.taskDetails;
				startTimer();
			}
			// если же мы запущены уже, то запустить новую задачу
			else if($scope.status == "started") {
				stopTimer();
				$scope.details = data.taskDetails;
				startTimer();
			} 
			$timeout(function(){
				$scope.$broadcast("editLastItem");
			}, 10);
		});

		// Кто-то хочет сделать новый под-таск
		$scope.$on("startNewSubTask", function(event, data) {
			// делаем на паузе (останавливаем таймер, если работает)
			if($scope.status == "started") {
				stopTimer();
			}
			// задаём детали + новый псевдотаск
			data.taskDetails.push(window.funnyPhrase ? window.funnyPhrase() : "Задача " + (new Date()).getTime()*Math.random());
			$scope.details = data.taskDetails;
			$timeout(function(){
				$scope.$broadcast("editLastItem");
				// или может быть всё-таки стартуем
				startTimer();
			}, 10);
		})

		// Вкл/Выкл таймера
		$scope.status = "stopped";
		$scope.toggle = function() {
			if($scope.status == "stopped") {
				startTimer();
			}
			else if($scope.status == "started") {
				stopTimer()
			}
		};

		// Тик таймера, что делаем...
		var updateDelay = 1000;
		function ticklistener() {
			// сохраняем в хранилище данные (но каждую секунду примерно)
			Storage.updateEntry(currentEntry, {
				stop: $scope.info.stop
			});
		};

		function startTimer() {
			$scope.status = "started";
			if($scope.details.length < 1) $scope.details = [$scope.funnytask];
			// ВАЖНО: сначала новая запись в хранилище
			currentEntry = Storage.addEntry({
				start: new Date(),
				stop: new Date(),
				details: $scope.details
			});
			TimerClock.addTickListener(ticklistener);
			TimerClock.start();
			//$rootScope.$broadcast("timerStatus", $scope.status);
		}

		function stopTimer() {
			$scope.status = "stopped";
			TimerClock.removeTickListener(ticklistener);
			TimerClock.stop();
			//$rootScope.$broadcast("timerStatus", $scope.status);
		}

		// сохраняем имя таска каждое нажатие клавиши (но ждем пока юзер перестанет печатать в теч. 0,2 сек)
		// а также переключаем таймер по enter
		var wait;
		$scope.save = function(event) {
			// если нажали Enter
			if(event.which == 13) {
				$scope.toggle();
			}
			// если таймер уже бежит, апдейтим название таска
			if($scope.status == "started") {
				if(wait) $timeout.cancel(wait);
				wait = $timeout(function() {
					if($scope.details.length < 1) $scope.details = [$scope.funnytask];
					Storage.updateEntry(currentEntry, {
						details: $scope.details
					});					
				}, 200)
			}
		}
	}]);