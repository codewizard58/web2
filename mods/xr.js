//
//Copyright 2018 The Immersive Web Community Group

//Permission is hereby granted, free of charge, to any person obtaining a copy of
//this software and associated documentation files (the "Software"), to deal in
//the Software without restriction, including without limitation the rights to
//use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
//the Software, and to permit persons to whom the Software is furnished to do so,
//subject to the following conditions:

//The above copyright notice and this permission notice shall be included in all
//copies or substantial portions of the Software.

//THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
//FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
//COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
//IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
//CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import {WebXRButton} from './js/util/webxr-button.js';
import {Scene} from './js/render/scenes/scene.js';
import {Renderer, createWebGLContext} from './js/render/core/renderer.js';
import {UrlTexture} from './js/render/core/texture.js';
import {ImageTexture} from './js/render/core/texture.js';
import {Gltf2Node} from './js/render/nodes/gltf2.js';
import {SkyboxNode} from './js/render/nodes/skybox.js';
import * as glMatrix from "./js/matrix/gl-matrix-min.js";
import {Node} from './js/render/core/node.js';
import {BitNode} from './mods/xrBit.js';
import {ButtonNode} from './js/render/nodes/button.js';
import {VideoNode} from './js/render/nodes/video.js';
import {BoxBuilder} from './js/render/geometry/box-builder.js';
import {PbrMaterial} from './js/render/materials/pbr.js';
import {mat4, vec3} from './js/render/math/gl-matrix.js';
import {Ray} from './js/render/math/ray.js';
import WebXRPolyfill from './js/third-party/webxr-polyfill/build/webxr-polyfill.module.js';
import { scale, set } from './js/third-party/gl-matrix/src/gl-matrix/mat2.js';
import {createXRLorenzNode,  createXRMandelNode, createXRPlayerNode, createXRWireNode, map2Dto3D, 
  mapX2XR, mapY2XR, mapW2XR, mapH2XR, xrBox, bitBuilder, setCtrlScene, createXRHarpNode} from './mods/xrctrls.js';


'use strict';
 var xrSession = null;
 var xrRequested = false;
 var xrOK = false;
 var xrCtrl = null;
 let xrRunning = false;
 let xrSelectedKnob = null;   // the selected knob
 let xrCurZ = [0, 0];

// Called when the user clicks the button to enter XR. If we don't have a
// session we'll request one, and if we do have a session we'll end it.
function UIonXRButtonClicked(xrmode) 
{   let f;
  let xr = bitformaction;

    debugmsg("UIonXRButtonClicked "+xrmode);

    if( xr != xrCtrl){
      debugmsg("xr != xrCtrl");
      return;
    }
    if( xr == null){
      return;
    }

    if( xrmode == 0){
        xr.getData();
        xr.setData();
        return;
    }
    
    if( xrmode == 1){
        if (xrSession== null && xrRequested == false) {
          xrRequested = true;
          navigator.xr.requestSession('immersive-vr').then( (session) => {
            session.isImmersive = true;
            xrSession = session;
            onSessionStarted(session);
          });
        }
        f = document.getElementById("xr-button");
        if( f.value != null){
          f.addEventListener('click', UIendXR);
        }
} else if( xrmode == 2){
      if( xrSession != null){
        xrSession.end();
        xrSession = null;
      }
      xrRequested = false;
    }
}

function UIstartXR()
{
  UIonXRButtonClicked(1);
}

function UIendXR()
{
  UIonXRButtonClicked(2);
}

let scene = null;
let renderer=null;
let gl;
let skybox = "";
let skyboxnode = null;

let room = "";
let roomnode = null;
let bitbuilder = null;
let bits = [];
let roomwidth = 4;
let roomheight = 4;
let xrWidth = 800;
let xrHeight = 600;
let showfloor = false;
let showDemo = true;

let selButton = null;
let scanner = null;
let docker = null;
let delButton = null;
let flipButton = null;
let flipvButton = null;

function setSkyBox(sb)
{
  if( skyboxnode != null){
    scene.removeNode( skyboxnode);
    skyboxnode = null;
  }
  skybox = sb;
  if( sb != ""){
    skyboxnode = new SkyboxNode({url: skybox});
    scene.addNode(skyboxnode);
  }

}

function setRoom(sb)
{
  if( roomnode != null){
    scene.removeNode( roomnode);
    roomnode = null;
  }
  room = sb;
  if( sb != ""){
    roomnode = new Gltf2Node({url: room});
    scene.addNode(roomnode);
  }
}

function setFloor(show){
  if(show){
    addFloorBox();
  }else if( floorNode != null){
      scene.removeNode(floorNode);
      floorNode = null;
  }
}


/////
function onResize() {
  gl.canvas.width = gl.canvas.clientWidth * window.devicePixelRatio;
  gl.canvas.height = gl.canvas.clientHeight * window.devicePixelRatio;
}


function decoration(bit, mode)
{
  if( mode == 0){
    selButton.visible(false);
    delButton.visible(false);
    flipButton.visible(false);
    flipvButton.visible(false);
  }else if( mode == 1){
    selButton.visible(true);
    delButton.visible(true);
    if( (bit.btype & 1 ) == 0){
      flipButton.visible(true);
    }else {
      flipvButton.visible(true);
    }
  }
}

  
// Called when we've successfully acquired a XRSession. In response we
// will set up the necessary session state and kick off the frame loop.
function onSessionStarted(session)
{
  session.addEventListener('end', onXRSessionEnded);

  let canvas;
  if(xrOK){
    canvas = document.createElement("canvas");

  }else {
    canvas = document.getElementById("playcanvas");
    debugmsg("Use playcanvas");
  
  }
  gl = canvas.getContext('webgl', { xrCompatible: true, preserveDrawingBuffer: true });

  //window.addEventListener('resize', onResize);
  //onResize();

  if( !session.isImmersive ){
  // Installs the listeners necessary to allow users to look around with
  // inline sessions using the mouse or touch.
    addInlineViewListeners(gl.canvas);
  }

  if( scene == null ){
    scene = new Scene();

    debugmsg("New scene");
    let stats = false;

    scene.enableStats(stats);

  }

  if( room != ""){
    setRoom(room);
  }

  renderer = new Renderer(gl);
  setCtrlScene(scene, renderer);

  // Set the scene's renderer, which creates the necessary GPU resources.
  scene.setRenderer(renderer);
  scene.inputRenderer.setControllerMesh(new Gltf2Node({url: 'media/gltf/controller/controller.gltf'}), 'right');
  scene.inputRenderer.setControllerMesh(new Gltf2Node({url: 'media/gltf/controller/controller-left.gltf'}), 'left');

  debugmsg("event handlers");

  session.addEventListener('selectstart', onXRSelectStart);
  session.addEventListener('selectend', onXRSelectEnd);
  // By listening for the 'select' event we can find out when the user has
  // performed some sort of primary input action and respond to it.
  session.addEventListener('select', onXRSelect);
//  session.addEventListener('select', onSelect);

  session.addEventListener('squeezestart', onXRSqueezeStart);
  session.addEventListener('squeezeend', onXRSqueezeEnd);
  session.addEventListener('squeeze', onXRSqueeze);

  if( skybox != ""){
    setSkyBox(skybox);
  }
  // this.scene.standingStats(true);
  
  if( showfloor){
    setFloor(showfloor);
  }
  
//        debugmsg("MAP 100="+this.mapX2XR(100)+" 200="+this.mapX2XR(200)+" w="+this.mapW2XR(100)+" "+this.mapH2XR(50));
  let bit;
  let i;

  debugmsg("Make info");
  let button = new createXRButton(0.0, 0.0, -1.0, 1, 1, "media/textures/info-button.png");
  button.visible(true);
  // scene.addNode(button.node);
  delButton = new createXRButton(0.0, 0.0, -1.0, 1, 1, "resources/images/remove.png");
  delButton.visible(true);
  scene.addNode(delButton.node);
  flipButton = new createXRButton(0.0, 0.0, -1.0, 1, 1, "resources/images/flip.png");
  flipButton.visible(true);
  scene.addNode(flipButton.node);
  flipvButton = new createXRButton(0.0, 0.0, -1.0, 1, 1, "resources/images/flip-v1.png");
  flipvButton.visible(true);
  scene.addNode(flipvButton.node);

  selButton = new createXRSelNode(0.15, 0.15, -0.9, 0.3, 0.3, [ 0.0, 1.0, 0.0, .9]);
  selButton.visible(true);
  scene.addNode(selButton.node);

  scanner = new createXRSelNode(0.15, 0.15, -0.9, 0.3, 0.3, [ 1.0, 0.0, 0.0, .9]);
  scanner.visible(true);
  scene.addNode(scanner.node);
  docker = new createXRSelNode(0.15, 0.15, -0.9, 0.3, 0.3, [ 1.0, 1.0, 1.0, .9]);
  docker.visible(false);
  scene.addNode(docker.node);

  bitbuilder = new bitBuilder(renderer);

  scene.inputRenderer.useProfileControllerMeshes(session);

  let glLayer = new XRWebGLLayer(session, gl);
  session.updateRenderState({ baseLayer: glLayer });
  xrImmersiveRefSpace = null;
  xrInlineRefSpace = null;

  // xrOK is false if we requested inline.
  if (xrOK && session.isImmersive ) {
    session.requestReferenceSpace('local-floor').then((refSpace) => {
      xrImmersiveRefSpace = refSpace;
      startDisplaying(session, 'local-floor');
    }, (e) => {
      debugmsg("local-floor not available");
      session.requestReferenceSpace('local').then((refSpace) => {
        xrImmersiveRefSpace = refSpace;
        startDisplaying(session, 'local');
      } );
    });
  }else {
    session.requestReferenceSpace('viewer').then((refSpace) => {
      let xform = new XRRigidTransform({x: 0, y: -1.5, z: 0});
      refSpace.getOffsetReferenceSpace(xform);
      xrInlineRefSpace = refSpace;
      startDisplaying(session, 'viewer');
    } );
  }

}

