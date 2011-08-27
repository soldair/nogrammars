var winx, winy, mouse_coordinates = [];

var socket = io.connect();

 socket.on('connect', function () {
   console.log('connection made')
 });

		socket.on("moveXY", function (x, y){
			//alphaCircle[3].anim8(x,y);
			alphaCircle[1].motion(x, y)
//			console.log(x+','+y)
		});

var game = {

	init = function(){
		winx = window.innerWidth;
    winy = window.innerHeight;
		$('#viewPort').mousemove(function(e){
			mouse_coordinate = [e.pageX, e.pageY]
		});
		
	},

	cmds:{
		click: "fire",
		dbl: "move",
	},
	
	event_emitter: function(){
		var z = this
		, kup = function(e){
			var code = e.which||e.keyCode;
			socket.emit("key", code, mouse_coordinates)
		}
		, click_fn = function(e){
			socket.emit("click", z.cmds.click, mouse_coordinates)
		}
		, dbl_fn = function(e){
			socket.emit("dblClick", z.cmds.dbl, mouse_coordinates)
		};
		$('body').bind('keyup',kup);
		$('#viewPort').bind('click',click_fn);
		$('#viewPort').bind('dblclick',dbl_fn)
	}
	
	
}