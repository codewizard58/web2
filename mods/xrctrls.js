
// xrctrls
import {BoxBuilder} from './js/render/geometry/box-builder.js';
import {PbrMaterial} from './js/render/materials/pbr.js';
import {Node} from './js/render/core/node.js';
import {UrlTexture} from './js/render/core/texture.js';
import {BitNode} from './mods/xrBit.js';
import {ImageTexture} from './js/render/core/texture.js';



////

// 50 units is 0.5 screen units at depth 1
// screen is 4.0 units wide at depth 2

// 800 -> 4  = * 0.05
let xrWidth = 0;
let xrHeight = 0;
let roomwidth = 0;
let roomheight = 0;

export function map2Dto3D(xrW, xrH, roomW, roomH)
{   
    xrWidth = xrW;
    xrHeight = xrH;
    roomwidth = roomW;
    roomheight = roomH;
}

export function mapX2XR( num)
  { 
    let xx = num-(xrWidth/2);
    return roomwidth*(xx/ xrWidth);
  }
  
  // 0,0 is top left not center
 export function mapY2XR( num)
  { let numflipped = xrHeight-num-1;
    let yy = numflipped-(xrHeight/2);          // move origin to center
    return roomheight* (yy/xrHeight);  // rescale and flip
  }
  
  export function mapW2XR( num)
  { 
    const x = num;
    return roomwidth*(num/ xrWidth);
  }
  
  export function mapH2XR( num)
  { 
    return roomheight*(num/ xrHeight);
  }


let bitbuilder = null;
let scene = null;
let renderer = null;

export function setCtrlScene( s, r)
{
    scene = s;
    renderer = r;
}

export  function bitBuilder(){
    this.boxBuilder = new BoxBuilder();
    this.boxBuilder.pushCube([0, 0, 0], 1.0);
    this.boxPrimitive = this.boxBuilder.finishPrimitive(renderer);

    bitbuilder = this;
  }
  
  
// create a box node. This sits just behind the main active part of the bit.
// the renderprimitive allows the color to be changed.
// shares the bitbuilder
export function xrBox(obj)
{
  let boxMaterial = new PbrMaterial();
  boxMaterial.baseColorFactor.value = [0.0, 1.0, 0.0, 0.9];
  let boxRenderPrimitive = renderer.createRenderPrimitive(bitbuilder.boxPrimitive, boxMaterial);
  obj.boxNode = new Node();
  obj.boxNode.addRenderPrimitive(boxRenderPrimitive);
  obj.renderPrimitive = boxRenderPrimitive;
  scene.addNode(obj.boxNode);
  obj.boxNode.visible = true;
}



