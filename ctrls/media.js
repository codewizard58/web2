// media objects
//
// 1/16/25
// if (!navigator.mediaDevices?.enumerateDevices) {
//     console.log("enumerateDevices() not supported.");
//   } else {
    // List cameras and microphones.
//     navigator.mediaDevices
//       .enumerateDevices()
//       .then((devices) => {
//         devices.forEach((device) => {
//           console.log(`${device.kind}: ${device.label} id = ${device.deviceId}`);
//         });
//       })
//       .catch((err) => {
//         console.error(`${err.name}: ${err.message}`);
//       });
//   }

var vctx = null;
  

micBit.prototype = Object.create(control.prototype);

function micBit(bit)
{	control.call(this, bit);
	this.bit = bit;
	this.webkitstyle = false;
	this.val = 255;		// debug set initial volume
	this.audioin = null;
	this.audioout = null;
	this.ival = 0;

    let imagename = "mic";
	this.bitimg =this.bit.findImage(imagename);
	this.bitname = imagename;
	this.name = "Mic";

	this.setup = function(){
		if( this.audioout == null){
			const constraints = { audio: true };
			navigator.mediaDevices
				.getUserMedia(constraints)
				.then((stream) => {
					source = actx.createMediaStreamSource(stream);
					this.audioout = source;
					debugmsg("Create microphone");
				})
				.catch(function (err) {
				debugmsg("The following error occured: " + err);
			});
		}
	}

	// microphone
	this.Draw = function( )
	{	const b = this.bit;

		if( b == null){
			return;
		}

        ctx.fillStyle = "#ffffff";
		if( (b.btype & 1) == 0){
			drawImage( this.bitimg , b.x, b.y);
		}else {
			drawImage( this.bitimg+1 , b.x, b.y);
		}
	}

	this.setup();

}


videoBit.prototype = Object.create(control.prototype);

