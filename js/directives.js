
// services

var DATE_REGEXP = /(0[1-9]|[12][0-9]|3[01])\.(0[1-9]|1[012])\.(19|20)\d\d/;

angular.module("TimerwoodApp.directives", [])
	.directive('scrollTopOnClick', ["$anchorScroll", "$timeout", function($anchorScroll, $timeout) {
		return {
			restrict: 'A',
			link: function(scope, $elm) {
				var w = $(window);
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
						console.log("focu");
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
	}]);