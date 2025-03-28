/////////////////////////////////////////////////////////////////////////
// kit_basic.js
// this is the basic kit of parts
//
// 1/20/25

kit_basic.prototype = Object.create(sbmodule.prototype);

function kit_basic()
{	sbmodule.call(this, "Basic");


// maps bit type to image type.
//                                      l     r           t     b
//  image, title, w, h, l-snap, r-snap, t-snap, b-snap
//			 snap style, ctrl, title, description
//					domainmask, menu, a, b
// domainmask 4 groups of 4. In, out, top , bottom
// 16 per.

	this.bitnames = [
		"poweron", "power_on", 50, 50,		null, "powerout", null, null,			// 0
				0,	0, "Power On",		"Start a chain of SoftBits", 0x0010, "Power", 0, 1,	// 0
		"poweroff", "power_off", 50, 50,	"powerin", null, null, null,			// 1
				2,	0, "Power Off",		"End of a chain, optional.", 0x0001, "Power", 0, 1,	// 1
		"", "label", 100, 50,	null, null, null, null,			// 
				0,	4, "Label",		"Displays text", 0x0000, "Power", 0, 1,	// 1
		"", "map", 100, 100,	null, null, null, null,			// 
				0,	5, "Map",		"Map of bits in world", 0x0000, "Power", 0, 1,	// 1
	
		"",   "split", 50, 150,	"wirein",  "wireout" ,null,  "wireout",	// 2	
				12,	15, "Splitter",	"Split one output into two",	0x3033, "Wire", 0, 1,		// 2	"split",   "wire_split"
		"patchout",   "patch_out", 50, 50,	null,  "wireout" ,null,  null,	// 2	
				0,	22, "Patch Out",	"Patch out",	0x0010, "Wire", 0, 1,		// 2	patch cable
		"patchin",   "patch_in", 50, 50,	"wirein",  null ,null,  null,	// 2	
				0,	21, "Patch In",	"Patch in",		0x0001, "Wire", 0, 1,		// 2	patch cable
		"invert", "a_invert", 50, 50,		"actionin", "actionout" , null,  null,	// 3
				13,	0, "Analog Invert",	"Turn value upside down",		 0x0011, "Action", 0, 1,		// 3
		"", "a_dimmer", 100, 50,		"actionin", "actionout" , null,  null,	// 4
				14,	1, "Dimmer",		"",								 0x0011, "Action", 0, 1,		// 4
		"default", "a_setvalue", 100, 50,	"blankin", "actionout" , null,  null,	// 5
				0,	0, "",				"", 							0x3,  "Action", 0, 0,		// 22

		"",	"logic_and", 50, 150,		"logicin", "logicout" , "logicin", null,	// 6
				16,	24, "And",			"", 							0x0111, "Logic", 0, 1,		// 5
		"", "logic_or",  50, 150,	"logicin", "logicout" , "logicin",  null,	// 7
				17,	25, "Or",			"", 							0x0111, "Logic", 0, 1,		// 6
		"default", "logic_not", 50, 50,	"logicin",  "logicout" , null,  null,	// 8
				18,	0, "Not",			"", 0x0011,  "Logic", 0, 1,		// 7
		"", "logic_nand", 50, 150,	"logicin", "logicout", "logicin",  null,	// 9
				19,	26, "Nand",			"", 0x0111,  "Logic", 0, 1,		// 8
		"", "logic_nor", 50, 150,	"logicin", "logicout" , "logicin",  null,	// 10
				20,	27, "Nor",			"", 0x0111,  "Logic", 0, 1,		// 9

		"default", "a_plus", 100, 50,		"actionin", "actionout" ,"actionin",  null,		// 11
				36,	0, "Add ",				"", 0x0111, "Action", 0, 1,		// 22
		"default", "a_minus", 100, 50,		"actionin", "actionout" ,"actionin",  null,		// 12
				37,	0, "Subtract",		"Subtract top/bottom from left", 0x0111, "Action", 0, 1,		// 22
		"default", "a_times", 100, 50,		"actionin", "actionout" ,"actionin",  null,		// 13
				38,	0, "Multiply",				"", 0x0111, "Action", 0, 1,		// 22
		"default", "a_divide", 100, 50,		"actionin", "actionout" ,"actionin",  null,		// 14
				39,	0, "Divide",			"Divide left by top/bottom", 0x0111, "Action", 0, 1,		// 22

		"default", "a_diff", 100, 50,		"actionin", "actionout" ,"actionin",  null,		// 15
				0,	0, "",				"", 0x0111, "Action", 0, 1,		// 22
		"default", "logic_xor", 100, 50,	"logicin", "logicout" ,"logicin",  null,		// 16
				42,	0, "Xor",				"", 0x0111, "Logic", 0, 1,		// 22
		"default", "l_compare", 100, 50,    "actionin", "logicout" ,"actionin",  null,		// 17
				0,	0, "",				"", 0x0111, "Logic", 0, 1,		// 22
		"default", "l_latch", 100, 50,	    "logicin", "logicout" ,"logicin",  null,		// 18
				0,	0, "",				"", 0x0111, "Logic", 0, 1,		// 22

		"", "bargraph", 100, 50,		"outputin", "outputout" ,null,  null,		// 19
				0,	2, "Bargraph",				"", 0x0011, "Output", 0, 1,		// 22
		"", "bargraph2", 100, 50,	"outputin", "outputout" ,"outputin",  null,	// 20
				0,	3, "Dual Bargraph",				"", 0x111,  "Output", 0, 1,		// 22

		"", "wire", 50, 50, 		    "wirein",  "wireout",null , null,		// 25	
		109,	12, "Wire",	"Join output to input", 0x0011, "Wire", 0, 1,		// 22

		"", "corner", 50, 50, 		    "wirein",  "wireout",null , null,		// 25	
		109,	6, "Corner",	"Join output to input", 0x0011, "Wire", 0, 1,		// 22

		"control", "a_counter", 100, 50,	"actionin", "actionout" , null,  null,	// 27
		111,	23, "Counter",		"", 0x0011, "Action", 0, 1,		// 22
		"control", "push_switch", 100, 50,	"actionin",  "inputout" , null,  null,	// 28
		112,	9, "Push switch",	"", 0x0011, "Input", 0, 1,		// 22
		"control", "toggle_switch", 100, 50,"actionin",  "inputout" , null,  null,	// 29
		113,	10, "Toggle switch",	"", 0x0011, "Input", 0, 1,		// 22
		"rotary", "a_rotary",  50, 50,    "actionin", "actionout" , null,  null,	// 30
		114,	8, "Knob ",	"Round knob control", 0x0011, "Action", 0, 1,		// 22
		"control", "graph", 200, 100,		"outputin", "outputout" ,"outputin",  null,		// 31
		115,	11, "Line graph",	"", 0x0111, "Output", 0, 1,		// 22

		"control", "seq", 200, 50,	"inputin", "inputout" ,null,  null,		// 0
		123,	17, "Sequencer",	"sequencer",	 0x0011, "Input", 0, 1,	// 0

		"control", "seq8", 200, 100,	"inputin", "inputout" ,null,  null,		// 0
		123,	18, "Seq8",	"8 step sequencer",	 0x0011, "Input", 0, 1,	// 0

		"control", "seq16", 200, 200,	"inputin", "inputout" ,null,  null,		// 0
		123,	19, "Seq16",	"16 step sequencer",	 0x0011, "Input", 0, 1,	// 0

		"control", "piano", 200, 100,	"inputin", "inputout" ,null,  null,		// 0
		0,	20, "Piano",	"Two octave piano",	 0x0011, "Input", 0, 1,	// 0

		"control", "light",  50, 50,    "outputin", "outputout" , null,  null,	
		0,	13, "RGB Light",		"A colored light", 0x0011, "Output", 0, 1,		
		"control", "biglight",  100, 100,    "outputin", "outputout" , null,  null,
		0,	13, "Big RGB Light",		"A colored light", 0x0011, "Output", 0, 1,		
		"control", "mandel",  400, 400,    "outputin", "outputout" , "outputin",  null,
		64,	14, "Mandelbrot",		"A mandelbrot display", 0x0111, "Output", 0, 1,	

		"control", "lorenz",  400, 400,    "outputin", "outputout" , "outputin",  null,
		65,	16, "Lorenz_Chaos",		"A Lorenz Attractor display", 0x0111, "Output", 0, 1,		

		null, null, null, null,				null, null, null, null
	];


	this.ctrltab = [
//  ID, len, args
null, 0, 0, 0, 0	// end of table
];

// defines the op codes for the program. softbitslivs:execProgram
this.kitctrlcodes = [
	"power_on", 0,
//	"power_off", 2,
//	"a_invert", 13,
//	"a_dimmer", 14,
//	"a_rotary", 114,
//	"wire", 109,
//	"wire_corner", 110,
//	"push_switch", 112,
//	"toggle_switch", 113,
//	"graph", 115,
//	"a_counter", 111, 
//	"wire_split", 12,
//	"a_plus", 36,
//	"a_minus", 37,
//	"a_times", 38,
//	"a_divide", 39,
//	"logic_and", 16,
//	"logic_or", 17,
//	"logic_not", 18,
//	"logic_nand", 19,
//	"logic_nor", 20,
//	"logic_xor", 42,
//	"seq", 123,
//	"seq8", 123,	// generic sequencer 8 step
//	"seq16", 123,	// generic sequencer 16 step
	null, 254
];

// kit_basic addctrl
//
	this.addCtrl = function( bit)
	{	let i;
		let ct = null;
		let name = this.bitnames[ bit.btype+1];
		let ctrl = this.bitnames[ bit.btype+9];

		if( ctrl > 1){
			for(i=0; this.ctrltab[i] != null; i += this.ctrltab[i+1]){
				if( this.ctrltab[i] == name){
					// found control
					ctrl = this.ctrltab[i+2];
					break;
				}
			}
		}

		if( ctrl == 1){
			// slider 
			ct = new sliderBit( bit);
			bit.ctrl = ct;
			bit.code = DIMMER;		// explicit instruction code
			ct.setData();
			return ct;
		}else if(ctrl == 2){	// bargraph
			ct = new barGraphBit( bit);
			bit.ctrl = ct;
			return ct;
		}else if(ctrl == 3){	// bargraph2
			ct = new barGraph2Bit( bit);
			bit.ctrl = ct;
			return ct;
		}else if(ctrl == 4){	// label
			ct = new labelBit( bit);
			bit.ctrl = ct;
			ct.setData();
			return ct;
		}else if(ctrl == 5){	// map
			ct = new mapBit( bit);
			bit.ctrl = ct;
			return ct;
		}else if( ctrl == 8){
			// rotary
			ct = new rotaryBit( bit);
			bit.ctrl = ct;
			ct.setData();
			return ct;
		}else if( ctrl == 9){
			// push switch
			ct = new pushSw( bit);
			bit.ctrl = ct;
			ct.setData();
			this.value = 0;
			return ct;
		}else if( ctrl == 10){
			// toggle switch
			ct = new toggleSw( bit);
			bit.ctrl = ct;
			ct.setData();
			this.value = 0;
			return ct;
		}else if( ctrl == 11){	//  code 115
			// graph
			ct = new graphBit( bit);
			bit.ctrl = ct;
			ct.setData();
			return ct;
		}else if( ctrl == 12 || ctrl == 6){
			// wire
			ct = new wireBit( bit);
			bit.ctrl = ct;
			if( ctrl == 6){
				// corner special
				bit.snaps[1].side = "-b";
				bit.snaps[1].w = 50;
				bit.snaps[1].h = 15;
				bit.snaps[1].x = bit.snaps[0].x + bit.snaps[0].w;
				bit.snaps[1].y = bit.snaps[0].y + bit.snaps[0].h;
			}
			return ct;
		}else if( ctrl == 13){
			// RBG lights
			ct = new lightBit( bit);
			bit.ctrl = ct;
			ct.setData();
			return ct;
		}else if( ctrl == 14){
			// mandlebrot
			ct = new mandleBit( bit);
			bit.ctrl = ct;
			ct.setData();
			return ct;
		}else if( ctrl == 15 ){
			// wire
			ct = new splitterBit( bit);
			bit.ctrl = ct;
			bit.setOrientation(0);		// modify snaps.
			return ct;
		}else if( ctrl == 16){
			// lorenz
			ct = new lorenzBit( bit);
			bit.ctrl = ct;
			ct.setData();
			return ct;
		}else if( ctrl == 17){
			// sequencer
			ct = new seqBit( bit);
			bit.ctrl = ct;
			ct.setData();
			return ct;
		}else if( ctrl == 18){
			// sequencer
			ct = new seqBit( bit);
			ct.values = [100,104,60,112, 64, 68, 72, 74];
			ct.bitimg =ct.bit.findImage("seq8");
			ct.bitname = "seq8";
			bit.ctrl = ct;
			ct.setData();
			return ct;
		}else if( ctrl == 19){
			// sequencer
			ct = new seqBit( bit);
			ct.values = [100,104,60,112, 64, 68, 72, 74, 100,104,60,112, 64, 68, 72, 74];
			ct.bitimg =ct.bit.findImage("seq16");
			ct.bitname = "seq16";
			bit.ctrl = ct;
			ct.setData();
			return ct;
		}else if( ctrl == 20){
			// piano
			ct = new pianoBit( bit);
			ct.values = [];
			bit.ctrl = ct;
			ct.setData();
			return ct;
		}else if( ctrl == 21){
			// patch cable
			ct = new patchinBit( bit);
			ct.values = [];
			bit.ctrl = ct;
			ct.setData();
			return ct;
		}else if( ctrl == 22){
			// patch cable
			ct = new patchoutBit( bit);
			ct.values = [];
			bit.ctrl = ct;
			ct.setData();
			return ct;
		}else if( ctrl == 23){
			ct = new counterBit( bit);
			ct.values = [];
			bit.ctrl = ct;
			ct.setData();
			debugmsg("New counter");
			return ct;
		}else if( ctrl == 24){
			ct = new logicBit( bit);
			ct.setImage("and2", "And", LOGICAND);
			ct.values = [];
			bit.ctrl = ct;
			bit.setOrientation(0);		// modify snaps.
			ct.setData();
			return ct;
		}else if( ctrl == 25){
			ct = new logicBit( bit);
			ct.setImage("or", "Or", LOGICOR);
			ct.values = [];
			bit.ctrl = ct;
			bit.setOrientation(0);		// modify snaps.
			ct.setData();
			return ct;
		}else if( ctrl == 26){
			ct = new logicBit( bit);
			ct.setImage("nand", "Nand", LOGICNAND);
			ct.values = [];
			bit.ctrl = ct;
			bit.setOrientation(0);		// modify snaps.
			ct.setData();
			return ct;
		}else if( ctrl == 27){
			ct = new logicBit( bit);
			ct.setImage("nor", "Nor", LOGICNOR);
			ct.values = [];
			bit.ctrl = ct;
			bit.setOrientation(0);		// modify snaps.
			ct.setData();
			return ct;
		}else {
			message("Unknown control "+ctrl);
		}

		return null;
	}

// name, type 0=snap, 1=bit, 2=resources/images
	this.bitimagemap = [
		"powerin",		6,		// 4 == -l -t
		"powerout",		0xa,	// 8 == -r -b
		"flip",			2,
		"flip-v",		2,
		"remove",		0,
		"inputin",		4,		// 4 == -l -t
		"inputout",		8,		// -r -b
		"outputin",		4,
		"outputout",	8,		// -r -b
		"actionin",		4,
		"actionout",	8,		// -r -b
		"wirein",		4,
		"wireout",		8,		// -r -b
		"split",		0xd,	// -v
		"logicin-l",	0,
		"logicin-t",	0,
		"logicout-b",	0,
		"logicout-r",	0,
		"blankin-l",	0,
		"blankin-t",	0,
		"blankout-r",	0,
		"blankout-b",	0,

		"poweron",		0xd,
		"poweroff",		0xd,
		"default",		0xd,
		"defaulta",		0xd,
//		"corner",		0xd,
		"straight",		0xd,
		"control",		0xd,
		"wiresend",		1,
		"wiresend-v",	1,
		"wirerecv",		1,
		"wirerecv-v",	1,
		"short",		1,
		"short-v",		1,
		"and",			0xd,

		"knob", 		2,
		"knob-v", 		2,
		"invert", 		1,
		"invert-v",		1,
		"patchin", 		0xd,
		"patchout",		0xd,
		"imagetile",	1,
		"piano",		1,
		"and2",			0xd,
		"or",			0xd,
		"nand",			0xd,
		"nor",			0xd,
		"rotary",		0xd,
		null, null
	];

	this.getdomain = function()
	{
		return 1;		// basic domain is available
	}
}


addkit( new kit_basic() );

new postkitload("Basic");


