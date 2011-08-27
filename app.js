/*
this is my server test!
let see if our linode updates
*/
// server.js
var http = require('http')
, nko = require('nko')('1QyupeJT3MVzJOLf')
, express = require('express')
, io = require('socket.io');

//slug nogrammars secret 1QyupeJT3MVzJOLf

var app = express.createServer();

/**
 * App configuration.
 */

app.configure(function () {
  app.use(express.static(__dirname + '/public'));
  app.set('views', __dirname);
  app.set('view engine', 'jade');

});


/**
 * App routes.
 */

app.get('/', function (req, res) {
  res.render('index', { layout: false });
});

app.get('/game/:id',function(req,res){
	res.render('index', { layout: false});
});


sio = io.listen(app);

sio.sockets.on('connection', function (socket) {
	
	
	
	socket.on("event", function(a,b,c){
		if (b > 1) // 70 = f = fire!
		{
			sio.sockets.emit("event", a, b, c, 10) // the 4th variable is radius, proportional to the energy in the fire!
		}
		sio.sockets.emit('event', a, b, c);
	})
	
})
	
app.listen(process.env.NODE_ENV === 'production' ? 80 : 8000);
console.log('Listening on ' + app.address().port);
