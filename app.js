
var http = require('http')
, nko = require('nko')('1QyupeJT3MVzJOLf')
, express = require('express')
, io = require('socket.io')
, hashlib = require('hashlib')
, gameCore = require(__dirname+'/lib/game.js');

//slug nogrammars secret 1QyupeJT3MVzJOLf

var server = {
	app:null,
	sio:null,
	games:{},
	clients:{},
	clientIdInc:1,
	fullSyncKeyFrame:10000,//every 10 secs sync all units
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
			res.render('game', { layout: false});
		});

		app.get('/draw',function(req,res){
			//NOTE should be set on all routes
			res.cookie('io.sid', req.sessionID, {httpOnly:false,path:'/',maxAge:864000000});
			res.render('draw', { layout: false});
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
							socket.set('clientid',id,function(){
								if(!z.clients[id]){
									z.clients[id] = {game:z.joinedGame(game,id,socket)};
									console.log("brand new client "+id);
								} else {
									console.log("RECONNECTED client "+id);
									z.clients[id].disconnected = null;
									z.clients[id].game = z.joinedGame(game,id,socket,true);
								}
							});
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
				console.log('EVENT ',data);
				socket.get('clientid',function(id){
					//INSECURE \/
					if(data.client) id=data.client;
					
					console.log('got id '+id+" "+_clientId+"  "+iosid);
					console.log(z.clients[data.client]);
					
					var gameId = (z.clients[data.client]||{}).game;
					if(!gameId){
						console.log('missing game id for socket event from id');
						return;
					}
					z.games[gameId].game.clientEvent(id,data.command,data);
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
		var z = this
		,g = this.games[gameId];
		
		if(!g){
			g = this.games[gameId] = {
				clients:{},
				//TODO TEAM SETTINGS
				//NOTE refactor create game.. chicken and the egg .. need a game to join a user
				game:new gameCore.game(gameId,{teams:2})
			};
			
			g.game.onChangeCb = function(changes){
				z.emitChanges(z.games[gameId],changes);
			};
			
			g.game.onDeleteCb = function(deletes){
				//pass message to delete units and objects
				z.emitToGame(z.games[gameId],'delete',deletes);
			};
		}


		g.clients[clientId] = socket;
		

		if(g && g.game && !reconnected) {
			//TODO check for units for client id
			//THIS IS where i make the first unit. this is not really a good place for this call but it'll do for 5:42 am
			g.game.createUnit('ship',[+(Math.random()+'').substr(2,3),30],clientId);

		}

		var playerData = {};
		
		if(!playerData){
			playerData = game.createPlayer(clientId);
		}

		var gameState = g.game.gameState;

		//TODO ENSURE player data support on client
		z.emitToGame(g,'joined',{id:clientId,reconnected:reconnected,player:playerData,players:gameState.players,teams:gameState.teams},{exclude:clientId});

		//sync current game state to current user
		socket.emit('sync',{state:gameState,clientId:clientId});

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
			game.game.deletePlayer(id);
			// the above also does this. game.game.deleteUnitsByOwner(id);

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
			this.emitToGame(game,'changes',{units:game.game.gameState.units});
			this._fullSyncKeyFrame = Date.now();
			delete changes.units;
			if(!Object.keys(changes).length) changes = false;
		}
		
		if(changes){
			//TODO try volitile for not full sync long polling perf
			this.emitToGame(game,'changes',changes);
		}
	},
	emitToGame:function(game,ev,data,options){
		//console.log('emit to game!! ',ev,' ',data);
		var exclude = {};
		if(options) exclude = options.exclude||{};
		//prolly a better way than looping but this is ok for now i hope.
		if(game.clients && Object.keys(game.clients).length){
			Object.keys(game.clients).forEach(function(id,v) {
				//kinda lame that you can only exclude one id
				if(exclude == id) return;
				var socket = game.clients[id];
				socket.emit(ev, data);
			});
		}
	}
};


server.init();
