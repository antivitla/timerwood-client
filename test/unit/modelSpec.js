describe('Models', function(){
	it('TimeNode работает', function() {
		var time1 = new TimeNode();
		time1.stop.setMinutes(time1.stop.getMinutes() + 1);
		console.log("Duration " + time1.getDuration());
		expect(time1.getDuration()).toBe(60000);
	});

	it("Прицепить пару промежутков времени к задаче", function() {
		var t1 = new TimeNode();
		t1.stop.setMinutes(t1.stop.getMinutes() + 2);
		var t2 = new TimeNode();
		t2.stop.setMinutes(t2.stop.getMinutes() + 5);
		var task = new TaskNode();
		task.attachTime(t1);
		task.attachTime(t2);
		console.log("Кол-во времени: "+task.time.length);
		// приаттачилось верно
		expect(task.time.length).toBe(2);
		// правильно проставилась ссылка во времени на таск
		expect(task.time[0].task).toBe(task);
		expect(task.time[1].task).toBe(task);
	});

	it("Добавляем новый подтаск к конечному таску, должен преобразовать свое время в подзадачу новую", function() {
		// первый таск
		var t1 = new TimeNode();
		t1.stop.setMinutes(t1.stop.getMinutes() + 2);
		var t2 = new TimeNode();
		t2.stop.setMinutes(t2.stop.getMinutes() + 5);
		var task1 = new TaskNode();
		task1.name = "Подзадача";
		task1.attachTime(t1);
		task1.attachTime(t2);
		var dur = task1.getDuration();

		// второй таск
		t3 = new TimeNode();
		t3.stop.setMinutes(t3.stop.getMinutes() + 15);
		t4 = new TimeNode();
		t4.stop.setMinutes(t4.stop.getMinutes() + 40);
		var task2 = new TaskNode();
		task2.name = "Главный таск";
		task2.attachTime(t3);
		task2.attachTime(t4);
		dur += task2.getDuration();

		// третий таск
		t5 = new TimeNode();
		t5.stop.setMinutes(t5.stop.getMinutes() + 3);
		var task3 = new TaskNode();
		task3.name = "Глубокий таск";
		task3.attachTime(t5);
		dur += task3.getDuration();


		// аттачим таск
		task2.attachTask(task1);
		task1.attachTask(task3);

		// теперь там два таска - остаток прошлого и новый
		// сумма равна
		console.log(task2.name, 
			task2.children[0].name, 
			task2.children[1].name, 
			task2.children[1].children[0].name, 
			task2.time.length, 
			dur, 
			task2.getDuration());
		expect(task2.children.length).toBe(2);
		expect(task2.time.length).toBe(0);
		expect(dur).toBe(task2.getDuration());
	});


	// Данные и импорт

	it('Импортируем из таймера v.1', function() {
		expect(Timerwood.importData).toBeTruthy();
	});

	it("Есть объект Лог", function() {
		expect(Timerwood.Log).toBeTruthy();
	});

	it("Есть Хранилище", function() {
		expect(Timerwood.Storage).toBeTruthy();
		//expect(Timerwood.Storage.entries).toBeTruthy();
		expect(Timerwood.Storage.add).toBeTruthy();
		expect(Timerwood.Storage.remove).toBeTruthy();
		expect(Timerwood.Storage.update).toBeTruthy();
		expect(Timerwood.Storage.get).toBeTruthy();
	});

});