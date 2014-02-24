



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
				var minStr = mins > 0 ? ("0"+mins).slice(-2) : ""+mins;
				return hrs + " " + minStr;
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
				return (hrs != 0 ? (hrs + " " + niceRussianHourEnding(Math.abs(hrs)) + " ") : "") + mins + " мин";
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
	.filter("filterDurationStringToMilliseconds", function() {
		return function(d, delimiter) {
			var newDuration = d.split(delimiter ? delimiter: " ");
			// если только одна цифра - это минуты
			if(newDuration.length == 1) {
				newDuration = parseInt(newDuration[0]) * 60 * 1000;
			}
			// если две - часы и минуты
			else if(newDuration.length == 2) {
				newDuration = (parseInt(newDuration[0]) * 60 * 60 * 1000) + (parseInt(newDuration[1]) * 60 * 1000)
			}
			// или вообще ничего не делаем
			else return false;

			// типа валидации
			if(newDuration != NaN && newDuration > 0) {
				return newDuration;
			} else {
				return false;
			}
		}
	})
	.filter("updateDateFromDayTimeString", function() {
		return function(date, time, delimiter) {
			var daytime = time.split(delimiter ? delimiter : ":");
			if(daytime.length == 2 && parseInt(daytime[0]) > -1 && parseInt(daytime[1]) > -1) {
				date.setHours(daytime[0]);
				date.setMinutes(daytime[1]);
			}
			return date;
		}
	})
	.filter("updateDateFromDateString", function() {
		return function(date, editDate, delimiter) {
			var newDate = editDate.split(delimiter ? delimiter : ".");
			if(newDate.length == 3 && 
					parseInt(newDate[0]) > 0 && parseInt(newDate[0]) < 31 && 
					parseInt(newDate[1]) > 0 && parseInt(newDate[1]) < 13 &&
					parseInt(newDate[2]) != NaN) {
				date.setDate(parseInt(newDate[0]));
				date.setMonth(parseInt(newDate[1]-1));
				date.setFullYear(parseInt(newDate[2]));
			}
			return date;
		}
	})
	.filter("spacedNumber", function() {
		return function(n) {
			var limit = 1;
			var oldstr = String(n);
			var newstr = [];
			for(var i = oldstr.length; i > 0; i--) {
				if((oldstr.length-i)%3 == 0) newstr.push(" ");
				newstr.push(oldstr[i-1]);
			}
			if(newstr[0] == " ") newstr = newstr.slice(1, newstr.length);
			return newstr.reverse().join("");

		}
	});