//
// Timerwood 3.0
// сервис "задачи"
//

angular.module("TimerwoodApp.services")
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
			this.storage.addListener("add", function() { self.restore(); });
			this.storage.addListener("remove", function() { self.restore(); });
			this.storage.addListener("update.details", function() { self.restore(); });
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
		}

		function createFastHierarchyFromStorageEntry(entry, hierarchy, entries) {
			// копируем массив имен
			var path = angular.copy(entry.details);
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
		TaskNode.prototype.getOwnDuration = function() {
			var duration = 0;
			for(var k = 0; k < this.time.length; k++) {
				duration += this.time[k].getDuration();
			}
			return duration;
		}

		// Создаем структуру задач
		return new Tasks(Storage);
	}]);