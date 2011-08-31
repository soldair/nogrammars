var m = require(__dirname+'/../lib/math.js')
, grid = [//10x5
 [0,1,2,3,4,5,6,7,8,9]//0
,[0,1,2,3,4,5,6,7,8,9]//1
,[0,1,2,3,4,5,6,7,8,9]//2
,[0,1,2,3,4,5,6,7,8,9]//3
,[0,1,2,3,4,5,6,7,8,9]//4
,[0,1,2,3,4,5,6,7,8,9]//5
,[0,1,2,3,4,5,6,7,8,9]//6
];
require('should');


module.exports = {
	vectorTestMoveUp:function(){

		after = m.moveToward([1,2],[4,8],4);
		(after[0]>1).should.be.true;
		(after[1]>2).should.be.true;
		(after[0]<4).should.be.true;
		(after[1]<8).should.be.true;
		
		//test up constrain
		after = m.moveToward([1,2],[4,8],30);
		after[0].should.equal(4);
		after[1].should.equal(8);
	},
	vectorTestMoveDown:function(){
		
		after = m.moveToward([4,8],[1,2],4);
		(after[0]>1).should.be.true;
		(after[1]>2).should.be.true;
		(after[0]<4).should.be.true;
		(after[1]<8).should.be.true;
		
		//test down constrain
		after = m.moveToward([4,8],[1,2],30);
		after[0].should.equal(1);
		after[1].should.equal(2);

	},
	slopeTest:function(){
		//external refrence for expected values: http://www.mathopenref.com/coordslope.html
		m.slope([1,5],[8,5]).should.equal(0);

		m.slope([8,9],[18,23]).should.equal(1.4);
	}
}