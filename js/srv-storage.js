//
// Timerwood 3.0
// сервис "хранилище"
//

angular.module("TimerwoodApp.services")
	.factory("Storage", ["DropboxClient", function(DropboxClient) {

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
		Storage.prototype.batchRemoveEntry = function(arr) {
			var count = 0;
			for(var i = 0; i < arr.length; i++) {
				if(this.entries.indexOf(arr[i]) > -1) {
					this.entries.splice(this.entries.indexOf(arr[i]), 1);
					count++;
				}
			}
			if(count) {
				this.save();
				for(var i = 0; i < addEntryListeners.length; i++) { removeEntryListeners[i](arr); }
			}
		}

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
					this.broadcastUpdateDetails([entry]);
				}
			}
		}

		// Сохранить все в локальном хранилище
		Storage.prototype.save = function() {
			var storageEntries = this.entries;
			// save to localStorage
			localStorage.setItem("Timerwood-Log", angular.toJson({ entries: storageEntries }));
		};

		// Загрузить из локального хранилища
		Storage.prototype.load = function() {
			var data = localStorage.getItem("Timerwood-Log") ? angular.fromJson(localStorage.getItem("Timerwood-Log")).entries : [];
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

		Storage.prototype.broadcastUpdateDetails = function(tasks) {
			for(var j = 0; j < updateEntryDetailsListeners.length; j++) { 
				updateEntryDetailsListeners[j](tasks); 
			}
		}

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
	}]);