function videoBit(bit)
{	control.call(this, bit);
	this.bit = bit;
	this.audioin = null;
	this.audioout = null;
	this.image = null;
	this.previmage = null;
	this.video = null;
	this.mode = 0;			// 0 = normal, 1 = diff, 2 neg
	this.shift = 0;				// 4 * 2
	this.gain = null;
	this.mix = 0;
	this.prevmix = new delta();

    let imagename = "mic";
	this.bitimg =this.bit.findImage(imagename);
	this.bitname = imagename;
	this.name = "Video";

	this.setup = function(){
		let f;
		if( vctx == null){
			f = document.getElementById("videocanvas");
			if( f != null){
				vctx = f.getContext('2d');
			}
		}
	
		if( this.audioout == null){
			const constraints = { audio: true, video: true };
			navigator.mediaDevices
				.getUserMedia(constraints)
				.then((stream) => {
						source = actx.createMediaStreamSource(stream);
						debugmsg("Create video");
						this.video = document.querySelector("video");
						this.video.srcObject = stream;
						this.video.onloadedmetadata = () => {
						this.video.play();
						this.video.volume = 0.0;

						if( this.gain == null){
							// create a new node
							if( typeof( actx.createGainNode) != "undefined"){
						//		alert ("use gain node");
								this.webkitstyle = true;
								this.gain = actx.createGainNode();
							}else {
								this.gain = actx.createGain();
							}
							this.gain.gain.setTargetAtTime( 0, 0, 0.01);
							source.connect( this.gain); 
						}
						this.prevmix.changed(-1);
						this.audioout = this.gain;
			
						};
					}
				)
				.catch(function (err) {
					debugmsg("The following error occured: " + err);
			});
		}
	}

	this.setValue = function(data, chan)
	{	const bit = this.bit;
		let mix = 0.0;

		if( chan == 0){
			this.mix = checkRange(data);
			indicator_spin(4);
			indicator(data, 5);

			if( this.mix != 0){		// mix of 0 also freezes the video.
				this.doEffects();
			}
		}else {
			return;
		}

		mix = this.mix / 256;

		if( this.prevmix.changed(mix)){
			if(this.gain != null){
				this.gain.gain.setTargetAtTime( mix, 0, 0.05);
			}
		}

	}

	// video - setValue drives stuff. So no power no effects.
	this.doEffects = function()
	{	const b = this.bit;
		let n;
		let i;
		let j;

		if( this.mode == 0){
			this.curImage = 0;
		}

		this.previmage = this.image;
		if(this.previmage != null && this.image!= null ){
			if( this.mode == 1 ){
				n = 0;
				for(i=0; i < b.h; i++){
					for(j=0; j < b.w - this.shift; j++){
						this.previmage.data[n] = checkRange(this.previmage.data[n] - this.image.data[n+this.shift]);
						this.previmage.data[n+1] = checkRange(this.previmage.data[n+1] - this.image.data[n+1+this.shift]);
						this.previmage.data[n+2] = checkRange(this.previmage.data[n+2] - this.image.data[n+2+this.shift]);

						n += 4;
					}
					n += 4*this.shift;
				}
				this.curImage = 1;
			}else if(this.mode == 2 ){
				n = 0;
				for(i=0; i < b.h; i++){
					for(j=0; j < b.w ; j++){
						this.previmage.data[n] =   256 - this.image.data[n+this.shift];
						this.previmage.data[n+1] = 256 - this.image.data[n+1+this.shift];
						this.previmage.data[n+2] = 256 - this.image.data[n+2+this.shift];

						n += 4;
					}
				}
				this.curImage = 1;
			}
		}else {
			debugmsg("image is null");
		}
	}

	// video
	this.Draw = function( )
	{	const b = this.bit;

		if( b == null){
			return;
		}

		if( this.mix > 0 || this.image == null){					// use mix == 0 to freeze video, allow first.
			this.image = null;
			if( this.video != null){
				vctx.drawImage(this.video, 0, 0, b.w, b.h);
				this.image = vctx.getImageData(0, 0, b.w, b.h);
			}
		}

		// this.mix is input and has to be non 0

        ctx.fillStyle = "#ffffff";
		if( this.curImage == 1){
			if(this.previmage != null){
				ctx.putImageData(this.previmage, b.x, b.y);
			}
		}else if(this.image != null){
			ctx.putImageData(this.image, b.x, b.y);
		}

	}

	this.setData = function()
	{	let msg="";
        let tl;
        let n;
        let style = "";

		if( bitform != null){
			bitform.innerHTML="";
		}
		bitform = document.getElementById("bitform");
		if( bitform != null){
			msg = "<table>";
			msg += "<tr><th>Effect</th><td><select id='videomode' >";
			msg += "<option value='0' "+isSelected(this.mode, 0)+">Normal</option>";
			msg += "<option value='1' "+isSelected(this.mode, 1)+">Edge</option>";
			msg += "<option value='2' "+isSelected(this.mode, 2)+">Color reversed</option>";
			msg +="</select></td></tr>\n";
			msg += "</table>\n";

			bitform.innerHTML = msg;
			bitformaction = this;
			this.prog = 0;
		}

    }

	this.getData = function()
	{	let i = 0;
		let f = null;
		let val = 0;
		let s = new saveargs();

		s.addarg("control");
		s.addarg( "video");

        f = document.getElementById("videomode");
        if( f != null){
            s.addarg("videomode");
            s.addarg(f.value);
        }
		this.doLoad( s.getdata(), 0);
	}


	this.doLoad = function(initdata, idx)
	{	var len = initdata[idx];
		let n = 1;
		let param="";
		let val = "";

		for(n = 1; n < len ; n += 2){
			param = initdata[idx+n];
		    val = initdata[idx+n+1];
			debugmsg("Video "+param+" "+val);
            if( param == "'control'"){
				continue;
			}
			if( param == "videomode"){
				this.mode = val;
			}
		}

	}

	this.setup();

}