export function createXRLorenzNode(b_x, b_y, b_z, b_w, b_h, itype, image)
{ this.sticks = [];
  this.node = null;
  debugmsg("lorenznode "+b_x+" "+b_y+" "+b_w+" "+b_h);

  this.position = [b_x+b_w*0.05, b_y+b_h*0.05, b_z];
  this.scale = [b_w, b_h, 1.0];
  this.dragPos = null;
  this.grabbed = false;
  this.num_points = 200;
  this.boxnode = null;
  this.depth = b_z;

  this.sx = 0;
  this.sy = 0;
  this.sz = 0;
  this.cnt = 0;

  for(let s = 0; s < this.num_points; s++){
    let stick = new XRstick();
    this.sticks[s]= stick ;
    scene.addNode(stick.node);
  }

  xrBox(this);

  this.visible = function(state)
  { let old=false;
    if( this.node != null){
      old = this.node.visible;
      this.node.visible = state;
    }
    return old;
  }

// lorenz
  this.update = function(time)
  { const d2r = Math.PI / 180;
    let node;
    const b_x = this.bit.x;
    const b_y = this.bit.y;
    const b_w = this.bit.w;
    const b_h = this.bit.h;
    let mapw = mapW2XR(b_w);
    let maph = mapH2XR(b_h);
    const mapx = mapX2XR(b_x);
    const mapy = mapY2XR(b_y);
    let w = mapW2XR(15);
    let h = mapH2XR(50);
    // adjust flipped y offset
    let ah = Math.floor((b_h/50)-1)* h;


    let positionbox = [mapx+mapw*0.5, mapy+maph*0.5-ah, this.depth-0.05];
    this.scalebox = [ mapw*1.1, maph*1.1, 0.1];


    this.setPath();

    for(let s=1; s < this.num_points; s++){
      let st = this.sticks[s];
      node = st.node;
      mat4.identity(node.matrix);
      mat4.translate(node.matrix, node.matrix, st.position);
      if( st.rotation[0] != 0){
        mat4.rotateX(node.matrix, node.matrix, st.rotation[0] * d2r);
      }
      if(st.rotation[1] != 0){
        mat4.rotateY(node.matrix, node.matrix, st.rotation[1] * d2r);
      }
      if( st.rotation[2] != 0){
        mat4.rotateZ(node.matrix, node.matrix, st.rotation[2] * d2r);
      }
  //    mat4.rotateX(node.matrix, node.matrix, 90 * Math.PI / 180);
      mat4.scale(node.matrix, node.matrix, st.scale);
    }

    node = this.boxNode;
    if( node != null){
      mat4.identity(node.matrix);
      mat4.translate(node.matrix, node.matrix, positionbox);
  //    mat4.rotateX(node.matrix, node.matrix, 90 * Math.PI / 180);
      mat4.scale(node.matrix, node.matrix, this.scalebox);
    }


  }

  this.lineTo = function(idx, x, y, z)
  { let sx = mapX2XR(x);
    let sy = mapY2XR(y);
//    debugmsg("line "+x+" "+y);
    this.sticks[idx].setStick(sx, sy, -2.0+z, 0.1, 0, 0, 0 );
  }

  // lorenz
  this.setPath = function()
  { // setup sticks to connect from begining to end
    if( this.bit == null){
        debugmsg("L bit null");
      return;
    }
    const bit = this.bit;
    const ctrl = bit.ctrl;
    if( ctrl == null){
      debugmsg("L ctrl null");
      return;
    }
    let i;
    let x;
    let y;
    let z;
    let c = ctrl.lcnt;
    let n = 0;
// debugmsg("SP "+c+" "+ctrl.lmax);
    i=this.cnt;
    while( i != c ){
        x = ctrl.lpoints[i].x*ctrl.lscale + 200;
        y = ctrl.lpoints[i].y*ctrl.lscale + 200;
        z = (ctrl.lpoints[i].z)/ 45;
        if( i != c){
            this.lineTo(i, bit.x+x, bit.y+y, z);
        }
      i++;
      if( i >= ctrl.lmax){
        i = 0;
      }
      n++;
    }
    this.cnt = i;
//    debugmsg("Num "+n);
  }

}

