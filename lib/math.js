module.exports = {
	distance:function(c1,c2){
		return Math.sqrt(Math.pow(c2[0]-c1[0],2)+Math.pow(c2[1]-c1[1],2))
	},
 	moveToward:function(c1,c2,distance,constrain) {

		var c3 = [c1[0],c1[1]]
		, x = 0
		, y = 0;
		
		if(c1[0] == c2[0]) {
			y = distance;
		} else if(c1[1] == c2[1]){
			x = distance;
		} else {
			var slope = this.slope(c1,c2);
			x = distance-slope
			y = slope*x;
		}
		
		//apply direction
		if(c1[0] > c2[0]) x = -x;
		if(c1[1] > c2[1]) y = -y;
		
		c3 =[c1[0]+x,c1[1]+y];
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
		var out = (c1[1]-c2[1])/(c1[0]-c2[0]);
		if(out == Infinity || isNaN(out)) out = 0;
		return out;
	}
};