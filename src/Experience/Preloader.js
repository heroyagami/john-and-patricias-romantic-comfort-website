import * as THREE from "three/webgpu";

import { EventEmitter } from "events";
import { Experience } from "./Experience";

import gsap from "gsap";

export class Preloader extends EventEmitter {
  constructor() {
    super();
    this.experience = Experience.getInstance();
    this.resources = this.experience.resources;

    this.preloader = document.querySelector(".preloader");
    this.progressBar = document.querySelector(".preloader__progress-bar");
    this.percentText = document.querySelector(".preloader__percent");
    this.progressWrapper = document.querySelector(
      ".preloader__progress-wrapper",
    );
    this.introEl = document.querySelector(".preloader__intro");
    this.enterBtn = document.getElementById("enter-btn");
    this.silentBtn = document.getElementById("enter-silent-btn");
    this.sceneReady = false;
    this._setButtonsReady(false);

    this.enterBtn.addEventListener("click", () => {
      this.experience.world.raycaster?.toggleMusic();
      this._loadDeferredScene();
      this._dismiss();
    });

    this.silentBtn.addEventListener("click", () => {
      this._loadDeferredScene();
      this._dismiss();
    });

    this.resources.on("progress", (value) => {
      this.onLoad(value);
    });

    this.resources.on("ready", () => {
      this.sceneReady = true;
      this._setButtonsReady(true);
    });

    requestAnimationFrame(() => this.playOutro());
  }

  onLoad(value) {
    const pct = Math.round(value * 100);
    this.progressBar.style.width = `${pct}%`;
    this.percentText.textContent = `${pct}%`;
    if (!this.sceneReady) this.enterBtn.textContent = `场景加载中 ${pct}%`;
  }

  _setButtonsReady(ready) {
    this.enterBtn.disabled = !ready;
    this.silentBtn.disabled = !ready;
    this.enterBtn.textContent = ready ? "进入我们的婚礼" : "场景加载中 0%";
    this.silentBtn.textContent = ready ? "静音进入" : "请稍候";
  }

  playOutro() {
    gsap.to([this.progressWrapper, this.percentText], {
      opacity: 0,
      duration: 0.3,
      delay: 0.5,
      onComplete: () => {
        this.progressWrapper.style.display = "none";
        this.percentText.style.display = "none";
        this.introEl.style.display = "flex";
        gsap.fromTo(
          this.introEl,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" },
        );
      },
    });
  }

  _dismiss() {
    gsap.to(this.preloader, {
      opacity: 0,
      duration: 0.6,
      ease: "power2.inOut",
      onComplete: () => {
        this.preloader.remove();
        this.emit("preloaderfinished");
      },
    });
  }

  _loadDeferredScene() {
    this.resources.loadDeferred().then(() => {
      const house = this.resources.items.houseReplacement;
      if (house) this.experience.world.room?.attachWeddingHouse(house);
    });
  }
}