export function createXRMandelNode(b_x, b_y, b_z, b_w, b_h, itype, image)
{ this.sticks = [];
  this.node = null;
  debugmsg("Mandelnode "+b_x+" "+b_y+" "+b_w+" "+b_h+" "+image);

  this.position = [b_x+b_w*0.05, b_y+b_h*0.05, b_z];
  this.scale = [b_w, b_h, 1.0];
  this.dragPos = null;
  this.grabbed = false;
  this.num_points = 200;
  this.boxnode = null;
  this.depth = b_z;

  this.sx = 0;
  this.sy = 0;
  this.sz = 0;
  this.cnt = 0;

  if( itype == 0){
    this.texture = new UrlTexture(image);
  }else {
    this.texture = new ImageTexture(image);
    this.texture.genDataKey();
  }

  this.bitNode = new BitNode(this.texture, () => {
    this.bitNode.visible = true;
  });
  scene.addNode(this.bitNode);
  
  xrBox(this);

  this.visible = function(state)
  { let old=false;
    if( this.node != null){
      old = this.node.visible;
      this.node.visible = state;
    }
    return old;
  }

  // when we recalc the mandelbrot we will call setimage to update the texture.
  this.setImage = function(image)
  {
//    debugmsg("Set image");
    image.src = "./local";
    image.complete = true;
    image.naturalWidth = true;
  
    this.texture = new ImageTexture(image);
    this.texture.genDataKey();

    if( this.bitNode._iconRenderPrimitive){            // wait until it is available.
      this.bitNode.iconTexture = this.texture;
    }

  }

// mandelbrot
  this.update = function(time)
  { const d2r = Math.PI / 180;
    let node;
    const b_x = this.bit.x;
    const b_y = this.bit.y;
    const b_w = this.bit.w;
    const b_h = this.bit.h;
    const mapx = mapX2XR(b_x);
    const mapy = mapY2XR(b_y);
    let mapw = mapW2XR(b_w);
    let maph = mapH2XR(b_h);
    let w = mapW2XR(15);
    let h = mapH2XR(50);
    // adjust flipped y offset
    let ah = Math.floor((b_h/50)-1)* h;
    let ctrl = this.bit.ctrl;


    let position = [mapx+mapw*0.5, mapy+maph*0.5-ah, this.depth];
    let positionbox = [mapx+mapw*0.5, mapy+maph*0.5-ah, this.depth-0.05];
    this.scale = [ mapw*10, maph*10, 1.0];
    this.scalebox = [ mapw*1.1, maph*1.1, 0.1];


//    this.setPath();
    
    this.num_points = this.sticks.length;

    for(let s=1; s < this.num_points; s++){
      let st = this.sticks[s];
      node = st.node;
      mat4.identity(node.matrix);
      mat4.translate(node.matrix, node.matrix, st.position);
      if( st.rotation[0] != 0){
        mat4.rotateX(node.matrix, node.matrix, st.rotation[0] * d2r);
      }
      if(st.rotation[1] != 0){
        mat4.rotateY(node.matrix, node.matrix, st.rotation[1] * d2r);
      }
      if( st.rotation[2] != 0){
        mat4.rotateZ(node.matrix, node.matrix, st.rotation[2] * d2r);
      }
  //    mat4.rotateX(node.matrix, node.matrix, 90 * Math.PI / 180);
      mat4.scale(node.matrix, node.matrix, st.scale);
    }

    if( ctrl != null && ctrl.image != null && ctrl.dirty){
      ctrl.dirty = false;
      this.setImage( ctrl.image);
    }

    node = this.bitNode;
    if( node != null){
      mat4.identity(node.matrix);
      mat4.translate(node.matrix, node.matrix, position);
  //    mat4.rotateX(node.matrix, node.matrix, 90 * Math.PI / 180);
      mat4.scale(node.matrix, node.matrix, this.scale);
    }

    node = this.boxNode;
    if( node != null){
      mat4.identity(node.matrix);
      mat4.translate(node.matrix, node.matrix, positionbox);
  //    mat4.rotateX(node.matrix, node.matrix, 90 * Math.PI / 180);
      mat4.scale(node.matrix, node.matrix, this.scalebox);
    }


  }

  this.lineTo = function(idx, x, y, z)
  { let sx = mapX2XR(x);
    let sy = mapY2XR(y);
    this.sticks[idx].setStick(sx, sy, z, 0.1, 0, 0, 0 );
  }

  // mandelbrot
  this.setPath = function()
  { // setup sticks to connect from begining to end
    if( this.bit == null){
      return;
    }
    const bit = this.bit;
    const ctrl = bit.ctrl;
    if( ctrl == null){
      return;
    }


  }

}

export function createXRPlayerNode(b_x, b_y, b_z, b_w, b_h, itype, image)
{ this.sticks = [];
  this.node = null;
  debugmsg("playernode "+b_x+" "+b_y+" "+b_w+" "+b_h);

  this.position = [b_x+b_w*0.05, b_y+b_h*0.05, b_z];
  this.scale = [b_w, b_h, 1.0];
  this.dragPos = null;
  this.grabbed = false;
  this.num_points = 200;
  this.boxnode = null;
  this.depth = b_z;

  this.sx = 0;
  this.sy = 0;
  this.sz = 0;
  this.cnt = 0;

  xrBox(this)

  this.visible = function(state)
  { let old=false;
    if( this.node != null){
      old = this.node.visible;
      this.node.visible = state;
    }
    return old;
  }

// player
  this.update = function(time)
  { const d2r = Math.PI / 180;
    let node;
    const b_x = mapX2XR(this.bit.x);
    const b_y = mapY2XR(this.bit.y);
    const b_w = mapW2XR(this.bit.w);
    const b_h = mapY2XR(this.bit.h);
    let w = mapW2XR(15);
    let h = mapH2XR(50);
    // adjust flipped y offset
    let ah = Math.floor((this.bit.h/50)-1)* h;


    let positionbox = [b_x+b_w*0.5, b_y+b_h*0.5-ah, this.depth-0.05];
    this.scalebox = [ b_w*1.1, b_h*1.1, 0.1];

    this.setGrid();

    for(let s=1; s < this.num_points; s++){
      let st = this.sticks[s];

      if( st.dirty){
        node = st.node;
        mat4.identity(node.matrix);
        mat4.translate(node.matrix, node.matrix, st.position);
        if( st.rotation[0] != 0){
          mat4.rotateX(node.matrix, node.matrix, st.rotation[0] * d2r);
        }
        if(st.rotation[1] != 0){
          mat4.rotateY(node.matrix, node.matrix, st.rotation[1] * d2r);
        }
        if( st.rotation[2] != 0){
          mat4.rotateZ(node.matrix, node.matrix, st.rotation[2] * d2r);
        }
        mat4.scale(node.matrix, node.matrix, st.scale);
      }
    }

    node = this.boxNode;
    if( node != null){
      mat4.identity(node.matrix);
      mat4.translate(node.matrix, node.matrix, positionbox);
  //    mat4.rotateX(node.matrix, node.matrix, 90 * Math.PI / 180);
      mat4.scale(node.matrix, node.matrix, this.scalebox);
    }


  }

  this.lineTo = function(idx, x, y, z)
  { let sx = mapX2XR(x);
    let sy = mapY2XR(y);
//    debugmsg("line "+x+" "+y);
    this.sticks[idx].setStick(sx, sy, z, 0.1, 0, 0, 0 );
  }

  // player
  this.setGrid = function()
  { // setup sticks to connect from begining to end
    if( this.bit == null){
      return;
    }
    const bit = this.bit;
    const ctrl = bit.ctrl;
    if( ctrl == null){
      return;
    }
    let beats = ctrl.beats;
    let bars = ctrl.bars;
    let gridRows = ctrl.gridRows;
    let numPoints = beats * bars * gridRows;
    if( this.sticks.length < numPoints){
      debugmsg("Player "+numPoints);
      for(let st = 0; st < numPoints; st++){
        let stick = new  XRstick();
        this.sticks[st]= stick ;
        scene.addNode(stick.node);
      }
    }
    let i;
        let x;
        let y;
        let z;
  }

}

