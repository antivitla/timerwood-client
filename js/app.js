/* Timerwood */

// Модель временного промежутка (знает таск, к которому относится)
function TimeNode(obj) {
	obj = obj ? obj : {};
	this.start = obj.start ? obj.start : new Date();
	this.stop = obj.stop ? obj.stop : new Date();
	this.task = obj.task ? obj.task : null;
}
TimeNode.prototype.getDuration = function() {
	return this.stop-this.start;
}

// // Модель записи лога
// function LogNode(obj) {
// 	obj = obj ? obj : {};
// 	this.time = obj.time ? obj.time : new TimeNode();
// 	this.details = obj.details ? obj.details : [];
// }

// Модель задачи (узел иерархии, знает родителя и детей)
function TaskNode(obj) {
	obj = obj ? obj : {};
	this.name = obj.name ? obj.name : (window.funnyPhrase ? window.funnyPhrase() : "Никак не названная задача");
	this.children = [];
	this.parent = null;
	this.time = obj.time ? (obj.time.length > 0 ? obj.time : []) : [];
}
TaskNode.prototype._attachChild = function(child) {
	this.children.unshift(child);
	child.parent = this;
}
TaskNode.prototype.attachTask = function(task) {
	// если не было детей, перенести накопленное время в новую подзадачу
	if(this.children.length == 0) {
		var newtask = new TaskNode();
		newtask.time = this.time;
		this.time = [];
		this._attachChild(newtask);
	}
	// а теперь можно и добавить присланный таск
	this._attachChild(task);
}
TaskNode.prototype.attachTime = function(timenode) {
	this.time.unshift(timenode);
	timenode.task = this;
}
TaskNode.prototype.getDuration = function() {
	var duration = 0;
	if(this.children.length > 0) {
		for(var i = 0; i < this.children.length; i++) {
			duration += this.children[i].getDuration();
		}
	}
	else {
		for(var k = 0; k < this.time.length; k++) {
			duration += this.time[k].getDuration();
		}
	}
	return duration;
}

// // Импорт данных из таймеров
// function importTimerData(options) {
// 	return "zok";
// }



// Глобальное хранилище данных таймера
var Timerwood = {
	Log: {
		entries: []
	},
	// В виде иерархии Задач
	Tasks: {
		entries: []
	},
	// Хранилище в формате сервера (из него восстанавливаем лог)
	Storage: {
		entries: []
	}
};


// app
angular.module("TimerwoodApp", ["TimerwoodApp.controllers", "TimerwoodApp.services", "TimerwoodApp.filters"]);

// controllers
angular.module("TimerwoodApp.controllers", [])
	.controller('TimerCtrl', ["$scope", "TimerClock", function($scope, TimerClock) {
		// Состояние
		$scope.status = "stopped";
		$scope.type = "simple";
		$scope.info = TimerClock.info;

		// $scope.$watch("info.stop", function(newValue, oldValue) {
		// 	updateCurrentTask(newValue);
		// });
		// function updateCurrentTask(stopDate) {
		// 	$scope.currentTask.time[0].stop = stopDate;
		// }

		// Загрузить предыдущий сохраненный в localStorage текущий таск (или например самый последний из Лога, если не было сохраненного)
		// Текущий таск - это ссылка на таск в иерархии тасков (или логе - там одни и те же объекты). Но при этом для удобства отображения, мы должны уметь выводить общую длительность таска, причем... чтоб $apply работал. То есть таск хранит обновляемую инфу о длительностях периодов времени входящих в него. Возможно это значит нужно создавать таски через angular-систему

		// Тексты
		$scope.typeTip = {
			"simple" : "С возможностью создавать иерархию задач",
			"complex" : ""
		}
		$scope.toggleTip = {
			"started" : "Остановить таймер",
			"stopped" : "Запустить таймер"
		}

		$scope.task = {
			name : funnyPhrase()
		}
		// Переключаем
		$scope.toggle = function() {
			if($scope.status == "stopped") {
				$scope.status = "started";
				TimerClock.start();
			}
			else if($scope.status == "started") {
				$scope.status = "stopped";
				TimerClock.stop();
			}
		}
		$scope.newTask = function() {
			$scope.task.name = funnyPhrase();
		}
		$scope.toggleType = function() {
			$scope.type = ($scope.type == "simple" ? "complex" : "simple");
		}
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
			// ищем по дате
			var searchDate = (new Date(entry.start)).getTime();
			for(var i = 0; i < $scope.entries.length; i++) {
				if( (new Date($scope.entries[i].start)).getTime() == searchDate) {
					// нашли, удаляем
					$scope.entries.splice(i,1);
				}
			}
		}
	}])
	.controller("DateViewCtrl", ["$scope", "Storage", function($scope, Storage) {
		$scope.entries = [];
		for(var i = 0; i < Storage.entries.length; i++) {
			// перем первую дату
			var d = Storage.entries[i].start.split("T")[0];
			// если она не равна предыдущей, создаем новый день
			if(i > 0) {
				if(d != Storage.entries[i-1].start.split("T")[0]) {
					$scope.entries.push({
						date: new Date(Storage.entries[i].start),
						tasks: []
					});
				}
			}
			// (создаём первый день)
			else {
				$scope.entries.push({
					date: new Date(Storage.entries[i].start),
					tasks: []
				});
			}
			var lastDay = $scope.entries[$scope.entries.length-1];
			// смотрим список тасков
			var t = Storage.entries[i].details;
			// если в текущем дне не было таких тасков, создаём
			var foundTask = findTask(lastDay.tasks, t)
			if(!foundTask) {
				lastDay.tasks.push(new TaskNode({
					name: JSON.parse(Storage.entries[i].details)
				}));
			}
			var lastTask = lastDay.tasks[lastDay.tasks.length-1];
			lastTask.time.push(new TimeNode({
				start: new Date(Storage.entries[i].start),
				stop: new Date(Storage.entries[i].stop),
			}));
		}

		function findTask(arr, str) {
			for(var i = 0; i < arr.length; i++) {
				if(JSON.stringify(arr[i].name) == str) return arr[i];
			}
			return false;
		}

		$scope.tasksDuration = function(tasks) {
			var dur = 0;
			for(var i = 0; i < tasks.length; i++) {
				dur = dur + tasks[i].getDuration();
			}
			return dur;
		}

		// фильтруем недавнее
		var recentCount = 1; // сколько дней в недавние запихнуть
		$scope.recent = function(item) {
			return $scope.entries.indexOf(item) > recentCount-1 ? false : true;
		};
		$scope.excludeRecent = function(item) {
			return $scope.entries.indexOf(item) > recentCount-1 ? true : false;
		};
	}])
	.controller("LogViewCtrl", ["$scope", "Storage", function($scope, Storage) {
		var Log = function(storageEntries) {
			this.entries = [];
			// восставливаем из записей хранилища
			for(var i = 0; i < (storageEntries ? storageEntries.length : 0); i++) {
				var time = new TimeNode({
					start: new Date(storageEntries[i].start),
					stop: new Date(storageEntries[i].stop)
				});
				this.entries.push({
					time: time,
					details: JSON.parse(storageEntries[i].details)
				});
			}
		}
		$scope.log = new Log(Storage.entries);
	}]);