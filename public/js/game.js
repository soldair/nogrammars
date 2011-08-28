var socket = io.connect(),
winx=window.innerWidth,
winy=window.innerHeight;
 socket.on('connect', function () {
   console.log('connection made')
 });
function toggleValue(getter){
	if (!getter){
		getter = true;
		return
	}
	if (getter){
		getter = !getter
	}
}
var game = {
	socket:null,
	mouse_coordinates:[0,0],
	gameId:0,//your game
	gameState:{
		units:[]
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
		this.draw.yellowBase(300,300,200,200);
		this.draw.purpleBase(600,300,200,200);
		this.draw.myEnergyMeter(88); // param  = % energy
		this.fluxCapacity.set(80); // probably not a percentage of energy, but a unit value
	},
	cmds:{
		click: "fire",
		
	},
	my_energy: 88, // it is 5:17 am after all
	fluxCapacity:{get:0, set : function(x){var y = x; if (x > 100){y = 100}; if (x < 0){y = 0}; game.draw.myFluxCapacitor(y); this.get = y}},
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
			var x = e.pageX;
			var y = e.pageY;
				vp.css({
				left : x*(1 - rx)});
				vp.css({
				top  : y*(1 - ry)});
			});
	}},
	event_emitter: function(){
		var z = this,
		keys = [65,68,83,87,69,81,32,70,48,49,50,51,52,53,54,55,56,57]
		, kup = function(e){
					console.log(e.keyCode);
			e.preventDefault()
			if(e.keyCode == 68){toggleValue(game.scout.get);game.scout.set()}
			if (!_.include(keys, e.keyCode)){return false}
			if (e.keyCode > 48 && e.keyCode < 58){game.fluxCapacity.set((e.keyCode-48)*10);return}
			if (e.keyCode == 48){game.fluxCapacity.set(100);return}
			var code = e.which||e.keyCode;
			z.socket.emit("event", "key", code, z.mouse_coordinates);
		}
		, click_fn = function(e){
			console.log(e)
			z.socket.emit("event", "click", z.cmds.click, z.mouse_coordinates)
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
		$(document).bind('keypress',kup);
		$(document).bind('click',click_fn);
		var mousewheelevt=(/Firefox/i.test(navigator.userAgent))? "DOMMouseScroll" : "mousewheel"
		document.addEventListener(mousewheelevt, getDelta, false)
	},
	socketInit:function(){
		var z = this
		,socket  = this.socket = io.connect();

		socket.on('connect', function () {
			console.log('connection made');
		});

		socket.on('event', function(a,b,c,r){
			$('#msg').empty().append("event type: "+a+"<br>Command: "+b+"<br>At Coordinate: "+c[0]+","+c[1]);
			if (b = 32){
				z.draw.energyWave(c[0],c[1],r)
			}
			if (a == "click"){
				z.draw.drawUnit(c[0],c[1])
			}
		});
	},
	paper:function(){
		//RAPHAEL INIT
		Raphael.fn.flag = function (x, y, r, hue) {
		            hue = hue || 0;
		            return this.set(
		                this.ellipse(x - r / 2, y + r - r / 2, r, r).attr({fill: "rhsb(" + hue + ", 1, .25)-hsb(" + hue + ", 1, .25)", stroke: "none", opacity: 0}),
		                this.ellipse(x, y, r, r).attr({fill: "rhsb(" + hue + ", 1, .75)-hsb(" + hue + ", .5, .25)", stroke: "none"}),
		                this.ellipse(x, y, r, r).attr({stroke: "none", fill: "r#ccc-#ccc", opacity: 0})
		            );
		        };
		this.draw.paper = Raphael('viewPort', 5000, 5000);
		this.draw.graph();
		this.draw.commander = Raphael('console',winx,winy );
		
	},
	draw:{
		commander:null,
		paper:null,
		winx:window.innerWidth,
		winy:window.innerHeight,
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
				paper.path("M"+i+" 0L"+i+" "+h).attr({"stroke":"rgba(252,244,6,.1)"});
			}
			for (i=0; i < w; i+=50){
				paper.path("M0 "+i+"L"+w+" "+i).attr({"stroke":"rgba(252,244,6,.1)"});
			}
			
			paper.circle(2500,2500,2400).attr({"fill":"transparent", "stroke-width":300});
			vp.css({left:-1500,top:cy});			
		},
		energyWave:function(x,y,r,_id){
			var _id = 123
			,mb = this.linear(0,this.winy,x,y)
			,z = (mb[0]*5000) + mb[1];
			
			game[_id] = this.paper.circle(0,this.winy,r).attr({"stroke-width":0,"fill":"rrgba(138,211,242,1)-rgba(68,68,68,0)"}).animate({"cx":5000,"cy":z,"r":r*100,"opcaity":0,"fill-opacity":0},747)
		},
		drawUnit:function (x,y,_id){
			var paper = this.paper;
			var _id = "aeiou"; 
			game[_id] = paper.set();
			game[_id].push(
				paper.circle(x-3,y+5,40).attr({"fill":"rrgba(0,0,0,.5):50-rgba(0,0,0,.1)","stroke-width":0}),
				paper.circle(x, y, 40).attr({"fill":"rrgba(240,240,240,1):10-rgba(47,208,63,1):75-rgba(165,182,157,1)","stroke":"yellow","stroke-width":1,}),
				paper.path("M"+(x+28)+" "+(y+28)+"L"+(x-28)+" "+(y-28)+" M"+(x-28)+" "+(y+28)+"L"+(x+28)+" "+(y-28)).attr({"stroke":"rgba(105,161,109,.5)", "stroke-width":2}),
				//paper.circle(x,y,14).attr({"fill":"r(.45,.45)rgba(112,23,18,.67):5-rgba(162,47,171,1):80-rgba(230,230,240,1)", "stroke-width":0})
				this.paper.flag(x,y,10,.25)
			);
			setInterval(function(){game[_id].rotate(15)},30	); // for later
			//setInterval(function(){game[_id].translate(3,3)},33)
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
			this.commander.rect(10,10,30,700,5).attr({"stroke":"#f9f9f9", "stroke-width":3, "fill":"90-"+color+":"+x+"-#111:"+x});
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
	}
}
$(function(){
	game.init();
});
