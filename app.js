
var http = require('http')
, nko = require('nko')('1QyupeJT3MVzJOLf')
, express = require('express')
, io = require('socket.io')
,gameCore = require(__dirname+'/lib/game.js');

//slug nogrammars secret 1QyupeJT3MVzJOLf

var server = {
	app:null,
	sio:null,
	games:{},
	clients:{},
	clientIdInc:1,
	init:function(){
		this.express();
		this.socketio();
		this.listen();
	},
	express:function(){
		var app = this.app = express.createServer();

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

	},
	socketio:function(){
		var z = this
		, sio = z.sio = io.listen(z.app);

		//NOTE this will need refactor
		sio.sockets.on("connection", function (socket) {
			var _clientId;
			socket.on("join",function(game){
				if(game && /^\d+$/.test(game+'')) {
					socket.get('clientid',function(id){
						if(!id) {//brand new
							//unique client id
							id = _clientId = z.clientIdInc++;

							z.clients[id] = {game:z.joinedGame(game,id,socket)};
							socket.set('clientid',id);
							//TODO player joined broadcast
							
							console.log("brand new client "+id);

						} else if(z.clients[id]){
							if(!z.clients[id] || !z.clients[id].game || !z.games[z.clients[id].game]){
								//not part of an existing game
								z.clients[id] = {game:z.joinedGame(game,id,socket)};
								//TODO player joined broadcast
								console.log("existing client with no game ",id," joined game ",z.clients[id].game);
							} else {
								socket.emit('error',{msg:'Weird, you are aready part of game '+z.clients[id].game});
							}

						} else {
							console.log("THIS CLIENT WAS NOT! IN THE CLIENTS OBJECT! ",id);
							socket.emit('error',{msg:'you are in a bad state. sorry =(. please refresh th page'});
						}
					});

				} else {
					socket.emit('error',{msg:'invalid game'});
				}
			});

			socket.on("abandon",function(){
				socket.get('clientid',function(id){
					if(id && z.clients[id] && z.clients[id].game && z.games[z.clients[id].game]) {
						delete z.games[z.clients[id].game].clients[id];
						//player abandon broadcast
						z.emitToGame(game,'client_abandoned',{id:id});
					}
					//could check active games for player.. would be bug condition
				});
			});
			
			socket.on("event", function(data){
				socket.get('clientid',function(id){
					if(!id) return;
					var gameId = this.clients[id]||{}.game;
					if(!gameId) return;
					z.games[gameId].clientEvent(data.name,data.data)
				});
			});
			
			//TODO remove clients and empty games!
			socket.on("disconnect", function () {
				
				console.info('disconnected:  ',_clientId);
				
				var id = _clientId;

				if(!z.clients[id]) return;

				console.log('was in game ',z.clients[id],'   ',z.clients[id].game);

				var game = z.games[z.clients[id].game];

				delete game.clients[id];
				if(Object.keys(game.clients).length == 0) {
					console.log('last client left game ',z.clients[id].game,' cleaning up');
					
					delete z.games[z.clients[id].game];
					
					console.log(Object.keys(z.games).length,' games remaining');
				}

				delete z.clients[id];
				console.log('')
				console.log('deleted client ',id,' ',Object.keys(z.clients).length,' clients remaining');;
				//player abandon broadcast
				z.emitToGame(game,'client_abandoned',{id:id});
			});

			
		});
	},
	listen:function(){
		this.app.listen(process.env.NODE_ENV === 'production' ? 80 : 8000);
		console.log('Listening on ' + this.app.address().port);
	},
	// ------------------- /\ init stuff --- \/ helper stuff
	joinedGame:function(gameId,clientId,socket){
		var z = this;
		if(!this.games[gameId]){
			this.games[gameId] = {
				clients:{},
				game:new gameCore.game(gameId,function(changes){
					z.emitChanges(gameObject,changes);
				})
			};
		}

		this.games[gameId].clients[clientId] = socket;
		return gameId;
	},
	emitChanges:function(game,changes){
		//can only use volitile if i blast sync often
		//TODO periodic full sync
		this.emitToGame(game,'changes',changes);
	},
	emitToGame:function(game,ev,data){
		//prolly a better way than looping but this is ok for now i hope.
		if(game.clients && Object.keys(game.clients).length){
			Object.keys(game.clients).forEach(function(id,v) {
				var socket = game.clients[id];
				socket.emit('changes', changes);
			});
		}
	}
	
};


server.init();