function startDisplaying(session, msg)
{
  let refSpace = xrImmersiveRefSpace;
  if( refSpace == null){
    refSpace = xrInlineRefSpace;
  }

  debugmsg("Start displaying "+msg);
  // Save the session-specific base reference space, and apply the current
  setRefSpace(session, refSpace, false);
  updateOriginOffset(session);

  session.requestReferenceSpace('viewer').then(function(viewerSpace){
    // Save a separate reference space that represents the tracking space
    xrViewerSpaces[session.mode] = viewerSpace;
    session.requestAnimationFrame(onXRFrame);
  });
}

function onEndSession(ev) {
  debugmsg("XR end session");

  if( xrSession != null){
    xrSession.end();
  }
  xrSession = null;
}


function onXRSessionEnded(event)
{ let f;
  debugmsg("XR session ended");

  bits = [];

  renderer = null;
  gl = null;
  if( scene != null){
    scene.clearNodes();
    scene.clearRenderPrimitives();
    debugmsg("Clear scene");
  }

  scene = null;

  if( xrSession != null){
    xrSession = null;
  }

  f = document.getElementById("xrsession");
  if( f != null){
    f.innerHTML = "";
  }
  xrRunning = false;
  xrRequested = false;
  initXR();   // reset
}


function  onXRSelectStart(ev) 
{ const frame = ev.frame;
  const session = frame.session;
  let i = (ev.inputSource.handedness == "left") ? 0 : 1;

  setSelecting(1+i);
  let refSpace = ev.frame.session.isImmersive ? getRefSpace(session, true) : xrInlineRefSpace;

    let headPose = ev.frame.getPose(xrViewerSpaces[session.mode], refSpace);
    if (headPose){

    // Get the position offset in world space from the tracking space origin
    // to the player's feet. The headPose position is the head position in world space.
    // Subtract the tracking space origin position in world space to get a relative world space vector.
      vec3.set(playerInWorldSpaceOld, headPose.transform.position.x, 0, headPose.transform.position.z);
      vec3.sub(
        playerOffsetInWorldSpaceOld,
        playerInWorldSpaceOld,
        trackingSpaceOriginInWorldSpace);
    }

  let targetRayPose = ev.frame.getPose(ev.inputSource.targetRaySpace, refSpace);
  if (!targetRayPose) {
    return;
  }

  vec3.copy(playerInWorldSpaceNew, playerInWorldSpaceOld);
  let rotationDelta = 0;

  let hitResult = scene.hitTest(targetRayPose.transform);
  if (hitResult) {
   // Check to see if the hit result was one of our boxes.

    for(let bit of bits){
      bit.hitTest(hitResult.node);
    }
    if (hitResult.node == floorNode) {
      // New position uses x/z values of the hit test result, keeping y at 0 (floor level)
      debugmsg('teleport ');
      playerInWorldSpaceNew[0] = hitResult.intersection[0];
      playerInWorldSpaceNew[1] = 0;
      playerInWorldSpaceNew[2] = hitResult.intersection[2];
    }

   quat.identity(rotationDeltaQuat);
   quat.rotateY(rotationDeltaQuat, rotationDeltaQuat, rotationDelta * Math.PI / 180);
   vec3.transformQuat(playerOffsetInWorldSpaceNew, playerOffsetInWorldSpaceOld, rotationDeltaQuat);
   trackingSpaceHeadingDegrees += rotationDelta;

   // Update tracking space origin so that origin + playerOffset == player location in world space
   vec3.sub(
     trackingSpaceOriginInWorldSpace,
     playerInWorldSpaceNew,
     playerOffsetInWorldSpaceNew);

   updateOriginOffset(session);

  }
}

function onXRSelectEnd(ev) {
  let i = (ev.inputSource.handedness == "left") ? 0 : 1;

  for(let bit of bits){
    setSelecting(0);
    bit.hitTest(null);
  }
}

function onXRSelect(ev) {
  let i = (ev.inputSource.handedness == "left") ? 0 : 1;
  let session = ev.frame.session;
  let refSpace = ev.frame.session.isImmersive ? getRefSpace(session, true) : xrInlineRefSpace;

  let headPose = ev.frame.getPose(xrViewerSpaces[session.mode], refSpace);
  if (headPose){
    // Get the position offset in world space from the tracking space origin
    // to the player's feet. The headPose position is the head position in world space.
    // Subtract the tracking space origin position in world space to get a relative world space vector.
    vec3.set(playerInWorldSpaceOld, headPose.transform.position.x, 0, headPose.transform.position.z);
    vec3.sub(
      playerOffsetInWorldSpaceOld,
      playerInWorldSpaceOld,
      trackingSpaceOriginInWorldSpace);
  }

  // based on https://github.com/immersive-web/webxr/blob/master/input-explainer.md#targeting-ray-pose
  // let targetRayPose = ev.frame.getPose(ev.inputSource.targetRaySpace, refSpace);
  let inputSourcePose = ev.frame.getPose(ev.inputSource.targetRaySpace, refSpace);
  if (!inputSourcePose) {
    return;
  }
  
  // Hit test results can change teleport position and orientation.
  let hitResult = scene.hitTest(inputSourcePose.transform);
  if( hitResult != null){
    setSelecting(1+i);
    for(let bit of bits){
      bit.hitTest(hitResult.node);
    }
  }

  // teleport
  if( floorNode != null)
  {
    vec3.copy(playerInWorldSpaceNew, playerInWorldSpaceOld);
    let rotationDelta = 0;

  if( hitResult != null){
    if (hitResult.node == floorNode) {
        // New position uses x/z values of the hit test result, keeping y at 0 (floor level)
        playerInWorldSpaceNew[0] = hitResult.intersection[0];
        playerInWorldSpaceNew[1] = 0;
        playerInWorldSpaceNew[2] = hitResult.intersection[2];
        debugmsg('teleport to'+ playerInWorldSpaceNew);
    }


    quat.identity(rotationDeltaQuat);
    quat.rotateY(rotationDeltaQuat, rotationDeltaQuat, rotationDelta * Math.PI / 180);
    vec3.transformQuat(playerOffsetInWorldSpaceNew, playerOffsetInWorldSpaceOld, rotationDeltaQuat);
    trackingSpaceHeadingDegrees += rotationDelta;

    // Update tracking space origin so that origin + playerOffset == player location in world space
    vec3.sub(
      trackingSpaceOriginInWorldSpace,
      playerInWorldSpaceNew,
      playerOffsetInWorldSpaceNew);

      updateOriginOffset(session);
    }
  }

}

