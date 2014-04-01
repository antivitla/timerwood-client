//
// Timerwood 3.0
// сервис "хранилище"
//

angular.module("TimerwoodApp.services")
	.factory("Storage", ["$rootScope", "$timeout", "PetrovStorage", "$q", function($rootScope, $timeout, PetrovStorage, $q) {

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
		Storage.prototype.addEntry = function(obj, dir, nosave) {
			
			// не генерим новый объект если уже дают готовый, просто вставить значит
			var entry = (obj.constructor.name == "StorageEntry" ? obj : new StorageEntry(obj));
			// по умолчанию добавляем "умно" - что сохранялось сортированность "по умолчанию" (свежие первые)
			// это как будто unshift на самом деле, если пришло новое от таймера - добавится в первом же цикле
			if(!dir) {
				if(this.entries.length > 0) {
					var inserted = false;
					for(var i = 0; i < this.entries.length; i++) {
						if(entry.start.getTime() - this.entries[i].start.getTime() >= 0) {
							this.entries.splice(i, 0, entry);
							inserted = true;
							break;
						}
					}
					// если вообще первей всего стала, то значит в конец
					if(!inserted) this.entries.push(entry);
				} else {
					this.entries.push(entry);
				}
			} 
			// либо добавляем в конец (например парсинг большого списка)
			else { this.entries.push(entry); }
			// оповещаем о событии		
			$rootScope.$broadcast("storage-add-entry", entry);
			// временно - сохраняем
			if(!nosave) this.save();
			// отдаем свежедобавленное
			return entry;
		}

		// Удалить запись
		Storage.prototype.removeEntry = function(entry, nosave) {
			var id = this.entries.indexOf(entry);
			if(id > -1) { 
				this.entries.splice(id, 1); 
				$rootScope.$broadcast("storage-remove-entry", entry);
				// временно - сохраняем
				if(!nosave) this.save();
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
			this.removeEntry(entry, true);
			// изменяем
			entry.start = !data.start ? entry.start : data.start;
			entry.stop = !data.stop ? entry.stop : data.stop;
			entry.details = !data.details ? entry.details : data.details;
			// вставляем заново
			this.addEntry(entry, false, true);
			// сохраняем
			this.save();
			// отдаём
			return entry;
		}

		// пакетное удаление
		Storage.prototype.batchRemoveEntries = function(pack, nosave) {
			var id;
			for(var i = 0; i < pack.length; i++) {
				id = this.entries.indexOf(pack[i]);
				if(id > -1)  {
					this.entries.splice(id, 1);
				}
			}
			$rootScope.$broadcast("storage-batch-remove", pack);
			if(!nosave) this.save();
		}

		// пакетное добавление
		Storage.prototype.batchAddEntries = function(pack, nosave) {
			// если хранилище пустое,
			// то просто добавить и отсортировать
			if(this.entries.length == 0) {
				for(var i = 0; i < pack.length; i++) {
					this.entries.push(pack[i]);
				}
				this.sort();
			}
			else {
				// если же нет, ищем куда правильно вставить каждую
				// с учётом сортировки
				for(var i = 0; i < pack.length; i++) {
					var inserted = false;
					for(var k = 0; k < this.entries.length; k++) {
						if(pack[i].start - this.entries[k].start >= 0) {
							this.entries.splice(i, 0, pack[i]);
							inserted = true;
							break;
						}
					}
					if(!inserted) this.entries.push(pack[i]);
				}
			}
			$rootScope.$broadcast("storage-batch-add", pack);
			if(!nosave) this.save();
		}

		Storage.prototype.batchUpdateEntries = function(pack, changes) {
			// сначала удалим
			this.batchRemoveEntries(pack, true);
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
			this.batchAddEntries(pack, true);
			// сортировочка
			this.sort();
			// сохраняем
			this.save();
		}

		Storage.prototype.sort = function() {
			this.entries.sort(function(a,b) { return b.start - a.start; });
		}



		// 
		// ТУДУ
		//

		// Сохраняем тик таймера
		Storage.prototype.tickSave = function(entry) {
			console.log("storage tick save");
			// ТУДУ
			this.save()
		}

		// Сохранить все в локальном хранилище
		Storage.prototype.save = function() {
			var storageEntriesJson = angular.toJson({ entries: this.entries.slice(0) });
			// сохраняем в локальный бэкап 
			localStorage.setItem("Timerwood-Log"+PetrovStorage.account, storageEntriesJson);
			// и удалённо?
			if(PetrovStorage.account) PetrovStorage.update(PetrovStorage.account, storageEntriesJson);
		};

		Storage.prototype.saveLocal = function(account) {
			var storageEntriesJson = angular.toJson({ entries: this.entries.slice(0) });
			// сохраняем в локальный бэкап 
			localStorage.setItem("Timerwood-Log"+account, storageEntriesJson);
		}

		Storage.prototype.saveRemote = function(account) {
			var deferred = $q.defer();
			var storageEntriesJson = angular.toJson({ entries: this.entries.slice(0) });
			PetrovStorage.update(account, storageEntriesJson).then(function() {
				deferred.resolve();
			}, function() {
				deferred.reject();
			});
			return deferred.promise;
		}

		// Загрузить данные
		Storage.prototype.load = function(account) {
			$rootScope.loadingAccount = true;
			var self = this;
			// сначала грузимся с локального бэкапа данного аккаунта
			// так как это синхронная операция, 
			// то к моменту включения задач и дней, они уже будут иметь список записей
			// так что врубать события не надо
			this.loadLocal(PetrovStorage.account);
			// потом пробуем удалёнку
			$timeout(function() {
				self.loadRemote(PetrovStorage.account).then(function() {
					$rootScope.loadingAccount = false;
				}, function() {
					$rootScope.loadingAccount = false;
				});
			}, 500);
		}

		Storage.prototype.loadLocal = function(account) {
			var data = localStorage.getItem("Timerwood-Log"+account) ? angular.fromJson(localStorage.getItem("Timerwood-Log"+account)).entries : [];
			//this.clear();
			this.parseEntries(data);
			this.sort();
		}

		Storage.prototype.loadRemote = function(account) {
			var self = this;
			var deferred = $q.defer();
			if(!account) deferred.reject("empty account");
			else {
				PetrovStorage.load(account).then(function(result) {
					console.log("storage remote load ok", result);
					var data = result.data ? angular.fromJson(result.data) : { entries: [] };
					// очищаем с событием для остальных видов
					self.clear();
					self.parseEntries(data.entries);
					self.sort();
					if(self.entries.length > 0) {
						$rootScope.$broadcast("storage-batch-add", self.entries.slice(0));
					}
					deferred.resolve();
				}, 
				function(error) {
					console.log("storage remote load error", error);
					deferred.reject(error);
				});
			}
			return deferred.promise;
		}

		Storage.prototype.parseEntries = function(data) {
			for(var i = 0; i < data.length; i++) {
				this.entries.push(new StorageEntry({
					start: new Date(data[i].start),
					stop: new Date(data[i].stop),
					details: data[i].details
				}));
			}
		}

		Storage.prototype.clear = function() {
			while(this.entries.length > 0) this.entries.pop();
			$rootScope.$broadcast("storage-clear");
		}

		var storage = new Storage();
		storage.load(PetrovStorage.account);
		window.storage = storage;

		return storage;
	}]);