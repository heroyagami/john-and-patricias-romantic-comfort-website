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

    this.enterBtn.addEventListener("click", async () => {
      this.experience.world.raycaster?.toggleMusic();
      await this._prepareDeferredScene();
      this._dismiss();
    });

    this.silentBtn.addEventListener("click", async () => {
      await this._prepareDeferredScene();
      this._dismiss();
    });

    this.resources.on("progress", (value) => {
      this.onLoad(value);
    });

    this.resources.on("ready", () => {
      this.sceneReady = true;
      this._setButtonsReady(true);
      const warmHouse = () => this._loadDeferredScene();
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(warmHouse, { timeout: 1500 });
      } else {
        window.setTimeout(warmHouse, 500);
      }
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

  async _prepareDeferredScene() {
    if (this.entering) return;
    this.entering = true;
    this.enterBtn.disabled = true;
    this.silentBtn.disabled = true;
    this.enterBtn.textContent = "正在布置新房…";
    this.silentBtn.textContent = "请稍候";

    try {
      await this._loadDeferredScene();
    } catch (error) {
      console.warn("Unable to load the replacement house", error);
    }
  }

  _loadDeferredScene() {
    if (this.deferredScenePromise) return this.deferredScenePromise;

    this.deferredScenePromise = this.resources.loadDeferred().then(() => {
      const house = this.resources.items.houseReplacement;
      if (house) this.experience.world.room?.attachWeddingHouse(house);
    });
    return this.deferredScenePromise;
  }
}
