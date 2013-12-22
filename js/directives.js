
// services

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
	});