function  onXRSqueezeStart (ev) 
{ const frame = ev.frame;
  const session = frame.session;
  let refSpace = ev.frame.session.isImmersive ? getRefSpace(session, true) : xrInlineRefSpace;
  let targetRayPose = ev.frame.getPose(ev.inputSource.targetRaySpace, refSpace);
  if (!targetRayPose) {
    return;
  }

  let hitResult = scene.hitTest(targetRayPose.transform);
  if (hitResult) {

    for( let bit of bits){
      let b = bit.bit;
      if(hitResult.node == bit.bnode.node && !bit.grabbed){
        bit.grabbed = true;
        bit.dragPos = bit.position;
        mx = b.x+5;
        my = b.y+5;
//        debugmsg("Bit grabbed "+b,name+" mx="+mx+" my="+my);
      }
      if( !bit.grabbed){
        for(let s=0; s < 4; s++){
          if ( bit.snaps[s] != null && hitResult.node == bit.snaps[s].node ){
            bit.grabbed = true;
            bit.dragPos = bit.position;
            mx = b.snaps[s].x+5;
            my = b.snaps[s].y+5;
//            debugmsg("Snap grabbed mx="+mx+" my="+my);
            break;
          }
        }
      }
      if( bit.grabbed){
        sketch.doMouseDown();
        break;
      }
   }
  }
}

function onXRSqueezeEnd(ev) {
  let i = (ev.inputSource.handedness == "left") ? 0 : 1;

  for( let bit of bits){
    if( bit.grabbed){
      bit.grabbed = false;
      debugmsg("Grab end ");
      sketch.doMouseUp();
    }
  }


}

function onXRSqueeze (ev) {
  let i = (ev.inputSource.handedness == "left") ? 0 : 1;

}

function getRefSpace(session, isOffset) {
  let ref= session.isImmersive ?
        (isOffset ? xrImmersiveRefSpaceOffset : xrImmersiveRefSpaceBase) :
        (isOffset ? xrInlineRefSpaceOffset : xrInlineRefSpaceBase);

  if( ref == null){
    ref = xrImmersiveRefSpace;
  }
  return ref;
}

function setRefSpace(session, refSpace, isOffset) {
  if (session.isImmersive) {
    if (isOffset) {
      xrImmersiveRefSpaceOffset = refSpace;
    } else {
      xrImmersiveRefSpaceBase = refSpace;
    }
  } else {
    if (isOffset) {
      xrInlineRefSpaceOffset = refSpace;
    } else {
      xrInlineRefSpaceBase = refSpace;
    }
  }
}



function onXRFrame (time, frame) {
  let session = frame.session;

  if( xrSession == null){
    debugmsg("XR frame session anded");
    return;
  }

  let refSpace = session.isImmersive ?  getRefSpace(session, true) : xrInlineRefSpace;

  if (!session.isImmersive ) {
    refSpace = getAdjustedRefSpace(refSpace);
  }

  let pose = frame.getViewerPose( refSpace);
  let n = 0;

  scene.startFrame();

  session.requestAnimationFrame(onXRFrame);

  // check if we can move grabbed objects
  for (let inputSource of frame.session.inputSources) 
  {
    let i = (inputSource.handedness == "left") ? 0 : 1;
    n++;

    let gamepad = inputSource.gamepad;
    if( gamepad != null){
      let msg="";
      let axes = gamepad.axes;
      let buttons = gamepad.buttons;
    
      if( axes != null){
        for(let ax=0; ax < axes.length; ax++){
          if( axes[ax] != 0){
            msg += " ["+ax+"] "+axes[ax];
          }

        }
        if( msg != ""){
          msg += " "+inputSource.handedness;
        }
      }
      if( msg != ""){
        debugmsg("gamepad "+msg+" "+(buttons ? buttons.length: 0));
      }
    }
    if (inputSource.gripSpace) {
      const gripPose = frame.getPose(inputSource.gripSpace, refSpace);
  
      if (gripPose) {
        let o = gripPose.transform.orientation;

        if( i == 1){
//          debugmsg("grip "+o.x+" "+o.y+" "+o.z+" "+o.w);
          if( xrSelectedKnob != null){
            xrSelectedKnob.setValue(o.z - xrCurZ[i]);
          }else {
            xrCurZ[i] = o.z;           // track current rotation 
          }
        }else {
          xrCurZ[i] = o.z;           // track current rotation 
        }
      }
    }


    let targetRayPose = frame.getPose(inputSource.targetRaySpace, refSpace);

    if (targetRayPose) {
      let targetRay = new Ray(targetRayPose.transform.matrix);
      let grabDistance = 0.1+i*0.9; // 10 cm
      let grabPos = vec3.fromValues(
          targetRay.origin[0], //x
          targetRay.origin[1], //y
          targetRay.origin[2]  //z
          );
      vec3.add(grabPos, grabPos, [
          targetRay.direction[0] * grabDistance,
          targetRay.direction[1] * grabDistance + 0.06, // 6 cm up to avoid collision with a ray
          targetRay.direction[2] * grabDistance,
          ]);

    
      let gx = (grabPos[0] / roomwidth) * xrWidth + xrWidth/2;
      let gy = (grabPos[1] / roomheight) * xrHeight + xrHeight/2;
  //    debugmsg("gx gy "+gx+" "+gy);
      for(let bit of bits){
        if( bit.grabbed ){
          mx = gx;
          my = xrHeight-gy;
  //        debugmsg("GMOVE "+mx+" "+my);
          sketch.doMouseMove();
        }
      }
    }

  }

  let bit;
  let i;
  let anysel = false;
  let drag = null;
  let snidx = -1;
  let dock = null;
  let dockidx = -1;
  let d = -1;

  if( selected != null){
    drag = selected.getDrag();
    if( drag != selected){
      for(i=0; i < drag.snaps.length; i++){
        if( drag.snaps[i] == selected){
          snidx = i;
          break;
        }
      }
      // snap selected
      scanner.visible(true);
      decoration(drag, 0);
    }else {
      // bit selected
      scanner.visible(false);
      decoration(drag, 1);
    }
  }else {
    // nothing selected
      scanner.visible(false);
      decoration(null, 0);
  }
  if( docktarget != null){
    dock = docktarget.getDrag();
    if( dock != docktarget){
      for(i=0; i < dock.snaps.length; i++){
        if( dock.snaps[i] == docktarget){
          dockidx = i;
          break;
        }
      }
      docker.visible(true);
    }else if(docker != null){
      docker.visible(false);
    }
  }else if(docker != null){
    docker.visible(false);
  }

  for(i = sketch.blist; i != null ; i = i.next){
    let s = null;
    i.bit.marked = true;
    if( drag != null && drag == i.bit){
      s = selButton;
      anysel = true;
    }
    d = -1;
    if( dock != null && dock == i.bit){
      d = dockidx;
    }
    for ( bit of bits) {
      if( bit.bit == i.bit){
        bit.marked = true;
        i.bit.marked = false;

        if( s != null){
          bit.snapidx = snidx;
          if( snidx >= 0){
            s = null;         // snap selected not bit.
          }
        }else {
          bit.snapidx = -1;
        }
        bit.selected = s;
        bit.dockidx = d;
        break;
      }
    }
  }

  // update the bits
  for ( bit of bits) {
    if( bit.marked && bit.bit != null){
      bit.update(time);
    }
  }
  // blist still marked are new
  for(i = sketch.blist; i != null ; i = i.next){
    if( i.bit.marked){
      bit = new createXRBit(i.bit);
      bits.push( bit);
      bit.marked = true;
    }
  }
  // unmarked bits are old.
  for ( bit of bits) {
    if( !bit.marked && bit.bit != null){
      debugmsg("Remove "+bit.bit.bitname);
      let i = bits.indexOf(bit);
      if (i > -1) {
        bits.splice(i, 1);
      }
      bit.remove();
      bit.bit = null;
      break;    // 
    }
    bit.marked = false;
  }

  scene.updateInputSources( frame, refSpace);
 // XRupdateInputSources(session, frame, refSpace);

  scene.drawXRFrame(frame, pose);

  scene.endFrame();


}


