

var game = {
	socket:null,
	mouse_coordinates:[0,0],
	init : function(){
		var z = this;
		$('#viewPort').mousemove(function(e){
			z.mouse_coordinates = [e.pageX, e.pageY]
		});
		this.socketInit();
		this.event_emitter(); 
		this.paper();
	},
	cmds:{
		click: "fire",
		
	},
	
	units: [],
	
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
		// push object to units
	},
	
	destroy_unit: function(_id){
		// destroy unit
		// removed from  units array 
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
			console.log('connection made')
		});

		socket.on('event', function(a,b,c,r){
			console.log('event!',a,b,c,r);
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
		this.draw.paper = Raphael('viewPort', 5000, this.winy);
		this.draw.graph();
		g = this.winy/10;
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
			var _id = 123; 
			game[_id] = paper.set();
			game[_id].push(
				paper.circle(x, y, 20).attr({"fill":"purple","stroke":"yellow","stroke-width":3})
			)
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