//
// Timerwood 3.0
// сервис "сервер Петрова 1.0"
//

angular.module("TimerwoodApp.services")
	.factory("PetrovStorage", ["$rootScope", "$q", function($rootScope, $q) {

		function Petrov() {
			// при создании пытаемся выцепить имя аккаунта из урл
			this.account = location.href.split("?")[1] ? location.href.split("?")[1].split("&")[0] : "";
		}

		Petrov.prototype.load = function(code) {
			var deferred = $q.defer();
			var self = this;
			jQuery.ajax({
				type: "GET",
				url: "http://82.196.2.175:8062/timer/" + encodeURIComponent(code) + "/",
				success: function(result) { 
					console.log("petrov load", result);
					if(result.status) {
						deferred.resolve(result);
					} else {
						if(result.error.search("not found") > -1) {
							// если не найден такой аккаунт, 
							// надо создать
							self.create(code, "").then(function(result2) {
								deferred.resolve(result2);
							}, function(error) {
								deferred.reject(error);
							})
						} else {
							deferred.reject(result.error);
						}
					}
				},
				error: function(error) { 
					console.log("petrov load error", error);
					deferred.reject(error);
				}
			});
			return deferred.promise;
		}

		Petrov.prototype.create = function(code, entriesData) {
			var deferred = $q.defer();
			jQuery.ajax({
				type: "POST",
				url: "http://82.196.2.175:8062/timer/" + encodeURIComponent(code) + "/",
				data: { data: entriesData ? entriesData : "" },
				success: function(result) { 
					console.log("petrov create", result); 
					if(result.status) {
						deferred.resolve(result);
					} else {
						deferred.reject(result.error);
					}
				},
				error: function(error) { 
					console.log("petrov create error", error); 
					deferred.reject(error);
				}
			});
			return deferred.promise;
		}

		Petrov.prototype.update = function(code, data) {
			var self = this;
			var deferred = $q.defer();
			jQuery.ajax({
				type: "PUT",
				data: { data: data },
				url: "http://82.196.2.175:8062/timer/" + encodeURIComponent(code) + "/",
				success: function(result) { 
					console.log("petrov update", result, angular.fromJson(data).entries.length); 
					if(result.status) {
						deferred.resolve(result);
					} else {
						if(result.error.search("not found") > -1) {
							// если кто-то удалил аккаунт, создать опять
							// c сохранением сразу
							self.create(code, data).then(function(result2) {
								deferred.resolve(result2);
							});
						} else{
							deferred.reject(result.error);
						}
					}
				},
				error: function(error) { 
					console.log("petrov update error", error); 
					deferred.reject(error);
				}
			});
			return deferred.promise;
		}

		Petrov.prototype.remove = function(code) {
			jQuery.ajax({
				type: "DELETE",
				url: "http://82.196.2.175:8062/timer/" + encodeURIComponent(code) + "/",
				success: function(result) { console.log(result); },
				error: function(error) { console.log(error); }
			})
		}

		var petrov = new Petrov();
		window.petrov = petrov;

		return petrov;
	}]);
	
	