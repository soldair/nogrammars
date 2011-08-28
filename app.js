
var http = require('http')
, nko = require('nko')('1QyupeJT3MVzJOLf')
, express = require('express')
, io = require('socket.io')
, hashlib = require('hashlib')
,gameCore = require(__dirname+'/lib/game.js');

//slug nogrammars secret 1QyupeJT3MVzJOLf

var server = {
	app:null,
	sio:null,
	games:{},
	clients:{},
	clientIdInc:1,
	fullSyncKeyFrame:10000,
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
			app.use(express.cookieParser());
			
			var sess = express.session({ secret: "1QyupeJT3MVzJOLf" });
			
			app.use(sess);
		});


		/**
		* App routes.
		*/

		app.get('/', function (req, res) {
			//NOTE should be set on all routes
			res.cookie('io.sid', req.sessionID, {httpOnly:false,path:'/',maxAge:864000000});
			res.render('index', { layout: false });
		});

		app.get('/game/:id',function(req,res){
			//NOTE should be set on all routes
			res.cookie('io.sid', req.sessionID, {httpOnly:false,path:'/',maxAge:864000000});
			res.render('index', { layout: false});
		});

	},
	socketio:function(){
		var z = this
		, sio = z.sio = io.listen(z.app);
		
		sio.set('log level',1);
		
		//NOTE this will need refactor... its a little hairy
		sio.sockets.on("connection", function (socket) {

			var _clientId = socket.id,iosid;
			console.log('socket id ', socket.id);
			
			socket.on("join",function(data){
				var game = data.game
				,iosid = hashlib.md5(data.sid);
				
				if(game && /^\d+$/.test(game+'')) {
					socket.get('clientid',function(id){
						if(!id) {//brand new
							//persistent sid or unique per page client id
							id = iosid||_clientId;
							socket.set('clientid',id);
							if(!z.clients[id]){
								z.clients[id] = {game:z.joinedGame(game,id,socket)};
								console.log("brand new client "+id);
							} else {
								console.log("RECONNECTED client "+id);
								z.clients[id].disconnected = null;
								z.clients[id].game = z.joinedGame(game,id,socket,true);
							}
						} else if(z.clients[id]){
							//clear disconnected flag if present
							if(z.clients[id].disconnected) delete z.clients[id].disconnected;
							
							if(!z.clients[id] || !z.clients[id].game || !z.games[z.clients[id].game]){
								//not part of an existing game
								z.clients[id] = {game:z.joinedGame(game,id,socket)};

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
					z.abandonnedGame(id);
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
			
			socket.on("disconnect", function () {
				
				console.info('disconnected:  ',iosid);
				z.disconnectedFromGame(iosid||_clientId);
			});

			
		});
	},
	listen:function(){
		this.app.listen(process.env.NODE_ENV === 'production' ? 80 : 8000);
		console.log('Listening on ' + this.app.address().port);
	},
	// ------------------- /\ init stuff --- \/ helper stuff
	joinedGame:function(gameId,clientId,socket,reconnected){
		var z = this;
		if(!this.games[gameId]){
			this.games[gameId] = {
				clients:{},
				game:new gameCore.game(gameId)
			};
			
			this.games[gameId].game.onChangeCb = function(changes){
				z.emitChanges(z.games[gameId],changes);
			};
			
			this.games[gameId].game.onDeleteCb = function(deletes){
				//pass message to delete units and objects
				z.emitToGame(z.games[gameId],'delete',deletes);
			};
		}

		z.emitToGame(this.games[gameId],'joined',{id:clientId,reconnected:reconnected});

		this.games[gameId].clients[clientId] = socket;
		
		if(this.games[gameId]) {
			//THIS IS where i make the first unit. this is not really a good place for this call but it'll do for 5:42 am
			this.games[gameId].game.createUnit('ship',[+(Math.random()+'').substr(2,3),30],clientId);
		}
		
		//sync current game state
		z.emitToGame(this.games[gameId],'sync',this.games[gameId].game.gameState);

		return gameId;
	},
	disconnectedFromGame:function(id){
		console.log('DISCONNECT '+id);
		
		
		var z = this;
		if(!z.clients[id]) return;
		//in 30 seconds if the client with id has not reconnected remove them from the game
		z.clients[id].disconnected = 1;
		setTimeout(function(){
			if(z.clients[id].disconnected){
				console.log('is has been 30 seconds since client '+id+' has disconnected. they have abandoned');
				z.abandonedGame(id);
			}
		},20000);
	},
	abandonedGame:function(id){
		var z = this;
		if(!z.clients[id]) return;

		console.log('was in game ',z.clients[id],'   ',z.clients[id].game);

		var game = z.games[z.clients[id].game];

		delete game.clients[id];
		if(Object.keys(game.clients).length == 0) {
			
			console.log('last client left game ',z.clients[id].game,' cleaning up');
			delete z.games[z.clients[id].game];
			console.log(Object.keys(z.games).length,' games remaining');
			
		} else if(game.game && Object.keys(game.game.units).length){

			game.game.deleteUnitsByOwner(id);

		}

		delete z.clients[id];
		console.log('deleted client ',id,' ',Object.keys(z.clients).length,' clients remaining');;
		//player abandon broadcast
		z.emitToGame(game,'abandoned',{id:id});
	},
	emitChanges:function(game,changes){
		if(!this._fullSyncKeyFrame) this._fullSyncKeyFrame = Date.now();
		//can only use volitile if i blast sync often
		//PERIODIC full sync
		if(this._fullSyncKeyFrame+this.fullSyncKeyFrame < Date.now()){
			this.emitToGame(game,'changes',game.game.gameState.units);
			this._fullSyncKeyFrame = Date.now();
		} else {
			//TODO try volitile for not full sync long polling perf
			this.emitToGame(game,'changes',changes);
		}
	},
	emitToGame:function(game,ev,data){
		console.log('emit to game!! ',ev,' ',data);
		//prolly a better way than looping but this is ok for now i hope.
		if(game.clients && Object.keys(game.clients).length){
			Object.keys(game.clients).forEach(function(id,v) {
				var socket = game.clients[id];
				socket.emit(ev, data);
			});
		}
	}
};


server.init();