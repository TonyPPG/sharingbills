var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;


app.use(express.static(__dirname+'/public'));

var usernames = {};
var numUsers = 0;

io.on('connection', function(socket){
	var addedUser = false;

	//when the clients emits 'new message', this listens and executes
	socket.on('chat message', function(msg){
		// tell client to execute 'new message'
		socket.broadcast.emit('new message', {
			username: socket.username,
			message: msg
		});
	});

	// add user
	socket.on('add user', function(username){
		socket.username = username;
		usernames[username] = username;
		++numUsers;
		addedUser = true;
		socket.emit('login',{
			numUsers: numUsers
		});
		// echo that person has connected
		socket.broadcast.emit('user joined', {
			username: socket.username,
			numUsers: numUsers
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