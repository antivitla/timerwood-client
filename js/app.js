/* 

Timerwood 3.0

*/

// app
angular.module("TimerwoodApp", ["TimerwoodApp.controllers", "TimerwoodApp.services", "TimerwoodApp.filters", "TimerwoodApp.directives", "ui.bootstrap"]);

// controllers
angular.module("TimerwoodApp.controllers", [])
	.controller('TimerCtrl', ["$scope", "TimerClock", "Storage", "$timeout", function($scope, TimerClock, Storage, $timeout) {
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
		});

		// Кто-то хочет сделать новый под-таск
		$scope.$on("startNewSubTask", function(event, data) {
			// делаем на паузе (останавливаем таймер, если работает)
			if($scope.status == "started") {
				stopTimer();
			}
			// задаём детали + новый псевдотаск
			data.taskDetails.push(window.funnyPhrase ? window.funnyPhrase() : "Задача " + (new Date()).getTime()*Math.random());
			console.log(data.taskDetails)
			$scope.details = data.taskDetails;
			$timeout(function(){
				$scope.$broadcast("focusNewSubTask");
				// или может быть всё-таки стартуем
				startTimer();
			}, 100);
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
		}

		function stopTimer() {
			$scope.status = "stopped";
			TimerClock.removeTickListener(ticklistener);
			TimerClock.stop();
		}

		// Переключатель типа UI таймера (сложный/простой)
		$scope.type = "complex";
		$scope.toggleType = function() {
			$scope.type = ($scope.type == "simple" ? "complex" : "simple");
		};

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
	}])
	.controller("SwitchViewCtrl", ["$scope", "$rootScope", "Storage", function($scope, $rootScope, Storage) {
		$scope.storage = Storage.entries;
		$scope.currentView = window.localStorage ? (window.localStorage.getItem("Timerwood-view") ? window.localStorage.getItem("Timerwood-view") : "task") : "task"; // date, storage, task
		$scope.$watch("currentView", updateView);

		function updateView() {
			if(window.localStorage)  {
				console.log($scope.currentView);
				window.localStorage.setItem("Timerwood-view", $scope.currentView);
			}
			// Нам нужно передать в таймер состояние переключателя
			$rootScope.$broadcast("changeView", {
				currentView: $scope.currentView
			});
		}
	}])
	.controller("StorageViewCtrl", ["$scope", "Storage", "$rootScope", "$modal", function($scope, Storage, $rootScope, $modal) {
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
			var newDetails = JSON.parse(JSON.stringify(details));
			$rootScope.$broadcast("startNewTask", {
				taskDetails: newDetails
			});
		}

		$scope.deleteEntry = function(entry) {
			Storage.removeEntry(entry);
		}
		$scope.editEntry = function(entry) {
			console.log("Storage Edit call!")
		}
		$scope.openEditStartDateDialog = function(editDate) {
			var modalInstance = $modal.open({
				templateUrl: 'edit-date',
				controller: "EditDateCtrl",
				resolve: {
					date: function () {
						return editDate;
					}
				}
			});

			modalInstance.result.then(function (selectedDate) {
				// ok
				//editDate = selectedDate;
				console.log(editDate.getDate(), selectedDate.getDate());
			}, function (selectedDate) {
				// cancel
				console.log('cancel selectedDate: ' + selectedDate);
			});
		}
	}])
	.controller("DateViewCtrl", ["$scope", "$rootScope", "Days", function($scope, $rootScope, Days) {
		$scope.days = Days.entries; 

		// фильтруем недавнее
		$scope.recentCount = 1; // сколько дней в недавние запихнуть
		$scope.recent = function(day) {
			return $scope.days.indexOf(day) > $scope.recentCount-1 ? false : true;
		};
		$scope.excludeRecent = function(day) {
			return $scope.days.indexOf(day) > $scope.recentCount-1 ? true : false;
		};

		/*

		При нажатии на таск (или на группу) мы добавляем его в таймер - для продолжения работы. при этом мы можем жать на один из узлов - и тогда добавится соотв. структуры таск. Но вопрос - добавлять ли сразу подзадачу или записывать в сам таск, даже если у него есть подзадачи

		Можем редактировать - там появится поле названия задачи (в реальности изменятся все соотв. названия сгруппированные для этого дня). Может редактировать время... но видимо как-то хитро надо - показать опять же список временных промежутков - и их можно редактировать каждый отдельно

		*/

		$scope.start = function(details) {
			var newDetails = JSON.parse(JSON.stringify(details));
			$rootScope.$broadcast("startNewTask", {
				taskDetails: newDetails
			});
		}

	}])
	.controller("TasksViewCtrl", ["$scope", "$rootScope", "Tasks", function($scope, $rootScope, Tasks) {
		$scope.tasks = Tasks.entries;
		// фильтруем недавнее
		$scope.recentCount = 1; // сколько дней в недавние запихнуть
		$scope.recent = function(task) {
			return $scope.tasks.indexOf(task) > $scope.recentCount-1 ? false : true;
		};
		$scope.excludeRecent = function(task) {
			return $scope.tasks.indexOf(task) > $scope.recentCount-1 ? true : false;
		};

		/* При нажатии на таск, стартуем его */
		$scope.start = function(task) {
			$rootScope.$broadcast("startNewTask", {
				taskDetails: restoreDetails(task)
			});
		}

		/* создаём под-таск */
		$scope.subTask = function(task) {
			$rootScope.$broadcast("startNewSubTask", {
				taskDetails: restoreDetails(task)
			});
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
	}])
	.controller("FooterCtrl", ["$scope", "Storage", function($scope, Storage) {
		$scope.storage = Storage.entries;
	}])
	.controller("EditDateCtrl", ["$scope", "$modalInstance", "date", function($scope, $modalInstance, date) {
		var d = new Date(date);
		$scope.date = ("0"+d.getDate()).slice(-2) + "." + ("0"+(d.getMonth()+1)).slice(-2) + "." + d.getFullYear();

		$scope.$watch("date", function() {
			console.log("date change");
		});

		console.log("form", $scope.form);

		$scope.ok = function(error) {
			console.log(error);
			if(!error) {
				console.log(d, $scope.date);
				var temp = $scope.date.split(".");
				d.setDate(parseInt(temp[0]));
				d.setMonth(parseInt(temp[1])-1);
				d.setYear(parseInt(temp[2]));
				$modalInstance.close(d);
			}
		}
		$scope.cancel = function() {
			$modalInstance.dismiss("cancel");
		}
	}]);
