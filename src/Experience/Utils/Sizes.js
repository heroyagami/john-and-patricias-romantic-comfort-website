import * as THREE from "three/webgpu";

import { EventEmitter } from "events";

export class Sizes extends EventEmitter {
  constructor() {
    super();
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.aspect = this.width / this.height;
    this.pixelRatio = this.getPixelRatio();

    window.addEventListener("resize", () => {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.aspect = this.width / this.height;
      this.pixelRatio = this.getPixelRatio();
      this.emit("resize");
    });
  }

  getPixelRatio() {
    // High-DPI mobile screens can exhaust GPU memory quickly in this 3D scene
    // and cause Safari/WeChat to silently reload the page.
    const mobile = window.matchMedia("(max-width: 768px)").matches;
    return Math.min(window.devicePixelRatio, mobile ? 1.35 : 2);
  }
}
