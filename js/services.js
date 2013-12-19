
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
			this.details = entry.details ? entry.details : [];
		}

		// Хранилище данных таймера
		function Storage() {
			// простой список записей
			this.entries = [];
			// импортируем старые данные, если нужно
			if(localStorage.getItem("Timerwood-imported") != "true") {
				if(window["jQuery"] && window["jQuery"]["jStorage"]) {
					var importdata = JSON.parse($.jStorage.get("timer",-1)).periods; // используем старые библиотеки
					// конвертим в наш формат и добавляем
					if(importdata) {
						for(var i = 0; i < importdata.length; i++) {
							this.entries.push(new StorageEntry({
								start: new Date(importdata[i].start),
								stop: new Date(importdata[i].end),
								details: [(importdata[i].notes ? JSON.parse(importdata[i].notes) : (window.funnyPhrase ? window.funnyPhrase() : "Никак не названная задача"))]
							}));
						}
					}
					// больше не импортируем
					localStorage.setItem("Timerwood-imported", true);
				}
			}
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
			}
			this.save();
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

		// добавляем слушателя
		Storage.prototype.addListener = function(type, fn) {
			if(type == "add") {
				addEntryListeners.push(fn);
			}
			else if(type == "remove") {
				removeEntryListeners.push(fn);
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
		}

		return new Storage();
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