////////////////////////////////////////////////////////////////////////////////////////
// interface to bits world


///
function createXRSnap(snap, b_z, image)
{ 
  this.snap = snap;
  this.depth = b_z;
  this.index = 0;


  this.visible = function(state)
  { let old=false;
    if( this.node != null){
      old = this.node.visible;
      this.node.visible = state;
    }
    return old;
  }

  this._update = function()
  {
    const b_x = mapX2XR(this.snap.x);
    const b_y = mapY2XR(this.snap.y);
    const b_w = mapW2XR(this.snap.w)*10;
    const b_h = mapH2XR(this.snap.h)*10;
    let ah = 0;
    if(this.index == 2){
      ah = mapH2XR(40);
    }

    this.position = [b_x+b_w*0.05, b_y+b_h*0.05+ah, this.depth];
    this.scale = [b_w, b_h, 1.0];
  }

  this.update = function(time)
  { let node;
    this._update();

    node = this.node;
    mat4.identity(node.matrix);
    mat4.translate(node.matrix, node.matrix, this.position);
//          mat4.rotateX(node.matrix, node.matrix, 90 * Math.PI / 180);
    mat4.scale(node.matrix, node.matrix, this.scale);
    
  }

  this.texture = new UrlTexture(image);
  this.node = new BitNode(this.texture, () => {
    this.node.visible = true;
  });

  this._update();

}


function createXRBitNode(b_x, b_y, b_z, b_w, b_h, itype, image)
{ 
  this.node = null;
  debugmsg("bitnode "+b_x+" "+b_y+" "+image+" "+b_w+" "+b_h);
  if( itype == 0){
    this.texture = new UrlTexture(image);
  }else {
    image.src = "./local";
    image.complete = true;
    image.naturalWidth = true;
  
    this.texture = new ImageTexture(image);
    this.texture.genDataKey();
  }
  this.position = [b_x+b_w*0.05, b_y+b_h*0.05, b_z];
  this.scale = [b_w, b_h, 1.0];
  this.dragPos = null;
  this.grabbed = false;
  this.selected = false;

  // Create a button that plays the video when clicked.
  this.node = new BitNode(this.texture, () => {
    this.node.visible = true;
  });

  this.visible = function(state)
  { let old=false;
    if( this.node != null){
      old = this.node.visible;
      this.node.visible = state;
    }
    return old;
  }

  this.hitTest = function(hit)
  {
    this.selected = false;
    if( this.node == hit){
      this.selected = true;
    }
    return this.selected;
  }

}

function createXRSelNode(b_x, b_y, b_z, b_w, b_h, color)
{ 
  this.node = null;
 
  let boxBuilder = new BoxBuilder();
  let fw = 0.005;     // thickness of frame x,y
  let fs = 0.04;      // range
  let fd = 0.03;      // depth
  boxBuilder.pushBox([-fs-fw, -fs-fw, 0.01], [-fs+fw, fs+fw, 0.01+fd]);
  boxBuilder.pushBox([fs-fw, -fs-fw, 0.01], [fs+fw, fs+fw, 0.01+fd]);
  boxBuilder.pushBox([-fs-fw, -fs-fw, 0.01], [fs+fw, -fs+fw, 0.01+fd]);
  boxBuilder.pushBox([-fs-fw, fs-fw, 0.01], [fs+fw, fs+fw, 0.01+fd]);

  let boxPrimitive = boxBuilder.finishPrimitive(renderer);
  let boxMaterial = new PbrMaterial();
  if( color == null){
    color =  [0.0, 1.0, 0.0, 0.9];
  }
  boxMaterial.baseColorFactor.value = color;
  let boxRenderPrimitive = renderer.createRenderPrimitive(boxPrimitive, boxMaterial);
  this.node = new Node();
  this.node.addRenderPrimitive(boxRenderPrimitive);
  this.node.visible = true;

  this.position = [b_x+b_w*0.05, b_y+b_h*0.05, b_z];
  this.scale = [b_w, b_h, 1.0];
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
}


function createXRButton(b_x, b_y, b_z, b_w, b_h, image)
{ this.node = null;
  this.texture = new UrlTexture(image);

  // Create a button that plays the video when clicked.
  this.node = new ButtonNode(this.texture, () => {
    this.node.visible = true;
  });
  this.node.translation = [b_x, b_y, b_z];
  this.node.scale = [b_w, b_h, 1.0];

  this.visible = function(state)
  { let old=false;
    if( this.node != null){
      old = this.node.visible;
      this.node.visible = state;
    }
    return old;
  }
}

