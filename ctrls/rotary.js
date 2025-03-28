// 10/19/24
// rotary.js

rotaryBit.prototype = Object.create(control.prototype);
function rotaryBit(bit)
{	control.call(this, bit);
	this.bit = bit;
	this.sx = 0;
	this.sy = 0;
	this.sval = 0;
	this.knobs = [25, 25];
	this.values = [0];
	this.initx = 0;
	this.inity = 0;
	this.ival = 0;
	this.selstep = 0;

	let imagename = "rotary";
	this.bitimg =this.bit.findImage(imagename);
	this.bitname = imagename;
	this.name = "Rotary";

	//rotary
	this.setValue = function(data, func)
	{	let b = this.bit;

		if( func == 2){
			b.value = checkRange(data);
			this.values[0] = b.value;
//			debugmsg("R SV "+data+" "+func);
		}
		return;

	}

	this.HitTest = function(mx, my)
	{	let ret = soundHitTest(this, mx, my);

		if( ret != null){
			this.selstep = 1;
			this.initx = mx;
			this.inity = my;
			this.ival = this.values[0];
		}
		return ret;

	}

	this.Draw = function( )
	{	const b = this.bit;

		if( b == null){
			return;
		}
		soundDraw(this, b);
	}

	this.getData = function()
	{
	}

	this.setData = function()
	{
	}

	this.onMove = function(x, y)
	{	let vx = x - this.initx;
		let vy = y - this.inity;
		let val = 0;
		let f = null;

		val = rotaryvalue(vx, vy, this.ival);
		this.setValue(val, 2);

		if( miditargeting != null){
			midiAddTarget(this, 0);
		}

		if( bitformaction != this){
			return;
		}

	}

	this.startMove = function()
	{	var b = this.bit;
		var bt;

		if( b == null){
			return;
		}
		bt = b.btype & 7;	// 0 = horiz, 1 == vert

		if( bt == 0){
			this.sval = mx - b.x-5;
		}else {
			this.sval = b.h - (my - b.y + 5);
		}

		this.sx = mx;
		this.sy = my;
	}

	this.stopMove = function()
	{
		selected = this.bit;
		curctrl = null;			// stop tracking
	}

	this.doSave = function()
	{	var msg = "2,";
		var b = this.bit;

		msg += b.value+",";

		return msg;
	}
		
	this.doLoad = function(initdata,  idx)
	{	var i = initdata[idx];
		var b = this.bit;

		if( i == 2){
			b.value = initdata[idx+1];
		}
	}		
		
}

