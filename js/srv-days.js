//
// Timerwood 3.0
// сервис "дни"
//

angular.module("TimerwoodApp.services")
	.factory("Days", ["Storage", "$rootScope", function(Storage, $rootScope) {

		// Хронология задач, группированная по дням
		// Задача содержит список записей хранилища которые она группирует 
		// (одинаковые имена задач за данный день)

		function Days() {
			this.days = [];
		}

		// при этом апдейт записи из хранилища сводится к удалению и повторной вставке через
		// наши парсеры

		// далее редактирование - если редактируем детали, то это одно. а время и длительность - другое

		// должны уметь парсить по одной задаче хранилища

		// поэтому понадобятся вспомогательные добавлялки и геттеры для UI

		// фильтры недавнего тоже нужны

		// как отображение и редактирование происходит? редактируем детали
		// и идёт команда переименовать все соотв. записи хранилища - батч едит

		// если длительность или... а зачем менять длительность? забыли включить? или переставить порядок
		// должны уметь удалить запись хранилища при необходимости (и добавить и заапдейтить))

		// то есть есть функции для юзера, а есть внутренние

		Days.prototype.restore = function(storage) {
			this.days = [];
			for(var i = 0; i < storage.entries.length; i++) {
				// но это добавление новой записи хранилища
				this.addStorageEntry(storage.entries[i]);
			}
			this.sort();
		}

		Days.prototype.addStorageEntry = function(entry) {
			var day = this.getDay(entry.start);
			if(!day) {
				this.days.unshift(new Day(entry, this));
			} else {
				day.addStorageEntry(entry);
			}
			this.sort();
		}

		Days.prototype.removeStorageEntry = function(entry) {
			var day = this.getDay(entry.start);
			if(day) {
				day.removeStorageEntry(entry);
			} else {
				console.log("days removeStorageEntry: day not found or already removed");
			}
		}		

		Days.prototype.getDay = function(date) {
			for(var i = 0; i < this.days.length; i++) {
				if(sameDate(date, this.days[i].tasks[0].time[0].start)) {
					return this.days[i];
				}
			}
		}

		Days.prototype.removeDay = function(day) {
			var id = this.days.indexOf(day);
			if(id > -1) {
				this.days.splice(id, 1);
			}
		}

		Days.prototype.sort = function() {
			this.days.sort(function(a,b) { return b.tasks[0].time[0].start - a.tasks[0].time[0].start; });
		}



		//
		// Day
		//

		function Day(obj, parent) {
			if(obj.constructor.name == "StorageEntry") {
				this.tasks = [new Task(obj, this)];
			} else {
				this.tasks = [];
			}
			if(parent.constructor.name == "Days") {
				this.parent = parent;
			} else {
				console.log("день без родителя-хронологии - оцтой");
			}
		}

		Day.prototype.addStorageEntry = function(entry) {
			var task = this.getTask(entry.details);
			if(!task) {
				this.tasks.unshift(new Task(entry, this));
			} else {
				task.addStorageEntry(entry);
			}
			this.sort();
		}

		Day.prototype.removeStorageEntry = function(entry) {
			var task = this.getTask(entry.details);
			if(task) {
				task.removeStorageEntry(entry);
				// если больше нет задач, удаляем
				if(this.tasks.length == 0) {
					this.parent.removeDay(this);
				}
			} else {
				console.log("day removeStorageEntry: task not found or already removed");
			}
		}		

		Day.prototype.getTask = function(details) {
			for(var i = 0; i < this.tasks.length; i++) {
				if(angular.toJson(this.tasks[i].time[0].details) == angular.toJson(details)) {
					return this.tasks[i];
				}
			}
		}

		Day.prototype.removeTask = function(task) {
			var id = this.tasks.indexOf(task);
			if(id > -1) {
				this.tasks.splice(id, 1);
			}
		}

		Day.prototype.sort = function() {
			this.tasks.sort(function(a,b) { return b.time[0].start - a.time[0].start; });
		}

		Day.prototype.getDuration = function() {
			var duration = 0;
			for(var i = 0; i < this.tasks.length; i++) {
				duration += this.tasks[i].getDuration();
			}
			return duration;
		}

		Day.prototype.getDate = function() {
			return this.tasks[0].time[0].start;
		}


		//
		// Task
		//

		function Task(obj, parent) {
			if(obj.constructor.name == "StorageEntry") {
				this.time = [obj];
			} else {
				this.time = [];
				console.log("new task empty! Будет дерьмо");
			}

			if(parent.constructor.name == "Day") {
				this.parent = parent;
			} else {
				console.log("таск без родителя - оцтой");
			}
		}

		Task.prototype.addStorageEntry = function(entry) {
			if(this.time.indexOf(entry) < 0) { 
				this.time.unshift(entry); 
			}
			this.sort();
		}

		Task.prototype.removeStorageEntry = function(entry) {
			var id = this.time.indexOf(entry);
			if(id > -1) {
				this.time.splice(id,1);
				// если время стало пусто, нужно бы удалить таск
				if(this.time.length == 0) {
					this.parent.removeTask(this);
				}
			} else {
				console.log("task removeStorageEntry: time not found or already removed");
			}
		}

		Task.prototype.sort = function() {
			this.time.sort(function(a,b) { return b.start - a.start; });
		}

		Task.prototype.getDuration = function() {
			var duration = 0;
			for(var i = 0; i < this.time.length; i++) {
				duration += this.time[i].getDuration();
			}
			return duration;
		}

		Task.prototype.getDetails = function() {
			return this.time[0].details;
		}



		//
		// Утилиты
		//

		function sameDate(d1, d2) {
			return (d1.getDate() == d2.getDate()) && (d1.getMonth() == d2.getMonth()) && (d1.getFullYear() == d2.getFullYear());
		}
		function isFirstDateBigger(d1, d2) {
			return (
				d1.getFullYear() - d2.getFullYear() > 0 ||
				(d1.getFullYear() - d2.getFullYear() >= 0  && d1.getMonth() - d2.getMonth() > 0) ||
				(d1.getFullYear() - d2.getFullYear() >= 0 && d1.getMonth() - d2.getMonth() >= 0 && d1.getDate() - d2.getDate() > 0)
			);
		}



		//
		// Создаём
		//

		var days = new Days();
		days.restore(Storage);
		window.days = days;



		//
		// События
		//

		$rootScope.$on("storage-remove-entry", function(event, entry) {
			days.removeStorageEntry(entry);
		});

		$rootScope.$on("storage-add-entry", function(event, entry) {
			days.addStorageEntry(entry);
		});

		$rootScope.$on("storage-batch-remove", function(event, pack) {
			for(var i = 0; i < pack.length; i++) {
				days.removeStorageEntry(pack[i]);
			}
		});

		$rootScope.$on("storage-batch-add", function(event, pack) {
			for(var i = 0; i < pack.length; i++) {
				days.addStorageEntry(pack[i]);
			}
		});

		$rootScope.$on("storage-clear", function(event) {
			while(days.days.length > 0) days.days.pop();
		})


		return days;

	}]);