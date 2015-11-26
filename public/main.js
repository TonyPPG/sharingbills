$(function() {
var FADE_TIME = 150; // ms
var TYPING_TIMER_LENGTH = 400; // ms
var COLORS = [
'#e21400', '#91580f', '#f8a700', '#f78b00',
'#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
'#3b88eb', '#3824aa', '#a700ff', '#d300e7'
];

// Initialize varibles
var $window = $(window);
var $usernameInput = $('.usernameInput'); // Input for username
var $messages = $('.messages'); // Messages area
var $inputMessage = $('.inputMessage'); // Input message input box

var $loginPage = $('.login.page'); // The login page
var $chatPage = $('.chat.page'); // The chatroom page
var $enterButton = $('.enterb'); // The push button
var $addPerson = $('#addperson');// add button
var $minusPerson = $('#minusperson');// minus button


// Prompt for setting a username
var username;
var connected = false;
var typing = false;
var lastTypingTime;
var $currentInput = $usernameInput.focus();

var paidMoney = 0;
var totalMoney = 0;

var socket = io();

function addParticipantsMessage (data) {
	var message = '';
	if (data.numUsers === 1) {
		message += "there's 1 participant";
	} else {
		message += "there are " + data.numUsers + " participants";
	}
	log(message);
}

// Sets the client's username
function setUsername () {
	username = cleanInput($usernameInput.val().trim());

	// If the username is valid
	if (username) {
		$loginPage.fadeOut();
		$chatPage.show();
		$loginPage.off('click');
		$currentInput = $inputMessage.focus();

		// Tell the server your username
		socket.emit('add user', username);
	}
}

// Sends a chat message
function sendMessage () {
	var message = $inputMessage.val();
	var items = message.split(" ");
	var money = Number(items.pop());
	if (money) {
		paidMoney += money;
	};
	// Prevent markup from being injected into the message
	message = cleanInput(message);
	$currentInput = $inputMessage.focus();
	// if there is a non-empty message and a socket connection
	if (message && connected) {
		$inputMessage.val('');
		addChatMessage({
			username: username,
			message: message
		});
	  // tell server to execute 'new message' and send along one parameter
	  socket.emit('chat message', message);
	}
}

// Log a message
function log (message, options) {
	var $el = $('<li>').addClass('log').text(message);
	addMessageElement($el, options);
}

// Adds the visual chat message to the message list
function addChatMessage (data, options) {
	
	options = options || {};

	var $usernameDiv = $('<span class="username"/>')
	.text(data.username)
	.css('color', getUsernameColor(data.username));
	var $messageBodyDiv = $('<span class="messageBody">')
	.text(data.message);

	var typingClass = data.typing ? 'typing' : '';
	var $messageDiv = $('<li class="message"/>')
	.addClass(typingClass)
	.data('username', data.username)
	.append($usernameDiv, $messageBodyDiv);

	addMessageElement($messageDiv, options);
}



// Adds a message element to the messages and scrolls to the bottom
// el - The element to add as a message
// options.fade - If the element should fade-in (default = true)
// options.prepend - If the element should prepend
//   all other messages (default = false)
function addMessageElement (el, options) {
	var $el = $(el);

	// Setup default options
	if (!options) {
		options = {};
	}
	if (typeof options.fade === 'undefined') {
		options.fade = true;
	}
	if (typeof options.prepend === 'undefined') {
		options.prepend = false;
	}

	// Apply options
	if (options.fade) {
		$el.hide().fadeIn(FADE_TIME);
	}
	if (options.prepend) {
		$messages.prepend($el);
	} else {
		$messages.append($el);
	}
	$messages[0].scrollTop = $messages[0].scrollHeight;
}

// Prevents input from having injected markup
function cleanInput (input) {
	return $('<div/>').text(input).text();
}

//refresh result
function refreshResult(data){
	totalMoney = Number(data.totalMoney);
	var avgMoney = Number(data.totalMoney)/Number(data.numUsers);
	log(paidMoney + ' you paid');
	log('Average price = '+ avgMoney);
	if(paidMoney > avgMoney){
		log('You should collect $'+ (paidMoney - avgMoney));
	}else if(paidMoney == avgMoney){
		log('You are even');
	}else{
		log('You should pay $'+ (avgMoney - paidMoney));
	}
	addParticipantsMessage(data);
}




// Gets the color of a username through our hash function
function getUsernameColor (username) {
	// Compute hash code
	var hash = 7;
	for (var i = 0; i < username.length; i++) {
		hash = username.charCodeAt(i) + (hash << 5) - hash;
	}
	// Calculate color
	var index = Math.abs(hash % COLORS.length);
	return COLORS[index];
}

  // Keyboard events

$window.keydown(function (event) {
	// Auto-focus the current input when a key is typed
	if (!(event.ctrlKey || event.metaKey || event.altKey)) {
	  $currentInput.focus();
	}
	// When the client hits ENTER on their keyboard
	if (event.which === 13) {
	  if (username) {
	    sendMessage();
	    typing = false;
	  } else {
	    setUsername();
	  }
	}
});

$enterButton.click(function(){
	if (username) {
		sendMessage();
		typing = false;
	} else {
		setUsername();
	}
});

$addPerson.click(function(){
	socket.emit('add person');
});

$minusPerson.click(function(){
	socket.emit('minus person');
});

// Focus input when clicking anywhere on login page
$loginPage.click(function () {
	$currentInput.focus();
});

// Focus input when clicking on the message input's border
$inputMessage.click(function () {
	$inputMessage.focus();
});

// Socket events

// Whenever the server emits 'login', log the login message
socket.on('login', function (data) {
	connected = true;
	// Display the welcome message
	var message = "Welcome – ";
	log(message, {
		prepend: true
	});
	addParticipantsMessage(data);
});

// Refresh
socket.on('refresh', function(data){
	refreshResult(data);
});

// Whenever the server emits 'new message', update the chat body
socket.on('new message', function (data) {
	addChatMessage(data);
	log(data.totalMoney+'totalMoney');
	refreshResult(data);
});

// Whenever the server emits 'user joined', log it in the chat body
socket.on('user joined', function (data) {
	log(data.username + ' joined');
	addParticipantsMessage(data);
	refreshResult(data);
});

// Whenever the server emits 'user left', log it in the chat body
socket.on('user left', function (data) {
	log(data.username + ' left');
	addParticipantsMessage(data);
});

});