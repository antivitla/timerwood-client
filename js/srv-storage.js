//
// Timerwood 3.0
// сервис "хранилище"
//

angular.module("TimerwoodApp.services")
	.factory("Storage", ["$rootScope", "$timeout", "PetrovStorage", function($rootScope, $timeout, PetrovStorage) {

		// Хранилище записей таймера - последняя правда. 
		// Хранится обычным списком. 
		// Служит источником евентов
		// Тип данных - сортированный список, всегда поддерживается сортированность по ключу "временя старта"

		// Запись хранилища
		function StorageEntry(obj) {
			obj = obj ? obj : {};
			this.start = obj.start ? obj.start : new Date();
			this.stop = obj.stop ? obj.stop : new Date();
			this.details = obj.details ? obj.details : [];
			// плагин генерации смешных имён если пустое пришло
			if(this.details.length == 0) {
				if(window.funnyPhrase) this.details.push(funnyPhrase());
				else this.details.push("Задача" + (new Date()).getTime());
			}
		}
		StorageEntry.prototype.getDuration = function() {
			return this.stop - this.start;
		}

		// Хранилище
		function Storage() {
			this.entries = [];
		}

		// Добавить запись
		// кто может добавить запись? Таймер (старт),  загрузка из сохраненного или удалённого
		// есть быстрое добавление - в начало например (по клику таймера)
		// есть умное добавление (сразу с сортировкой) - например некий апдейт удалённо пришел или ещё откуда-то
		// при этом нужно разослать сообщение о добавлении
		Storage.prototype.addEntry = function(obj, dir) {
			
			// не генерим новый объект если уже дают готовый, просто вставить значит
			var entry = (obj.constructor.name == "StorageEntry" ? obj : new StorageEntry(obj));
			// по умолчанию добавляем "умно" - что сохранялось сортированность "по умолчанию" (свежие первые)
			// это как будто unshift на самом деле, если пришло новое от таймера - добавится в первом же цикле
			if(!dir) {
				if(this.entries.length > 0) {
					for(var i = 0; i < this.entries.length; i++) {
						if(entry.start.getTime() - this.entries[i].start.getTime() >= 0) {
							this.entries.splice(i, 0, entry);
							break;
						}
					}
				} else {
					this.entries.push(entry);
				}
			} 
			// либо добавляем в конец (например парсинг большого списка)
			else { this.entries.push(entry); }
			// оповещаем о событии		
			$rootScope.$broadcast("storage-add-entry", entry);
			// временно - сохраняем
			this.save();
			// отдаем свежедобавленное
			return entry;
		}

		// Удалить запись
		Storage.prototype.removeEntry = function(entry) {
			var id = this.entries.indexOf(entry);
			if(id > -1) { 
				this.entries.splice(id, 1); 
				$rootScope.$broadcast("storage-remove-entry", entry);
				// временно - сохраняем
				this.save();
				// отдаём удалённое
				return entry;
			}
		}

		// а если исходить из юзера?
		// - добавить задачу (из таймера)
		// - удалить задачу(и)
		// - апдейтить задачу (можно через удалить-добавить, если время старта поменялось)
		// - получить задачи (query по всяким параметрам)


		// Изменить запись хранилища
		Storage.prototype.updateEntry = function(entry, data) {
			// удаляем
			this.removeEntry(entry);
			// изменяем
			entry.start = !data.start ? entry.start : data.start;
			entry.stop = !data.stop ? entry.stop : data.stop;
			entry.details = !data.details ? entry.details : data.details;
			// вставляем заново
			this.addEntry(entry);
			// отдаём
			return entry;
		}

		// пакетное удаление
		Storage.prototype.batchRemoveEntries = function(pack) {
			var id;
			for(var i = 0; i < pack.length; i++) {
				id = this.entries.indexOf(pack[i]);
				if(id > -1)  {
					this.entries.splice(id, 1);
				}
			}
			$rootScope.$broadcast("storage-batch-remove", pack);
			this.save();
		}

		// пакетное добавление
		Storage.prototype.batchAddEntries = function(pack) {
			for(var i = 0; i < pack.length; i++) {
				// ищем куда правильно вставить в хронологии хранилища
				for(var k = 0; k < this.entries.length; k++) {
					if(pack[i].start - this.entries[k].start >= 0) {
						this.entries.splice(i, 0, pack[i]);
						break;
					}
				}
			}
			$rootScope.$broadcast("storage-batch-add", pack);
			this.save();
		}

		Storage.prototype.batchUpdateEntries = function(pack, changes) {
			// сначала удалим
			this.batchRemoveEntries(pack);
			// потом изменим
			var id;
			for(var i = 0; i < pack.length; i++) {
				// изменяем дату старта
				// и сохранить длительность нужно как было
				if(changes.startDate) {
					var duration = pack[i].stop - pack[i].start;
					pack[i].start.setDate(changes.startDate.getDate());
					pack[i].start.setMonth(changes.startDate.getMonth());
					pack[i].start.setFullYear(changes.startDate.getFullYear());
					pack[i].stop = new Date(pack[i].start.getTime() + duration);
				}
				// переименование сложное (для разных задач изменение структуры)
				if(changes.detailsNewPart && changes.detailsStopDepth) {
					// нужно заменить начиная с нуля до detailsStopDepth на detailsNewPart
					pack[i].details = changes.detailsNewPart.slice(0).concat(pack[i].details.slice(changes.detailsStopDepth));
				} 
				// переименование простое
				else if(changes.details) {
					pack[i].details = angular.copy(changes.details);
				}
			}
			// а теперь добавим заново
			this.batchAddEntries(pack);
			// сортировочка
			this.sort();
		}

		Storage.prototype.sort = function() {
			this.entries.sort(function(a,b) { return b.start - a.start; });
		}



		// 
		// TODO
		//

		// Сохраняем тик таймера
		Storage.prototype.tickSave = function(entry) {
			console.log("storage tick save");
			// TODO
			this.save()
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
					details: data[i].details
				}));
			}
			// сортировочка?
			this.sort();
		}

		var storage = new Storage();
		storage.load();
		window.storage = storage;

		return storage;
	}]);