function xrKnob()
{ this.node = null;
  this.value = 0;
  this.bit = null;
  this.index = 0;
  this.depth = -2.0;
  this.oldac = -1;    // selected knob
  this.selected = false;
  this.renderPrimitive = null;
  let boxBuilder = new BoxBuilder();
  let fw = 0.01; 
  let fs = 0.04;      // range
  let fd = 0.1;       // depth
  let color =  [0.0, 0.0, 1.0, 0.9];
  boxBuilder.pushBox([-fs, -fw, 0.01], [fs, fw, 0.01+fd]);
  boxBuilder.pushBox([-fw-fw, -fs, 0.01], [fw+fw, 0.0, 0.01+fd]);
//  boxBuilder.pushBox([fs-fw, -fs-fw, 0.01], [fs+fw, fs+fw, 0.01+fd]);
//  boxBuilder.pushBox([-fs-fw, -fs-fw, 0.01], [fs+fw, -fs+fw, 0.01+fd]);
//  boxBuilder.pushBox([-fs-fw, fs-fw, 0.01], [fs+fw, fs+fw, 0.01+fd]);

  let boxPrimitive = boxBuilder.finishPrimitive(renderer);
  let boxMaterial = new PbrMaterial();
  if( color == null){
    color =  [0.0, 0.0, 1.0, 0.9];
  }
  boxMaterial.baseColorFactor.value = color;
  let boxRenderPrimitive = renderer.createRenderPrimitive(boxPrimitive, boxMaterial);
  this.node = new Node();
  this.node.addRenderPrimitive(boxRenderPrimitive);
  this.renderPrimitive = boxRenderPrimitive;
  this.node.visible = true;
  this.node.translation = [0.0, 0.0, 0.0];
  this.node.scale = [1.0, 1.0, 1.0];
  this.node.selectable = true;

  this.position = [0.0, 0.0, 0.0];
  this.scale = [0.1, 0.1, 1.0];

  this.initValue = 128;
  this.now = 0;                   // used to smooth out hover selection
  this.hoverEnd = 0;

  this.visible = function(state)
  { let old=false;
    if( this.node != null){
      old = this.node.visible;
      this.node.visible = state;
    }
    return old;
  }

  this.setColor = function(rc,gc,bc,ac)
  { let uniforms = this.renderPrimitive.uniforms;
    uniforms.baseColorFactor.value = [rc, gc, bc, ac];
  }


  // called with a delta value.
  this.setValue = function(val)
  { let ctrl=null;

//    debugmsg("Knob SV "+val);
    if( this.bit != null){
      ctrl = this.bit.ctrl;
    }
    if( ctrl == null){
      return;
    }

    ctrl.values[this.index] = checkRange(this.initValue - val*300);

  }

  // knobs
  this.update = function(time)
  { let ctrl=null;
    let node;
    let idx = this.index+this.index;
    this.now = time;

    if( xrSelectedKnob == this && !this.selected){
      if( this.hoverEnd < time){
        xrSelectedKnob = null;
      }
    }

    if( this.bit != null){
      ctrl = this.bit.ctrl;
    }
    if( ctrl == null){
      return;
    }
    // ctrl.values[0] = (time%2000) / 8;
    let ac = ctrl.getstep();


    this.value = ctrl.values[this.index];
    const mapx = mapX2XR(this.bit.x ) + mapW2XR(+ ctrl.knobs[idx]);
    const mapy = mapY2XR(this.bit.y) - mapH2XR(ctrl.knobs[idx+1]);
    let w = mapW2XR(25);
    let h = mapH2XR(50);
    let ah = Math.floor((this.bit.h/50))* h;

    this.position = [mapx, mapy+h, this.depth+0.02];
    this.scale = [ w*10, w*10, 1.0];

    node = this.node;
    mat4.identity(node.matrix);
    mat4.translate(node.matrix, node.matrix, this.position);
    mat4.rotateZ(node.matrix, node.matrix, -(this.value-135) * Math.PI / 180);
    mat4.scale(node.matrix, node.matrix, this.scale);

    if( this.selected){
      if( xrSelectedKnob != this ){
        // just selected.
        this.initValue = this.value;
//        debugmsg("init knob");
      }
      xrSelectedKnob = this;
      this.setColor( 0.0, 1.0, 0.0, 1.0);
    }else {
      if( ac != this.oldac){
        if( ac == this.index ){
          this.setColor( 1.0, 0.0, 0.0, 0.8);
        }else {
          this.setColor( 0.0, 0.0, 1.0, 0.8);
        }
        this.oldac = ac;
      }else {
        this.setColor( 0.0, 0.0, 1.0, 0.8);
      }
    }

  }

  this.link = function(bit, idx)
  {
    this.bit = bit;
    this.index = idx;
    debugmsg("Link knob "+idx);
  }

  this.onHoverStart = function()
  { let us = this.knob;        // node is (this)
    us.selected = true;
//    debugmsg("KHS "+us.index);
  }

  this.onHoverEnd = function()
  { let us = this.knob;        // node is (this)
//    debugmsg("KHE "+us.index);
    us.hoverEnd = us.now + 250;  // delay for 1/4 sec.
    us.selected = false;
  }


  this.setColor( 0.0, 0.0, 1.0, 1.0);

}

let imagenum = 1;

