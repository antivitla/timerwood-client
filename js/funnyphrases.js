//
// Timerwood 3.0
// 
// Забавные фразы из случайных слов 
// http://ru.wikipedia.org/wiki/Падеж
//

var funnyVocabulary = {
	verb: [
		["окучиваем", "окучивать"],
		["долбим", "добить"],
		["ковыряем", "ковырять"],
		["смазываем", "смазывать"],
		["искореняем", "искоренять"],
		["пилим", "пилить"],
		["полируем", "полировать"],
		["штопаем", "штопать"],
		["пилотируем", "пилотировать"]
	],
	noun: [
		["трактор"],
		["дятла"],
		["груши"],
		["пассатижи"],
		["жука"],
		["верстак"],
		["утюг"]
	]
}

function funnyPhrase(options) {
	if(!options) options = ["verb","noun"]; // safe call
	var phrase = "";
	for(var i = 0; i < options.length; i++) {
		var word = funnyVocabulary[options[i]][parseInt(Math.round(Math.random() * (funnyVocabulary[options[i]].length-1)))];
		phrase += word[0] + (i < options.length-1 ? " " : "");
	}
	return phrase;
}