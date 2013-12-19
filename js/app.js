/* Timerwood */

// Модель временного промежутка (знает таск, к которому относится)
// function TimeNode(obj) {
// 	obj = obj ? obj : {};
// 	this.start = obj.start ? obj.start : new Date();
// 	this.stop = obj.stop ? obj.stop : new Date();
// 	this.task = obj.task ? obj.task : null;
// }
// TimeNode.prototype.getDuration = function() {
// 	return this.stop-this.start;
// }

// Модель записи лога
// function LogNode(obj) {
// 	obj = obj ? obj : {};
// 	this.details = obj.details ? obj.details : [];
// }
// LogNode.prototype = TimeNode.prototype;

// Модель задачи (узел иерархии, знает родителя и детей)
// function TaskNode(obj) {
// 	obj = obj ? obj : {};
// 	this.name = obj.name ? obj.name : (window.funnyPhrase ? window.funnyPhrase() : "Никак не названная задача");
// 	this.children = [];
// 	this.parent = null;
// 	this.time = obj.time ? (obj.time.length > 0 ? obj.time : []) : [];
// }
// TaskNode.prototype._attachChild = function(child) {
// 	this.children.unshift(child);
// 	child.parent = this;
// }
// TaskNode.prototype.attachTask = function(task) {
// 	// если не было детей, перенести накопленное время в новую подзадачу
// 	if(this.children.length == 0) {
// 		var newtask = new TaskNode();
// 		newtask.time = this.time;
// 		this.time = [];
// 		this._attachChild(newtask);
// 	}
// 	// а теперь можно и добавить присланный таск
// 	this._attachChild(task);
// }
// TaskNode.prototype.attachTime = function(timenode) {
// 	this.time.unshift(timenode);
// 	timenode.task = this;
// }
// TaskNode.prototype.getDuration = function() {
// 	var duration = 0;
// 	if(this.children.length > 0) {
// 		for(var i = 0; i < this.children.length; i++) {
// 			duration += this.children[i].getDuration();
// 		}
// 	}
// 	else {
// 		for(var k = 0; k < this.time.length; k++) {
// 			duration += this.time[k].getDuration();
// 		}
// 	}
// 	return duration;
// }

// Глобальное хранилище данных таймера
// var Timerwood = {
// 	Log: {
// 		entries: []
// 	},
// 	// В виде иерархии Задач
// 	Tasks: {
// 		entries: []
// 	},
// 	// Хранилище в формате сервера (из него восстанавливаем лог)
// 	Storage: {
// 		entries: []
// 	}
// };


// app
angular.module("TimerwoodApp", ["TimerwoodApp.controllers", "TimerwoodApp.services", "TimerwoodApp.filters"]);