export function XRstick()
{
  let boxBuilder = new BoxBuilder();
  boxBuilder.pushBox([0.0, -0.05, -0.02], [0.1, 0.05, 0.02]);
//  boxBuilder.pushCube([0.0, 0.0, 0.0],0.1);
  let boxPrimitive = boxBuilder.finishPrimitive(renderer);
  let boxMaterial = new PbrMaterial();
  let color =  [1.0, 1.0, 0.0, 0.9];

  boxMaterial.baseColorFactor.value = color;
  let boxRenderPrimitive = renderer.createRenderPrimitive(boxPrimitive, boxMaterial);
  this.node = new Node();
  this.node.addRenderPrimitive(boxRenderPrimitive);
  this.node.visible = true;
  this.position = [0.0, 0.0, 0.0];
  this.scale = [1.0, 1.0, 1.0];
  this.rotation = [0.0, 0.0, 0.0];
  this.renderPrimitive = boxRenderPrimitive;
  this.sf = 10.0;
  this.dirty = false;

  // in 3D coords.
  this.setStick = function(x1, y1, z1, len, rx, ry, rz)
  {
    this.position = [x1, y1, z1];
    this.scale = [len*this.sf, this.sf/10, this.sf/10];
    this.rotation= [rx, ry, rz];
    this.dirty = true;

  }

  this.setColor = function(rc,gc,bc,ac)
  { let uniforms = this.renderPrimitive.uniforms;
    uniforms.baseColorFactor.value = [rc, gc, bc, ac];
  }

  // stick
  this.update = function(time)
  { const d2r = Math.PI / 180;

    let node = this.node;
    if( this.dirty){
      mat4.identity(node.matrix);
      mat4.translate(node.matrix, node.matrix, this.position);
      if( this.rotation[0] != 0){
        mat4.rotateX(node.matrix, node.matrix, this.rotation[0] * d2r);
      }
      if(this.rotation[1] != 0){
        mat4.rotateY(node.matrix, node.matrix, this.rotation[1] * d2r);
      }
      if( this.rotation[2] != 0){
        mat4.rotateZ(node.matrix, node.matrix, this.rotation[2] * d2r);
      }
      mat4.scale(node.matrix, node.matrix, this.scale);
      this.dirty = false;
    }

  }

}

