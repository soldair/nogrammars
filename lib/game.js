
function Game(id,onChangeCb){
	if(!id) throw new Error('you for got to give an id to the game');
	this.init(onChangeCb);
}

Game.prototype = {
	id:null,
	beatCbs:[],
	changes:[],
	onChangeCb:null,
	interval:null,
	gameState:{
		units:[]
		,world:{
			name:'default'
			,width:5000
			,height:5000
		}
		,objects:[]
	},
	init:function(changeCb){
		this.onChangeCb = changeCb;
		this.heartBeat();
	},
	heartBeat:function(){
		var z = this;
		//for now interval. 
		setInterval(function(){
			z.beatCbs.forEach(function(cb,k){
				var changes = cb(this.gameState);
				if(changes) z.changes.push.apply(z.changes,changes);
			});
			z.pushChanges();
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
	// push changes to call back so something else can send them to the client
	pushChanges:function(){
		if(this.onChangeCb && this.changes.length) {
			this.onChangeCb(this.changes);
			this.changes = [];
		}
	},
	onBeat:function(cb,remove){
		if(remove){
			//remove it
		} else {
			if(cb && cb.call) this.beatCbs.push(cb);
		}
	},
	// client event handlers
	createUnit:function(type,coords){
		if(this.units[type]) {
			var unit = this.units[type]();
			unit.id = this.units.length;
			unit.position = coords;
			unit.type = type;
			this.units.push(unit);
			
			//
			return unit.id;
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
			}
		}
	}
};


module.exports = {
	game:Game
}