// global scene, bitbuilder
function createXRBit(bit)
{ const b_x = bit.x;
  const b_y = bit.y;
  const b_w = bit.w;
  const b_h = bit.h;
  this.ctrl = null;
  debugmsg("BL "+bit.name+" "+bit.x+" "+bit.y);

  this.snaps = [null, null, null, null];
  this.knobs = [];
  this.bit = bit;
  this.vert = 0;    // orientation check.
  this.bnode = null;
  this.marked = false;
  let s;
  this.boxNode = null;
  this.selected = null;
  this.snapidx = -1;
  this.dockidx = -1;
  this.renderPrimitive = null;

  const mapx = mapX2XR(b_x);
  const mapy = mapY2XR(b_y);
  let mapw = mapW2XR(b_w);
  let maph = mapH2XR(b_h);
  let w = mapW2XR(15);
  let h = mapH2XR(50);
  // adjust flipped y offset
  let ah = Math.floor((b_h/50)-1)* h;
  this.depth = -2.1;
  this.scale = [ mapw*10, maph*10, 1.0];
  this.scalebox = [ mapw*1.1, maph*1.1, 0.1];
  let image = null;
 
  this.addSnaps = function()
  { let n;
    let bit = this.bit;
    let names = [null, null, null, null];

    for(let n = 0; n < 4; n++){
      if( bit.snapnames[n] != null){
        names[n] = bitpicnames[bit.snapnames[n]]+".png";
      }else{
        names[n] = null;
      }
    }
  
    for(let sn=0; sn < 4; sn++){
      if( names[sn] != null){
        this.snaps[sn] = new createXRSnap(bit.snaps[sn], this.depth+sn*0.001, "resources/snaps/"+names[sn]);
        this.snaps[sn].index = sn;
      }
    }
  
  }

  this.addKnobs = function()
  { let i;
    let knob;

    for(i=0; i < this.ctrl.values.length; i++){
      knob =  new xrKnob();
      knob.link(this.bit, i);
      knob.depth = this.depth+0.01;
      this.knobs[i] = knob ; 
      scene.addNode( knob.node);
      knob.node.onHoverStart = knob.onHoverStart;
      knob.node.onHoverEnd = knob.onHoverEnd;
      knob.node.knob = knob;
      knob.node.selectable = true;
    }

  }

  this.addSnaps();
  
  let img = null;

  if( bit.ctrl != null){  
    this.ctrl = bit.ctrl;
    if( this.ctrl.bitname != null){
      img = this.ctrl.bitname+".png";
    }else if(this.ctrl.imagename != null){
      img = this.ctrl.imagename+".png";
    }

    if( bit.code != MIDIPLAYER && bit.code != 64){
      this.addKnobs();
    }
  }else if(bit.bitname != null){
    img = bit.bitname+".png";
  }

  if( bit.code == WIRE)
  {
    debugmsg("Wire");
    this.bnode = new createXRWireNode(mapx, mapy-ah, -1.1, mapw, maph,  1, "resources/bits/"+img);
    this.bnode.bit = bit;
  }else if( bit.code == MIDIPLAYER){
    debugmsg("player");
    this.bnode = new createXRPlayerNode(mapx, mapy-ah, -2.1, mapw, maph, 1, "resources/bits/"+img);
    this.bnode.bit = bit;
  }else if( bit.code == MANDELBROT){
    debugmsg("Mandelbrot");
    this.bnode = new createXRMandelNode(mapx, mapy-ah, -2.1, mapw, maph, 0, "resources/bits/"+img);
    this.bnode.bit = bit;
  }else if( bit.code == LORENZ){
    debugmsg("Lorenz 2");
    this.bnode = new createXRLorenzNode(mapx, mapy-ah, -2.1, mapw, maph, 1, "resources/bits/"+img);
    this.bnode.bit = bit;
  }else if( bit.code == HARP){
    debugmsg("harp");
    this.bnode = new createXRHarpNode(mapx, mapy-ah, -2.1, mapw, maph, 1, "resources/bits/"+img);
    this.bnode.bit = bit;
    // link lasers to frame
    for(let l of this.bnode.lasers){
      l.frame = this.bnode;
    }
  }
  if( img == null){
    img = "control.png";
  }

  debugmsg("XR img="+img);

  if( this.bnode == null){
    if( image != null){
      this.bnode = new createXRBitNode(mapx, mapy-ah, -1.1, mapw, maph, 1, image);
    }else {
      this.bnode = new createXRBitNode(mapx, mapy-ah, -1.1, mapw, maph, 0, "resources/bits/"+img);
    }
  }
  this.bnode.visible(true);

  if( this.bnode.node != null){   // not wire etc
    xrBox(this);
  }

  // add snaps as children
  for(s = 0; s < this.snaps.length; s++){
    if( this.snaps[s] != null){
      this.snaps[s].visible(true);
      scene.addNode(this.snaps[s].node);
    }
  }

  if( this.bnode.node != null){
    this.bnode.node.selectable = true;
    scene.addNode(this.bnode.node);
  }

  this.remove = function()
  { let s, sn;

    for(s = 0; s < this.snaps.length; s++){
      if( this.snaps[s] != null){
        scene.removeNode(this.snaps[s].node);
        this.snaps[s].node = null;
      }
    }
    for(let k of this.knobs){
        scene.removeNode(k.node);
        k.node = null;
    }
    if( this.bnode.node != null){
      scene.removeNode(this.bnode.node);
    }
    this.bnode.node = null;
    
    if( this.boxNode != null){
      scene.removeNode(this.boxNode);
      this.boxNode = null;
    }

  }

  this.hitTest = function(hit)
  {
    let s;
    let node = this.bnode;

    if( node != null){
      node.hitTest(hit);

      if(node.node == hit){
        this.selected = true;
        debugmsg("HIT BIT "+this.bit.name);
        return true;
      }
    }

    for(s = 0; s < this.snaps.length; s++){
      if( this.snaps[s] != null){
        let sn = this.snaps[s];
        if (hit == sn.node) {
          this.selected = true;
          debugmsg("HIT snap "+s+" "+this.bit.name);
          return true;
        }
      }
    }
    // use hover
//    for(s of this.knobs){
//      debugmsg("Hit test knob"+s.index);
//      s.selected = false;
//      if( hit == s.node){
//        s.selected = true;
//        this.selected = true;
//        return true;
//      }
//    }
    return false;
  }

  // has the bit moved? 
  this.update = function(time)
  { let node;
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
     
    let position = [mapx+mapw*0.5, mapy+maph*0.5-ah, this.depth];
    let positionbox = [mapx+mapw*0.5, mapy+maph*0.5-ah, this.depth-0.05];
    let positionsel = [mapx+mapw*0.5, mapy+maph*0.5-ah, this.depth+0.01];
    let selani = (time%1000)/ 1000;
    if( selani < 0.5){
      selani += 0.5;
    }
    let selscale = [this.scale[0] * selani, this.scale[1] * selani , this.scale[2]];
    let scanscale = [h * selani *12, h*selani * 12 , this.scale[2]];

 
    for(let i=0; i < 4; i++){
      let sn = this.snaps[i];
      if( sn != null){
        sn.update(time);
      }
    }

    for(let k of this.knobs){
        k.update(time);
    }

    node = this.bnode.node;
    if( node != null){
      mat4.identity(node.matrix);
      mat4.translate(node.matrix, node.matrix, position);
  //    mat4.rotateX(node.matrix, node.matrix, 90 * Math.PI / 180);
      mat4.scale(node.matrix, node.matrix, this.scale);
    }else {
      // self draw nodes
      this.bnode.update(time);
    }

    node = this.boxNode;
    if( node != null){
      mat4.identity(node.matrix);
      mat4.translate(node.matrix, node.matrix, positionbox);
  //    mat4.rotateX(node.matrix, node.matrix, 90 * Math.PI / 180);
      mat4.scale(node.matrix, node.matrix, this.scalebox);
    }

    if( this.selected != null){
      node = this.selected.node;
      mat4.identity(node.matrix);
      mat4.translate(node.matrix, node.matrix, positionsel);
//      mat4.rotateZ(node.matrix, node.matrix, time/1500);
      mat4.scale(node.matrix, node.matrix, selscale );

      node = delButton.node;
      mat4.identity(node.matrix);
      mat4.translate(node.matrix, node.matrix, [mapx-w-w, mapy+h+w+w, this.depth+0.02]);
//      mat4.rotateZ(node.matrix, node.matrix, time/1500);
      mat4.scale(node.matrix, node.matrix, [2.0, 2.0, 1.0]);

      node = flipButton.node;
      mat4.identity(node.matrix);
      mat4.translate(node.matrix, node.matrix, [mapx+mapw+w+w, mapy-w-w, this.depth+0.02]);
//      mat4.rotateZ(node.matrix, node.matrix, time/1500);
      mat4.scale(node.matrix, node.matrix, [2.0, 2.0, 1.0]);
    }
    
    if( this.snapidx >= 0 && this.snapidx < this.snaps.length ){
      let sn = this.snaps[this.snapidx];
      let selani2 = selani;
      if( docktarget != null){
        selani2 = (500 - time%500)/ 500;
      }

      node = scanner.node;
      mat4.identity(node.matrix);
      if( this.snapidx == 0 ){
        mat4.translate(node.matrix, node.matrix, [sn.position[0]-selani2/5, sn.position[1], sn.position[2]]);
        mat4.rotateY(node.matrix, node.matrix, 90 * Math.PI / 180);
      }else if( this.snapidx == 1){
        mat4.translate(node.matrix, node.matrix, [sn.position[0]+selani2/5, sn.position[1], sn.position[2]]);
        mat4.rotateY(node.matrix, node.matrix, 90 * Math.PI / 180);
      }else if( this.snapidx == 2){
        mat4.translate(node.matrix, node.matrix, [sn.position[0], sn.position[1]+selani2/5, sn.position[2]]);
        mat4.rotateX(node.matrix, node.matrix, -90 * Math.PI / 180);
      }else if( this.snapidx == 3){
        mat4.translate(node.matrix, node.matrix, [sn.position[0], sn.position[1]-selani2/5, sn.position[2]]);
        mat4.rotateX(node.matrix, node.matrix, -90 * Math.PI / 180);
      }
//      mat4.rotateZ(node.matrix, node.matrix, time/1500);
      mat4.scale(node.matrix, node.matrix, scanscale );
    }

    if( this.dockidx >= 0 && this.dockidx < this.snaps.length ){
      let sn = this.snaps[this.dockidx];
      let selani2 = (500 - time%500)/ 500;

      node = docker.node;
      mat4.identity(node.matrix);
      if( this.dockidx == 0 ){
        mat4.translate(node.matrix, node.matrix, [sn.position[0]-selani2/5, sn.position[1], sn.position[2]]);
        mat4.rotateY(node.matrix, node.matrix, 90 * Math.PI / 180);
      }else if( this.dockidx == 1){
        mat4.translate(node.matrix, node.matrix, [sn.position[0]+selani2/5, sn.position[1], sn.position[2]]);
        mat4.rotateY(node.matrix, node.matrix, 90 * Math.PI / 180);
      }else if( this.dockidx == 2){
        mat4.translate(node.matrix, node.matrix, [sn.position[0], sn.position[1]+selani2/5, sn.position[2]]);
        mat4.rotateX(node.matrix, node.matrix, -90 * Math.PI / 180);
      }else if( this.dockidx == 3){
        mat4.translate(node.matrix, node.matrix, [sn.position[0], sn.position[1]-selani2/5, sn.position[2]]);
        mat4.rotateX(node.matrix, node.matrix, -90 * Math.PI / 180);
      }
//      mat4.rotateZ(node.matrix, node.matrix, time/1500);
      mat4.scale(node.matrix, node.matrix, scanscale );
    }
  }
}




let xrImmersiveRefSpace;
let xrInlineRefSpace;
let xrImmersiveRefSpaceBase = null;
let xrImmersiveRefSpaceOffset = null;
let xrInlineRefSpaceBase = null;
let xrInlineRefSpaceOffset = null;
let xrViewerSpaces = {};

let trackingSpaceOriginInWorldSpace = vec3.create();
let trackingSpaceHeadingDegrees = 0;  // around +Y axis, positive angles rotate left
let floorSize = 10;
let floorPosition = [0, -floorSize / 2 + 0.01 -2, 0];
let floorNode = null;

// Used for updating the origin offset.
let playerInWorldSpaceOld = vec3.create();
let playerInWorldSpaceNew = vec3.create();
let playerOffsetInWorldSpaceOld = vec3.create();
let playerOffsetInWorldSpaceNew = vec3.create();
let rotationDeltaQuat = quat.create();
let invPosition = vec3.create();
let invOrientation = quat.create();

let lookYaw = 0;
let lookPitch = 0;
const LOOK_SPEED = 0.0025;

