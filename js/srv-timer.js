//
// Timerwood 3.0
// сервис таймера-часиков
//

angular.module("TimerwoodApp.services")
	.factory("TimerClock", ["$timeout", "$rootScope", function($timeout, $rootScope) {
		var ticking = false;
		var info = {
			start: new Date(),
			stop: new Date(),
			duration: 0
		}
		function tick() {
			info.stop = new Date();
			info.duration = info.stop.getTime() - info.start.getTime();
			$rootScope.$broadcast("timer-tick", info);
			if(ticking) { $timeout(tick, parseInt(Math.random()*50+20)); }
		}
		function startTick() {
			info.start = new Date();
			info.stop = new Date();
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
			toggle: function() {
				if(ticking) stopTick();
				else startTick();
			},
			info: info
		}
	}]);