//
// Timerwood 3.0
// сервис "задачи"
//

angular.module("TimerwoodApp.services")
	.factory("Tasks", ["Storage", "$rootScope", function(Storage, $rootScope) {

		// суровый сервис, дерево, с хронологией
		// если создавать, следить за parent и другими
		function Task() {
			this.name = "root";
			this.children = [];
			this.time = [];
			this.parent = undefined;
			this.depth = 0;
			// иерархия тут же для быстрого доступа
		}

		// мы должны уметь создать дерево из хранилища
		Task.prototype.restore = function(storage) {
			if(this.depth > 0) {
				console.log("task: restore - only root task can restore");
				return;
			}

			for(var i = 0; i < storage.entries.length; i++) {
				this.addStorageEntry(storage.entries[i]);
			}
		}

		Task.prototype.addStorageEntry = function(entry) {
			// нам нужно определить, мы сейчас финальный таск, которому нужно добавить время
			// или промежуточный или начальный, и нужно вложить ещё тасков (в деталях записи несколько имен)
			// определяем по глубине
			// если глубина 0, то в деталях позиция 0 это первое имя списка, делаем такой таск
			// если глубина 1, то в деталях позиция 1, это второе имя. Если в деталях нет второй позиции
			// то есть таск корневой, значит на данной глубине мы уже в финальном таске и нужно просто
			// добавить время
			if(!entry.details[this.depth]) {
				// мы финальный таск, добавить время просто
				this.addTime(entry);
				// отдаём таск для сортировки в будущем или ещё зачем-то
				return this;
			}
			else {
				// мы не финальный таск:
				// а есть уже этот таск, текущего уровня? проверяем по быстрым свойствам
				if(this[entry.details[this.depth]]) {
					// если есть, передать добавление ему рекурсивно
					return this[entry.details[this.depth]].addStorageEntry(entry);
				}
				// если нету, стало быть
				// нужно вложить ещё таск текущего уровня
				// и передать вложение ему
				else {
					var task = new Task();
					task.name = entry.details[this.depth];
					task.depth = this.depth + 1;
					task.parent = this;
					// добавляем таск в детей
					this.children.push(task);
					// добавляем в быстрый поиск
					this[entry.details[this.depth]] = task;
					// передаём добавление ему
					return task.addStorageEntry(entry);
				}
			}
		}

		Task.prototype.removeStorageEntry = function(entry) {
			// как найти таск этот чтобы удалить?
			// могли ли мы похерить дерево (предусмотреть проверку полную? ТУДУ)
			// но если дерево идеально,
			// для начала попробуем проверить вдруг мы финальный таск
			if(!entry.details[this.depth]) {
				this.removeTime(entry);
				// отдаём на сортировку и убирание пустоты
				return this;
			}
			// если же нет, рекурсивно шлем вглубь
			else {
				var subtask = this[entry.details[this.depth]];
				if(subtask) {
					return this[entry.details[this.depth]].removeStorageEntry(entry);
				} else {
					// задачу кто-то мог уже удалить
					return this;
				}
			}
		}

		// затем нам нужно удалить пустые образовавшиеся таски
		Task.prototype.removeEmpty = function(entry) {
			if(this.time.length == 0 && this.children.length == 0 && this.parent) {
				// нужно удалить себя из списка детей родителя
				// тест
				if(this.parent.children.indexOf(this) < 0) {
					console.log("поломались задачи, мы отсоединены", this, entry);
				}
				this.parent.children.splice(this.parent.children.indexOf(this), 1);
				// и удалить быструю ссылку на себя...
				// нужно знать своё имя в быстрой ссылке родителя...
				// значит нужен список деталей и глубина..
				delete this.parent[entry.details[this.depth-1]];
				// кроме того, нужно рекурсивно удалить и родителя, если он стал бездетный
				return this.parent.removeEmpty(entry);
			} 
			else {
				// а здесь, кстати, остается
				// таск, который непустой, из которого
				// только что удалили дитя
				// стало быть его нужно возвратить - для сортировки или ещё для чего
				return this;
			}
		}

		Task.prototype.addTime = function(entry) {
			this.time.push(entry);
		}

		Task.prototype.removeTime = function(entry) {
			var id = this.time.indexOf(entry);
			if(id > -1) {
				this.time.splice(id, 1);
			}
			return this.time.length;
		}


		Task.prototype.getDuration = function() {
			var duration = this.getOwnDuration();
			for(var i = 0; i < this.children.length; i++) {
				duration += this.children[i].getDuration();
			}
			return duration;
		}

		Task.prototype.getOwnDuration = function() {
			var duration = 0;
			for(var i = 0; i < this.time.length; i++) {
				duration += this.time[i].getDuration();
			}
			return duration;
		}

		Task.prototype.sort = function() {
			// сначала своё время
			this.time.sort(function(a,b) { return b.stop - a.stop; });
			// потом детей
			this.children.sort(function(a,b) { return b.getLastUpdated() - a.getLastUpdated(); });
			// потом родителя
			if(this.parent) this.parent.sort();
		}

		Task.prototype.getLastUpdated = function() {
			// у нас два времени - собственное и детей
			var time = {
				self: (this.time[0] ? this.time[0].stop : 0),
				group: (this.children[0] ? this.children[0].getLastUpdated() : 0)
			};
			// отдаём последнее
			return (time.self > time.group ? time.self : time.group);
		}

		Task.prototype.restoreDetails = function() {
			var details = this.time.length > 0 ? angular.copy(this.time[0].details) : [];
			if(details.length == 0) {
				var node = this;
				while(node) {
					details.unshift(node.name);
					node = node.parent;
					if(!node.parent) break;
				}
			}
			return details;
		}

		Task.prototype.collectEntries = function() {
			// нужно собрать все записи свои
			var pack = this.time.slice(0);
			for(var i = 0; i < this.children.length; i++) {
				pack = pack.concat(this.children[i].collectEntries());
			}
			return pack;
		}

		var tasks = new Task();
		tasks.restore(Storage);
		window.tasks = tasks;

		//
		// События
		//

		// обновление списка
		$rootScope.$on("storage-add-entry", function(event, entry) {
			// просто добавить в иерархию
			tasks.addStorageEntry(entry).sort();
		});

		$rootScope.$on("storage-remove-entry", function(event, entry) {
			var lastNonEmpty = tasks.removeStorageEntry(entry).removeEmpty(entry);
			// и вроде как нужно опять отсортировать, если было удаление
			if(lastNonEmpty) lastNonEmpty.sort();
		});

		$rootScope.$on("storage-batch-remove", function(event, pack) {
			// пакетное удаление
			for(var i = 0; i < pack.length; i++) {
				var last = tasks.removeStorageEntry(pack[i]).removeEmpty(pack[i]);
				if(last) last.sort();
			}
			
		});

		$rootScope.$on("storage-batch-add", function(event, pack) {
			// пакетное добавление
			for(var i = 0; i < pack.length; i++) {
				tasks.addStorageEntry(pack[i]).sort();
			}
		});

		$rootScope.$on("storage-clear", function(event) {
			// очищаем детей
			while(tasks.children.length > 0) tasks.children.pop();
			// и быстрые ссылки
			for(var prop in tasks) {
				if(tasks[prop]) {
					if(tasks[prop].parent == tasks) {
						delete tasks[prop];
					}
				}
			}
		})

		// отдаём
		return tasks;

	}]);