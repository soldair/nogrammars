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
var mouse_coordinates=[0,0]
var winx=window.innerWidth,
winy=window.innerHeight,
commander = Raphael("command", winx, winy);
$(window).mousemove(function(e){
	mouse_coordinates = [e.pageX, e.pageY]
});
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
	//	commander.path("M"+i+" 0L"+i+" "+h).attr({"stroke":"rgba(252,244,6,.1)"});
	}
	for (i=0; i < w; i+=50){
	//	commander.path("M0 "+i+"L"+w+" "+i).attr({"stroke":"rgba(252,244,6,.1)"});
	}	
}graph()
	/*	$(document).mousemove(function(e){
			var x = parseInt(e.pageX)
			, y = parseInt(e.pageY);
			commander.flag(x+parseFloat(t()+Math.random().toString())*20,y+parseFloat(t()+Math.random().toString())*20,20,1).animate({cx:winx/2,cy:winy/2},200)
		})
	*/
var e = {
	linear:function (x, y,x1,y1){
		var m = (y1 - y)/x1 -x;
		var b = y - (m*x);
		return [m,b]
	},
	energyWave:function(x,y,r,team){
		if (team == "purple"){ var tcolor = "purple"}
		if (team == "yellow"){var tcolor = "rgba(47,208,63,.2):80"}
		var mb = this.linear(0,winy,x,y)
		,z = (mb[0]*5000) + mb[1];
		commander.circle(0,winy,r).attr({fill:"r#333-"+tcolor+"-#333","stroke-width":0, "fill-opacity":.1}).animate({"cx":5000,"cy":z,"r":r*100,"opcaity":0,"fill-opacity":0},3000)
	},
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
	slope:function(c1,c2){
		return (c1[1]-c2[1])/(c1[0]-c2[0]);
	},
	event_emitter: function(){
		var z = this
		, click_fn = function(ev){
			console.log(ev);
			z.energyWave(mouse_coordinates[0],mouse_coordinates[1],3, "purple");
		}
		$('#command').bind('click',click_fn);
	}
}; e.event_emitter();
e.drawUnit(100,100,"tl", "yellow");
e.drawUnit(winx-100,100,"tr", "purple");
e.drawUnit(100,winy-100,"bl", "purple");
e.drawUnit(winx-100,winy-100,"br", "yellow");

var finito = [[]];

//var fPath = commander.path("M100 100 "+(winx-100)+" 100 "+(winx-100)+" "+(winy-100)+" 100 "+(winy-100)+"z").attr({stroke:"transparent"})
commander.text(winx/2,winy/2.8,"FINITO").attr({"font-size":133, fill:"#333", "stroke":"rgba(252,244,6,.25)", "stroke-width":5})
commander.text(winx/2,winy/2	,"~or~").attr({"font-size":30, fill:"#333", "stroke":"rgba(252,244,6,.5)", "stroke-width":1})
commander.text(winx/2,winy/1.65	,"Really Like Just The Beginning").attr({"font-size":67, fill:"#333", "stroke":"rgba(252,244,6,.25)", "stroke-width":3})
//paper.print(100, 100, "Test string", paper.getFont("Times", 800), 30);

