// Copyright 2018 The Immersive Web Community Group
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import {Material} from './js/render/core/material.js';
import {Node} from './js/render/core/node.js';
import {PrimitiveStream} from './js/render/geometry/primitive-stream.js';

const BUTTON_ICON_SIZE = 0.1;
const BUTTON_LAYER_DISTANCE = 0.005;
const BUTTON_HOVER_SCALE = 1.1;
const BUTTON_HOVER_TRANSITION_TIME_MS = 200;


class BitIconMaterial extends Material {
  constructor() {
    super();

    this.state.blend = true;

    this.defineUniform('hoverAmount', 0);
    this.icon = this.defineSampler('icon');
  }

  get materialName() {
    return 'BUTTON_ICON_MATERIAL';
  }

  get vertexSource() {
    return `
    attribute vec3 POSITION;
    attribute vec2 TEXCOORD_0;

    uniform float hoverAmount;

    varying vec2 vTexCoord;

    vec4 vertex_main(mat4 proj, mat4 view, mat4 model) {
      vTexCoord = TEXCOORD_0;
      float scale = mix(1.0, ${BUTTON_HOVER_SCALE}, hoverAmount);
      vec4 pos = vec4(POSITION.x * scale, POSITION.y * scale, POSITION.z * (scale + (hoverAmount * 0.2)), 1.0);
      return proj * view * model * pos;
    }`;
  }

  get fragmentSource() {
    return `
    uniform sampler2D icon;
    varying vec2 vTexCoord;

    vec4 fragment_main() {
      return texture2D(icon, vTexCoord);
    }`;
  }
}

export class BitNode extends Node {
  constructor(iconTexture, callback) {
    super();

    // All buttons are selectable by default.
    this.selectable = true;

    this._selectHandler = callback;
    this._iconTexture = iconTexture;
    this._hovered = false;
  }

  get iconTexture() {
    return this._iconTexture;
  }

  set iconTexture(value) {
    if (this._iconTexture == value) {
      return;
    }

    this._iconTexture = value;
    this._iconRenderPrimitive.samplers.icon.texture = value;
  }

  onRendererChanged(renderer) {
    let stream = new PrimitiveStream();

    let hd = BUTTON_LAYER_DISTANCE * 0.5;
    let hs = BUTTON_ICON_SIZE * 0.5;

    stream.clear();
    stream.startGeometry();

    stream.pushVertex(-hs, hs, hd, 0, 0, 0, 0, 1);
    stream.pushVertex(-hs, -hs, hd, 0, 1, 0, 0, 1);
    stream.pushVertex(hs, -hs, hd, 1, 1, 0, 0, 1);
    stream.pushVertex(hs, hs, hd, 1, 0, 0, 0, 1);

    stream.pushTriangle(0, 1, 2);
    stream.pushTriangle(0, 2, 3);

    stream.endGeometry();

    let iconPrimitive = stream.finishPrimitive(renderer);
    let iconMaterial = new BitIconMaterial();
    iconMaterial.icon.texture = this._iconTexture;
    this._iconRenderPrimitive = renderer.createRenderPrimitive(iconPrimitive, iconMaterial);
    this.addRenderPrimitive(this._iconRenderPrimitive);
  }

  onHoverStart() {
    this._hovered = true;
  }

  onHoverEnd() {
    this._hovered = false;
  }

  _updateHoverState() {
  }

  onUpdate(timestamp, frameDelta) {

  }

}