// not a control.
// a utility object
//
function sampler(ctrl)
{	this.ctrl = ctrl;
	this.image = null;
	this.data = null;
	this.values = [];
	this.points = [];
	this.w = 0;
	this.h = 0;
	this.beats = 32;
	this.max = 0;
	this.dir = 1;
	this.tick = 0;
	this.pingpong = 0;
	this.gate = 128;
	this.tempo =180;



	this.setImage = function(image)
	{
		this.image = image;
	}

	this.setData = function(data)
	{
		this.data = data;
		debugmsg("SETDATA "+this.data.length);
	}

	this.setSize = function(w, h)
	{
		this.w = w;
		this.h = h;
	}

	this.setPoints = function( points, max)
	{
		this.points = points;
		this.max = max;
	}

	this.setValues = function( values, max)
	{
		this.values = values;
		this.max = max;
	}

	this.radial = function(ix, iy)
	{	let dx;
		let dy;
		let x;
		let y;
		let cnt;
		let idx;
		const sw = this.w / 256;
		const sh = this.h / 256;

		// use points to sample image.
		dx = (ix - 128) / this.beats;
		dy = (iy - 128) / this.beats;

//				debugmsg("Start new line "+this.ix+" "+this.iy);
		x = 128;
		y = 128;
		for(cnt=0; cnt < this.beats; cnt++){
			this.points[cnt] = new mpoint(Math.floor(x), Math.floor(y));
			idx = Math.floor(sh * y)*this.w + Math.floor(sw * x);
			if( this.data != null){
				this.values[cnt] = this.data[idx];
			}
			x = x+dx;
			y = y+dy;
		}
		this.max = cnt;
		debugmsg("End new line "+x+" "+y);
	}

//sampler
	this.getValue = function()
	{
		if( this.dir > 0){
			this.tick++;
		}else {
			this.tick--;
		}

		if( this.tick >= this.max){
			if( this.pingpong ){
				this.dir = -this.dir;
				this.tick = this.max -1;
			}else {
				this.tick = 0;
			}
		}
		if( this.tick < 0){
			this.tick = 0;
			if( this.pingpong ){
				this.dir = - this.dir;
			}else if( this.max > 0){
				this.tick = this.max-1;
			}
		}
		return this.values[this.tick];
	}

	this.position = function()
	{
		return this.tick;
	}

}

harp.prototype = Object.create(control.prototype);

