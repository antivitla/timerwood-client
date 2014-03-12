//
// Timerwood 3.0
// сервисы
//

angular.module("TimerwoodApp.services")

	.factory("Timerwood", [function() {
		return Timerwood;
	}])

	.factory("DropboxClient", ["$rootScope", "$q", "$timeout", function($rootScope, $q, $timeout) {
		var client = new Dropbox.Client({key: "yon04gtk6dzqos9"});

		// дебаг-хак
		window.dc = client;

		// Хак чтоб редирект с dropbox'а не ломал нахрен приложение
		$rootScope.$on("$locationChangeStart", function(event, newurl, oldurl) {
			event.preventDefault();
		});

		// пробуем соединиться сразу
		var info = $q.defer();
		client.authenticate({interactive: false}, function(error) {
			if(!error) {
				client.getAccountInfo(function(e, d, i) {
					if(!e) {
						info.resolve(i);
					} else {
						info.reject(e);
					}
				});	
			} else if(error.code == "access_denied"){
				client.reset();
			} else {
				console.log(error);
			}
		});


		function connect() {
			var d = $q.defer();
			client.authenticate(function(error, b, c) {
				if(error) {
					console.log("dropbox auth error", error)
				} else {
					console.log("dropbox auth ok");
					d.resolve(client);
				}
			});
			return d.promise;
		}

		function disconnect() {
			var d = $q.defer();
			client.signOut(function(error) {
				if(!error) {
					d.resolve();
				}
			});
			return d.promise;
		}

		return {
			connect: connect,
			disconnect: disconnect,
			info: function() { return info.promise; }
		}
	}]);
	
	