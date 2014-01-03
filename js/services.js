
// services

angular.module("TimerwoodApp.services", [])
	.factory("Timerwood", [function() {
		return Timerwood;
	}])
	.factory("Storage", [function() {

		/*	
			В броузере первичный список - список промежутков времени. Зависимый от него - список задач, иерархичный.

			Мы должны мочь импортировать данные из старых таймеров.

			Мы должны уметь хранить на сервере данные. Используем для этого список объектов:

				{ 
					start: (date), 
					stop: (stop), 
					details: ["group", "group", "task"]
				}

			details хранит путь к задаче, к которой принадлежит данная запись таймера.

			ТУДУ: мы должны уметь искать записи. Удалить конкретную запись. Возможно дата начала есть уникальный идентификатор. Но тогда нужно сделать чтоб при редактировании времени создавать уникальное время автоматически (проверить на сервере?) - а то случайно сделаем начало такое же как и у старой-старой задачи. А с другой стороны - может ли такое быть? Разве что специально ломать.

		*/

		// Модель записи лога
		function StorageEntry(entry) {
			entry = entry ? entry : {};
			this.start = entry.start ? entry.start : new Date();
			this.stop = entry.stop ? entry.stop : new Date();
			this.details = entry.details && entry.details.length > 0 ? entry.details : [(window.funnyPhrase ? window.funnyPhrase() : "Задача "+(new Date()).getTime()*Math.random())];
		}
		StorageEntry.prototype.getDuration = function() {
			return this.stop - this.start;
		}

		// Хранилище данных таймера
		function Storage() {
			// простой список записей
			this.entries = [];
			// // импортируем старые данные, если нужно
			// if(localStorage.getItem("Timerwood-imported") != "true") {
			// 	if(window["jQuery"] && window["jQuery"]["jStorage"]) {
			// 		var importdata = JSON.parse($.jStorage.get("timer",-1)).periods; // используем старые библиотеки
			// 		// конвертим в наш формат и добавляем
			// 		if(importdata) {
			// 			for(var i = 0; i < importdata.length; i++) {
			// 				this.entries.push(new StorageEntry({
			// 					start: new Date(importdata[i].start),
			// 					stop: new Date(importdata[i].end),
			// 					details: [(importdata[i].notes ? JSON.parse(importdata[i].notes) : (window.funnyPhrase ? window.funnyPhrase() : "Никак не названная задача"))]
			// 				}));
			// 			}
			// 		}
			// 		// больше не импортируем
			// 		localStorage.setItem("Timerwood-imported", true);
			// 	}
			// }
			// загружаемся из локального хранилища
			this.load();
		}

		// Добавить запись в Хранилище
		Storage.prototype.addEntry = function(obj) {
			// создаём новую запись
			var entry = new StorageEntry({
				start: obj.start,
				stop: obj.stop,
				details: obj.details
			});
			this.entries.unshift(entry);
			// сохраняем всё локально
			this.save();
			// Слушатели
			for(var i = 0; i < addEntryListeners.length; i++) { addEntryListeners[i](entry); }
			// ТУДУ: возможно, отправляем на сервер
			return entry;
		};

		// Удалить запись из хранилища
		Storage.prototype.removeEntry = function(entry) {
			var foundEntry = this.entries.indexOf(entry);
			if(foundEntry == 0) {
				this.entries.shift();
			}
			else {
				this.entries.splice(this.entries.indexOf(entry), 1);
			}
			// сохранить в локальном хранилише
			this.save();
			// Слушатели
			for(var i = 0; i < addEntryListeners.length; i++) { removeEntryListeners[i](entry); }
		};

		// Изменить запись хранилища
		Storage.prototype.updateEntry = function(entry, data) {
			var foundEntry = this.entries.indexOf(entry);
			if(foundEntry > -1) {
				entry.start = !data.start ? entry.start : data.start;
				entry.stop = !data.stop ? entry.stop : data.stop;
				entry.details = !data.details ? entry.details : data.details;
				this.save();
				// Слушатели
				for(var i = 0; i < updateEntryListeners.length; i++) { 
					updateEntryListeners[i](entry); 
				}
				if(data.details) {
					for(var j = 0; j < updateEntryDetailsListeners.length; j++) { 
						updateEntryDetailsListeners[j](entry); 
					}
				}
			}
		}

		// Сохранить все в локальном хранилище
		Storage.prototype.save = function() {
			var storageEntries = this.entries;
			// save to localStorage
			localStorage.setItem("Timerwood-Log", JSON.stringify({ entries: storageEntries }));
		};

		// Загрузить из локального хранилища
		Storage.prototype.load = function() {
			var data = localStorage.getItem("Timerwood-Log") ? JSON.parse(localStorage.getItem("Timerwood-Log")).entries : [];
			for(var i = 0; i < data.length; i++) {
				this.entries.push(new StorageEntry({
					start: new Date(data[i].start),
					stop: new Date(data[i].stop),
					details: data[i].details.length > 0 ? data[i].details : [(window.funnyPhrase ? window.funnyPhrase() : "Никак не названная задача")]
				}));
			}
		}

		// Слушатели событий Хранилища
		var addEntryListeners = [];
		var removeEntryListeners = [];
		var updateEntryListeners = [];
		var updateEntryDetailsListeners = [];

		// добавляем слушателя
		Storage.prototype.addListener = function(type, fn) {
			if(type == "add") {
				addEntryListeners.push(fn);
			}
			else if(type == "remove") {
				removeEntryListeners.push(fn);
			}
			else if(type == "update") {
				updateEntryListeners.push(fn);
			}
			else if(type == "update.details") {
				updateEntryDetailsListeners.push(fn);
			}
		}

		// удаляем слушателя
		Storage.prototype.removeListener = function(type, fn) {
			if(type == "add") {
				var id = addEntryListeners.indexOf(fn);
				if(id == 0) {
					addEntryListeners.shift()
				}
				else if(id > 0) {
					addEntryListeners.splice(id, 1);
				}
			}
			else if(type == "remove") {
				var id = removeEntryListeners.indexOf(fn);
				if(id == 0) {
					removeEntryListeners.shift()
				}
				else if(id > 0) {
					removeEntryListeners.splice(id, 1);
				}
			}
			else if(type == "update") {
				var id = updateEntryListeners.indexOf(fn);
				if(id == 0) {
					updateEntryListeners.shift()
				}
				else if(id > 0) {
					updateEntryListeners.splice(id, 1);
				}
			}
			else if(type == "update.details") {
				var id = updateEntryDetailsListeners.indexOf(fn);
				if(id == 0) {
					updateEntryDetailsListeners.shift()
				}
				else if(id > 0) {
					updateEntryDetailsListeners.splice(id, 1);
				}
			}
		}

		return new Storage();
	}])

	// Дни (история по дням, строится по Хранилищу)
	.factory("Days", ["Storage", function(Storage) {

		// Хронология по дням. Группируем одинаковые задачи в пределах одного дня в одну запись
		function Days(storage) {
			this.entries = [];
			this.storage = storage;
			// начально восстановление
			this.restore();
			// привязываем пере-восстановление при изменениях. Оно дорогое, поэтому без фанатизма
			var self = this;
			this.storage.addListener("add", function() { self.restore(); console.log("dateview: add"); });
			this.storage.addListener("remove", function() { self.restore(); console.log("dateviw: remove"); });
			this.storage.addListener("update.details", function() { self.restore(); console.log("dateview: update.details"); });
		}

		// Восстанавление из Хранилища
		Days.prototype.restore = function() {
			// очищаем дни
			while(this.entries.length > 0) this.entries.pop();
			// только если не пустое хранилище
			if(this.storage.entries.length > 0) {
				// добавляем первый день и первый таск
				this.entries.push(new DayEntry({
					date: this.storage.entries[0].start,
					tasks: [new TaskEntry({
						details: this.storage.entries[0].details,
						time: [this.storage.entries[0]]
					})]
				}));
				// добавляем остальные дни
				for(var i = 1; i < this.storage.entries.length; i++) {
					// если дата не равна предыдущей, делаем новый день c пустым списком тасков
					if(!sameDate(this.storage.entries[i].start, this.storage.entries[i-1].start)) {
						this.entries.push(new DayEntry({
							date: this.storage.entries[i].start,
							tasks: []
						}));
					}
					// теперь добавляем таск к дню (к последнему добавленному)
					var lastDay = this.entries[this.entries.length - 1];
					// создаём новый если в этот день такого таска не было
					var foundTask = false;
					for(var j = 0; j < lastDay.tasks.length; j++) {
						if(JSON.stringify(this.storage.entries[i].details) == JSON.stringify(lastDay.tasks[j].details)) {
							foundTask = lastDay.tasks[j];
						}
					}
					if(!foundTask) {
						lastDay.tasks.push(new TaskEntry({
							details: this.storage.entries[i].details,
							time: [this.storage.entries[i]]
						}));
					}
					// в противном случае добавляем к существующему в этот день таску
					else {
						foundTask.time.push(this.storage.entries[i]);
					}
				}
			}
		}

		// Модель дня (содержит задачи)
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

		// Модель задачи дня
		function TaskEntry(obj) {
			this.details = obj.details;
			this.time = obj.time;
		};
		TaskEntry.prototype.getDuration = function() {
			var duration = 0;
			for(var i = 0; i < this.time.length; i++) {
				duration += this.time[i].getDuration();
			}
			return duration;
		}

		// утилита сравнения дат
		function sameDate(d1, d2) {
			return (d1.getDate() == d2.getDate()) && (d1.getMonth() == d2.getMonth()) && (d1.getFullYear() == d2.getFullYear());
		}

		// создаем Дни
		return new Days(Storage);
	}])

	// Задачи (самое помороченное)
	.factory("Tasks", ["Storage", function(Storage) {

		// Иерархия (список узлов) задач
		function Tasks(storage) {
			this.entries = [];
			this.hierarchy = {};
			// Сохраняем ссылку на Хранилище
			this.storage = storage;
			// начальное восстановление из Хранилища
			this.restore();
			// привязываем пере-восстановление при изменениях. Оно дорогое, поэтому без фанатизма
			var self = this;
			this.storage.addListener("add", function() { self.restore(); console.log("taskview: add"); });
			this.storage.addListener("remove", function() { self.restore(); console.log("taskview: remove"); });
			this.storage.addListener("update.details", function() { self.restore(); console.log("taskview: update.details"); });
		}

		Tasks.prototype.restore = function() {
			// опустошаем список
			while(this.entries.length > 0) { 
				this.entries.pop(); 
				this.hierarchy = {};
			}
			// если хранилище не пусто, начинаем
			if(this.storage.entries.length > 0) {
				// проходим по каждой записи хранилища
				for(var i = 0; i < this.storage.entries.length; i++) {
					// сначала создаём иерархию быструю (и получаем конечный таск)
					var leaftask = createFastHierarchyFromStorageEntry(this.storage.entries[i], this.hierarchy, this.entries);
					// теперь добавляем ему время
					leaftask.time.push(this.storage.entries[i]);
				}
			}
			console.log(this.entries, this.hierarchy)
		}

		function createFastHierarchyFromStorageEntry(entry, hierarchy, entries) {
			// копируем массив имен
			var path = JSON.parse(JSON.stringify(entry.details));
			// определяем новый корневой уровень
			if(!hierarchy[path[0]]) {
				hierarchy[path[0]] = new TaskNode({ name: path[0] });
				// добавляем в сортированный список задач
				entries.push(hierarchy[path[0]]);
			}
			// Пробегаем по остальным
			var level = hierarchy[path[0]];
			path.shift();
			while(path.length > 0) {
				if(!level[path[0]]) {
					// если след. уровень (таск) не найден, создаем его
					level[path[0]] = new TaskNode({ name: path[0], parent: level });
					// Добавляем деток
					if(level[path[0]].parent) {
						level[path[0]].parent.children.push(level[path[0]]);
					}
				}
				// След. цикл
				level = level[path[0]];
				path.shift();
			}
			// в конце у нас остается конечный таск level. 
			// отдаём его
			return level;
		}

		// Модель задачи
		function TaskNode(obj) {
			obj = obj?obj:{};
			this.name = obj.name?obj.name:"Незаполненный таск";
			this.children = obj.children?obj.children:[];
			this.parent = obj.parent;
			this.time = obj.time?obj.time:[];
		}
		TaskNode.prototype.root = function() {
			var level = this;
			while(level.parent) level = level.parent;
			// Теперь мы имеем ссылу на корневой таск
			return level;
		}
		TaskNode.prototype.getDuration = function() {
			var duration = 0;
			// считаем время детей
			for(var i = 0; i < this.children.length; i++) {
				duration += this.children[i].getDuration();
			}
			// собственое время тоже считаем
			for(var k = 0; k < this.time.length; k++) {
				duration += this.time[k].getDuration();
			}
			return duration;
		}

		// Создаем структуру задач
		return new Tasks(Storage);
	}])

	// Наши таймер-часики
	.factory("TimerClock", ["$timeout", function($timeout) {
		var ticking = false;
		var startDate = new Date();
		var stopDate = new Date();
		var listeners = []; // внешние слушатели тика
		var info = {
			start: new Date(),
			stop: new Date(),
			duration: 0
		}
		function tick() {
			stopDate = new Date();
			info.stop = stopDate;
			info.duration = stopDate - startDate;
			for(var i = 0; i < listeners.length; i++) { listeners[i](); } // оповещаем внешних слушателей
			if(ticking) { $timeout(tick, parseInt(Math.random()*50+20)); }
		}
		function startTick() {
			startDate = new Date();
			info.start = startDate;
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
			addTickListener: function(fn) {
				listeners.push(fn);
				return fn;
			},
			removeTickListener: function(fn) {
				var id = listeners.indexOf(fn);
				if(id == 0) {
					listeners.shift();
				}
				else if(id > 0) {
					listeners.splice(listeners.indexOf(fn), 1);
				}
			},
			info: info
		}
	}]);