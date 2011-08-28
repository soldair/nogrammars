
function Game(id,onChangeCb,onDeleteCb){
	if(!id) throw new Error('you for got to give an id to the game');
	this.init(onChangeCb,onDeleteCb);
}

Game.prototype = {
	id:null,
	beatCbs:[],
	changes:[],
	deletes:[],
	onChangeCb:null,
	onDeleteCb:null,
	interval:null,
	unitIdInc:1,
	gameState:{
		units:{}
		,world:{
			name:'default'
			,width:5000
			,height:5000
		}
		,objects:{}
	},
	init:function(changeCb,deleteCb){
		this.onChangeCb = changeCb;
		this.onDeleteCb = deleteCb;
		this.setBeats();
		this.heartBeat();
	},
	heartBeat:function(){
		var z = this;
		//for now interval. 
		setInterval(function(){
			z.beatCbs.forEach(function(cb,k){
				var changes = cb(z.gameState);
				if(changes) z.changes.push.apply(z.changes,changes);
			});
			//changes structure should probably support delete
			z.pushChanges();
			z.pushDeletes();
		},100);
	},
	clientEvent:function(event,data){
		//temp map to callable
		switch(event) {
			case "move":
				return this.moveUnit(this.gameState.units[data.id],data.destination);
			case "create":
				return this.createUnit(data.type||'ship',data.coords||data.position||[0,0]);
		}
	},
	// type = unit||object
	registerDelete:function(type,id){
		console.log("deleting unit: type:"+type+", id:"+id+", game:"+this.id);
		this.deletes.push({type:type,id:id});
	},
	deleteUnitsByOwner:function(owner){
		var z = this;
		
		Object.keys(this.gameState.units).forEach(function(k,i){
			var unit = z.gameState.units[k];
			if(unit.owner == owner){
				console.log('registering unit for deletion ',unit,k);
				z.registerDelete('unit',unit.id);
				
			}
		});
	},
	// push changes to call back so something else can send them to the client
	pushChanges:function(){
		if(this.onChangeCb && this.changes.length) {
			this.onChangeCb(this.changes);
			this.changes = [];
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
		this.onBeat(function(serverData){
			var changes = [];
			Object.keys(serverData.units).forEach(function(k,i){
				var unit = serverData.units[k];

				if(unit.position[0] != unit.destination[0] || unit.position[1] != unit.destination[1]){
					//apply delta
					unit.position = z.math.moveToward(unit.position,unit.destination,unit.speed);
				}
			});
			return changes.length?changes:false;
		});
	},
	//TODO do i have to create payers as game objects?
	createPlayer:function(id,team){
		//if(!team)
	},
	// client event handlers
	createUnit:function(type,coords,owner){
		if(this.units[type]) {
			var unit = this.units[type]();
			unit.id = this.unitIdInc++;
			unit.position = unit.destination = coords;
			unit.type = type;
			unit.owner = owner;
			
			this.gameState.units[unit.id] = unit;
			this.changes.push(unit);//this will sync to other clients
			//
			return unit;
		}
	},
	moveUnit:function(unit,destination){
		if(unit){
			unit.destination = data.destination;
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
				,speed:10
				,destination:[0,0]
				,position:[0,0]
				,radius:10
				,energy:1000
				,owner:null//clientId of owner
			}
		}
	},
	player:function(){
		return {
			id:null
			,team:null
		}
	}
};


module.exports = {
	game:Game
}