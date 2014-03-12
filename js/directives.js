//
// Timerwood 3.0
// новые директивы и теги
// 

var DATE_REGEXP = /(0[1-9]|[12][0-9]|3[01])\.(0[1-9]|1[012])\.(19|20)\d\d/;

angular.module("TimerwoodApp.directives", [])
	.directive('scrollTopOnClick', ["$anchorScroll", "$timeout", "$window", function($anchorScroll, $timeout, $window) {
		return {
			restrict: 'A',
			link: function(scope, $elm) {
				var w = $window;
				function scrollDelta(delta) {
					w.scrollTop(w.scrollTop() - w.scrollTop()*0.8);
					if(w.scrollTop() < 5) {
						w.scrollTop(0);
					} else {
						$timeout(function() {
							scrollDelta(delta);						
						}, 50);
					}
				}
				$elm.on('click', function() {
					scrollDelta(0.8);
				});
			}
		}
	}])
	.directive('twParentHover', function() {
		return {
			restrict: 'A',
			link: function(scope, $elm) {
				$elm.on('mouseenter', function() {
					window.el = $elm;
					$elm.parent().addClass("hover");
				});
				$elm.on('mouseleave', function() {
					$elm.parent().removeClass("hover");
				});
			}
		}
	})
	.directive("twFocusOnSubtask", function() {
		return {
			restrict: "A",
			link: function($scope, $element, $attr) {
				$scope.$on("focusNewSubTask", function() {
					console.log("focusNewSubTask");
					$element[0].selectionStart = $element[0].value.indexOf($element[0].value.split(", ")[$element[0].value.split(", ").length-1]);
					$element[0].selectionEnd = $element[0].value.length;
					$element[0].focus();
				})
			}
		}
	})
	.directive("twFocusOnEdit", ["$timeout", function($timeout) {
		return {
			restrict: "A",
			link: function($scope, $element, $attr) {
				$scope.$on("editLastItem", function() {
					console.log("editLastItem");
					$timeout(function() {
						$element[0].selectionStart = String($element[0].value).indexOf($element[0].value.split(", ")[$element[0].value.split(", ").length-1]);
						$element[0].selectionEnd = String($element[0].value).length;
						$element[0].focus();
					},10)
				});
			}
		}
	}])
	.directive("twFocusOnSwitchView", ["$timeout", function($timeout) {
		return {
			restrict: "A",
			link: function($scope, $element, $attr) {
				$scope.$on("editLastItemOnSwitchView", function() {
					console.log("editLastItemOnSwitchView");
					$timeout(function() {
						$element[0].selectionStart = String($element[0].value).indexOf($element[0].value.split(", ")[$element[0].value.split(", ").length-1]);
						$element[0].selectionEnd = String($element[0].value).length;
						$element[0].focus();
					},10)
				})
			}
		}
	}])
	.directive("twGlobalShortcuts", ["$document", "$rootScope", function($document, $rootScope) {
		return {
			restrict: "A",
			link: function($scope, $element, $attr) {
				$document.bind("keypress", function(e) {
					$rootScope.$broadcast("keypress:"+e.which, e);
					console.log(e.which);

					// сразу раздаём какие-то шорткаты

					// хелп по клавише H
					if(e.which == 104 || e.which == 1088 || e.which == 72 || e.which == 1056 || 
						e.which == 121 || e.which == 1085 || e.which == 89 || e.which == 1053) { 
						$rootScope.help = $rootScope.help ? false : true; 
						$rootScope.$apply();
					}
					// меню по клавише M
					else if(e.which == 109 || e.which == 1100 || e.which == 77 || e.which == 1068 || 
						e.which == 118 || e.which == 1084 || e.which == 86 || e.which == 1052) { 
						$rootScope.menu = $rootScope.menu ? false : true; 
						$rootScope.$apply();
					}
					// меню по клавише N
					else if(e.which == 110 || e.which == 1090 || e.which == 78 || e.which == 1058) { 
						$rootScope.notes = $rootScope.notes ? false : true; 
						$rootScope.$apply();
					}
				});
			}
		}
	}]);