// XRReferenceSpace offset is immutable, so return a new reference space
// that has an updated orientation.
function getAdjustedRefSpace(refSpace) {
  // Represent the rotational component of the reference space as a
  // quaternion.
  let invOrientation = quat.create();
  quat.rotateX(invOrientation, invOrientation, -lookPitch);
  quat.rotateY(invOrientation, invOrientation, -lookYaw);
  let xform = new XRRigidTransform(
      {x: 0, y: 0, z: 0},
      {x: invOrientation[0], y: invOrientation[1], z: invOrientation[2], w: invOrientation[3]});
  return refSpace.getOffsetReferenceSpace(xform);
}

function updateOriginOffset(session) {
  // Compute the origin offset based on player position/orientation.
  quat.identity(invOrientation);
  quat.rotateY(invOrientation, invOrientation, -trackingSpaceHeadingDegrees * Math.PI / 180);
  vec3.negate(invPosition, trackingSpaceOriginInWorldSpace);
  vec3.transformQuat(invPosition, invPosition, invOrientation);
  let xform = new XRRigidTransform(
    {x: invPosition[0], y: invPosition[1], z: invPosition[2]},
    {x: invOrientation[0], y: invOrientation[1], z: invOrientation[2], w: invOrientation[3]});

  // Update offset reference to use a new originOffset with the teleported
  // player position and orientation.
  // This new offset needs to be applied to the base ref space.
  let refSpace = getRefSpace(session, false).getOffsetReferenceSpace(xform);
  setRefSpace(session, refSpace, true);

}


function rotateView(dx, dy) {
  lookYaw += dx * LOOK_SPEED;
  lookPitch += dy * LOOK_SPEED;
  if (lookPitch < -Math.PI*0.5)
      lookPitch = -Math.PI*0.5;
  if (lookPitch > Math.PI*0.5)
      lookPitch = Math.PI*0.5;
}

function xrGetXY(e) {
  let rc = e.target.getBoundingClientRect();
  let xmx = Math.floor(e.clientX - rc.left);
  let xw = rc.right - rc.left;
  let xw2 = Math.floor( xw / 2);
  let xscale = 0.54;
  let yscale = 0.4;
  let xmy = Math.floor(e.clientY - rc.top);
  let xh = rc.bottom - rc.top;
  let xh2 = Math.floor( xh / 2);

  mx = Math.floor(xw2+( xmx - xw2-50) * xscale)-75;
  my = Math.floor(xh2+( xmy - xh2-50) * yscale)-25;
  if (mx < 0) mx = 0;
  if (my < 0) my = 0;

//  debugmsg("XY "+bit.name+" "+bit.x+" "+mx);
//  bl = bl.next;
//  bit = bl.bit;
//  debugmsg("XY "+bit.name+" "+bit.snaps[1].x+" "+mx);
}



function addInlineViewListeners(canvas) {

  canvas.addEventListener('mousedown', (event) => {
    // Only rotate when the right button is pressed
    canvas.focus();
    xrGetXY(event);
    sketch.doMouseDown();
    event.preventDefault();
    event.stopPropagation();

  });

  canvas.addEventListener('mouseup', (event) => {
    xrGetXY(event);
    sketch.doMouseUp();
    event.stopPropagation();
    event.preventDefault();
  });

  canvas.addEventListener('mousemove', (event) => {
    if ( (event.buttons & 2) == 2) {
      rotateView(event.movementX, event.movementY);
    }else{
      xrGetXY(event);
      sketch.doMouseMove();
    }
    event.preventDefault();
    event.stopPropagation();
  });

  canvas.addEventListener('wheel', (event) => {
//      debugmsg("Wheel "+event.deltaY);
  });

  // Keep track of touch-related state so that users can touch and drag on
  // the canvas to adjust the viewer pose in an inline session.
  let primaryTouch = undefined;
  let prevTouchX = undefined;
  let prevTouchY = undefined;

  // Keep track of all active touches, but only use the first touch to
  // adjust the viewer pose.
  canvas.addEventListener("touchstart", (event) => {
    canvas.focus();
    if (primaryTouch == undefined) {
      let touch = event.changedTouches[0];
      primaryTouch = touch.identifier;
      prevTouchX = touch.pageX;
      prevTouchY = touch.pageY;
    }
  });

  // Update the set of active touches now that one or more touches
  // finished. If the primary touch just finished, update the viewer pose
  // based on the final touch movement.
  canvas.addEventListener("touchend", (event) => {
    for (let touch of event.changedTouches) {
      if (primaryTouch == touch.identifier) {
        primaryTouch = undefined;
        rotateView(touch.pageX - prevTouchX, touch.pageY - prevTouchY);
      }
    }
  });

  // Update the set of active touches now that one or more touches was
  // cancelled. Don't update the viewer pose when the primary touch was
  // cancelled.
  canvas.addEventListener("touchcancel", (event) => {
    for (let touch of event.changedTouches) {
      if (primaryTouch == touch.identifier) {
        primaryTouch = undefined;
      }
    }
  });

  // Only use the delta between the most recent and previous events for
  // the primary touch. Ignore the other touches.
  canvas.addEventListener("touchmove", (event) => {
    for (let touch of event.changedTouches) {
      if (primaryTouch == touch.identifier) {
        rotateView(touch.pageX - prevTouchX, touch.pageY - prevTouchY);
        prevTouchX = touch.pageX;
        prevTouchY = touch.pageY;
      }
    }
  });

  canvas.addEventListener("keydown",(event) => {
    let code = event.keyCode;
    canvas.focus();

    event.preventDefault();
    sketch.keyboard.KeyPress(code, 1);
    return false;
   });
   canvas.addEventListener("keyup",(event) => {
    let code = event.keyCode;

    event.preventDefault();
    sketch.keyboard.KeyPress(code, 0);
    return false;
   });
   canvas.addEventListener("keypress",(event) => {
    let code = event.keyCode;

    event.preventDefault();
    return false;
   });


}

function keydown(ev)
{	let code = ev.keyCode;

  debugmsg("Keydown "+code);
}

function keyup(ev)
{	let code = ev.keyCode;

  debugmsg("Keyup "+code);

}

function updateFov() 
{
  let fov = document.getElementById("xrfov");
  if( fov == null){
    return;
  }
  let value = parseFloat(fov.value);
  // The inlineVerticalFieldOfView is specified in radians.
  let radValue = value * (Math.PI / 180);

  if (xrSession!= null) {
    // As with any values set with updateRenderState, this will take
    // effect on the next frame.
    xrSession.updateRenderState({
      inlineVerticalFieldOfView: radValue
    });
  }
  
}


function addFloorBox() {
  let boxBuilder = new BoxBuilder();
  boxBuilder.pushCube([0, 0, 0], floorSize);
  let boxPrimitive = boxBuilder.finishPrimitive(renderer);

  let boxMaterial = new PbrMaterial();
  boxMaterial.baseColorFactor.value = [0.3, 0.3, 0.3, 1.0];
  let boxRenderPrimitive = renderer.createRenderPrimitive(boxPrimitive, boxMaterial);

  floorNode = new Node();
  floorNode.addRenderPrimitive(boxRenderPrimitive);
  floorNode.selectable = true;
  scene.addNode(floorNode);
  mat4.identity(floorNode.matrix);
  mat4.translate(floorNode.matrix, floorNode.matrix, floorPosition);
}


