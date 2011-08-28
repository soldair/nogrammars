var game;
if(!window.console) window.console = {log:function(){}};

(function(){
// bad gloabls place
var winx=window.innerWidth
,winy=window.innerHeight
,w = $('#viewPort').width()
,h = $('#viewPort').height()
,vp =  $('#viewPort')
,vpleft = parseInt(vp.css("left"))
,vptop = parseInt(vp.css("top"))
,cx = (winx-w)/2
,cy = (winy-h)/2
,rx = w/winx
,ry = h/(winy);
//if they are in here i will keep them

	
//_game as the local refrence to the main object
var _game;
_game = game = {
	socket:null,
	mouse_coordinates:[0,0],
	gameId:0,//your game
	beatCbs:[],
	clientIntervalTime:50,
	heartBeatInterval:null,
	viewPort:null,
	gameState:{
		serverIntervalTime:100,
		units:{}
	},
	renderState:{
		units:{},
		objects:{}
	},
	init : function(){
		var z = this;
		z.viewPort = $('#viewPort').mousemove(function(e){
			z.mouse_coordinates = [e.clientX, e.clientY]
		});
		this.event_emitter();
		//set loader until server reports game state
		this.loading(true);
		this.setGameId();

		//after set gameId
		this.socketInit();
	},
	cmds:{
		click: "fire",
	},
	my_energy: 66, // it is 5:17 am after all
	fluxCapacity:{
		get:0, 
		set : function(x){
			var y = x;
			if (x > 100){
				y = 100
			}; 
			if (x < 0){
				y = 0
			}; 
			_game.draw.myFluxCapacitor(y); this.get = y
		}
	},
	setGameId:function(){
		var p = window.location.pathname;
		if(p.indexOf('/game/') == 0) {
			var id = p.split('/').pop();
			if(id && /^\d+$/.test(id)) {
				this.gameId = id;
			}
		}
	},
 	scout: {
		get: 0,
		set: function(){
		if (!this.get){$('#console').unbind('mousemove');return}
		var w = $('#viewPort').width();
		var h = $('#viewPort').height();
		var vp =  $('#viewPort');
		var vpleft = parseInt(vp.css("left"));
		var vptop = parseInt(vp.css("top"));
		var cx = (winx-w)/2;
		var cy = (winy-h)/2;
		var rx = w/winx;
		var ry = h/(winy)
		$("#console").mousemove(function(e){
			var x = e.screenX;
			var y = e.screenY;
			var xzoom = -(x/winx)*(w)+w/2;
			var yzoom = -(y/winy)*(h)+h/2;
			console.log(w);
				vp.css({
				left : xzoom, top: yzoom});
		});
	}},
	event_emitter: function(){
		var z = this,
		keys = [65,68,83,87,69,81,32,70,48,49,50,51,52,53,54,55,56,57]
		, kup = function(e){
					console.log(e.keyCode);
			e.preventDefault()
			if(e.keyCode == 68){toggleValue(game.scout);game.scout.set()}
			if (!_.include(keys, e.keyCode)){return false}
			if (e.keyCode > 48 && e.keyCode < 58){game.fluxCapacity.set((e.keyCode-48)*10);return}
			if (e.keyCode == 48){game.fluxCapacity.set(100);return}
			var code = e.which||e.keyCode;
			z.socket.emit("event", "key", code, z.mouse_coordinates);
		}
		, click_fn = function(e){
			var xcoord = e.clientX - parseInt((vp.css("left"));
			var ycoord = e.clientY - parseInt(vp.css("top"));
			z.socket.emit("event", "click", z.cmds.click, [xcoord,ycoord]);
			//$('#viewPort').css({left: parseInt(vp.css("left"))-(z.mouse_coordinates[0]-winx/2), top: parseInt(vp.css("top"))+(z.mouse_coordinates[1]-winy/2)})
		}
		, getDelta = function(e){
			var evt=window.event || e;
			var delta=evt.detail? evt.detail*(-120) : evt.wheelDelta
			$('#msg').empty().append("DELTA = "+delta);
			if (delta > 0){
				game.fluxCapacity.set(game.fluxCapacity.get+5);
			}
			if (delta < 0){
				game.fluxCapacity.set(game.fluxCapacity.get-5);
			}
		}
		$(document).bind('keyup',kup);
		$('#console').bind('click',click_fn);
		var mousewheelevt=(/Firefox/i.test(navigator.userAgent))? "DOMMouseScroll" : "mousewheel"
		document.addEventListener(mousewheelevt, getDelta, false)
	},
	socketInit:function(){
		var z = this
		,socket  = this.socket = io.connect();

		socket.on('connect', function () {
			console.log('connection made',arguments);
			var iosid = (z.parseCookies()||{})['io.sid']||false;
			z.socket.emit("join",{game:z.gameId,sid:iosid});
		});

		//server reports game state here
		socket.on('sync', function(state){
			z.gameState = state;
			z.paper();

			z.loading(false);
			z.setBeats();
			z.checkHeartBeat();
		});

		socket.on('error', function(data){
			console.log('error event emitted ',data).
			z.flashMessage(data.msg);
		});

		socket.on('joined',function(data){
			console.log('joined event emitted ',data);
			z.flashMessage(data.id+' '+(data.reconnected?'reconnected to':'joined')+' the game!');
		});

		socket.on('abandoned',function(data){
			//console.log('abandoned event emitted ',data).
			z.flashMessage(data.id+' abandoned the game!');
		});
		
		socket.on('event', function(a,b,c,r){
			
			console.log('event!',a,b,c,r);
			/*

			$('#msg').empty().append("event type: "+a+"<br>Command: "+b+"<br>At Coordinate: "+c[0]+","+c[1]);
			if (b = 32){
				z.draw.energyWave(c[0],c[1],r)
			}
			if (a == "click"){
				z.draw.drawUnit(c[0],c[1])
			}
			*/
		});
		
		socket.on('changes',function(changes){
			$.each(changes,function(k,unit){
				z.gameState.units[unit.id] = unit;
			});
		});
		
		socket.on('delete',function(deletes){
			$.each(deletes,function(k,data){
				if(data.type == 'unit'){
					if(z.gameState.units[data.id]){
						z.deleteRenderedUnit(z.gameState.units[data.id]);
						delete z.gameState.units[data.id];
					}
				} else if(z.gameState.objects[data.id]){
					z.deleteRenderedObject(z.gameState.units[data.id]);
					delete z.gameState.objects[data.id];
				}
			});
		});
	},
	checkHeartBeat:function(){
		if(this.heartBeatInterval === null) this.heartBeat();
	},
	heartBeat:function(){
		//translate all property values based on 
		//(server interval/my interval)
		var z = this;
		z.heartBeatInterval = setInterval(function(){
			for(var i=0,j=z.beatCbs.length;i<j;i++){
				z.beatCbs[i](z.gameState);
			}
		},z.clientIntervalTime);
	},
	onBeat:function(cb,remove){
		if(remove) {
			//remove
		} else if(cb && cb.call){
			this.beatCbs.push(cb);
		}
	},
	paperInit:0,
	paper:function(){
		if(this.paperInit) return;
		this.paperInit = 1;

		this.draw.bootPaper();
		
		this.draw.graph();
		//g = this.winy/10;
		
		this.draw.yellowBase(300,300,200,200);
		this.draw.purpleBase(600,300,200,200);
		this.draw.myEnergyMeter(66); // param  = % energy
		//this.fluxCapacity.set(40); // probably not a percentage of energy, but a unit value
		
	},
	setBeats:function(){
		var z = this;
		//unit movement
		this.onBeat(function(serverData){
			var translationFactor = serverData.serverIntervalTime/serverData.clientIntervalTime;
			//this will be optimzed to only loop changed.

			$.each(serverData.units,function(k,unit){
				//is rendered?
				if(!z.isUnitRendered(unit.id)){
					//TODO UPDATE THIS TO DRAW UNIT
					z.draw.drawShip(unit.position[0],unit.position[1],unit.id);

				} else if(unit.position[0] != unit.destination[0] || unit.position[1] != unit.destination[1]){
					
					//apply delta
					unit.position = z.math.moveToward(unit.position,unit.destination,math.floor(unit.speed/factor));
					z.draw.drawShip(unit.position[0],unit.position[1],unit.id);
					
				}
			});
		});
	},
	isUnitRendered:function(id){
		return (this.renderState.units[id]||{}).object;
	},
	deleteRenderedUnit:function(unit){
		if(this.renderState.units[unit.id]){
			var renderState = this.renderState.units[unit.id];
			renderState.object.remove();
		}
	},
	deleteRenderedObject:function(object){
		if(this.renderState.objects[object.id]){
			var renderState = this.renderState.objects[object.id];
			renderState.object.remove();
		}
	},
	addRenderedUnit:function(id,svgObject){
		this.renderState.units[id] = svgObject;
	},
	addRenderedObject:function(id,svgObject){
		if(!this.renderState.units[_id]) this.renderState.units[_id] = {};
		this.renderState.objects[id].object = svgObject;
	},
	//for debug
	flashMessage:function(message){
		if(!$("#flashmsg").length) {
			$("<div id='flashmsg'></div>").appendTo("body").css({position:'fixed',bottom:10,right:10,zIndex:8000});
		}
		
		var d = $("<div>").appendTo("#flashmsg").css({
			backgroundColor:"#fff"
			,borderRadius:"5px"
			,padding:"4px"
			,marginBottom:"4px"
		}).text(message);
		
		setTimeout(function(){
			d.fadeOut(1000,function(){
				$(this).remove();
				if(!$("#flashmsg div").length) {
					$("#flashmsg").remove();
				}
			});
		},10000);
	},
	loading:function(on){
		if(on && !$("#loading").length) {
			$("<div>").attr('id','loading').css({
				position:'fixed'
				,top:($(window).height()/2)-30
				,left:($(window).width()/2)-70
				,zIndex:7000
				,backgroundColor:"#fff"
				,borderRadius:'5px'
				,paddingRight:'8px'
				,paddingLeft:'8px'
			}).html("<h1>LOADING</h1>").appendTo("body");
		} else {
			$("#loading").remove();
		}
	},
	parseCookies:function(){
		var c = document.cookie
		,chunks = c.split(";")
		,chunks = chunks.map(function(v){return v.trim?v.trim():v.replace(/^\s+|\s+$/g,'')})
		,kv=[];
		$.each(chunks,function(i,data){
			var p = data.split('=');
			kv[p.shift()] = decodeURIComponent(p.shift());
		});
		return kv;
	}
};

_game.math = {
	moveToward:function(c1,c2,distance,constrain) {

		var slope = this.slope(c1,c2)
		,x = distance-slope
		,y = slope*x;
		
		//apply direction
		if(c1[0] > c2[0]) x = -x;
		if(c1[1] > c2[1]) y = -y;
		
		var c3 =[c1[0]+x,c1[1]+y];
		
		if(constrain !== false){
			//stop movement at desired location
			if(x > 0){//moving right
				if(c3[0]>c2[0]) c3[0] = c2[0];
			} else {//moving left
				if(c3[0]<c2[0]) c3[0] = c2[0];
			}
			if(y > 0){//up
				if(c3[1]>c2[1]) c3[1] = c2[1];
			} else {//down
				if(c3[1]<c2[1]) c3[1] = c2[1];
			}
		}
		return c3;
	},
	slope:function(c1,c2){
		return (c1[1]-c2[1])/(c1[0]-c2[0]);
	}
};


_game.draw = {
	paper:null,
	commander:null,
	winx:window.innerWidth,
	winy:window.innerHeight,
	bootPaper:function(viewport){
		viewport = viewport||'viewPort';
		
		var width = 4000,height = 2500;
		
		if(_game.gameState && _game.gameState.world) {
			width = _game.gameState.world.width || 5000;
			height = _game.gameState.world.height || this.winy;
		}

		//RAPHAEL INIT
		Raphael.fn.flag = function (x, y, r, hue) {
			hue = hue || 0;
			return this.set(
				this.ellipse(x - r / 2, y + r - r / 2, r, r).attr({fill: "rhsb(" + hue + ", 1, .25)-hsb(" + hue + ", 1, .25)", stroke: "none", opacity: 0}),
				this.ellipse(x, y, r, r).attr({fill: "rhsb(" + hue + ", 1, .75)-hsb(" + hue + ", .5, .25)", stroke: "none"}),
				this.ellipse(x, y, r, r).attr({stroke: "none", fill: "r#ccc-#ccc", opacity: 0})
			);
		};
		this.paper = Raphael('viewPort', width, height);
		this.commander = Raphael('console', this.winx, this.winy);
		
	},
	graph:function(){
		
		var paper = this.paper
		,winy = this.winy
		,winx = this.winx
		,alphaGraph = {}
		var w = $('#viewPort').width();
		var h = $('#viewPort').height();
		var vp =  $('#viewPort');
		var cx = (winx-w)/2;
		var cy = (winy-h)/2;
		var rx = w/winx;
		var ry = h/(winy)

		
		for (i=0; i < w; i+=10){
			paper.path("M"+i+" 0L"+i+" "+h).attr({"stroke":"rgba(252,244,6,.1)"});
		}
		for (i=0; i < w; i+=10){
			paper.path("M0 "+i+"L"+w+" "+i).attr({"stroke":"rgba(252,244,6,.1)"});
		}
		for (i=0; i < w; i+=50){
				//paper.circle(2500,1000,i).attr({"fill":"transparent", stroke:"rgba(252,244,6,.1)", "stroke-width":1});
			paper.path("M"+i+" 0L"+i+" "+h).attr({"stroke":"rgba(252,244,6,.1)"});
		}
		for (i=0; i < w; i+=50){
			paper.path("M0 "+i+"L"+w+" "+i).attr({"stroke":"rgba(252,244,6,.1)"});
		}
		$('#viewPort').css({left: cx+'px', top: cy+'px'})
		//paper.circle(2500,1000,2400).attr({"fill":"transparent", "stroke-width":10});
		//vp.css({left:-1500,top:cy});			
	},
	energyWave:function(x,y,r,_id){
		var _id = 123
		,mb = this.linear(0,this.winy,x,y)
		,z = (mb[0]*5000) + mb[1];
		
		game[_id] = this.paper.circle(0,this.winy,r).attr({"stroke-width":0,"fill":"rrgba(138,211,242,1)-rgba(68,68,68,0)"}).animate({"cx":5000,"cy":z,"r":r*100,"opcaity":0,"fill-opacity":0},747)
	},
	drawUnit:function (x,y,_id,team, shield,eRad,isFire){ //eRad is charge radius 
		if (team == "purple"){ var tcolor = "purple", fcolor =.66}
		if (team == "yellow"){var tcolor = "rgba(47,208,63,.2):80", fcolor =.25}
		
		// for bullets, eRad is an interpolated radius, based on energy in the buller, used to set the radius, which should increase every step by a factor of < 1, or ? 
		

		
		if(isFire){
			this.paper.circle(x,y,eRad).attr({
				"fill":"rrgba(255,255,255,.1):20-"+tcolor,"stroke-width":0
				,"fill-opacity":.5
			});return
		}
		
		var unit = this.paper.set();
		
		if (eRad){
			unit.push(this.paper.circle(x-3,y+5,40+1*eRad).attr({"fill":"rrgba(255,255,255,.1):20-"+tcolor,"stroke-width":0,"fill-opacity":1}))
		}
		//we cannot set ids like this
		//if this is an object that the game must manage this object must be set in an object that is managed
		unit.push(
			this.paper.circle(x-3,y+5,40).attr({"fill":"rrgba(0,0,0,.5):50-rgba(0,0,0,.1)","stroke-width":0}),
			this.paper.circle(x, y, 40).attr({"fill":"rrgba(240,240,240,1):10-"+tcolor+":75-rgba(165,182,157,1)","stroke":"#333","stroke-width":1,}),
			this.paper.path("M"+(x+28)+" "+(y+28)+"L"+(x-28)+" "+(y-28)+" M"+(x-28)+" "+(y+28)+"L"+(x+28)+" "+(y-28)).attr({"stroke":"rgba(105,161,109,.5)", "stroke-width":2})
			//paper.circle(x,y,14).attr({"fill":"r(.45,.45)rgba(112,23,18,.67):5-rgba(162,47,171,1):80-rgba(230,230,240,1)", "stroke-width":0})
		);
		
		if (shield){
			unit.push(this.paper.circle(x,y,40+1*shield).attr({"fill":"rrgba(255,255,255,.1):20-"+tcolor,"stroke-width":0,"fill-opacity":.1}))
		}
		
		unit.push(this.paper.flag(x,y,10,fcolor))
		
		//ensure the game can manage this unit
		_game.addRenderedUnit(_id,unit);
		
		//no more intervals for things being drawn in the view port
		//if (eRad) {setInterval(function(){e[_id].rotate(15)},30);} // spinning is the new tower
	},
	drawShip:function (x,y,_id){
		//set to empty object just in case we want to attach different render specific data like rotation
		if(!_game.renderState.units[_id]) _game.renderState.units[_id] = {};
		
		var serverData = _game.gameState.units[_id]
		,paper = this.paper
		,c1 = serverData.position
		,c2 = serverData.destination
		//uses isMoving to know when to rotate
		,isMoving = (c1[0] != c2[0] || c1[1] != c2[1])
		,renderState = _game.renderState.units[_id];
		
		if(!renderState.object){
			renderState.object = paper.set();
			renderState.object.push(
				paper.circle(x-3,y+5,40).attr({
					"fill":"rrgba(0,0,0,.5):50-rgba(0,0,0,.1)",
					"stroke-width":0
				})
				, paper.circle(x, y, 40).attr({
					"fill":"rrgba(240,240,240,1):10-rgba(47,208,63,1):75-rgba(165,182,157,1)",
					"stroke":"yellow",
					"stroke-width":1
				})
				, paper.path("M"+(x+28)+" "+(y+28)+"L"+(x-28)+" "+(y-28)+" M"+(x-28)+" "+(y+28)+"L"+(x+28)+" "+(y-28)).attr({
					"stroke":"rgba(105,161,109,.5)",
					"stroke-width":2
				})
				, paper.flag(x,y,8,.66)
			);
			renderState.position = c1;
			renderState.rotate = 0;
		} else {
			// apply movement translated from last rendered position to current
			renderState.object.translate(renderState.position[0]-c1[0],renderState.position[1]-c1[2]);
		}
		
		if(isMoving){
			renderState.rotate += 10;
			if(renderState.rotate > 360){
				renderState.rotate -= 360;
			}
			renderState.object.rotate(renderState.rotate);
		}
	},
	yellowBase : function(x,y,h,w){
			for (i=0;i<8;++i){
				game.yellowBase = this.paper.rect(x+(10*i),y+(10*i),h-(20*i),w-(20*i)).attr({"stroke":"rgba(47,208,63,1)", fill: "#444","stroke.width":"3px"})
			}
			game.draw.yellowFlag(x,y,h,w);
	},
	yellowFlag: function(x,y,h,w){
		game.yellowFlag = this.paper.flag(x+100,y+100,14,.25)
	},
	purpleBase : function(x,y,h,w){
			for (i=0;i<8;++i){
			game.purpleBase = this.paper.rect(x+(10*i),y+(10*i),h-(20*i),w-(20*i)).attr({"stroke":"purple", fill: "#444","stroke.width":"3px"})
			}
			game.draw.purpleFlag(x,y,h,w);
	},
	purpleFlag: function (x,y,h,w){game.purpleFlag = this.paper.flag(x+100,y+100,14,.66);},
	myEnergyMeter: function(x){
		var color;
		if (x < 25) color = "red";
		if (x > 49 && x < 75) color = "orange";
		if (x > 24 && x < 50) color = "yellow";
		if (x > 74) color = "green";
		this.commander.rect(10,10,30,700>this.winy?this.winy-10:700,5).attr({"stroke":"#f9f9f9", "stroke-width":3, "fill":"90-"+color+":"+x+"-#111:"+x});
	},
	myFluxCapacitor: function(x){
		color: "rgba(6,252,30,1)"
		var flux = this.commander.set();
		flux.push(
			this.commander.rect(55,10,300,30,15).attr({"stroke":"#f9f9f9", "stroke-width":3, "fill":"360-rgba(30,245,245,.68):"+x+"-#111:"+x}),
			this.commander.text(180,25,"FLUX CAPACITY: SCROLL WHEEL OR NUM KEYS").attr({stroke:"#111"})
		);
	},
	linear:function (x, y,x1,y1){
		var m = (y1 - y)/x1 -x;
		var b = y - (m*x);
		return [m,b]
	}
};

//hoisted helper functions
function toggleValue(getter){
	if (!getter.get){
		getter.get = true;
		return
	}
	if (getter.get){
		getter.get = !getter.get
	}
}

}());
