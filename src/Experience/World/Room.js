import * as THREE from "three/webgpu";
import {
  texture,
  uv,
  positionWorld,
  normalWorld,
  vec2,
  vec3,
  vec4,
  select,
  uniform,
  time,
  mx_noise_float,
  mix,
} from "three/tsl";
import gsap from "gsap";
import { Experience } from "../Experience";
import {
  spotProjectionMatrixUniform,
  spotProjectionMatrixUniform2,
  spotProjectionMatrixUniform3,
} from "./Environment";

export class Room {
  constructor() {
    this.experience = Experience.getInstance();
    this.model = this.experience.resources.items.room.scene;
    this.goboTex = this.experience.resources.items.goboTexture;
    this.goboTex.colorSpace = THREE.NoColorSpace;
    this.goboTex.generateMipmaps = true;
    this.goboTex.minFilter = THREE.LinearMipmapLinearFilter;
    this.goboTex.anisotropy = 16;
    this.goboTex.needsUpdate = true;
    this.init();
  }

  init() {
    this.uGoboStrength = uniform(0.5);
    const uGoboStrength = this.uGoboStrength;
    const uSwayAmount = uniform(0.008);
    const uSwaySpeed = uniform(0.2);
    const uGoboBlur = uniform(0.0);
    this.uDayNight = uniform(0.0);
    this.isNight = false;

    const items = this.experience.resources.items;
    const originalHouseAndDeskProps =
      this.model.getObjectByName("First_House_Baked");
    if (originalHouseAndDeskProps) {
      // The original cottage, cutting mat, desk tools and wall lettering share
      // one baked mesh. A tiny depth offset tucks the coplanar English lettering
      // behind the wall while keeping the raised desk props visible.
      originalHouseAndDeskProps.position.z -= 0.18;
    }

    this.attachWeddingHouse(items.houseReplacement);

    this.createWeddingWallQuote();

    const ordinalTextureMap = {
      First: items.firstTexture,
      Second: items.secondTexture,
      Third: items.thirdTexture,
      Fourth: items.fourthTexture,
      Fifth: items.fifthTexture,
      Sixth: items.sixthTexture,
      Seventh: items.seventhTexture,
      Eighth: items.eighthTexture,
      Ninth: items.ninthTexture,
    };
    const ordinalNightTextureMap = {
      First: items.firstNightTexture ?? items.firstTexture,
      Second: items.secondNightTexture ?? items.secondTexture,
      Third: items.thirdNightTexture ?? items.thirdTexture,
      Fourth: items.fourthNightTexture ?? items.fourthTexture,
      Fifth: items.fifthNightTexture ?? items.fifthTexture,
      Sixth: items.sixthNightTexture ?? items.sixthTexture,
      Seventh: items.seventhNightTexture ?? items.seventhTexture,
      Eighth: items.eighthNightTexture ?? items.eighthTexture,
      Ninth: items.ninthNightTexture ?? items.ninthTexture,
    };
    const storyCardTexture = this.createWeddingAttachmentTexture(
      "我们的故事",
      "从相遇，到相守",
    );
    const vowCardTexture = this.createWeddingAttachmentTexture(
      "给彼此的话",
      "朝暮与年岁并往",
    );
    const attachmentTextures = {
      Ninth_Attachment_John: {
        day: storyCardTexture,
        night: storyCardTexture,
      },
      Ninth_Attachment_Patricia: {
        day: vowCardTexture,
        night: vowCardTexture,
      },
    };

    [
      ...Object.values(ordinalTextureMap),
      ...Object.values(ordinalNightTextureMap),
    ].forEach((t) => {
      if (t) {
        t.flipY = false;
        t.generateMipmaps = true;
        t.minFilter = THREE.LinearMipmapLinearFilter;
        t.anisotropy = 16;
      }
    });

    const blurGobo = (centerUV) => {
      const r = uGoboBlur;
      const rn = uGoboBlur.mul(-1.0);
      // 3x3 Gaussian kernel: corners=1/16, edges=2/16, center=4/16
      return texture(this.goboTex, centerUV.add(vec2(rn, rn)))
        .rgb.mul(0.0625)
        .add(texture(this.goboTex, centerUV.add(vec2(0.0, rn))).rgb.mul(0.125))
        .add(texture(this.goboTex, centerUV.add(vec2(r, rn))).rgb.mul(0.0625))
        .add(texture(this.goboTex, centerUV.add(vec2(rn, 0.0))).rgb.mul(0.125))
        .add(texture(this.goboTex, centerUV).rgb.mul(0.25))
        .add(texture(this.goboTex, centerUV.add(vec2(r, 0.0))).rgb.mul(0.125))
        .add(texture(this.goboTex, centerUV.add(vec2(rn, r))).rgb.mul(0.0625))
        .add(texture(this.goboTex, centerUV.add(vec2(0.0, r))).rgb.mul(0.125))
        .add(texture(this.goboTex, centerUV.add(vec2(r, r))).rgb.mul(0.0625));
    };

    this._applyWeddingMaterial = (obj) => {
      if (!obj.isMesh) return;

      const old = obj.material;
      const mat = new THREE.MeshBasicNodeMaterial();

      const t = time.mul(uSwaySpeed);

      const clipPos = spotProjectionMatrixUniform.mul(vec4(positionWorld, 1.0));
      const projUV = clipPos.xy.div(clipPos.w).mul(0.5).add(0.5);
      const inFrustum = clipPos.w
        .greaterThan(0.0)
        .and(projUV.x.greaterThanEqual(0.0))
        .and(projUV.x.lessThanEqual(1.0))
        .and(projUV.y.greaterThanEqual(0.0))
        .and(projUV.y.lessThanEqual(1.0));
      const offsetX = mx_noise_float(
        vec3(projUV.x.mul(2.0), projUV.y.mul(2.0), t),
      );
      const offsetY = mx_noise_float(
        vec3(
          projUV.x.mul(2.0).add(5.2),
          projUV.y.mul(2.0).add(1.3),
          t.add(2.7),
        ),
      );
      const areaVariation = mx_noise_float(vec3(projUV.x, projUV.y, 0.0))
        .abs()
        .mul(1.5)
        .add(0.3);
      const distortedUV = projUV.add(
        vec2(offsetX, offsetY).mul(uSwayAmount).mul(areaVariation),
      );
      const goboSample = select(inFrustum, blurGobo(distortedUV), vec3(1.0));
      const softGobo = goboSample.oneMinus().mul(uGoboStrength).oneMinus();

      const clipPos2 = spotProjectionMatrixUniform2.mul(
        vec4(positionWorld, 1.0),
      );
      const projUV2 = clipPos2.xy.div(clipPos2.w).mul(0.5).add(0.5);
      const inFrustum2 = clipPos2.w
        .greaterThan(0.0)
        .and(projUV2.x.greaterThanEqual(0.0))
        .and(projUV2.x.lessThanEqual(1.0))
        .and(projUV2.y.greaterThanEqual(0.0))
        .and(projUV2.y.lessThanEqual(1.0));
      const offsetX2 = mx_noise_float(
        vec3(projUV2.x.mul(2.0).add(9.1), projUV2.y.mul(2.0).add(4.7), t),
      );
      const offsetY2 = mx_noise_float(
        vec3(
          projUV2.x.mul(2.0).add(14.3),
          projUV2.y.mul(2.0).add(5.9),
          t.add(2.7),
        ),
      );
      const areaVariation2 = mx_noise_float(
        vec3(projUV2.x.add(7.3), projUV2.y.add(3.1), 0.0),
      )
        .abs()
        .mul(1.5)
        .add(0.3);
      const distortedUV2 = projUV2.add(
        vec2(offsetX2, offsetY2).mul(uSwayAmount).mul(areaVariation2),
      );
      const goboSample2 = select(inFrustum2, blurGobo(distortedUV2), vec3(1.0));
      const softGobo2 = goboSample2.oneMinus().mul(uGoboStrength).oneMinus();

      const clipPos3 = spotProjectionMatrixUniform3.mul(
        vec4(positionWorld, 1.0),
      );
      const projUV3 = clipPos3.xy.div(clipPos3.w).mul(0.5).add(0.5);
      const inFrustum3 = clipPos3.w
        .greaterThan(0.0)
        .and(projUV3.x.greaterThanEqual(0.0))
        .and(projUV3.x.lessThanEqual(1.0))
        .and(projUV3.y.greaterThanEqual(0.0))
        .and(projUV3.y.lessThanEqual(1.0));
      const offsetX3 = mx_noise_float(
        vec3(projUV3.x.mul(2.0).add(17.5), projUV3.y.mul(2.0).add(8.3), t),
      );
      const offsetY3 = mx_noise_float(
        vec3(
          projUV3.x.mul(2.0).add(22.1),
          projUV3.y.mul(2.0).add(11.7),
          t.add(2.7),
        ),
      );
      const areaVariation3 = mx_noise_float(
        vec3(projUV3.x.add(13.9), projUV3.y.add(6.4), 0.0),
      )
        .abs()
        .mul(1.5)
        .add(0.3);
      const distortedUV3 = projUV3.add(
        vec2(offsetX3, offsetY3).mul(uSwayAmount).mul(areaVariation3),
      );
      const goboSample3 = select(inFrustum3, blurGobo(distortedUV3), vec3(1.0));
      const softGobo3 = goboSample3.oneMinus().mul(uGoboStrength).oneMinus();

      const ordinal = obj.name.split("_")[0];
      const ordinalTex = ordinalTextureMap[ordinal];
      const ordinalNightTex = ordinalNightTextureMap[ordinal];
      const attachmentTexture = attachmentTextures[obj.name];
      const alphaTest = ordinal === "Fourth" ? 0.5 : 0.2;
      const weddingMaterialName = old.name ?? "";
      const weddingPalettes = {
        婚房_台阶混凝土: { color: [0.25, 0.24, 0.22], scale: 1.2, variation: 0.1 },
        婚房_褐色门窗套: { color: [0.28, 0.12, 0.055], scale: 2.5, variation: 0.06 },
        婚房_米白真石漆: { color: [0.52, 0.46, 0.36], scale: 1.8, variation: 0.13 },
        婚房_深灰外墙: { color: [0.14, 0.13, 0.12], scale: 1.7, variation: 0.09 },
        婚房_深灰陶瓦: { color: [0.085, 0.08, 0.09], scale: 5, variation: 0.13 },
        婚房_檐口深灰: { color: [0.065, 0.06, 0.055], scale: 2, variation: 0.05 },
        婚房_灰蓝栏杆: { color: [0.13, 0.19, 0.2], scale: 2, variation: 0.035 },
        婚房_LOE玻璃: { color: [0.13, 0.25, 0.29], scale: 1.5, variation: 0.04 },
      };
      const weddingPalette = weddingPalettes[weddingMaterialName];

      if (attachmentTexture) {
        this.applyPlanarCardUv(obj);
        const daySample = texture(attachmentTexture.day, uv());
        const nightSample = texture(attachmentTexture.night, uv());
        mat.colorNode = mix(daySample, nightSample, this.uDayNight).rgb.mul(
          softGobo.min(softGobo2).min(softGobo3),
        );
        mat.side = THREE.DoubleSide;
      } else if (weddingPalette) {
        const surfaceNoise = mx_noise_float(
          positionWorld.mul(weddingPalette.scale),
        )
          .mul(weddingPalette.variation)
          .add(1.0);
        const directionalLight = normalWorld
          .dot(vec3(0.38, -0.55, 0.74))
          .max(0.0)
          .mul(0.38)
          .add(0.62);
        mat.colorNode = vec3(...weddingPalette.color)
          .mul(surfaceNoise)
          .mul(directionalLight)
          .mul(softGobo.min(softGobo2).min(softGobo3));
        if (weddingMaterialName === "婚房_LOE玻璃") {
          mat.transparent = true;
          mat.opacity = 0.42;
          mat.depthWrite = false;
        }
      } else if (ordinalTex && ordinalNightTex) {
        const daySample = texture(ordinalTex, uv());
        const nightSample = texture(ordinalNightTex, uv());
        const blended = mix(daySample, nightSample, this.uDayNight);
        mat.colorNode = blended.rgb.mul(softGobo.min(softGobo2).min(softGobo3));
        mat.opacityNode = blended.a;
        mat.transparent = true;
        mat.alphaTest = alphaTest;
      } else if (ordinalTex) {
        const texSample = texture(ordinalTex, uv());
        mat.colorNode = texSample.rgb.mul(
          softGobo.min(softGobo2).min(softGobo3),
        );
        mat.opacityNode = texSample.a;
        mat.transparent = true;
        mat.alphaTest = alphaTest;
      } else if (old.map) {
        mat.colorNode = texture(old.map, uv()).mul(
          softGobo.min(softGobo2).min(softGobo3),
        );
      } else {
        mat.color.copy(old.color);
      }

      old.dispose();
      obj.material = mat;
    };
    this.model.traverse(this._applyWeddingMaterial);

    this.experience.scene.add(this.model);

    const folder = this.experience.gui.addFolder("Room Gobo Projection");
    folder
      .add({ strength: 0.5 }, "strength", 0, 1, 0.01)
      .name("Shadow Strength")
      .onChange((v) => {
        uGoboStrength.value = v;
      });
    folder
      .add({ swayAmount: 0.008 }, "swayAmount", 0, 0.03, 0.001)
      .name("Sway Amount")
      .onChange((v) => {
        uSwayAmount.value = v;
      });
    folder
      .add({ swaySpeed: 0.2 }, "swaySpeed", 0, 1, 0.01)
      .name("Sway Speed")
      .onChange((v) => {
        uSwaySpeed.value = v;
      });
    folder
      .add({ softness: 0.0 }, "softness", 0, 0.002, 0.0001)
      .name("Shadow Softness")
      .onChange((v) => {
        uGoboBlur.value = v;
      });
    folder
      .add({ blend: 0.0 }, "blend", 0, 1, 0.01)
      .name("Day/Night Blend")
      .onChange((v) => {
        this.uDayNight.value = v;
      });
  }

