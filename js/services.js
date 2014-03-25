//
// Timerwood 3.0
// сервисы
//

angular.module("TimerwoodApp.services")

	.factory("PetrovStorage", ["$rootScope", "$q",function($rootScope, $q) {

		function Petrov() {
			// пытаемся загрузить имя аккаунта из урла
			this.account = location.href.split("?")[1] ? location.href.split("?")[1] : "";
		};

		Petrov.prototype.load = function(code) {
			var deferred = $q.defer();
			var xhr = jQuery.ajax({
				type: "GET",
				url: "http://82.196.2.175:8062/timer/" + code + "/",
				success: function(result) { 
					console.log(result);
					// либо успешно скачали таймер, 
					// либо его не нашли
					if(result.status) {
						deferred.resolve({
							data: result.data,
							mode: result.mode
						});
					} else {
						deferred.reject({
							error: result.error
						});
					}
				},
				error: function(error) { 
					console.log("petrov GET error", error); 
				}
			});
			return deferred.promise;
		}

		Petrov.prototype.create = function(code, data) {
			var deferred = $q.defer();
			var xhr = jQuery.ajax({
				type: "POST",
				url: "http://82.196.2.175:8062/timer/" + code + "/",
				data: { data: data },
				success: function(result) { 
					console.log(result);
					// создали 
					if(result.status) {
						deferred.resolve({
							master: result.master_code,
							guest: result.guest_code
						});
					} 
					// или нет
					else {
						deferred.reject({
							error: result.error
						});
					}
				},
				error: function(error) { 
					console.log("petrov POST error", error); 
				}
			});
			return deferred.promise;
		}

		Petrov.prototype.update = function(code, data) {
			var deferred = $q.defer();
			var xhr = jQuery.ajax({
				type: "PUT",
				data: { data: data },
				url: "http://82.196.2.175:8062/timer/" + code + "/",
				success: function(result) { 
					console.log(result);
					// результат апдейта
					if(result.status) {
						deferred.resolve();
					} else {
						deferred.reject({
							error: result.error
						});
					}
				},
				error: function(error) { 
					console.log("petrov PUT error", error); 
				}
			});
			return deferred.promise;
		}

		Petrov.prototype.remove = function(code, data) {
			var deferred = $q.defer();
			var xhr = jQuery.ajax({
				type: "DELETE",
				url: "http://82.196.2.175:8062/timer/" + code + "/",
				success: function(result) { 
					console.log(result);
					if(result.status) {
						deferred.resolve();
					} else {
						deferred.reject({
							error: result.error
						});
					}
				},
				error: function(error) { 
					console.log("petrov DELETE error", error); 
				}
			});
			return deferred.promise;
		}

		var petrov = new Petrov();
		window.petrov = petrov;

		return petrov;
	}]);

	// .factory("Timerwood", [function() {
	// 	return Timerwood;
	// }])

	// .factory("DropboxClient", ["$rootScope", "$q", "$timeout", function($rootScope, $q, $timeout) {
	// 	var client = new Dropbox.Client({key: "yon04gtk6dzqos9"});

	// 	// дебаг-хак
	// 	window.dc = client;

	// 	// Хак чтоб редирект с dropbox'а не ломал нахрен приложение
	// 	$rootScope.$on("$locationChangeStart", function(event, newurl, oldurl) {
	// 		event.preventDefault();
	// 	});

	// 	// пробуем соединиться сразу
	// 	var info = $q.defer();
	// 	client.authenticate({interactive: false}, function(error) {
	// 		if(!error) {
	// 			client.getAccountInfo(function(e, d, i) {
	// 				if(!e) {
	// 					info.resolve(i);
	// 				} else {
	// 					info.reject(e);
	// 				}
	// 			});	
	// 		} else if(error.code == "access_denied"){
	// 			client.reset();
	// 		} else {
	// 			console.log(error);
	// 		}
	// 	});


	// 	function connect() {
	// 		var d = $q.defer();
	// 		client.authenticate(function(error, b, c) {
	// 			if(error) {
	// 				console.log("dropbox auth error", error)
	// 			} else {
	// 				console.log("dropbox auth ok");
	// 				d.resolve(client);
	// 			}
	// 		});
	// 		return d.promise;
	// 	}

	// 	function disconnect() {
	// 		var d = $q.defer();
	// 		client.signOut(function(error) {
	// 			if(!error) {
	// 				d.resolve();
	// 			}
	// 		});
	// 		return d.promise;
	// 	}

	// 	return {
	// 		connect: connect,
	// 		disconnect: disconnect,
	// 		info: function() { return info.promise; }
	// 	}
	// }]);
	
	