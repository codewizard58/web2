// kits/kit media.js
//

const xrStuff = {};


kit_media.prototype = Object.create(sbmodule.prototype);

function kit_media()
{	
	sbmodule.call(this, "Media");
	// image name w h snap-l snap-r snap-t snap-b  code ctrl title desc domains group ? ?

	this.bitnames = [
		"poweron", "power_on", 50, 50,		null, "powerout", null, null,			// 0
				0,	0, "Power On",		"Start a chain of SoftBits", 0x0010, "Power", 0, 1,	// 0
		"poweroff", "power_off", 50, 50,	"powerin", null, null, null,			// 1
				2,	0, "Power Off",		"End of a chain, optional.", 0x0001, "Power", 0, 1,	// 1
        "control", "headset", 100, 50,	"actionin", null ,null,  null,		// 0
				HEADSET,	1, "Headset",	"Virtual Reality",	 0x001, "Action", 0, 1,	// 0
		"control", "harp", 100, 100,	"actionin", "actionout" ,null,  null,		// 0
				HARP,	2, "Harp",	"Laser Harp",	 0x011, "Input", 0, 1,	// 0
		
        null, null, null, null,				null, null, null, null
    ];

    // name, folder:2,mode:2
	// 
	this.bitimagemap = [
		null, null
	];

	this.ctrltab = [
    	null, 0, 0, 0, 0	// end of table
	];

	// defines the op codes for the program. softbitslivs:execProgram
	this.kitctrlcodes = [
		"power_on", 0,
		null, 254
	];


	this.addCtrl = function( bit)
	{	let i=0;
		let ct = null;
		let name = this.bitnames[ bit.btype+1];
		let ctrl = this.bitnames[ bit.btype+9];
		let f;

        // found control
		if( ctrl == 1){		// headset
			mediaData = bit;
			if( mediaFunc != null){
				mediaFunc(1);
			}

			return null;
		}else if( ctrl == 2){
			ct = new harp(bit);
			bit.ctrl = ct;
			ct.setData();
			return ct;
        }

        return null;
    }

    this.selected = function()
	{	let msg = "";
		f = document.getElementById("xrcontrols");
		if( f != null){
		  f.style.display="block";
		}

	}

	this.print = function()
	{	let i;
		let md;

        debugmsg("Kit_Media");

	}



    this.getdomain = function()
	{
		return 1;		// basic domain is available
	}


}


// XR helper routines
// these are in global scope
//
var mediaData = null;
var mediaFunc = null;
let selecting = 0;

function setSelecting(s)
{
	selecting = s;
}

function isSelecting()
{
	return selecting;
}

function mediaGetBit()
{	
	return mediaData;
}

function mediaSetBit(ctrl)
{
	mediaData.ctrl = ctrl;
	ctrl.setData();
}

function UImedia(mode)
{
	if( mediaFunc == null){
		return;
	}
	mediaFunc(mode);
}

function mediaSetFunc(func)
{
	debugmsg("mediaSetFunc");
	mediaFunc = func;
}


addkit( new kit_media() );

new postkitload("Media");

