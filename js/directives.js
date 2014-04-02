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
				});
			}
		}
	}])
	.directive("twFocusOnDuration", ["$timeout", function($timeout) {
		return {
			restrict: "A",
			link: function($scope, $element, $attr) {
				console.log("FOCA!!!");
				$scope.$on("focusOnDuration", function() {
					console.log("FOCAЯЯЯЯЯ!!!");
					$timeout(function() {
						$element[0].selectionStart = 0;
						$element[0].selectionEnd = String($element[0].value).length;
						$element[0].focus();
					},10)
				});
			}
		}
	}])
	.directive("twSwitchEdit", ["$timeout", function($timeout) {
		return {
			restrict: "A",
			link: function($scope, $element, $attr) {
				console.log("FOCA!!!");
				$scope.$on("focusOnDuration", function() {
					console.log("FOCAЯЯЯЯЯ!!!");
					$timeout(function() {
						$element[0].selectionStart = 0;
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

					// хелп по клавише H
					if(e.which == 104 || e.which == 1088 || e.which == 72 || e.which == 1056 || 
						e.which == 121 || e.which == 1085 || e.which == 89 || e.which == 1053) { 
						$rootScope.$broadcast("shortcut:"+"H");
					}
					// меню по клавише M
					else if(e.which == 109 || e.which == 1100 || e.which == 77 || e.which == 1068 || 
						e.which == 118 || e.which == 1084 || e.which == 86 || e.which == 1052) { 
						$rootScope.$broadcast("shortcut:"+"M");
					}
					// меню по клавише N
					else if(e.which == 110 || e.which == 1090 || e.which == 78 || e.which == 1058) { 
						$rootScope.$broadcast("shortcut:"+"N");
					}
					$rootScope.$apply();
				});
			}
		}
	}])
	.directive("twPreventShortcuts", [function() {
		return {
			restrict: "A",
			link: function($scope, $element, $attr) {
				$element.bind("keypress", function(e) {
					e.stopPropagation();
				});
			}
		}
	}])
	.directive("twFocusDuration", [function() {
		return {
			restrict: "A",
			link: function($scope, $element, $attr) {
				$scope.$on("focus-duration", function() {
					console.log("zok");
					$element[0].selectionStart = 0;
					$element[0].selectionEnd = String($element[0].value).length;
					$element[0].focus();
				});
				$scope.$on("view-changed", function(event, data) {
					if(data != "storage") $element[0].blur();
				})
			}
		}
	}])
	.directive("twWatchEdit", ["Storage", "$filter", "$timeout", function(Storage, $filter, $timeout) {
		return {
			restrict: "EA",
			link: function($scope, $element, $attr) {
				$scope.$on("edit-storage-entry", function(event, data) {
					var i = Storage.entries.indexOf(data.entry);
					var entryScope = angular.element(".storage-list li").eq(i).scope();


					data.entry.editDate = $filter("filterDateTo")(data.entry.start, "dd.mm.yyyy");
					data.entry.editStart = $filter("filterDateTo")(data.entry.start, "hh:mm");
					data.entry.editDetails = angular.copy(data.entry.details);
					data.entry.editDuration = $filter("filterMillisecondsTo")(data.entry.stop - data.entry.start, "h m");
					// следим за изменением времени начала (обратное соответствие длительности чтоб показывать)
					data.entry.editStartWatcher = entryScope.$watch("entry.editStart", function() {
						var newStart = $filter("updateDateFromDayTimeString")(new Date(data.entry.start), data.entry.editStart, ":");
						data.entry.editDuration = $filter("filterMillisecondsTo")(data.entry.stop - newStart, "h m");
					});

					entryScope.status = "edit";

					$timeout(function() {
						entryScope.$broadcast("focus-"+data.field);
					},10);
				});
				
				$scope.$on("view-changed", function(event, data) {
					if(data != "storage") {
						$(".storage-list li").each(function() {
							angular.element(this).scope().status = "view";
						})
					}
				})
			}
		}
	}]);