  createWeddingAttachmentTexture(title, subtitle) {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    const paper = "#efe5d2";
    const ink = "#493b30";
    const muted = "#80664d";
    const accent = "#98634c";
    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, 512, 512);

    // The paper folds into several visible panels. Repeating a complete,
    // restrained title in each quadrant keeps every fold readable.
    for (let row = 0; row < 2; row += 1) {
      for (let col = 0; col < 2; col += 1) {
        const x = col * 256;
        const y = row * 256;
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, 256, 256);
        ctx.clip();
        ctx.strokeStyle = "rgba(128,102,77,.18)";
        ctx.lineWidth = 1;
        for (let line = 28; line < 250; line += 21) {
          ctx.beginPath();
          ctx.moveTo(x + 14, y + line);
          ctx.lineTo(x + 242, y + line);
          ctx.stroke();
        }
        ctx.fillStyle = accent;
        ctx.font = '600 26px "Noto Serif SC", "Songti SC", serif';
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(title, x + 128, y + 110);
        ctx.fillStyle = ink;
        ctx.font = '15px "Noto Serif SC", "Songti SC", serif';
        ctx.fillText(subtitle, x + 128, y + 146);
        ctx.fillStyle = muted;
        ctx.font = '11px "Noto Serif SC", serif';
        ctx.fillText("2026.10.02", x + 128, y + 176);
        ctx.restore();
      }
    }

    const canvasTexture = new THREE.CanvasTexture(canvas);
    canvasTexture.colorSpace = THREE.SRGBColorSpace;
    canvasTexture.flipY = false;
    canvasTexture.generateMipmaps = false;
    canvasTexture.minFilter = THREE.LinearFilter;
    canvasTexture.anisotropy = 4;
    return canvasTexture;
  }

  applyPlanarCardUv(mesh) {
    mesh.geometry = mesh.geometry.clone();
    const geometry = mesh.geometry;
    geometry.computeBoundingBox();
    const box = geometry.boundingBox;
    const size = new THREE.Vector3();
    box.getSize(size);
    const axes = ["x", "y", "z"].sort((a, b) => size[b] - size[a]);
    const [uAxis, vAxis] = axes;
    const positions = geometry.attributes.position;
    const uvs = new Float32Array(positions.count * 2);
    const uSize = size[uAxis] || 1;
    const vSize = size[vAxis] || 1;
    const component = (attribute, index, axis) =>
      axis === "x"
        ? attribute.getX(index)
        : axis === "y"
          ? attribute.getY(index)
          : attribute.getZ(index);
    for (let i = 0; i < positions.count; i += 1) {
      uvs[i * 2] = (component(positions, i, uAxis) - box.min[uAxis]) / uSize;
      uvs[i * 2 + 1] =
        (component(positions, i, vAxis) - box.min[vAxis]) / vSize;
    }
    geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  }

  toggleDayNight() {
    this.isNight = !this.isNight;
    gsap.to(this.uDayNight, {
      value: this.isNight ? 1 : 0,
      duration: 1.5,
      ease: "power2.inOut",
    });
    gsap.to(this.experience.renderer.uContrast, {
      value: this.isNight ? 1.0 : 1.2,
      duration: 1.5,
      ease: "power2.inOut",
    });
    gsap.to(this.uGoboStrength, {
      value: this.isNight ? 0 : 0.5,
      duration: 1.5,
      ease: "power2.inOut",
    });
    this.experience.world.butterflies?.forEach((b) => {
      gsap.to(b.uOpacity, {
        value: this.isNight ? 0 : 1,
        duration: 1.5,
        ease: "power2.inOut",
      });
    });
    const fireflies = this.experience.world.fireflies;
    if (fireflies) {
      gsap.to(fireflies.uOpacity, {
        value: this.isNight ? 1 : 0,
        duration: 1.5,
        ease: "power2.inOut",
      });
    }
  }

  attachWeddingHouse(gltf) {
    const weddingHouse = gltf?.scene.getObjectByName("WeddingHouse");
    if (!weddingHouse || weddingHouse.parent === this.model) return;

    weddingHouse.removeFromParent();
    this.model.add(weddingHouse);
    const originalHouseAndDeskProps =
      this.model.getObjectByName("First_House_Baked");
    this.removeOriginalHouseGeometry(originalHouseAndDeskProps, weddingHouse);
    if (this._applyWeddingMaterial) {
      weddingHouse.traverse(this._applyWeddingMaterial);
    }
  }

  removeOriginalHouseGeometry(originalMesh, replacementHouse) {
    if (!originalMesh?.isMesh || !replacementHouse) return;

    this.model.updateMatrixWorld(true);
    const replacementBounds = new THREE.Box3().setFromObject(replacementHouse);
    const replacementSize = replacementBounds.getSize(new THREE.Vector3());
    replacementBounds.expandByVector(
      new THREE.Vector3(
        replacementSize.x * 0.12,
        0,
        replacementSize.z * 0.12,
      ),
    );

    // First_House_Baked also contains the teal cutting mat, scissors and the
    // other coloured desk props. Keep those triangles and remove only the old
    // cottage volume so the replacement house can sit on the original mat.
    const geometry = originalMesh.geometry;
    const positions = geometry.attributes.position;
    const sourceIndex = geometry.index
      ? Array.from(geometry.index.array)
      : Array.from({ length: positions.count }, (_, index) => index);
    const keptIndex = [];
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    const c = new THREE.Vector3();
    const center = new THREE.Vector3();
    const matHeight = replacementBounds.min.y + replacementSize.y * 0.015;

    for (let i = 0; i < sourceIndex.length; i += 3) {
      a.fromBufferAttribute(positions, sourceIndex[i]).applyMatrix4(
        originalMesh.matrixWorld,
      );
      b.fromBufferAttribute(positions, sourceIndex[i + 1]).applyMatrix4(
        originalMesh.matrixWorld,
      );
      c.fromBufferAttribute(positions, sourceIndex[i + 2]).applyMatrix4(
        originalMesh.matrixWorld,
      );
      center.copy(a).add(b).add(c).multiplyScalar(1 / 3);

      const belongsToOldHouse =
        center.y > matHeight &&
        center.x > replacementBounds.min.x &&
        center.x < replacementBounds.max.x &&
        center.z > replacementBounds.min.z &&
        center.z < replacementBounds.max.z;

      if (!belongsToOldHouse) {
        keptIndex.push(
          sourceIndex[i],
          sourceIndex[i + 1],
          sourceIndex[i + 2],
        );
      }
    }

    geometry.setIndex(keptIndex);
    geometry.computeBoundingSphere();
  }

  createWeddingWallQuote() {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 420;
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#4f3424";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = '92px "STKaiti", "KaiTi", serif';
    context.fillText("从今往后", canvas.width / 2, 118);
    context.fillText("朝暮与共", canvas.width / 2, 245);
    context.strokeStyle = "rgba(79, 52, 36, 0.72)";
    context.lineWidth = 4;
    context.beginPath();
    context.moveTo(330, 340);
    context.quadraticCurveTo(512, 375, 694, 340);
    context.stroke();

    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.needsUpdate = true;
    const material = new THREE.SpriteMaterial({
      map,
      transparent: true,
      depthWrite: false,
    });
    const quote = new THREE.Sprite(material);
    quote.name = "Wedding_Wall_Quote";

    // Project the requested screen location onto the back wall. The resulting
    // world point stays fixed when the camera later moves around the room.
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(
      new THREE.Vector2(-0.38, -0.34),
      this.experience.camera.instance,
    );
    const wall = new THREE.Plane(new THREE.Vector3(0, 0, 1), 30.25);
    const target = new THREE.Vector3();
    if (!raycaster.ray.intersectPlane(wall, target)) return;
    target.z += 0.06;
    quote.position.copy(target);
    quote.scale.set(5.6, 2.3, 1);
    this.model.add(quote);
  }

  resize() {}
  update() {}
  destroy() {}
}
