



// Filters

angular.module("TimerwoodApp.filters", [])
	.filter("filterMillisecondsTo", function() {


		function niceRussianHourEnding(hr) {
			var lastDigit = parseInt(("0"+hr).slice(-1));
			var lastTwoDigits = parseInt(("0"+hr).slice(-2));
			var result = "часов";
			if(lastTwoDigits > 10 && lastTwoDigits < 20) {
				result = "часов";
			}
			else if(lastDigit == 2 || lastDigit == 3 || lastDigit == 4) {
				result = "часа";
			}
			else if(hr == 1) {
				result = "час";
			}
			return result;
		}


		return function(ms, format, isPart) {
			if(format == "hh" && !isPart) {
				var hrs = parseInt(ms/3600000);
				return ("0"+hrs).slice(-2);
			}
			else if(format == "hh:mm" && !isPart) {
				var hrs = parseInt(ms/3600000);
				var mins = parseInt((ms - parseInt(ms/3600000)*3600000) / 60000);
				return ("0"+hrs).slice(-2)+":"+("0"+mins).slice(-2);
			}
			else if(format == "h:mm" && !isPart) {
				var hrs = parseInt(ms/3600000);
				var mins = parseInt((ms - parseInt(ms/3600000)*3600000) / 60000);
				return hrs+":"+("0"+mins).slice(-2);
			}
			else if(format == "hr mn" && !isPart) {
				var hrs = parseInt(ms/3600000);
				var mins = parseInt((ms - parseInt(ms/3600000)*3600000) / 60000);
				return (hrs > 0 ? (hrs+"ч ") : "" ) + mins+"м";
			}
			else if(format == "h m" && !isPart) {
				var hrs = parseInt(ms/3600000);
				var mins = parseInt((ms - parseInt(ms/3600000)*3600000) / 60000);
				return hrs + " " + ("0"+mins).slice(-2);
			}
			else if(format == "mm" && isPart) {
				var mins = parseInt((ms - parseInt(ms/3600000)*3600000) / 60000);
				return ("0"+mins).slice(-2);
			}
			else if(format == "ss" && isPart) {
				var secs = parseInt((ms - parseInt(ms/60000)*60000) / 1000);
				return ("0"+secs).slice(-2);
			}
			else if(format == "ms" && isPart) {
				var millisecs = parseInt(ms - parseInt(ms/1000)*1000);
				return ("00"+millisecs).slice(-3);
			}
			else if(format == "hour min" && !isPart) {
				var hrs = parseInt(ms / 3600000);
				var mins = parseInt((ms - hrs*3600000) / 60000);
				return (hrs > 0 ? (hrs + " " + niceRussianHourEnding(hrs) + " ") : "") + mins + " мин";
			}
			return ms;
		}
	})
	.filter("filterDateTo", function() {
		return function(d, format) {
			var yy = d.getFullYear();
			var mm = d.getMonth()+1;
			var month = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
			var month_small = ["Янв", "Фев", "Мар", "Апр", "Мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
			var days = ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];
			var days_lowercase = ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"];
			var days_small = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
			var dd = d.getDate();
			var hh = d.getHours();
			var min = d.getMinutes();
			var day = d.getDay();
			var output = "";
			if(format == "dd.mm.yyyy") {
				output = ("0"+dd).slice(-2)+"."+("0"+mm).slice(-2)+"."+yy;
			}
			else if(format == "dd.mm.yyyy from hh:mm") {
				output = ("0"+dd).slice(-2)+"."+("0"+mm).slice(-2)+"."+yy+" в "+("0"+hh).slice(-2)+":"+("0"+min).slice(-2);
			}
			else if(format == "dd.mm.yyyy, hh:mm") {
				output = ("0"+dd).slice(-2)+"."+("0"+mm).slice(-2)+"."+yy+", "+("0"+hh).slice(-2)+":"+("0"+min).slice(-2);
			}
			else if(format == "today, dd MM") {
				var today = new Date();
				if(dd == today.getDate() && mm == today.getMonth()+1 && yy == today.getFullYear()) {
					output = "Сегодня, " + dd + " " + month[mm-1];
				}
				else {
					output = dd + " " + month[mm-1];
				}
			}
			else if(format == "today, day dd MM") {
				var today = new Date();
				if(dd == today.getDate() && mm == today.getMonth()+1 && yy == today.getFullYear()) {
					output = "Сегодня, " + days_lowercase[day] + " " + dd + " " + month[mm-1];
				}
				else {
					output = days[day] + " " + dd + " " + month[mm-1];
				}
			}
			else if(format == "today, dd.mm") {
				var today = new Date();
				if(dd == today.getDate() && mm == today.getMonth()+1 && yy == today.getFullYear()) {
					output = "Сегодня, " + ("0"+dd).slice(-2) + "." + ("0"+mm).slice(-2);
				}
				else {
					output = ("0"+dd).slice(-2) + "." + ("0"+mm).slice(-2);
				}
			}
			else if(format == "dd.mm") {
				output = ("0"+dd).slice(-2) + "." + ("0"+mm).slice(-2);
			}
			else if(format == "d") {
				output = dd;
			}
			else if(format == "M") {
				output = month[mm-1];
			}
			else if(format == "today") {
				var today = new Date();
				if(dd == today.getDate() && mm == today.getMonth()+1 && yy == today.getFullYear()) {
					output = "Сегодня, ";
				}
				else {
					output = "";
				}
			}
			else if(format == "hh:mm") {
				output = ("0"+hh).slice(-2)+":"+("0"+min).slice(-2);
			}			
			return output;
		}
	})
	.filter("filterDateStringStopToDuration", function() {
		return function(stopDateString, startDateString, format) {
			var duration = (new Date(stopDateString)) - (new Date(startDateString));
			var output = duration;
			var hh = parseInt(duration / (1000*60*60));
			var mm = parseInt((duration-hh*60*60*1000) / (60*1000));

			function niceRussianHourEnding(hr) {
				var lastDigit = parseInt(("0"+hr).slice(-1));
				var lastTwoDigits = parseInt(("0"+hr).slice(-2));
				var result = "часов";
				if(lastTwoDigits > 10 && lastTwoDigits < 20) {
					result = "часов";
				}
				else if(lastDigit == 2 || lastDigit == 3 || lastDigit == 4) {
					result = "часа";
				}
				else if(hr == 1) {
					result = "час";
				}
				return result;

			}
			if(format == "hh:mm") {
				output = ("0"+hh).slice(-2)+":"+("0"+mm).slice(-2);
			}
			else if(format == "hour min") {
				output = (hh>0?(hh+" "+niceRussianHourEnding(hh)+" "):"")+mm+" мин";
			}
			return output;
		}
	});