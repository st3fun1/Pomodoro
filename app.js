// To add: notifications using HTML5  Notification API
$(function () {
    let isWorkTime = true;
    let timerIsRunning = false;
    let countdownInterval;
    let isPaused = false;
    const pomodoroWorkMinutes = 25;
    const pomodoroBreakMinutes = 5;
    let status = {
        break: {
            date: null
            , minutes: 0
            , seconds: 0
            , text: 'Break'
            , default :{
                secs: 3,
                mins: 0
            }
            , action: 'break'
            , sound: 1
        }
        , work: {
            date: null
            , minutes: 0
            , seconds: 0
            , text: 'Work'
            , default :{
                secs: 5,
                mins: 0
            }
            , action: 'work'
            , sound: 0
        }
    };
    let currentAction = status.work.action;
    
    let elements = {
        statusEl: $('.status')
        , resetBtn: $('.reset')
        , startBtn: $('.start')
        , minsSpan: $('.timer .minutes')
        , secSpan: $('.timer .seconds')
        , minusEl: $('.minus')
        , plusEl: $('.plus')
        , actionStatus: $('.action')
    };
    
    let getRemainingTime = function (time) {
        let t = Date.parse(time) - Date.parse(new Date());
        let seconds = Math.floor((t / 1000) % 60);
        let minutes = Math.floor((t / 1000 / 60) % 60);
        return {
            'total': t
            , 'seconds': seconds
            , 'minutes': minutes
        }
    };
    
    //return action type based on isWorkTime
    
    let initialize = function (action,btn,seconds,mins) {
        $('.controls .minus, .controls .plus').off('click',changeDurationHandler);
        status[action].date = setDate(seconds, mins);
        
        countdownInterval = setInterval(function () {
            let t;
            
            t = getRemainingTime(status[action].date);
            
            status[action].minutes = t.minutes;
            status[action].seconds = t.seconds;
            console.log('actv mins: ', t.minutes ,' ;actv secs: ', t.seconds);
            
            elements.minsSpan.text(checkTimeVal(t.minutes));
            elements.secSpan.text(checkTimeVal(t.seconds));
            
            if (t.total <  0) {
                
                timerIsRunning = false;
                //global variables: currentAction, isWorkTime
                if(isWorkTime){
                    elements.statusEl.text(status.break.text);
                    changeDisplayedTime(status.break.action);
                    status.work.minutes = status.work.default.mins;
                    status.work.secs = status.work.default.secs;
                } else {
                    elements.statusEl.text(status.work.text);
                    changeDisplayedTime(status.work.action);
                    status.break.minutes = status.break.default.mins;
                    status.break.secs = status.break.default.secs;
                }
                playSound(status[action].sound);
                currentAction = isWorkTime ? status.break.action: status.work.action;
                isWorkTime = !isWorkTime;
                isPaused = false;
                if(action == status.work.action){
                    let  pomodorosCount = parseInt(sessionStorage.getItem('pomodorosNum'));
                    pomodorosCount--;
                    sessionStorage.setItem('pomodorosNum',String(pomodorosCount));
                    $('#pomodoros-num').text(pomodorosCount);
                    if(pomodorosCount < 1) {
                        alert("Congratulations you've completed your task!");
                        sessionStorage.clear();
                        updateTaskDetails();   
                    }
                    showAllTimePomodoros('update');
                }
                elements.startBtn.text('Start');
                $('.controls .minus, .controls .plus').on('click',changeDurationHandler);
                clearInterval(countdownInterval);
            }
        }, 1000);
    };
    
    function startCountdown() {

        if(!sessionStorage.getItem('taskName')){
            insertTask(updateTaskDetails);
        }
        
        if (timerIsRunning == true) {
            timerIsRunning = false;
            elements.resetBtn.on('click', reset);
            clearInterval(countdownInterval); 
            if(status[currentAction].minutes !== -1 && status[currentAction].seconds !== -1){
                isPaused = true;
                elements.startBtn.text('Start');
            } 
        } else {
             if(isPaused){
                initialize(currentAction,'.start',status[currentAction].minutes,status[currentAction].seconds);
            } else {
                initialize(currentAction,'.start',status[currentAction].default.mins,status[currentAction].default.secs);
            }
            isPaused = false;
            elements.startBtn.text('Pause');
            timerIsRunning = true;
        }
         
    }
    
    //adds 0 for seconds/minutes value less than 10
    function checkTimeVal(val){
        return val < 10 ? '0' + val: val;
    }
    
    
    function changeDurationHandler() {
        var lengthEl = $(this).parent().children('.val');
        var length = parseInt(lengthEl.text());
        if ($(this).hasClass('minus')) length--;
        else length++;
        if (elements.statusEl.text() == 'Work' && $(this).parent().hasClass('work')) {
            $('#pomodoro .minutes').text(length);
            status.work.default.mins = length;
        }
        else {
            $('#pomodoro .minutes').text(length);
            status.break.default.mins = length;
        }
        lengthEl.html(length);
    }

    
    function setDate(minutes, seconds) {
       return new Date(Date.parse(new Date()) + minutes * 1000 * 60 + seconds * 1000);
    }
    
    
    var playSound = function (soundId) {
        $('.sound').get(soundId).play();
    };
    
    
    //change timer val
    
    /* change the displayed time inside the tomato based on which action is default right now */
    var changeDisplayedTime = function(action){
        $('.timer .minutes').text(checkTimeVal(status[action].default.mins));
        $('.timer .seconds').text(checkTimeVal(status[action].default.secs));
    };
    
    //reset timer
    var reset = function (btn) {
        $(btn).on('click', function () {
            if (timerIsRunning == false) {
                elements.minsSpan.text(pomodoroWorkMinutes);
                elements.secSpan.text('00');
                status.work.default.mins = pomodoroWorkMinutes;
                status.break.default.mins = pomodoroBreakMinutes;
                status.break.default.secs = status.work.default.secs = 0;
                isPaused = false;
                currentAction = status.work.action;
                //clear the session
                sessionStorage.removeItem('pomodorosNum');
                sessionStorage.removeItem('taskName');
                updateTaskDetails();
            }
        });
    };
    
    function insertTask(cb){
        var taskName = prompt('Enter a name for your your task(minimum 3 characters).');
        if(taskName.length >= 3){
            sessionStorage.setItem('taskName', taskName);
        } else {
            sessionStorage.setItem('taskName','Being productive');
        }
        
        var pomodorosNum = parseInt(prompt('How many pomodoros(insert an integer > 0) it will take for your task to be completed?'));
        if(Number.isInteger(pomodorosNum) && pomodorosNum > 0){
            sessionStorage.pomodorosNum = "" + pomodorosNum
        } else {
            sessionStorage.pomodorosNum = "1";
        }
        
        return cb();
    }
    
    function updateTaskDetails(){
        let taskName =  sessionStorage.getItem('taskName');
        let pomodoros = sessionStorage.getItem('pomodorosNum');
        if(taskName == null) {
            taskName = 'Being productive';
        }
        if(pomodoros == null) {
            pomodoros = '1';
        }
        console.log(taskName,pomodoros);
        $('#task-name').text(taskName);
        $('#pomodoros-num').text(pomodoros);
        return true;
    }
    
    function showAllTimePomodoros(action='show'){
      if(typeof(Storage) !== 'undefined'){
            if(localStorage.pomodoros == null){
                localStorage.pomodoros = '0';
            } else {
                if(action == 'update') {
                    localStorage.pomodoros = String(parseInt(localStorage.pomodoros)+1);
                }
            }
            $('#alltime').text(localStorage.pomodoros);
      }
    }
    
    /* first time init */
    var initApp = function (startBtn) {
        $(startBtn).on('click', startCountdown);
        changeDisplayedTime('work');
        $('.controls .minus, .controls .plus').on('click',changeDurationHandler);
        updateTaskDetails();
        showAllTimePomodoros();
    };
    reset(elements.resetBtn);
    initApp('.start','.pause');
});
