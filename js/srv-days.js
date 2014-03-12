//
// Timerwood 3.0
// сервис "дни"
//

angular.module("TimerwoodApp.services")
	.factory("Days", ["Storage", function(Storage) {

		// Хронология по дням. Группируем одинаковые задачи в пределах одного дня в одну запись
		function Days(storage) {
			this.entries = [];
			this.storage = storage;
			// начально восстановление
			this.restore();
			// привязываем пере-восстановление при изменениях. Оно дорогое, поэтому без фанатизма
			var self = this;
			this._selfDelete = false;
			this.storage.addListener("add", function() { self.restore(); });
			this.storage.addListener("remove", function() { 
				// только если не мы сами удалили в режиме редактирования - тогда мы уже все сделали сами
				if(!self._selfDelete) {
					self.restore(); 
					self._selfDelete = false;
				}
			});
			this.storage.addListener("update.details", function() { self.restore(); });
		}

		// Восстанавление из Хранилища
		Days.prototype.restore = function() {
			// очищаем дни
			while(this.entries.length > 0) this.entries.pop();
			// только если не пустое хранилище
			if(this.storage.entries.length > 0) {
				// добавляем первый день и первый таск
				var firstDay = this.addDay({
					date: this.storage.entries[0].start
				});
				firstDay.addTask({
					details: this.storage.entries[0].details,
					time: [this.storage.entries[0]]
				})
				// добавляем остальные дни
				for(var i = 1; i < this.storage.entries.length; i++) {
					// если дата не равна предыдущей, делаем новый день c пустым списком тасков
					if(!sameDate(this.storage.entries[i].start, this.storage.entries[i-1].start)) {
						this.addDay({
							date: this.storage.entries[i].start,
						});
					}
					// теперь добавляем таск к дню (к последнему добавленному)
					var lastDay = this.lastAddedDay(); //this.entries[this.entries.length - 1];
					// создаём новый если в этот день такого таска не было
					var foundTask = lastDay.findTaskByDetails(this.storage.entries[i].details);
					if(!foundTask) {
						lastDay.addTask({
							details: this.storage.entries[i].details,
							time: [this.storage.entries[i]]
						});
					}
					// в противном случае добавляем к существующему в этот день таску
					else {
						foundTask.addTime(this.storage.entries[i]);
					}
				}
			}
		}

		// Добавляем день
		Days.prototype.addDay = function(obj) {
			var dayEntry = new DayEntry({
				date: obj.date,
				parentDays: this
			});
			this.entries.push(dayEntry);
			return dayEntry;
		}

		// Последний добавленный день (если сортировку задумаем)
		Days.prototype.lastAddedDay = function() {
			return this.entries[this.entries.length - 1];
		}

		// Удалить день
		Days.prototype.removeDayEntry = function(day) {
			if(this.entries.indexOf(day) > -1) {
				// собираем все StorageEntries в кучу
				var se = [];
				for(var i = 0; i < day.tasks.length; i++) {
					se = se.concat(day.tasks[i].time);
				}
				// удаляем всю пачку
				if(se.length > 0) this.storage.batchRemoveEntry(se);
				// удаляем день
				this.entries.splice(this.entries.indexOf(day), 1);
			}
		}

		// Модель дня (содержит задачи)
		function DayEntry(obj) {
			this.date = obj.date ? obj.date : new Date();
			this.tasks = obj.tasks ? obj.tasks : [];
			this.parentDays = obj.parentDays ? obj.parentDays : null; // link to Days interface
		};
		DayEntry.prototype.getDuration = function() {
			var duration = 0;
			for(var i = 0; i < this.tasks.length; i++) {
				duration += this.tasks[i].getDuration();
			}
			return duration;
		}
		DayEntry.prototype.addTask = function(obj) {
			var taskEntry = new TaskEntry({
				details: obj.details,
				time: obj.time ? obj.time : [],
				parentDay: this
			});
			this.tasks.push(taskEntry);
			return taskEntry;
		}
		DayEntry.prototype.findTaskByDetails = function(details) {
			var found = null;
			for(var j = 0; j < this.tasks.length; j++) {
				if(angular.toJson(details) == angular.toJson(this.tasks[j].details)) {
					found = this.tasks[j];
					break;
				}
			}
			return found;
		}
		DayEntry.prototype.removeTaskEntry = function(task) {
			if(this.tasks.indexOf(task) > -1) {
				// во-первых удалить все StorageEntries
				this.parentDays.storage.batchRemoveEntry(task.time);
				// во-вторых удалить сам таск
				this.tasks.splice(this.tasks.indexOf(task), 1);
				// и пометить чтоб не перевосстанавливаться
				this._selfDelete = true;
			}
		}

		// Модель задачи дня
		function TaskEntry(obj) {
			this.details = obj.details ? obj.details : [];
			this.time = obj.time ? obj.time : [];
			this.parentDay = obj.parentDay ? obj.parentDay : null; // link to parent DayEntry
		};
		TaskEntry.prototype.getDuration = function() {
			var duration = 0;
			for(var i = 0; i < this.time.length; i++) {
				duration += this.time[i].getDuration();
			}
			return duration;
		}
		TaskEntry.prototype.addTime = function(storageEntry) {
			this.time.push(storageEntry);
			return storageEntry;
		}
		// TaskEntry.prototype.rename = function(details) {
		// 	for(var i = 0; i < this.time.length; i++) {
		// 		this.time[i].details = details;				
		// 	}
		// }

		// утилита сравнения дат
		function sameDate(d1, d2) {
			return (d1.getDate() == d2.getDate()) && (d1.getMonth() == d2.getMonth()) && (d1.getFullYear() == d2.getFullYear());
		}

		// создаем Дни
		return new Days(Storage);
	}]);