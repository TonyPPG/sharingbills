var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;


app.use(express.static(__dirname+'/public'));

var usernames = {};
var numUsers = 0;
var totalMoney = 0;


io.on('connection', function(socket){
	var addedUser = false;

	//when the clients emits 'new message', this listens and executes
	socket.on('chat message', function(msg){
		var items = msg.split(" ");
		var money = Number(items.pop());
		if (money) {
			totalMoney += money;
		};
		// tell client to execute 'new message'
		io.sockets.emit('new message', {
			username: socket.username,
			message: msg,
			totalMoney: totalMoney,
			numUsers: numUsers
		});
	});

	// add user
	socket.on('add user', function(username){
		socket.username = username;
		usernames[username] = username;
		++numUsers;
		addedUser = true;
		socket.emit('login',{
			username: socket.username,
			numUsers: numUsers
		});
		// echo that person has connected
		socket.broadcast.emit('user joined', {
			username: socket.username,
			numUsers: numUsers,
			totalMoney: totalMoney
		});
	});

	socket.on('add person', function(){
		numUsers++;
		io.sockets.emit('refresh', {
			username: socket.username,
			numUsers: numUsers,
			totalMoney: totalMoney
		});
	});

	socket.on('minus person', function(){
		numUsers--;
		io.sockets.emit('refresh', {
			username: socket.username,
			numUsers: numUsers,
			totalMoney: totalMoney
		});
	});

	socket.on('reset money', function(){
		totalMoney = 0;
		io.sockets.emit('reset paid', {
			username: socket.username,
			numUsers: numUsers,
			totalMoney: totalMoney
		});
	});



	socket.on('disconnect', function(){
		if(addedUser){
			delete usernames[socket.username];
			--numUsers;

			socket.broadcast.emit('user left', {
				username: socket.username,
				numUsers: numUsers
			});
		}
	});
});


http.listen(port, function(){
	console.log('Server Start and listening at port %d',port);
});