// an XR headset interface bit
//
xrBit.prototype = Object.create(control.prototype);
function xrBit(bit)  
{	control.call(this, bit);
	this.bit = bit;
  this.dragging = null;
  this.selected = null;
  this.scanning = null;
  this.vctx = null;
  this.image = null;
  this.previmage = null;
  this.keepimage = false;

  
  this.setValue = function(data, chan)
  { const bit = this.bit;

    if( bit == null){
      return;
    }

    // readpixel not reliable.
    if( chan == 0){
      if( this.image != null && this.keepimage){
        this.previmage = this.image;
      }

      this.image = null;
    }

  }
      
  this.Draw = function( )
  {	const b = this.bit;
    let cnt = 0;
    let len = 0;
    let x=1;
    let y;
    let points;
    let max;
  

    if( b == null){
      return;
    }


    ctx.fillStyle = "#000000";
    ctx.fillRect(b.x, b.y, b.w, b.h );

    
    if(this.previmage != null){
      ctx.putImageData(this.previmage, b.x, b.y);
    }
    
    ctx.strokeStyle = "#ff0000";			// red
    ctx.lineWidth = 2;
// bounding box
    ctx.strokeRect(b.x, b.y, b.w, b.h);

  }    


    // Called every time the XRSession requests that a new frame be drawn.
  this.setData = function()
  {	let msg="";
    let f;

      if( bitform != null){
          bitform.innerHTML="";
      }
      bitformaction = this;

      debugmsg("XR setdata");

      bitform = document.getElementById("bitform");
      if( bitform != null){
          if( xrOK && xrSession == null){
              msg += "<input type='button' id='xr-button' value='Enter XR' />";
          }else if( xrOK && xrSession != null){
            msg += "<input type='button' id='xr-button'  value='Exit XR' />";
          }else {
            msg += "<input type='button' id='xr-button' value='Not available' />";
          }
          msg += "<table>";
          msg += "<tr><th>Headset</th></tr>\n";
          msg += "<tr><th>sky</th><td><select id='xrsky'  onchange='UImedia(0);' >";
          msg += "<option value='' "+isSelected(skybox, '')+">Blank</option>\n";
          msg += "<option value='media/textures/milky-way-4k.png' "+isSelected(skybox, "media/textures/milky-way-4k.png")+">Milky Way</option>\n";
          msg += "</select></td></tr>\n";
          msg += "<tr><th>room</th><td><select id='xrroom'  onchange='UImedia(0);' >";
          msg += "<option value='' "+isSelected(room, '')+">Blank</option>\n";
          msg += "<option value='media/gltf/home-theater/home-theater.gltf' "+isSelected(room, 'media/gltf/home-theater/home-theater.gltf')+">Movie</option>\n";
          msg += "<option value='media/gltf/cave/cave.gltf' "+isSelected(room, 'media/gltf/cave/cave.gltf')+">Cave</option>\n";
          msg += "<option value='media/gltf/cube-room/cube-room.gltf' "+isSelected(room, 'media/gltf/cube-room/cube-room.gltf')+">Cubes</option>\n";
          msg += "</select></td></tr>\n";
          msg += "<tr><th>Floor</th><td><input type='checkbox' id='xrfloor' "+(showfloor ? "checked" : "")+" onchange='UImedia(0);' /></td></tr>\n";
          msg += "<tr><th>Demo boxes</th><td><input type='checkbox' id='xrdemo' "+(showDemo ? "checked" : "")+" /></td></tr>\n";

          msg += "</table>\n";
          bitform.innerHTML = msg;
          bitformaction = this;

          f = document.getElementById("xr-button");
          if( f.value != null){
            debugmsg("Add handler");
            f.addEventListener('click', UIstartXR);
          }

      }

  }


  this.getData = function()
  {	let f = null;
    let s = new saveargs();

    s.addarg("control");
    s.addarg( "headset");

    f = document.getElementById("xrsky");
    if( f != null){
      s.addarg("skybox");
      s.addarg(f.value);
    }      
    f = document.getElementById("xrroom");
    if( f != null){
      s.addarg("room");
      s.addarg(f.value);
    }      
    f = document.getElementById("xrfloor");
    if( f != null){
      s.addarg("floor");
      s.addarg(f.checked ? 1 : 0);
    }      
    f = document.getElementById("xrdemo");
    if( f != null){
      s.addarg("demo");
      s.addarg(f.checked ? 1 : 0);
    }      

    this.doLoad(s.getdata(), 0);
  }

  this.doLoad = function(initdata, idx)
	{	let param="";
		let val = "";
    let len = initdata[idx];
		let n = 1;

    for(n = 1; n < len ; n += 2){
			param = initdata[idx+n];
			val = initdata[idx+n+1];

			if( param == "'control'" || param == "control"){
				continue;
			}
      if( param == "skybox"){
        if( skybox != val){
          setSkyBox(val);
        }
      }else if( param == "room"){
        if( room != val){
          setRoom(val);
        }
      }else if( param == "floor"){
        let sf = (val == 1 );
        if( showfloor != sf){
          showfloor = sf;
          setFloor(sf);
        }
      }else if( param == "demo"){
        let sd = (val == 1);
        if(showDemo != sd){
          setDemo(sd);
        }
        showDemo = sd;
      }

    }

  
    
  }

  xrCtrl = this;

}

function xrFunc(code)
{ let bit;
  let x;
  debugmsg("xrFunc "+code);

  if( code == 0){
    bitformaction.getData();
    bitformaction.setData();
    return;
  }

  if( code == 1){
    bit = mediaGetBit();
    if( bit != null){
      x = new xrBit( bit );
      mediaSetBit(x);
    }
  }

}

function newXRinline()
{
  xrOK = false;
  newXR();

}


function newXR()
{ let bit;
  let x;
  let f;

  debugmsg("newXR");
  
  mediaSetFunc( xrFunc);

  bit = mediaGetBit();
  if( bit != null){
    x = new xrBit( bit );
    mediaSetBit(x);
  }
  f = document.getElementById("xrcontrols");
  if( f != null){
    f.style.display="none";
  }

  xrWidth = sketch.canvas.width;
  xrHeight = sketch.canvas.height;

  f = document.getElementById("playcanvas");
  if( f != null){
    xrWidth = f.width;
    xrHeight = f.height;
  }

  map2Dto3D(xrWidth, xrHeight, roomwidth, roomheight);

  if( !xrRunning ){
    xrRunning = true;
    if( !xrOK){
      // Start up an inline session, which should always be supported on
      // browsers that support WebXR regardless of the available hardware.
      navigator.xr.requestSession('inline').then((session) => {
        session.isImmersive = false;
        xrSession = session;
  
        f = document.getElementById("xrbutton");
        if( f != null){
          f.disabled = true;
        }
        f = document.getElementById("xrbutton3");
        if( f != null){
          f.addEventListener("click" , onEndSession);
          f.disabled = false;
        }
        f = document.getElementById("xrbutton2");
        if( f != null){
          f.disabled = true;
        }
        f = document.getElementById("xrsession");
        if( f != null){
          f.innerHTML = "Inline";
        }
        onSessionStarted(xrSession);
        updateFov();
        UIshowplay();
      });
    }else {
      debugmsg("request immersive");
      navigator.xr.requestSession('immersive-vr').then( (session) => {
        session.isImmersive = true;
        xrSession = session;
        f = document.getElementById("xrbutton");
        if( f != null){
          f.disabled = true;
        }
        f = document.getElementById("xrbutton3");
        if( f != null){
          f.addEventListener("click" , onEndSession);
          f.disabled = false;
        }
        f = document.getElementById("xrbutton2");
        if( f != null){
          f.disabled = true;
        }

        f = document.getElementById("xrsession");
        if( f != null){
          f.innerHTML = 'immersive-vr';
        }
        onSessionStarted(xrSession);
            
      });
    }

  }else {
    debugmsg("XR running");
  }

}

let polyfill;

function initXR()
{ let f;

  debugmsg("initxr");
  if( !navigator.xr){
        polyfill = new WebXRPolyfill();
  }

  if (navigator.xr) {
    navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
      if (supported) {
        xrOK = true;
      }

      f = document.getElementById("xrbutton");
      if( f != null){
        f.addEventListener("click" , newXR);
        f.value = "Use VR";
        f.disabled = false;
      }
      // only use when immersive is available.
      f = document.getElementById("xrbutton2");
      if( f != null ){
        f.addEventListener("click" , newXRinline);
        f.value = "Use Inline VR";
        f.disabled = !xrOK;   // only enable when choise
      }

      // end vr button, disable when not in VR
      f = document.getElementById("xrbutton3");
      if( f != null){
        f.disabled = true;
      }
    });

  }else {
    debugmsg("Use polyfill");
  }
}

initXR();


