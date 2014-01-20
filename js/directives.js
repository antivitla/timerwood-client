
// services

var DATE_REGEXP = /(0[1-9]|[12][0-9]|3[01])\.(0[1-9]|1[012])\.(19|20)\d\d/;

angular.module("TimerwoodApp.directives", [])
	.directive('scrollTopOnClick', function() {
		return {
			restrict: 'A',
			link: function(scope, $elm) {
				$elm.on('click', function() {
					$("body, html").animate({scrollTop: 0}, "normal");
				});
			}
		}
	})
	.directive('twParentHover', function() {
		return {
			restrict: 'A',
			link: function(scope, $elm) {
				$elm.on('mouseenter', function() {
					$(this).parent().addClass("hover");
				});
				$elm.on('mouseleave', function() {
					$(this).parent().removeClass("hover");
				});
			}
		}
	})
	.directive("twFocusOnSubtask", function() {
		return {
			restrict: "A",
			link: function($scope, $element, $attr) {
				$scope.$on("focusNewSubTask", function() {
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
					$timeout(function() {
						$element[0].selectionStart = String($element[0].value).indexOf($element[0].value.split(", ")[$element[0].value.split(", ").length-1]);
						$element[0].selectionEnd = String($element[0].value).length;
						$element[0].focus();
					},10)
				})
			}
		}
	}]);