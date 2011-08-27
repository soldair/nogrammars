

var game = {
	socket:null,
	mouse_coordinates:[0,0],
	gameId:0,//your game
	clientIntervalTime:50,
	heartBeatInterval:null,
	gameState:{
		serverIntervalTime:100,
		units:{}
	},
	renderState:{
		units:{}
	},
	init : function(){
		var z = this;
		$('#viewPort').mousemove(function(e){
			z.mouse_coordinates = [e.pageX, e.pageY]
		});
		this.event_emitter(); 
		this.paper();
		//
		this.setGameId();
		//after set gameId
		this.socketInit();
	},
	cmds:{
		click: "fire",
		
	},
		
	new_unit: function(type, _id, x, y){

		if (type = 1){ //type one = saucer
			var _id = 123; 
			game[_id] = paper.set();
			  game[_id].push(
					paper.circle(xy, y, 20).attr({"fill":"purple","stroke":"yellow","stroke-width":3})
				)
		}
		/*
		if (type = 2){
			
		}
		if (type = 3){
			
		}
		*/
		// draw new object
	},
	
	destroy_unit: function(_id){
		// destroy unit
		// removed from  unit object from game 
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
	event_emitter: function(){
		var z = this,
		keys = [65,68,83,87,69,81,32,70]
		, kup = function(e){
			e.preventDefault();
			if (!_.include(keys, e.keyCode)){return false}
			var code = e.which||e.keyCode;
			z.socket.emit("event", "key", code, z.mouse_coordinates)
		}
		, click_fn = function(e){
			z.socket.emit("event", "click", z.cmds.click, z.mouse_coordinates)
		};
		$('body').bind('keyup',kup);
		$('#viewPort').bind('click',click_fn);
	},
	socketInit:function(){
		var z = this
		,socket  = this.socket = io.connect();

		socket.on('connect', function () {
			console.log('connection made',arguments);
			z.socket.emit("join",z.gameId);
		});

		socket.on('sync', function(state){
			z.gameState = state;
			console.log('WOOOO SET game state');
			//z.checkHeartBeat();
		});

		socket.on('error', function(data){
			console.log('error event emitted ',data).
			z.flashMessage(data.msg);
		});

		socket.on('joined',function(data){
			console.log('joined event emitted ',data);
			z.flashMessage(data.id+' joined the game!');
		});

		socket.on('abandoned',function(data){
			console.log('abandoned event emitted ',data).
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
			console.log('changes! ',changes);
			
		});
	},
	checkHeartBeat:function(){
		if(!this.heartBeatInterval) this.heartBeat();
	},
	heartBeat:function(){
		//translate all property values based on 
		//(server interval/my interval)
		var z = this;
		z.heartBeatInterval = setInterval(function(){
			$.each(z.beatCbs,function(k,v){
				v(z.gameState);
				//events buffer?
			});
		},z.clientIntervalTime);
	},
	onBeat:function(cb,remove){
		if(remove) {
			//remove
		} else if(cb && cb.call){
			this.beatCbs.push(cb);
		}
	},
	paper:function(){
		//RAPHAEL INIT
		this.draw.paper = Raphael('viewPort', 5000, this.draw.winy);
		console.log(this.winy);
		this.draw.graph();
		g = this.winy/10;
	},
	setBeats:function(){
		//unit movement
	},
	draw:{
		paper:null,
		winx:window.innerWidth,
		winy:window.innerHeight,
		graph:function(){
			var paper = this.paper
			,winy = this.winy
			,winx = this.winx
			,alphaGraph = {}
			,iable = winy/25, xine = 5000/iable;
			
			for (i=0;i<xine;++i){
				paper.path("M"+iable*i+" 0L"+iable*i+" "+winy).attr({"stroke":"rgba(98,202,263,.2)"});
			}
			for (i=0;i<$('#viewPort').width()/(winy/100);++i){
				paper.path("M"+(winy/100)*i+" 0L"+(winy/100)*i+" "+winy).attr({"stroke":"rgba(98,202,263,.1)"});
			}
			for (i=0;i<25;++i){
				paper.path("M0 "+iable*i+"L"+5000+" "+iable*i).attr({"stroke":"rgba(98,202,263,.2)"});
			}
			for (i=0;i<xine;++i){
				paper.path("M0 "+(winy/100)*i+"L"+5000+" "+(winy/100)*i).attr({"stroke":"rgba(98,202,263,.1)"});
			}
		},
		energyWave:function(x,y,r,_id){
			var _id = 123
			,mb = this.linear(0,this.winy,x,y)
			,z = (mb[0]*5000) + mb[1];
			
			game[_id] = this.paper.circle(0,this.winy,r).attr({"stroke-width":0,"fill":"rrgba(138,211,242,1)-rgba(68,68,68,0)"}).animate({"cx":5000,"cy":z,"r":r*100,"opcaity":0,"fill-opacity":0},747)
		},
		drawUnit:function (x,y,_id){
			var paper = this.paper;
			
			//set to empty object just in case we want to attach different render specific data like rotation
			if(!this.renderState.units[_id]) this.renderState.units[_id] = {};
			
			var serverData = this.gameState.units[_id]
			,c1 = serverData.position
			,c2 = serverData.destination
			//uses isMoving to know when to rotate
			,isMoving = (c1[0] != c2[0] || c1[1] != c2[1])
			,renderState = this.renderState.units[_id];
			
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
					,paper.circle(x,y,14).attr({
						"fill":"r(.45,.45)rgba(112,23,18,.67):5-rgba(162,47,171,1):80-rgba(230,230,240,1)", 
						"stroke-width":0
					})
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
		linear:function (x, y,x1,y1){
			var m = (y1 - y)/x1 -x;
			var b = y - (m*x);
			return [m,b]
		}
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
	}
}
$(function(){
	game.init();
});