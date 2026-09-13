import { Experience } from "./Experience/Experience";
import { Modal } from "./Experience/Modal";
import { mountWeddingUI } from "./wedding-ui";
import "@fontsource-variable/noto-serif-sc";
import "./style.css";
import "./styles/wedding.css";
import "./styles/mobile-fixes.css";

const experience = new Experience();
mountWeddingUI();

const infoModal = new Modal();
const infoBtn = document.getElementById("info-btn");

infoBtn.addEventListener("mouseenter", () => {
  experience.world.raycaster?.showHitboxMarkers();
});

infoBtn.addEventListener("mouseleave", () => {
  experience.world.raycaster?.hideHitboxMarkers();
});

infoBtn.addEventListener("click", () => {
  infoModal.openHTML(
    "吴昊 × 舒倩 · 婚礼指南",
    `欢迎来到我们的婚礼邀请空间。<br><br>
点击房间里的不同物件可以继续探索：照片墙、日历、人物、房屋和音乐都会在后续版本逐步换成属于我们的内容。<br><br>
<strong>婚礼时间</strong><br>2026年10月2日 12:00<br><br>
<strong>婚礼地点</strong><br>湖北省咸宁市崇阳县 · 詹氏糯米酒超市对面<br><br>
右下角的婚礼卡片可以查看流程并填写 RSVP。`,
  );
});

const btn = document.getElementById("day-night-toggle");
const icon = btn.querySelector(".day-night-btn__icon");

btn.addEventListener("click", () => {
  experience.world.room?.toggleDayNight();
  const goingNight = experience.world.room?.isNight ?? false;
  icon.innerHTML = goingNight ? "&#9728;" : "&#9790;";
  experience.world.raycaster?.setDayNightVolume(goingNight);
});
