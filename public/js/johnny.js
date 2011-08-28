Raphael.fn.flag = function (x, y, r, hue) {
            hue = hue || 0;
            return this.set(
                this.ellipse(x - r / 2, y + r - r / 2, r, r).attr({fill: "rhsb(" + hue + ", .11, .25)-hsb(" + hue + ", 1, .25)", stroke: "none", opacity: 0}),
                this.ellipse(x, y, r, r).attr({fill: "rhsb(" + hue + ", .11, .75)-hsb(" + hue + ", .5, .25)", stroke: "none"}),
                this.ellipse(x, y, r, r).attr({stroke: "none", fill: "r#ccc-#ccc", opacity: 0})
            );
        };
var getter = false;
function t(){
	if (!getter){
		getter = true;
		return "+"
	}
	if (getter){
		getter = !getter
		return "-"
	}
}

var winx=window.innerWidth,
winy=window.innerHeight,
commander = Raphael("command", winx, winy);
var bod = commander.set(),
	bg = commander.rect(0,0,winx, winy).attr({fill:"rgba(0,0,0,0)"});
function graph(){
	var w = $('#command').width();
	var h = $('#command').height();
	var vp =  $('#command');
	var cx = (winx-w)/2;
	var cy = (winy-h)/2;
	var rx = w/winx;
	var ry = h/(winy)
	var x = 1;
	for (i=0; i < w; i+=10){
		commander.path("M"+i+" 0L"+i+" "+h).attr({"stroke":"rgba(252,244,6,.1)"})
	}
	for (i=0; i < w; i+=10){
		commander.path("M0 "+i+"L"+w+" "+i).attr({"stroke":"rgba(252,244,6,.1)"});
	}
	for (i=0; i < w; i+=50){
		commander.circle(winx/2,winy/2,i).attr({"stroke":"rgba(252,244,6,.1)"});
		commander.path("M"+i+" 0L"+i+" "+h).attr({"stroke":"rgba(252,244,6,.1)"});
	}
	for (i=0; i < w; i+=50){
		commander.path("M0 "+i+"L"+w+" "+i).attr({"stroke":"rgba(252,244,6,.1)"});
	}	
}graph()
	/*	$(document).mousemove(function(e){
			var x = parseInt(e.pageX)
			, y = parseInt(e.pageY);
			commander.flag(x+parseFloat(t()+Math.random().toString())*20,y+parseFloat(t()+Math.random().toString())*20,20,1).animate({cx:winx/2,cy:winy/2},200)
		})
	*/
var e = {
	drawUnit:function (x,y,_id,team, shield,eRad){
		if (team == "purple"){ var tcolor = "purple", fcolor =.66}
		if (team == "yellow"){var tcolor = "rgba(47,208,63,.2):80", fcolor =.25}
	e[_id] = commander.set();
		e[_id].push(
			commander.circle(x-3,y+5,40).attr({"fill":"rrgba(0,0,0,.5):50-rgba(0,0,0,.1)","stroke-width":0}),
			commander.circle(x, y, 40).attr({"fill":"rrgba(240,240,240,1):10-"+tcolor+":75-rgba(165,182,157,1)","stroke":"#333","stroke-width":1,}),
			commander.path("M"+(x+28)+" "+(y+28)+"L"+(x-28)+" "+(y-28)+" M"+(x-28)+" "+(y+28)+"L"+(x+28)+" "+(y-28)).attr({"stroke":"rgba(105,161,109,.5)", "stroke-width":2})
			//paper.circle(x,y,14).attr({"fill":"r(.45,.45)rgba(112,23,18,.67):5-rgba(162,47,171,1):80-rgba(230,230,240,1)", "stroke-width":0})
		);
		if (shield){e[_id].push(commander.circle(x-3,y+5,40+1*shield).attr({"fill":"rrgba(255,255,255,.1):20-"+tcolor,"stroke-width":0,"fill-opacity":.1}))}

		setInterval(function(){e[_id].rotate(60)},100);
	},
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
	},
	event_emitter: function(){
		var z = this
		, click_fn = function(e){
			console.log(e)
			z.socket.emit("event", "click", z.cmds.click, z.mouse_coordinates)
		}
		, getDelta = function(e){
			var evt=window.event || e;
			var delta=evt.detail? evt.detail*(-120) : evt.wheelDelta
			if (delta > 0){
				
			}
			if (delta < 0){
				
			}
		}
		$(document).bind('click',click_fn);
		var mousewheelevt=(/Firefox/i.test(navigator.userAgent))? "DOMMouseScroll" : "mousewheel"
		document.addEventListener(mousewheelevt, getDelta, false)
	},
} 
e.drawUnit(100,100,"tl", "yellow");
e.drawUnit(winx-100,100,"tr", "purple");
e.drawUnit(100,winy-100,"bl", "purple");
e.drawUnit(winx-100,winy-100,"br", "yellow");

var finito = [[]];

var fPath = commander.path("M100 100 "+(winx-100)+" 100 "+(winx-100)+" "+(winy-100)+" 100 "+(winy-100)+"z").attr({stroke:"transparent"})

commander.text(100,100,"F")
commander.print(100, 100, "Test string", commander.getFont("Times", 800), 30);

