var winx, winy, mouse_coordinates = [];
winx = window.innerWidth;
	winy = window.innerHeight;


//RAPHAEL INIT

paper = Raphael('viewPort', 5000, winy);
g = winy/10;
function graph(){
	alphaGraph = {}
	var iable = winy/25, xine = 5000/iable;
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
}graph()

function energyWave(x,y,r,_id){
	var _id = 123;
	game[_id] = paper.circle(0,winy,r).attr({"fill":"r(0.25, 0.75)rgba(138,211,242,1)-#ddd"}).animate({"cx":x,"cy":y,"r":r*5},333)
}

function drawUnit(x,y,_id){
var _id = 123; 
game[_id] = paper.set();
  game[_id].push(
		paper.circle(x, y, 20).attr({"fill":"purple","stroke":"yellow","stroke-width":3})
	)
}

// socket.io init

var socket = io.connect();

 socket.on('connect', function () {
   console.log('connection made')
 });

socket.on('event', function(a,b,c,r){
	console.log('event!')
	$('#msg').empty().append("event type: "+a+"<br>Command: "+b+"<br>At Coordinate: "+c[0]+","+c[1]);
	if (b = 32){
		energyWave(c[0],c[1],r)
	}
	if (a == "click"){
		drawUnit(c[0],c[1])
	}
})


var game = {

	init : function(){
		winx = window.innerWidth;
    	winy = window.innerHeight;
		$('#viewPort').mousemove(function(e){
			mouse_coordinates = [e.pageX, e.pageY]
		});
		this.event_emitter(); 
	},

	cmds:{
		click: "fire",
		
	},
	
	units: [],
	
	new_unit: function(type, _id, x, y){

		if (type = 1){
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
			socket.emit("event", "key", code, mouse_coordinates)
		}
		, click_fn = function(e){
			socket.emit("event", "click", z.cmds.click, mouse_coordinates)
		};
		$('body').bind('keyup',kup);
		$('#viewPort').bind('click',click_fn);
	}
}
$(function(){
	game.init();
});