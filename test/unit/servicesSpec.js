'use strict';

/* jasmine specs for services go here */

describe("service", function() {
	beforeEach(module("timerApp.services"));

	describe("Timer service", function() {
		it("should toggle (start/stop) and change tick status", inject(function(Timer) {
			var oldStatus = Timer.isTicking;
			Timer.toggle();
			expect(Timer.isTicking).toBe(!oldStatus); 
		}));
	});
});