export function createXRWireNode(b_x, b_y, b_z, b_w, b_h, itype, image)
{ this.sticks = [];
  this.node = null;
//  debugmsg("wirenode "+b_x+" "+b_y+" "+image+" "+b_w+" "+b_h);
  this.bit = null;
  this.bx = 0;
  this.by = 0;
  this.ex = 0;
  this.ey = 0;

  for(let s = 0; s < 4; s++){
    let stick = new XRstick();
    this.sticks[s]= stick ;
    scene.addNode(stick.node);
  }

  this.position = [b_x+b_w*0.05, b_y+b_h*0.05, b_z];
  this.scale = [b_w, b_h, 2.0];
  this.dragPos = null;
  this.grabbed = false;

  this.visible = function(state)
  { let old=false;
    if( this.node != null){
      old = this.node.visible;
      this.node.visible = state;
    }
    return old;
  }

  this.update = function(time)
  { const d2r = Math.PI / 180;

    this.setPath();

    for(let s=0; s < 3; s++){
      let st = this.sticks[s].update(time);
    }

  }

  this.setPath = function()
  { // setup sticks to connect from begining to end
    let begin, end;

    if( this.bit == null){
      return;
    }
    begin = this.bit.snaps[0];
    end = this.bit.snaps[1];
    if( begin == null || end == null){
      return;
    }
    if( this.bx == begin.x && this.by == begin.y && this.ex == end.x && this.ey == end.y){
      // nothing changed
      return;
    }
    this.bx = begin.x;
    this.by = begin.y;
    this.ex = end.x;
    this.ey = end.y;


    let vb = (begin.w > begin.h) ? 1 : 0;
    let ve = (end.w > end.h) ? 1 : 0;
    let w1,w2,w3,w4;
    let h1,h2,h3,h4;
    let h;
    let depth =  this.position[2];
    let bxw, byh;
//    debugmsg("W "+this.bx+" "+this.by+" "+this.ex+" "+this.ey+" "+vb+" "+ve);

      w1 = mapW2XR((end.x - begin.x) / 2);
      w2 = w1-mapW2XR(begin.w);
      h = mapH2XR(begin.h /2);
      h1 = mapH2XR((end.y - begin.y) / 2);
      h2 = h1-mapH2XR(begin.h);
      switch( vb+2*ve){
      case 0:   // l r
        bxw = mapX2XR(begin.x+begin.w);
        byh = mapY2XR(begin.y);

        this.sticks[0].setStick( bxw, byh+h, depth-1, w1, 0, 0, 0);
        this.sticks[1].setStick( bxw+w1, mapY2XR(end.y)+h,  depth-1, w2, 0, 0, 0);
        if( begin.y > end.y){
          this.sticks[2].setStick( bxw+w1, mapY2XR(end.y)+h,  depth-0.95, h1+h1, 0, 0, 90);
        }else {
          this.sticks[2].setStick( bxw+w1, mapY2XR(end.y)+h,  depth-0.95, -h1-h1, 0, 0, -90);
        }
        break;

      case 1:   // b r
        break;

      case 2:   // l t
        bxw = mapX2XR(begin.x+begin.w);
        byh = mapY2XR(begin.y);

        this.sticks[0].setStick( bxw, byh+h, depth-1, w1+w1, 0, 0, 0);
        if( begin.y > end.y){
          this.sticks[2].setStick( bxw+w1+w1, mapY2XR(end.y)+h,  depth-0.95, h1+h1, 0, 0, 90);
        }else {
          this.sticks[2].setStick( bxw+w1+w1, mapY2XR(end.y)+h,  depth-0.95, -h1-h1, 0, 0, -90);
        }
        break;

      case 3:   // b t
        break;
    }
  }
}

// laser harp
// frame and laser beams.
function laser(lx, ly, lz )
{ this.node = null;
  this.sticks = [];
  this.height = 2.0;
  this.idx = 0;
  this.selected = false;
  this.hover = false;

  this.position = [lx, ly, lz];
  this.scale = [1.0, 1.0, 1.0];
  this.rotation = [0, 0, 0];
  this.dirty = false;

  this.sticks[0] = new XRstick();
  this.sticks[0].sf = 5;
  this.sticks[0].node.selectable = true;
  this.sticks[1] = new XRstick();
  this.sticks[1].sf = 3;

  this.frame = null;      // what this is a part of.

  for(let s of this.sticks){
    if( s.node != null){
      scene.addNode(s.node);
      s.node.visible = true;
    }
  }

  this.onHoverStart = function()
  { let us = this.laser;        // node is (this)
    us.hover = true;
    us.dirty = true;
    if( us.frame != null){
      us.frame.hover(1 + us.idx);
    }
  }

  this.onHoverEnd = function()
  { let us = this.laser;        // node is (this)
    us.hover = false;
    us.dirty = true;
    us.frame.hover(0);
  }

  this.hitTest = function(hit)
  { 
    this.selected = false;
    if( this.sticks[0].node == hit){
      debugmsg("Hit laser "+this.idx);
      this.selected = true;
    }
  }
  
  this.update = function(time)
  { let lx = this.position[0];
    let ly = this.position[1];
    let lz = this.position[2];

    if( this.dirty == false){
//      debugmsg("L not dirty");
      return;
    }

    let sel = isSelecting();

    this.sticks[0].setStick(lx, ly, lz, this.height*1.9, 0, 0, 90);
    this.sticks[1].setStick(lx, ly+this.height-0.1, lz, 200.0, 0, 180, 0);
    if( this.hover && !this.selected && sel == 0){
      this.sticks[0].setColor( 1.0, 1.0, 1.0, 1.0);   // white
      this.sticks[1].setColor( 1.0, 1.0, 1.0, 1.0);
    }else if((this.hover && sel != 0) || this.selected){
      this.sticks[0].setColor( 0.0, 0.0, 1.0, 0.9);   // blue
      this.sticks[1].setColor( 0.0, 0.0, 1.0, 0.9);
    }else {
      this.sticks[0].setColor( 1.0, 0.0, 0.0, 0.5);   // red
      this.sticks[1].setColor( 1.0, 0.0, 0.0, 0.5);
    }

    for(let s of this.sticks){
//      debugmsg("L up stick "+s.position[0]+" "+s.position[1]);
      s.update(time);
    }

    this.dirty = false;

  }

  this.sticks[0].node.onHoverStart = this.onHoverStart;
  this.sticks[0].node.laser = this;
  this.sticks[0].node.onHoverEnd = this.onHoverEnd;
  
}

