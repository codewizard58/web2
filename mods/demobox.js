// demobox.js
// part of the XR samples
// now as its own module
//

import {BoxBuilder} from './js/render/geometry/box-builder.js';
import {Renderer, createWebGLContext} from './js/render/core/renderer.js';
import {PbrMaterial} from './js/render/materials/pbr.js';
import {Node} from './js/render/core/node.js';



export function demoBox(scene, renderer)
{
  this.boxBuilder = new BoxBuilder();
  this.boxBuilder.pushCube([0, 0, 0], 0.4);
  this.boxPrimitive = this.boxBuilder.finishPrimitive(renderer);
  this.boxes = [];
  this.currently_selected_boxes = [null, null];
  this.currently_grabbed_boxes = [null, null];
  this.hitResult = null;
  this.renderer = renderer;
  this.scene = scene;
  

  this.setHitResult = function(hitResult)
  {
    this.hitResult = hitResult;
  }

  this.visible = function(state)
  { let old=false;
    for( let box of this.boxes){
      if( box.node.visible ){
        old = true;
      }
      box.node.visible = state;
    }
    return old;
  }


  
  this.addBox= function(x, y, z, r, g, b) 
  {
    let boxMaterial = new PbrMaterial();
    boxMaterial.baseColorFactor.value = [r, g, b, 0.5];
    let boxRenderPrimitive = renderer.createRenderPrimitive(this.boxPrimitive, boxMaterial);
    let boxNode = new Node();
    boxNode.addRenderPrimitive(boxRenderPrimitive);
    // Marks the node as one that needs to be checked when hit testing.
    boxNode.selectable = true;
    this.boxes.push({
      node: boxNode,
      renderPrimitive: boxRenderPrimitive,
      position: [x, y, z],
      scale: [1, 1, 1],
    });
    debugmsg("Num boxes="+this.boxes.length);
    return boxNode;
  }

  this.onSessionStarted = function(session)
  {

    this.scene.addNode( this.addBox(-1.0, 1.2, -1.3, 1.0, 0.0, 0.0));
    this.scene.addNode( this.addBox(0.0, 1.2, -1.5, 0.0, 1.0, 0.0));
    this.scene.addNode( this.addBox(1.0, 1.2, -1.3, 0.0, 0.0, 1.0));
  
  
  }

  this.onSelectStart = function(ev)
  {
    if( this.hitResult == null){
        return;
    }
    for (let box of this.boxes) {
      if (this.hitResult.node == box.node) {
        let i = (ev.inputSource.handedness == "left") ? 0 : 1;
        this.currently_selected_boxes[i] = box;
        box.scale = [1.25, 1.25, 1.25];
        box.selected = false;
      }
    }

  }

  this.onSelectEnd = function(ev)
  {  let i = (ev.inputSource.handedness == "left") ? 0 : 1;

    let currently_selected_box = this.currently_selected_boxes[i];  
    if (currently_selected_box != null) {
      if (currently_selected_box.selected) {
        // it is expected that the scale is 0.75 (see onSelectStart). This should make the scale 1.0
        vec3.add(currently_selected_box.scale, currently_selected_box.scale, [0.25, 0.25, 0.25]);
        currently_selected_box.selected = false;
      } else {
        // there was no 'select' event: final cube's size will be smaller.
        currently_selected_box.scale = [0.75, 0.75, 0.75];
      }
      this.currently_selected_boxes[i] = null;
    }
  }

  this.onSelect = function(ev)
  { let i = (ev.inputSource.handedness == "left") ? 0 : 1;

    let currently_selected_box = this.currently_selected_boxes[i];  
    if (currently_selected_box != null) {
      // Change the box color to something random.
      let uniforms = currently_selected_box.renderPrimitive.uniforms;
      uniforms.baseColorFactor.value = [Math.random(), Math.random(), Math.random(), 1.0];
      // it is expected that the scale is 1.25 (see onSelectStart). This should make the scale 0.75
      vec3.add(currently_selected_box.scale, currently_selected_box.scale, [-0.5, -0.5, -0.5]);
      currently_selected_box.selected = true;
    }
  
  }

  this.onSqueezeStart = function(ev)
  { let i = (ev.inputSource.handedness == "left") ? 0 : 1;

    if( this.hitResult == null){
        return;
    }
    // Check to see if the hit result was one of our boxes.
    for (let box of this.boxes) {
      if (this.hitResult.node == box.node && !box.grabbed) {
        this.currently_grabbed_boxes[i] = box;
        box.scale = [0.1, 0.1, 0.1];
        box.originalPos = box.position;
        box.grabbed = true;
      }
    }
  }

  this.onSqueezeEnd = function(ev)
  { let i = (ev.inputSource.handedness == "left") ? 0 : 1;

    let currently_grabbed_box = this.currently_grabbed_boxes[i];  
    if (currently_grabbed_box != null && currently_grabbed_box.grabbed) {
      // the scale of 'grabbed' box is 0.1. Restore the original scale.
      vec3.add(currently_grabbed_box.scale, currently_grabbed_box.scale, [1, 1, 1]);
      currently_grabbed_box.position = currently_grabbed_box.originalPos;
      currently_grabbed_box.grabbed = false;
      this.currently_grabbed_boxes[i] = null;
    }
  
  
  }

  this.onSqueeze = function(ev)
  { let i = (ev.inputSource.handedness == "left") ? 0 : 1;

    let currently_grabbed_box = this.currently_grabbed_boxes[i];  
    if (currently_grabbed_box != null && currently_grabbed_box.grabbed) {
      // Change the box color to something random, so we can see that 'squeeze' was invoked.
      let uniforms = currently_grabbed_box.renderPrimitive.uniforms;
      uniforms.baseColorFactor.value = [Math.random(), Math.random(), Math.random(), 1.0];
    }

  }

  this.onFrame = function(inputSource, grabPos)
  { let i = (inputSource.handedness == "left") ? 0 : 1;

    if ( this.currently_grabbed_boxes[i] != null && this.currently_grabbed_boxes[i].grabbed) {
      this.currently_grabbed_boxes[i].position = grabPos;
    }
  }

  this.update = function(time)
  {
    // Update the matrix for each box
    for (let box of this.boxes) {
      let node = box.node;
      mat4.identity(node.matrix);
      mat4.translate(node.matrix, node.matrix, box.position);
      mat4.rotateX(node.matrix, node.matrix, time/1000);
      mat4.rotateY(node.matrix, node.matrix, time/1500);
      mat4.scale(node.matrix, node.matrix, box.scale);
    }
  }
  
}