// controllers
angular.module("TimerwoodApp.controllers", [])
	.controller('TimerCtrl', ["$scope", "TimerClock", "Storage", function($scope, TimerClock, Storage) {
		// Состояние
		$scope.status = "stopped";
		$scope.type = "complex";
		$scope.info = TimerClock.info;
		$scope.details = [(window.funnyPhrase ? window.funnyPhrase() : "Задача "+(new Date()).getTime()*Math.random())]; // имя задачи от юзера

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

		// сохраняем имя таска каждое нажатие клавиши
		$scope.save = function(details) {
			if($scope.status == "started")
			Storage.updateEntry(currentEntry, {
				details: $scope.details
			});
		}

		// Тик таймера...
		function ticklistener() {
			// сохраняем в хранилище новую длительность и детали (вдруг редактировали)
			Storage.updateEntry(currentEntry, {
				stop: $scope.info.stop
			});
		};

		// Вкл/Выкл таймера
		$scope.toggle = function() {
			if($scope.status == "stopped") {
				$scope.status = "started";
				TimerClock.addTickListener(ticklistener);
				TimerClock.start();
				// новая запись в хранилище
				currentEntry = Storage.addEntry({
					start: $scope.info.start,
					stop: $scope.info.stop,
					details: $scope.details
				});
			}
			else if($scope.status == "started") {
				$scope.status = "stopped";
				TimerClock.stop();
				TimerClock.removeTickListener(ticklistener);
			}
		};

		// Переключатель типа UI таймера (сложный/простой)
		$scope.toggleType = function() {
			$scope.type = ($scope.type == "simple" ? "complex" : "simple");
		};

	}])
	.controller("SwitchViewCtrl", ["$scope", function($scope) {
		var views = ["task", "date", "log", "storage"];
		$scope.currentView = "date";
		$scope.nextView = function() {
			var nextId = views.indexOf($scope.currentView) + 1;
			$scope.currentView = views[nextId >= views.length ? 0 : nextId];
		}

	}])
	.controller("StorageViewCtrl", ["$scope", "Storage", function($scope, Storage) {
		$scope.entries = Storage.entries;
		$scope.deleteEntry = function(entry) {
			Storage.removeEntry(entry);
		}
	}])
	.controller("DateViewCtrl", ["$scope", "Storage", function($scope, Storage) {
		$scope.days = []; // массив дней
		
		// восстанавливаем его из хранилища первоначально
		function restoreDays() {
			// очистка списка
			$scope.days = [];
			// только если не пустой список
			if(Storage.entries.length > 0) {
				// добавляем первый день и первый таск
				$scope.days.push(new DayEntry({
					date: Storage.entries[0].start,
					tasks: [new TaskEntry({
						details: Storage.entries[0].details,
						time: [Storage.entries[0]]
					})]
				}));

				// добавляем остальные дни
				for(var i = 1; i < Storage.entries.length; i++) {
					// если дата не равна предыдущей, делаем новый день c пустым списком тасков
					if(!sameDate(Storage.entries[i].start, Storage.entries[i-1].start)) {
						$scope.days.push(new DayEntry({
							date: Storage.entries[i].start,
							tasks: []
						}));
					}
					// теперь добавляем таск к дню (к последнему добавленному)
					var lastDay = $scope.days[$scope.days.length - 1];
					// создаём новый если в этот день такого таска не было
					var foundTask = false;
					for(var j = 0; j < lastDay.tasks.length; j++) {
						if(JSON.stringify(Storage.entries[i].details) == JSON.stringify(lastDay.tasks[j].details)) {
							foundTask = lastDay.tasks[j];
						}
					}
					if(!foundTask) {
						lastDay.tasks.push(new TaskEntry({
							details: Storage.entries[i].details,
							time: [Storage.entries[i]]
						}));
					}
					// в противном случае добавляем к найденному сущесвующему в этот день таску
					else {
						foundTask.time.push(Storage.entries[i]);
					}
				}
			}
		}
		restoreDays();

		// привязываем перевосстановление при изменениях
		Storage.addListener("add", function() { restoreDays(); console.log("adddd"); });
		Storage.addListener("remove", function() { restoreDays(); console.log("remove"); });

		// фильтруем недавнее
		var recentCount = 1; // сколько дней в недавние запихнуть
		$scope.recent = function(day) {
			return $scope.days.indexOf(day) > recentCount-1 ? false : true;
		};
		$scope.excludeRecent = function(day) {
			return $scope.days.indexOf(day) > recentCount-1 ? true : false;
		};

		console.log($scope.days);

		function TaskEntry(obj) {
			this.details = obj.details;
			this.time = obj.time;

		};
		TaskEntry.prototype.getDuration = function() {
			var duration = 0;
			for(var i = 0; i < this.time.length; i++) {
				duration += this.time[i].stop - this.time[i].start;
			}
			return duration;
		}

		function DayEntry(obj) {
			this.date = obj.date ? obj.date : new Date();
			this.tasks = obj.tasks;
		};
		DayEntry.prototype.getDuration = function() {
			var duration = 0;
			for(var i = 0; i < this.tasks.length; i++) {
				duration += this.tasks[i].getDuration();
			}
			return duration;
		}

		function sameDate(d1, d2) {
			return (d1.getDate() == d2.getDate()) && (d1.getMonth() == d2.getMonth()) && (d1.getFullYear() == d2.getFullYear());
		}

	}])
	.controller("LogViewCtrl", ["$scope", "Storage", function($scope, Storage) {
		// var Log = function(storageEntries) {
		// 	this.entries = [];
		// 	// восставливаем из записей хранилища
		// 	for(var i = 0; i < (storageEntries ? storageEntries.length : 0); i++) {
		// 		var time = new TimeNode({
		// 			start: new Date(storageEntries[i].start),
		// 			stop: new Date(storageEntries[i].stop)
		// 		});
		// 		this.entries.push({
		// 			time: time,
		// 			details: JSON.parse(storageEntries[i].details)
		// 		});
		// 	}
		// }
		// $scope.log = new Log(Storage.entries);
	}]);