export function createXRHarpNode(b_x, b_y, b_z, b_w, b_h, itype, image)
{
    this.frame = [];
    this.lasers = [];
    this.numBeams = 7;
    this.spread = 0.2;

    this.position = [b_x-2, b_y, b_z];
    this.scale = [1.0, 1.0, 1.0];
    this.rotation = [0, 0, 0];
    this.selected = false;
    this.bit = null;

    let node;

    for(let i=0 ; i < this.numBeams; i++){
      this.lasers[i] = new laser( this.position[0] +(i- this.numBeams / 2)*this.spread, this.position[1], this.position[2]);
      node = this.lasers[i].node;
      if( node != null){
        scene.addNode( node);
      }
      this.lasers[i].idx = i;   // for angle spread.
    }
    // frame
    this.frame[0] = new XRstick();
    this.frame[1] = new XRstick();
    this.frame[2] = new XRstick();
    for(let f of this.frame){
      scene.addNode(f.node);
    }

    this.visible = function( mode)
    {

    }

    // harp (.bnode)
    this.hover = function(idx){
      // called when a laser is hovered
      let sel = isSelecting();

      if( idx > 0 && sel > 0){
        // selecting and hover
        if( this.bit != null){
          this.bit.ctrl.setValue(idx, 1+sel);    // send value to bit. sel ==1 for lefthand and 2 for right hand.
        }else {
          debugmsg("bit is null");
        }
      }
    }

    this.hitTest = function(hit)
    {
      let s;

      for(s of this.lasers){
        s.selected = false;
        if(s.hitTest(hit) ){
          s.selected = true;
          return true;
        }
      }
  
    }
  
    this.update = function(time)
    { let node;
      const b_x = this.bit.x;
      const b_y = this.bit.y;
      const b_w = this.bit.w;
      const b_h = this.bit.h;
      let mapw = mapW2XR(b_w);
      let maph = mapH2XR(b_h);
      const mapx = mapX2XR(b_x)-4;
      const mapy = mapY2XR(b_y);
      let b_z = this.position[2]+1;
  
      for(let l of this.lasers){
        l.position = [ mapx , mapy, b_z+(l.idx- this.numBeams / 2)*this.spread];
        l.dirty = true;
        l.update(time);
      }
      this.frame[0].setStick(mapx, mapy, b_z +(-2 - this.numBeams / 2)*this.spread, 2.0, 0, 0, 90);
      this.frame[0].setColor( 1.0, 0.0, 0.0, 1.0);
      this.frame[1].setStick(mapx , mapy, b_z+( 2 + (this.numBeams-2) / 2)*this.spread, 2.0, 0, 0, 90);
      this.frame[2].setStick(mapx , mapy+2, b_z+(-2 - this.numBeams / 2)*this.spread, (this.numBeams+3)*this.spread, 0, -90, 0);
      this.frame[2].setColor( 0.0, 0.0, 1.0, 1.0);
      for(let f of this.frame){
//        debugmsg("H up frame "+f.position[0]+" "+f.position[1]);
        f.update(time);
      }
  
    }
  
    this.remove = function()
    {

    }


}
