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
	for (i=0;i<$('#console').width()/(winy/100);++i){
		paper.path("M"+(winy/100)*i+" 0L"+(winy/100)*i+" "+winy).attr({"stroke":"rgba(98,202,263,.1)"});
	}
	for (i=0;i<25;++i){
		paper.path("M0 "+iable*i+"L"+5000+" "+iable*i).attr({"stroke":"rgba(98,202,263,.2)"});
	}
	for (i=0;i<100;++i){
		paper.path("M0 "+(winy/100)*i+"L"+5000+" "+(winy/100)*i).attr({"stroke":"rgba(98,202,263,.1)"});
	}
}graph()

// socket.io init

var socket = io.connect();

 socket.on('connect', function () {
   console.log('connection made')
 });

socket.on('event', function(a,b,c){
	console.log('event!')
	$('#msg').empty().append("event type: "+a+"<br>Command: "+b+"<br>At Coordinate: "+c[0]+","+c[1]);
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
		dbl: "move",
	},
	
	event_emitter: function(){
		var z = this
		, kup = function(e){
			var code = e.which||e.keyCode;
			socket.emit("event", "key", code, mouse_coordinates)
		}
		, click_fn = function(e){
			socket.emit("event", "click", z.cmds.click, mouse_coordinates)
		}
		, dbl_fn = function(e){
			socket.emit("event", "dblClick", z.cmds.dbl, mouse_coordinates)
		};
		$('body').bind('keyup',kup);
		$('#viewPort').bind('click',click_fn);
		$('#viewPort').bind('dblclick',dbl_fn)
	}
}
$(function(){
	game.init();
});