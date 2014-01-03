
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
	.directive('parentHover', function() {
		return {
			restrict: 'A',
			link: function(scope, $elm) {
				$elm.on('mouseenter', function() {
					$(this).parent().addClass($(this).attr("parent-hover-class"));
				});
				$elm.on('mouseleave', function() {
					$(this).parent().removeClass($(this).attr("parent-hover-class"));
				});
			}
		}
	})
	.directive("twFocusOnSubtask", function() {
		return {
			restrict: "A",
			link: function($scope, $element, $attr) {
				$scope.$on("focusNewSubTask", function() {
					console.log($element[0].value);
					$element[0].selectionStart = $element[0].value.indexOf($element[0].value.split(", ")[$element[0].value.split(", ").length-1]);
					$element[0].selectionEnd = $element[0].value.length;
					$element[0].focus();
				})
			}
		}
	})
	.directive("twDateInput", function() {
		return {
			restrict: "A",
			require: "ngModel",
			scope: {
				date: "=ngModel"
			},
			link: function($scope, $el, $attr, $ctrl) {

				console.log("d", $scope, $scope.date, $scope.$parent.date);
				
				$ctrl.$parsers.unshift(function(viewValue) {
					if(DATE_REGEXP.test(viewValue)) {
						//console.log("valid", viewValue, $el.val());
						$ctrl.$setValidity('date', true);
						return viewValue;
					} else {
						//console.log("invalid", viewValue, $el.val());
						$ctrl.$setValidity('date', false);
						return viewValue;
					}
				});

				console.log($ctrl, $ctrl.$viewValue, $scope.date);

				$ctrl.$render = function() {
					$el.val($ctrl.$viewValue);
					console.log($ctrl, $ctrl.$viewValue, $scope.date);
				}

				$el.on("keyup blur change", function() {
					$ctrl.$setViewValue($scope.date);
					$scope.$parent.date = $scope.date;
					console.log($ctrl, $ctrl.$viewValue, $scope.date);

				});


				$ctrl.$setViewValue($scope.date);
				$ctrl.$render();


			}
		}
	});