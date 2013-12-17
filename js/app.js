/* Timerwood */

// Модель временного промежутка (знает таск, к которому относится)
function TimeNode() {
	this.start = new Date();
	this.stop = new Date();
	this.task = null;
}
TimeNode.prototype.getDuration = function() {
	return this.stop-this.start;
}

// Модель задачи (узел иерархии, знает родителя и детей)
function TaskNode() {
	this.name = window.funnyPhrase ? window.funnyPhrase() : "Никак не названная задача"
	this.children = [];
	this.parent = null;
	this.time = [];
	this.attachTime(new TimeNode());
}
TaskNode.prototype._attachChild = function(child) {
	this.children.push(child);
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
	this.time.push(timenode);
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
var Timerwood = {};
// В виде Лога таймера
Timerwood.Log = {};
// В виде иерархии Задач
Timerwood.Tasks = {};
// Хранилище в формате сервера (из него восстанавливаем лог)
Timerwood.Storage = {
	entries: []
};

/*	
	В броузере первичный список - список промежутков времени TimeNode (Лог). Зависимый от него - список задач TaskNode, иерархичный.

	Мы должны мочь импортировать данные из старых таймеров.

	Мы должны уметь хранить на сервере данные. Используем для этого список объектов:

		{ 
			start: (date), 
			stop: (stop), 
			details: ["group", "group", "task"]
		}

	details хранит путь к задаче, к которой принадлежит данная запись таймера.

	ТУДУ: мы должны уметь искать записи. Удалить конкретную запись. Возможно дата начала есть уникальный идентификатор. Но тогда нужно сделать чтоб при редактировании времени создавать уникальное время автоматически (проверить на сервере?) - а то случайно сделаем начало такое же как и у старой-старой задачи. А с другой стороны - может ли такое быть? Разве что специально ломать.

	Так или иначе нужно иметь некую копию или фейк для тестов - серверное хранилище Storage, где хранятся данные в серверном формате.
*/

Timerwood.isImportDone = false;
Timerwood.importData = function(timerdata) {
	if(!timerdata) return [];
	else if(timerdata && timerdata.length < 1) return [];
	// мы должны взять хранилище в старом формате и преобразовать (добавить) эти данные в наш формат - серверный.
	var convertedEntries = [];
	// version 1
	if(timerdata[0].start != undefined && timerdata[0].end != undefined && timerdata[0].notes != undefined) {
		convertedEntries = importFromTimer_1(timerdata);
	}
	// version 2
	else if(timerdata[0].start != undefined && timerdata[0].stop != undefined && timerdata[0].details != undefined) {
		convertedEntries = importFromTimer_2(timerdata);
	}

	// из таймера версии 1
	function importFromTimer_1(data) {
		var entries = [];
		for(var i = 0; i < data.length; i++) {
			if(data[i].end)
			entries.unshift({
				start: data[i].start,
				stop: data[i].end,
				details: JSON.stringify([(data[i].notes != "" ? data[i].notes : funnyPhrase())])
			});
		}
		return entries;
	}

	// из таймера версии 2
	function importFromTimer_2(data) {
		var entries = [];
		for(var i = 0; i < data.length; i++) {
			entries.unshift({
				start: data[i].start,
				stop: data[i].stop,
				details: JSON.stringify(data[i].details)
			});
		}
		return entries;
	}

	return convertedEntries;
};
// мы должны уметь добавить запись(и) к серверному списку, аргумент это массив новых записей
Timerwood.Storage.add = function(array) {
	this.entries = this.entries.concat(array);
	this.sortByStart(-1);
}
// удаляем записи, в качестве идентификатора - время
Timerwood.Storage.remove = function(date) {
	//this.entries.unshift(entry);
}
// редактируем запись, в качестве индентификатора - время. 
Timerwood.Storage.update = function(olddate, newentry) {
	this.entries.unshift(entry);
}
// получить запись?
Timerwood.Storage.get = function(date) {
	this.entries.unshift(entry);
}
// сортируем
Timerwood.Storage.sortByStart = function(direction) {
	this.entries.sort(function(a,b) { return (direction?direction:-1)*(new Date(a.start) - new Date(b.start)); });
} 

// app
angular.module("TimerwoodApp", ["TimerwoodApp.controllers", "TimerwoodApp.services", "TimerwoodApp.filters"])
	.value("Timerwood", Timerwood);

// filters
angular.module("TimerwoodApp.filters", [])
	.filter("filterMillisecondsTo", function() {
		return function(ms, format, isPart) {
			if(format == "hh" && !isPart) {
				var hrs = parseInt(ms/3600000);
				return ("0"+hrs).slice(-2);
			}
			if(format == "mm" && isPart) {
				var mins = parseInt((ms - parseInt(ms/3600000)*3600000) / 60000);
				return ("0"+mins).slice(-2);
			}
			if(format == "ss" && isPart) {
				var secs = parseInt((ms - parseInt(ms/60000)*60000) / 1000);
				return ("0"+secs).slice(-2);
			}
			if(format == "ms" && isPart) {
				var millisecs = parseInt(ms - parseInt(ms/1000)*1000);
				return ("00"+millisecs).slice(-3);
			}
			return ms;
		}
	})
	.filter("filterDateStringTo", function() {
		return function(dateString, format) {
			var d = new Date(dateString);
			var yy = d.getFullYear();
			var mm = d.getMonth()+1;
			var dd = d.getDate();
			var hh = d.getHours();
			var min = d.getMinutes();
			var output = dateString;
			if(format == "dd.mm.yyyy") {
				output = ("0"+dd).slice(-2)+"."+("0"+mm).slice(-2)+"."+yy;
			}
			else if(format == "dd.mm.yyyy from hh:mm") {
				output = ("0"+dd).slice(-2)+"."+("0"+mm).slice(-2)+"."+yy+" в "+("0"+hh).slice(-2)+":"+("0"+min).slice(-2);
			}
			else if(format == "dd.mm.yyyy, hh:mm") {
				output = ("0"+dd).slice(-2)+"."+("0"+mm).slice(-2)+"."+yy+", "+("0"+hh).slice(-2)+":"+("0"+min).slice(-2);
			}
			return output;
		}
	})
	.filter("filterDateStringStopToDuration", function() {
		return function(stopDateString, startDateString, format) {
			var duration = (new Date(stopDateString)) - (new Date(startDateString));
			var output = duration;
			var hh = parseInt(duration / (1000*60*60));
			var mm = parseInt((duration-hh*60*60*1000) / (60*1000));

			function niceRussianHourEnding(hr) {
				var lastDigit = parseInt(("0"+hr).slice(-1));
				var lastTwoDigits = parseInt(("0"+hr).slice(-2));
				var result = "часов";
				if(lastTwoDigits > 10 && lastTwoDigits < 20) {
					result = "часов";
				}
				else if(lastDigit == 2 || lastDigit == 3 || lastDigit == 4) {
					result = "часа";
				}
				else if(hr == 1) {
					result = "час";
				}
				return result;

			}
			if(format == "hh:mm") {
				output = ("0"+hh).slice(-2)+":"+("0"+mm).slice(-2);
			}
			else if(format == "hour min") {
				output = (hh>0?(hh+" "+niceRussianHourEnding(hh)+" "):"")+mm+" мин";
			}
			return output;
		}
	});

// services
angular.module("TimerwoodApp.services", [])
	.factory("Storage", ["Timerwood", function(Timerwood) {
		// импортируем старые данные, проверить чтоб только один раз
		if(!Timerwood.isImportDone) {
			var timerdata1 = Timerwood.importData(JSON.parse($.jStorage.get("timer",-1)).periods)
			var timerdata2 = Timerwood.importData(JSON.parse(localStorage.getItem("Timerwood-Log")));

			// добавляем в наш Storage
			Timerwood.Storage.add(timerdata1);
			Timerwood.Storage.add(timerdata2);

			// Больше не импортируем
			Timerwood.isImportDone = true;
		}

		return Timerwood.Storage;
	}])
	.factory("TimerClock", ["$timeout", function($timeout) {
		var ticking = false;
		var startDate = new Date();
		var stopDate = new Date();
		var info = {
			start: new Date(),
			stop: new Date(),
			duration: 0
		}
		function tick() {
			stopDate = new Date();
			info.stop = stopDate;
			info.start = startDate;
			info.duration = stopDate - startDate;
			if(ticking) {
				$timeout(tick, parseInt(Math.random()*50+20));
			}
		}
		function startTick() {
			startDate = new Date();
			ticking = true;
			tick();
		}
		function stopTick() {
			ticking = false;
		}
		return {
			start: function() {
				startTick();
			},
			stop: function() {
				stopTick();
			},
			ticking: function() {
				return ticking;
			},
			getStartDate: function() {
				return time.start;
			},
			toggle: function() {
				if(ticking) stopTick();
				else startTick();
			},
			info: info
		}
	}]);

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
		$scope.currentView = "task";
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
	}]);