//
// Timerwood 3.0
// сервис таймера-часиков
//

angular.module("TimerwoodApp.services")
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