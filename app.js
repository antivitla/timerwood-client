
// app
angular.module("timerApp", ["timerApp.controllers", "timerApp.services"]);

// services
angular.module("timerApp.services", [])

	// Timer service
	.service("Timer", function() {

		var self = this;

		// start timer
		function start() {
			self.isTicking = true;
			// debug
			console.log("Timer started");
		};

		// stop timer
		function stop() {
			self.isTicking = false;
			// debug
			console.log("Timer stopped");
		};

		// (API) toggle timer
		self.toggle = function() {
			if(self.isTicking) stop();
			else start();
		}

		// (API) status
		self.isTicking = false;
	});

// controllers
angular.module("timerApp.controllers", [])

	// Timer controller
	.controller("TimerCtrl",["$scope", "Timer" , function($scope, Timer) {
		// toggle start/stop
		$scope.toggle = Timer.toggle;
		// get status
		$scope.isTicking = function() { return Timer.isTicking; }
		// debug
		console.log("TimerCtrl initialized");
	}]);