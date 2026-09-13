import { wedding } from "./config/wedding";

const pad = (n) => String(n).padStart(2, "0");

function getCountdown() {
  const diff = new Date(wedding.dateISO).getTime() - Date.now();
  if (diff <= 0) return "今天，我们结婚啦";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  return `${days}天 ${pad(hours)}小时 ${pad(minutes)}分`;
}

export function mountWeddingUI() {
  const root = document.createElement("div");
  root.className = "wedding-ui";
  root.innerHTML = `
    <button class="wedding-card" id="wedding-card" aria-label="打开婚礼信息">
      <span class="wedding-card__eyebrow">OUR WEDDING DAY</span>
      <strong>${wedding.groom} × ${wedding.bride}</strong>
      <span>${wedding.dateDisplay}</span>
      <span class="wedding-card__countdown" id="wedding-countdown"></span>
    </button>

    <div class="wedding-sheet" id="wedding-sheet" role="dialog" aria-modal="true" aria-label="婚礼详情" aria-hidden="true">
      <div class="wedding-sheet__backdrop" data-close-sheet></div>
      <section class="wedding-sheet__panel">
        <button class="wedding-sheet__close" data-close-sheet aria-label="关闭">×</button>
        <p class="wedding-sheet__eyebrow">WEDDING INVITATION</p>
        <h1>${wedding.groom} <span>×</span> ${wedding.bride}</h1>
        <p class="wedding-sheet__lead">${wedding.invitation}</p>

        <div class="wedding-sheet__meta">
          <div><small>时间</small><strong>${wedding.dateDisplay}</strong></div>
          <div class="wedding-sheet__location">
            <small>地点</small>
            <strong>${wedding.location}</strong>
            <a class="wedding-map-preview" href="${wedding.mapUrl}" target="_blank" rel="noopener noreferrer" aria-label="在腾讯地图中查看婚礼地点">
              <iframe src="${wedding.mapUrl}" title="婚礼地点地图预览" loading="lazy" tabindex="-1" aria-hidden="true"></iframe>
              <span class="wedding-map-preview__pin" aria-hidden="true"></span>
              <span class="wedding-map-preview__label">婚礼地点 · 点击查看</span>
            </a>
            <div class="wedding-map-actions">
              <a class="wedding-sheet__map-link wedding-sheet__map-link--primary" href="${wedding.mapUrl}" target="_blank" rel="noopener noreferrer">腾讯地图</a>
              <a class="wedding-sheet__map-link" href="${wedding.amapUrl}" target="_blank" rel="noopener noreferrer">高德地图</a>
              <button class="wedding-sheet__map-link wedding-sheet__map-copy" type="button">复制地址</button>
            </div>
            <span class="wedding-map-status" role="status" aria-live="polite"></span>
          </div>
        </div>

        <div class="wedding-sheet__schedule">
          ${wedding.schedule.map((item) => `<div><span>${item.time}</span><strong>${item.title}</strong></div>`).join("")}
        </div>

      </section>
    </div>
  `;
  document.body.appendChild(root);

  const countdown = root.querySelector("#wedding-countdown");
  const sheet = root.querySelector("#wedding-sheet");
  const card = root.querySelector("#wedding-card");
  const copyAddress = root.querySelector(".wedding-sheet__map-copy");
  const mapStatus = root.querySelector(".wedding-map-status");

  const updateCountdown = () => {
    countdown.textContent = `距离婚礼还有 ${getCountdown()}`;
  };
  updateCountdown();
  setInterval(updateCountdown, 60000);

  const openSheet = () => {
    sheet.classList.add("is-open");
    sheet.setAttribute("aria-hidden", "false");
    root.querySelector("[data-close-sheet]").focus();
  };
  const closeSheet = () => {
    sheet.classList.remove("is-open");
    sheet.setAttribute("aria-hidden", "true");
  };

  card.addEventListener("click", openSheet);
  root.querySelectorAll("[data-close-sheet]").forEach((el) =>
    el.addEventListener("click", closeSheet),
  );
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && sheet.classList.contains("is-open")) closeSheet();
  });

  copyAddress.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(wedding.location);
    } catch {
      const input = document.createElement("textarea");
      input.value = wedding.location;
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    mapStatus.textContent = "地址已复制，可粘贴到任意地图搜索";
    setTimeout(() => {
      mapStatus.textContent = "";
    }, 2600);
  });

}
