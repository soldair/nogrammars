var mathHelper = require(__dirname+'/math');


function Game(id,config){
	if(!id) throw new Error('you forgot to give an id to the game');
	config = config||{};
	this.init(config.onChangeCb,config.onDeleteCb);
	if(config.teams) {
		//TODO
		this.initTeams(config.teams);
	}
}

Game.prototype = {
	id:null,
	beatCbs:[],
	changes:{},
	deletes:[],
	onChangeCb:null,
	onDeleteCb:null,
	interval:null,
	unitIdInc:1,
	teamIdInc:0,
	teamCount:0,
	gameState:{
		serverIntervalTime:200,
		units:{}
		,world:{
			name:'default'
			,width:5000
			,height:5000
		}
		,objects:{}
		,teams:{}
		,players:{}
	},
	init:function(changeCb,deleteCb){
		this.onChangeCb = changeCb;
		this.onDeleteCb = deleteCb;
		this.setBeats();
		this.heartBeat();
		this.math = mathHelper;
	},
	heartBeat:function(){
		console.log('HEARTBEAT STARTING');
		var z = this;
		//for now interval.
		var loopfn = function fn(){
			z.beatCbs.forEach(function(cb,k){
				cb(z.gameState);
			});
			//changes structure should probably support delete
			z.pushChanges();
			z.pushDeletes();
			setTimeout(fn,z.gameState.serverIntervalTime);
		};
		 
		setTimeout(loopfn,this.gameState.serverIntervalTime);
	},
	clientEvent:function(owner,event,data){
		console.log('clientEvent! ',owner,event,data);
		//temp map to callable
		switch(event) {
			case "move":
				
				var unit;
				if(data.id) {
					var u = this.gameState.units[data.id];
					if(u.owner == clientId) unit = u;
				} else {
					unit = this.getUnitsByOwner(owner).shift();
				}
				//console.log('going to move unit ',unit,' for user ',owner);
				
				if(unit){
					return this.moveUnit(unit,data.coords);
				} else {
					console.log('Move command given by '+owner+' but could not locate any valid units');
				}
				break;
			case "create":
				return this.createUnit(data.type||'ship',data.coords||data.position||[0,0]);
		}
	},
	registerChange:function(type,object){
		var msg = type+" "+object.id+" changed ";
		if(type=="units") {
			console.log(msg,"pos: "+object.position[0]+','+object.position[1],' dest: '+object.destination[0]+','+object.destination[1]," move state: ",object.moveState);
		} else {
			console.log(msg);
		}

		
		if(!this.changes) this.changes = {};
		if(!this.changes[type]) this.changes[type] = [];
		
		this.changes[type].push(object);
	},
	// type = unit||object
	registerDelete:function(type,id){
		console.log("deleting: type:"+type+", id:"+id+", game:"+this.id);
		this.deletes.push({type:type,id:id});
	},
	deletePlayer:function(id){
		if(this.gameState.players[id]){
			this.removePlayerFromTeam(id);
			delete this.gameState.players[id];
			this.registerDelete('players',id);
		}
		this.deleteUnitsByOwner(id);
	},
	deleteUnitsByOwner:function(owner){
		var z = this;
		this.getUnitsByOwner(owner).forEach(function(unit,i){
			console.log('registering unit for deletion ',unit,' ',i);
			z.registerDelete('units',unit.id);
			delete z.gameState.units[unit.id];
		});
	},
	getUnitsByOwner:function(owner){
		var ret = [],z = this;
		Object.keys(this.gameState.units).forEach(function(k,i){
			var unit = z.gameState.units[k];
			if(unit.owner == owner){
				ret.push(unit);
			}
		});
		return ret;
	},
	// push changes to call back so something else can send them to the client
	pushChanges:function(){
		if(this.onChangeCb && this.changes) {
			this.onChangeCb(this.changes);
			this.changes = false;
		}
	},
	pushDeletes:function(){
		if(this.onDeleteCb && this.deletes.length) {
			this.onDeleteCb(this.deletes);
			this.deletes = [];
		}
	},
	onBeat:function(cb,remove){
		if(remove){
			//remove it
		} else {
			if(cb && cb.call) this.beatCbs.push(cb);
		}
	},
	setBeats:function(){
		var z = this;
		this.onBeat(function(serverData){
			Object.keys(serverData.units).forEach(function(k,i){
				var unit = serverData.units[k];
				
				if(unit.position[0] != unit.destination[0] || unit.position[1] != unit.destination[1]){
					
					//apply delta
					//TODO make work
					//console.log('moving unit',unit.position,unit.destination,unit.speed);
					
					var p = mathHelper.moveToward(unit.position,unit.destination,unit.speed);
					unit.position = p;
					
					//TODO collision
					
					if(!unit.moveState){
						unit.moveState = 1;
						//just started moving!
						z.registerChange('units',unit);
					}
					
				} else if(unit.moveState == 1){
					//last was moving but now im at my destination
					//was moving but now im done
					delete unit.moveState;
					z.registerChange('units',unit);
				}
			});
		});
		//ANIMATE WINDOW based on scrolling regions
		this.onBeat(function(){
		
		});
	},
	getInitPlayer:function(id){
		if(!this.gameState.players[id]) {
			var p = this.player();
			p.id = id;
			
			p.team = this.assignPlayerToTeam(id);
			
			this.gameState.players[id] = p;
			//sync it up baby
			this.registerChange('players',p);
		}
		return this.gameState.players[id];
	},
	//round robbin flag
	lastTeamAssigned:0,
	assignPlayerToTeam:function(id){
		if(this.gameState.players[id]){
			return this.gameState.players[id].team;
		}

		var t = this.lastTeamAssigned++

		if(this.teamCount-1 < this.lastTeamAssigned) {
			this.lastTeamAssigned = 0;
		}
		
		if(!this.gameState.teams[t]){
		
		}
		this.gameState.teams[t].players.push(id);
		this.registerChange('teams',this.gameState.teams[t]);
		return t;
	},
	removePlayerFromTeam:function(id) {
		//removes a player and sets the next team to join to his team
		var t = this.gameState.players[id].team
		,players = this.gameState.teams[t].players;
		
		if(players !== null) {
			players.forEach(function(pid,k){
				if(pid == id) {
					players.splice(k,1);
				}
			});
			this.gameState.teams[t].players = players;
			this.registerChange('teams',this.gameState.teams[t]);
			//TODO game cleanup on empty teams?
		}
	},
	//NOTE run once 
	initTeams:function(count){
		//
		this.teamCount = count;
		var padding = 100
		,W = this.gameState.world.width
		,H = this.gameState.world.height;
		
		var color,t,pOffset = 0;
		for(i=0;i<count;i++){
			//TODO MORE COLORS/ MAX TEAMS
			if(i == 0) {
				color = 'yellow'; 
			} else {
				color = 'red';
			}
			
			t = this.team(this.teamIdInc,color);
			
			//TODO STARTING POSITION!!
			var c = (W>H?H:W)*Math.pi
			,dist=c/this.teamCount;
			//have dist between teams!

			this.gameState.teams[this.teamIdInc] = t;
			this.teamIdInc++
		}
	},
	//TODO will only return unit if its owner has none;
	getInitUnit:function(){
	
	},
	// client event handlers
	createUnit:function(type,coords,owner){
		if(this.units[type]) {
			var player = this.getInitPlayer(owner);
			
			var unit = this.units[type]();
			unit.id = this.unitIdInc++;
			unit.position = unit.destination = coords||[0,0];
			unit.type = type;
			unit.owner = owner;
			unit.team = player.team;
			this.gameState.units[unit.id] = unit;
			//this will sync to other clients
			this.registerChange('units',unit);

			return unit;
		}
	},
	
	moveUnit:function(unit,destination){
		if(unit){
			//console.log('updated unit '+unit.id+' set destination ',destination);
			unit.destination = destination;
			//TODO apply server side movement in beat function 
			this.registerChange('units',unit);
			return unit.position; 
		}
		return false;
	},
	//unit defs. temp home
	units:{
		ship:function(){
			return {
				type:'ship'
				,id:null
				,speed:20
				,destination:[0,0]
				,position:[0,0]
				,radius:10
				,energy:1000
				,owner:null//clientId of owner
				,team:null,
			}
		}
	},
	player:function(){
		return {
			id:null
			,team:null
		}
	},
	team:function(id,color){
		return {
			id:id
			,color:color
			,players:[]
			,start:[0,0]
		};
	}
};

module.exports = {
	game:Game
}