function harp(bit)
{	control.call(this, bit);
	this.values = [];
	this.octave = 5;			// C5
	this.scale = -1;
	this.value = 0;
	this.notes = [];
	this.numBeams = 7;
	this.curnote = 0;		// 1 offset
	this.transport = new transport();
    this.gate = 128;
	this.step = 0;
	this.prevdata = new delta();

	this.prevdata.changed(-1);


	this.setValue = function(data, chan)
	{	const bit = this.bit;
		let note = 1*data;
		let beat ;
		let step;
        let gate = Math.floor(this.gate / 4);

		if(chan == 0){
			if( data == 255){     // transport run
                if( this.prevdata.changed(data)){
                    if( this.transport.mode == 0 ){      // local mode
                        this.transport.resume();
                    }else {
                    // skip to where we should be.
                   }
                }

				this.step = this.transport.getValue();
				this.transport.trigger = 0;			// show that the transport is still being used.

				execmode = 2;
				beat = this.transport.getBeat();
				step = Math.floor(this.step %  Math.floor(256 / 4) );
//	 debugmsg("Beat "+beat+" "+step);
				if( step > gate){
					bit.value = 0;
				}
			}
		}

		if( chan >= 2){
			if( note > 0){
				note = note -1;				// was 1 offset.
				if( this.notes.length > note){
					note = this.notes[note];
				}
				note += 12*this.octave;
				if( chan == 2){
					note -= 12;		// one octave in semitones.
				}
				note = note*2;		// semitone to values

				this.transport.localStop();
				this.transport.localResume();
			}

			this.values[0] = 1*note;
			bit.value = checkRange(note);
			this.curnote = data;
			return;
		}
	}

	this.getValue = function(chan)
	{
		return this.bit.value;
	}

	this.setScale = function(mode)
	{
		if( this.scale == mode){
			return;
		}
		debugmsg("setscale "+mode);
	}

	//harp
	this.HitTest = function(x, y)
	{	let res = null;
		let b = this.bit;
		let border = 10;

//		debugmsg("HT "+x+" "+y+" X="+b.x+" Y="+b.y+" w "+b.w+" h "+b.h);
		if( b == null){
			return null;
		}
		if( (x >= b.x+border) && x <= (b.x+b.w-border) &&
		    y >= (b.y+border) && y <= (b.y+b.h-border)){
			res = this;
		}
		if( res == null){
			return null;
		}
		// 
		return res;
	}




	// harp
	this.Draw = function( )
	{	const b = this.bit;
		let w = b.w;
		let nw = Math.floor((w-15)/ this.numBeams);
		let h = b.h -20;

		if( b == null){
			return;
		}
        ctx.fillStyle = "#000000";
		ctx.fillRect(b.x, b.y, b.w, b.h);

        ctx.fillStyle = "#ffffff";
		for(let i=0; i < this.numBeams; i++){
			if( this.curnote -1 == i){
				ctx.fillStyle = "#ff0000";
				ctx.fillRect(b.x+i*nw+10, b.y+10, nw-5, h);
				ctx.fillStyle = "#ffffff";
			}else {
				ctx.fillRect(b.x+i*nw+10, b.y+10, nw-5, h);
			}
		}
		
	}
		
	// harp
	this.setData = function()
	{	let msg="";
        let tl;
        let n;
        let style = "";

		if( bitform != null){
			bitform.innerHTML="";
		}
		bitform = document.getElementById("bitform");
		if( bitform != null){
			msg = "<table>";
			msg += "<tr><th>Scale</th><td><select id='scale' onchange='UIrefresh(1, 0);' >";
			msg += "<option value='0' "+isSelected(this.scale, 0)+">Major</option>";
			msg += "<option value='1' "+isSelected(this.scale, 1)+">Minor</option>";
			msg += "<option value='2' "+isSelected(this.scale, 2)+">Pentatonic</option>";
			msg +="</select></td></tr>\n";
			msg += "<tr><th>Beams</th><td><select id='beams' onchange='UIrefresh(1, 0);' >";
			msg += "<option value='7' "+isSelected(this.numBeams, 7)+">7</option>";
			msg += "<option value='9' "+isSelected(this.numBeams, 9)+">9</option>";
			msg += "<option value='11' "+isSelected(this.numBeams, 11)+">11</option>";
			msg +="</select></td></tr>\n";
			msg += "<tr><td colspan='4'>"+this.transport.setData()+"</td></tr>\n";
			msg += "<tr><th>Gate</th><td ><input type='text' id='gate' value='"+this.gate+"'  size='4'  onchange='UIrefresh(1, 0);' /></td>";
            msg += "</tr>\n";

			msg += "<tr><th>Octave</th><td><input type='text' value='"+this.octave+"' size='3' id='octave' onchange='UIrefresh(1, 0);'  /></td></tr>\n";
			msg += "</table>\n";

			bitform.innerHTML = msg;
			bitformaction = this;
			this.prog = 0;
		}

    }

	//harp
	this.getData = function()
	{	let i = 0;
		let f = null;
		let val = 0;
		let s = new saveargs();

		s.addarg("control");
		s.addarg( "harp");

		f = document.getElementById("octave");
        if( f != null){
            s.addarg("octave");
            s.addarg(f.value);
        }
		f = document.getElementById("scale");
        if( f != null){
            s.addarg("scale");
            s.addarg(f.value);
        }
		f = document.getElementById("beams");
        if( f != null){
            s.addarg("beams");
            s.addarg(f.value);
        }
		f = document.getElementById("tempo");
        if( f != null){
            s.addarg("tempo");
            s.addarg(f.value);
        }
        f = document.getElementById("gate");
        if( f != null){
            s.addarg("gate");
            s.addarg(f.value);
        }

		this.doLoad( s.getdata(), 0);
	}

	this.doLoad = function(initdata, idx)
	{	var len = initdata[idx];
		let n = 1;
		let param="";
		let val = "";

		for(n = 1; n < len ; n += 2){
			param = initdata[idx+n];
		    val = initdata[idx+n+1];

			if( param == "'control'"){
				continue;
			}
			if( param == "octave"){
				this.octave = checkRange(1*val);
			}
			if( param == "scale"){
				this.setScale(val);
			}
			if( param == "beams"){
				this.numBeams = 1*val;
			}
			
		}

	}


	// harp
	this.setTempo = function(tempo)
    {
        this.transport.setTempo(tempo, 4);
    }



	// harp
	this.startMove = function()
	{	let b = this.bit;
		let ix = Math.floor((mx - b.x -10) );
		let iy = Math.floor((my - b.y -10) );
		let w = b.w;
		let nw = Math.floor((w-15)/ this.numBeams);
		let h = b.h -20;
		let idx = Math.floor( ix/nw);


		if( b == null){
			return;
		}

//		debugmsg("Harp move "+ix+" "+iy+" "+nw+" "+idx);
		this.setValue(idx+1, 3);			// 1 offset


	}

	this.onMove = function()
	{	let b = this.bit;
		let ix = Math.floor((mx - b.x -10) );
		let iy = Math.floor((my - b.y -10) );
		let w = b.w;
		let nw = Math.floor((w-15)/ this.numBeams);
		let h = b.h -20;
		let idx = Math.floor( ix/nw);

		if( b == null){
			return;
		}
//		debugmsg("Harp on move "+ix+" "+iy+" "+nw+" "+idx);
		this.setValue(idx+1, 3);			// 1 offset
	}

	// init stuff
	this.setTempo(120);
	this.transport.resume();

    timer_list.addobj(this.transport, null);
	this.transport.name = "Harp-transport";		// for debugging

}

//
