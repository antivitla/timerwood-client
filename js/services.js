
// services

angular.module("TimerwoodApp.services", [])
	.factory("Timerwood", [function() {
		return Timerwood;
	}])
	.factory("Storage", [function() {

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

		var Storage = function() {
			this.entries = [];
		}
		// мы должны уметь добавить запись(и) к серверному списку, аргумент это массив новых записей
		Storage.prototype.add = function(array) {
			this.entries = this.entries.concat(array);
			this.sortByStart(-1);
		}
		// удаляем записи, в качестве идентификатора - время
		Storage.prototype.remove = function(date) {
			//
		}
		// редактируем запись, в качестве индентификатора - время. 
		Storage.prototype.update = function(olddate, newentry) {
			//
		}
		// получить запись?
		Storage.prototype.get = function(date) {
			//
		}
		// сортируем
		Storage.prototype.sortByStart = function(direction) {
			this.entries.sort(function(a,b) { return (direction?direction:-1)*(new Date(a.start) - new Date(b.start)); });
		} 
		// импортируем из старых версий
		Storage.prototype.importData = function(timerdata) {
			if(!timerdata) return [];
			else if(timerdata && timerdata.length < 1) return [];
			// мы должны взять хранилище в старом формате и преобразовать (добавить) эти данные в наш формат - серверный.
			var convertedEntries = [];
			// проверка на версию 1
			if(timerdata[0].start != undefined && timerdata[0].end != undefined && timerdata[0].notes != undefined) {
				convertedEntries = importFromTimer_1(timerdata);
			}
			// проверка на версию 2
			else if(timerdata[0].start != undefined && timerdata[0].stop != undefined && timerdata[0].details != undefined) {
				convertedEntries = importFromTimer_2(timerdata);
			}
			function importFromTimer_1(data) {
				var entries = [];
				for(var i = 0; i < data.length; i++) {
					var entry = {};
					entry.start = data[i].start;
					entry.stop = data[i].end;
					entry.details = JSON.stringify([(data[i].notes != "" ? data[i].notes : funnyPhrase())]);
					entries.unshift(entry);
				}
				return entries;
			}
			function importFromTimer_2(data) {
				var entries = [];
				for(var i = 0; i < data.length; i++) {
					var entry = {};
					entry.start = data[i].start;
					entry.stop = data[i].stop;
					entry.details = JSON.stringify(data[i].details);
					entries.unshift(entry);
				}
				return entries;
			}
			return convertedEntries;
		};
		// создаём экземпляр
		var storage = new Storage();
		// импортируем старые данные
		var timerdata1 = storage.importData(JSON.parse($.jStorage.get("timer",-1)).periods)
		var timerdata2 = storage.importData(JSON.parse(localStorage.getItem("Timerwood-Log")).entries);
		// добавляем в наш Storage
		storage.add(timerdata1);
		storage.add(timerdata2);
		// отдаем
		return storage;
	}])
	.factory("Log", ["Storage", function(Storage) {
		var Log = function() {
			this.entries = [];
		}
		Log.prototype.restoreFromStorageEntries = function(entries) {
			for(var i = 0; i < entries.length; i++) {
				var time = new TimeNode({
					start: new Date(entries[i].start),
					stop: new Date(entries[i].stop)
				});
				this.entries.push(time);
			}
		}
		var log = new Log();
		log.restoreFromStorageEntries(Storage.entries);
		return log;
	}])
	.factory("Tasks", ["Log", function(Log) {
		var Tasks = function() {
			this.children = [];
		}
		Tasks.prototype.restoreFromLog = function(entries) {
			//
		}
		var tasks = new Tasks();
		tasks.restoreFromLogEntries(Log.entries);
		return tasks;
	}])
	// .factory("Log", ["Storage",  function(Storage) {
	// 	// Лог промежутков времени с соотв. тасками
	// 	var Log = function() {
	// 		this.entries = [];
	// 	}
	// 	// Уметь восстанавливать таск из записи хранилища
	// 	Log.prototype.restoreFromStorage = function(entries) {
	// 		for(var i = 0; i < entries.length; i++) {
	// 			// создаем время
	// 			var time = new TimeNode();
	// 			time.start = new Date(entries[i].start);
	// 			time.stop = new Date(entries[i].stop);
	// 			// Создаём задачу
	// 			var task = new TaskNode();
	// 			task.attachTime(time);
	// 			task.name = entries[i].details[entries[i].details.length-1];
	// 			this.entries.push(task);
	// 			// создаем родительские задачи
	// 			var temptask = task;
	// 			for(var j = entries[i].details.length-2; j > -1; j--) {
	// 				temptask.parent = new TaskNode();
	// 				temptask.parent.children.unshift(temptask);
	// 				temptask.parent.name = entries[i].details[j];
	// 				temptask = temptask.parent;
	// 			}
	// 		}
	// 	};
	// 	// создаём экземпляр
	// 	var log = new Log();
	// 	// первичное восстановление из хранилища
	// 	log.restoreFromStorage(Storage.entries);
	// 	// отдаём
	// 	return log;
	// }])

	// Наши таймер-часики
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