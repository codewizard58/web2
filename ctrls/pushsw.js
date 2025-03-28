///////////////////////////////////////////////////////////
pushSw.prototype = Object.create(control.prototype);

function pushSw(bit)
{	control.call(this, bit);
	this.bit = bit;
	this.l = 0;
	this.r = 0;
	this.t = 0;
	this.b = 0;
	this.sx = 0;
	this.sy = 0;
	this.sval = 0;

	this.setBounds = function()
	{	var b = this.bit;
		var bt;

		if( b == null){
			return;
		}
		bt = b.btype & 7;	// 0 = horiz, 1 == vert

		if( bt == 0){
			this.l = b.x;
			this.r = b.x+b.w;
			this.t = b.y+(b.h/2)-10;
			this.b = this.t+20;
		}else {
			this.l = b.x+(b.w/2)-10;
			this.r = this.l+20;
			this.t = b.y;
			this.b = b.y+b.h;
		}
	}

	this.Draw = function( )
	{	var b = this.bit;
		var bt;
		var xval = b.value;		// 0 - 255

		if( b == null){
			return;
		}
		bt = b.btype & 7;	// 0 = horiz, 1 == vert
//		message("Draw slider "+ xval);

        ctx.fillStyle = "#ffffff";
		if( bt == 0){
			xval = Math.floor( (xval * (b.w-10))/ 255);
	        ctx.fillRect(b.x,  b.y+(b.h/2)-10, b.w, 20);
	        ctx.fillStyle = "#000000";
	        ctx.fillRect(b.x,  b.y+(b.h/2)-1, b.w, 2);
	        ctx.fillRect(b.x+xval,  b.y+(b.h/2)-15, 10, 30);
		}else {
			xval = Math.floor( (xval * (b.h-10))/ 255);
	        ctx.fillRect(b.x+(b.w/2)-10, b.y, 20, b.h);
	        ctx.fillStyle = "#000000";
	        ctx.fillRect(b.x+(b.w/2)-1, b.y, 2, b.h);
	        ctx.fillRect(b.x+(b.w/2)-15, b.y+b.h-xval-10, 30, 10);	// 255 at top..
		}
	}

	this.HitTest = function(x, y)
	{	var res = null;
		var i;
		var b = this.bit;
		var bt;

		if( b == null){
			return;
		}
		bt = b.btype & 7;	// 0 = horiz, 1 == vert
		this.setBounds();
		
		if( x >= this.l && x <= this.r &&
		    y >= this.t && y <= this.b){
			res = this;
		}
		return res;
	}

	this.getData = function()
	{
	}

	this.setData = function()
	{
	}



	this.onMove = function()
	{
	}

// pushSw
	this.startMove = function()
	{	var b = this.bit;
		var bt;

		if( b == null){
			return;
		}
		b.value = 255;
	}

// pushSw
	this.stopMove = function()
	{
		this.bit.value = 0;
		selected = this.bit;
		curctrl = null;			// stop tracking
	}

// pushSw
	this.doSave = function()
	{	var msg = "2,";
		var b = this.bit;

		msg += b.value+",";

		return msg;
	}
		
// pushSw
	this.doLoad = function(initdata,  idx)
	{	var i = initdata[idx];
		var b = this.bit;

		if( i == 2){
			b.value = initdata[idx+1];
		}
	}		
		
	this.dock = function(from)
	{
		debugmsg("Connect "+from.name+" to switch");
	}

	// control
	// from is a bit
	this.undock = function(from)
	{
		debugmsg("Disconnect "+from.name+" from switch");
	}
		
}

