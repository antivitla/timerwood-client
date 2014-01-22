/* 

Timerwood 3.0

*/

// app
angular.module("TimerwoodApp", ["TimerwoodApp.controllers", "TimerwoodApp.services", "TimerwoodApp.filters", "TimerwoodApp.directives", "ui.bootstrap"]);

// controllers
angular.module("TimerwoodApp.controllers", [])
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
			$rootScope.$broadcast("timerStatus", $scope.status);
		}

		function stopTimer() {
			$scope.status = "stopped";
			TimerClock.removeTickListener(ticklistener);
			TimerClock.stop();
			$rootScope.$broadcast("timerStatus", $scope.status);
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
				window.localStorage.setItem("Timerwood-view", $scope.currentView);
			}
			// Нам нужно передать в таймер состояние переключателя
			$rootScope.$broadcast("changeView", {
				currentView: $scope.currentView
			});
		}
	}])
	.controller("StorageViewCtrl", ["$scope", "Storage", "$rootScope", "$filter", function($scope, Storage, $rootScope, $filter) {
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
			this.$broadcast("editLastItem");
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
				var entryDetails = JSON.stringify(entry.details).toLowerCase();
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

		function getDateFromInput(entry) {
			var d = $filter("setDateFromDayTimeString")(entry.start, entry.editStart, ":"); // время дня
		}
	}])
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
				if(JSON.stringify(task.details) == JSON.stringify(day.tasks[j].details) && task != day.tasks[j]) {
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
	}])
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
	}])
	.controller("FooterCtrl", ["$scope", "Storage", function($scope, Storage) {
		$scope.storage = Storage.entries;
	}]);
