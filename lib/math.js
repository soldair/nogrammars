module.exports = {
	distance:function(c1,c2){
		return Math.sqrt(Math.pow(c2[0]-c1[0],2)+Math.pow(c2[1]-c1[1],2))
	},
	moveToward:function(c1,c2,distance,constrain){
		// theta is the angle (in radians) of the direction in which to move
		var theta = Math.atan2(c2[1] - c1[1], c2[0] - c1[0])
		,deltax = distance*Math.cos(theta)
		,deltay = distance*Math.sin(theta);
		
		//new point!
		var c3 =[c1[0] + deltax,c1[1] + deltay]
		
		if(constrain !== false){
			//stop movement at desired location
			if(deltax > 0){//moving righ
				if(c3[0]>c2[0]) c3[0] = c2[0];
			} else {//moving left
				if(c3[0]<c2[0]) c3[0] = c2[0];
			}
			if(deltay > 0){//up
				if(c3[1]>c2[1]) c3[1] = c2[1];
			} else {//down
				if(c3[1]<c2[1]) c3[1] = c2[1];
			}
		}
		return c3;
	}
};