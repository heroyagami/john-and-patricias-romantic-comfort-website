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

    <div class="wedding-sheet" id="wedding-sheet" aria-hidden="true">
      <div class="wedding-sheet__backdrop" data-close-sheet></div>
      <section class="wedding-sheet__panel">
        <button class="wedding-sheet__close" data-close-sheet aria-label="关闭">×</button>
        <p class="wedding-sheet__eyebrow">WEDDING INVITATION</p>
        <h1>${wedding.groom} <span>×</span> ${wedding.bride}</h1>
        <p class="wedding-sheet__lead">${wedding.invitation}</p>

        <div class="wedding-sheet__meta">
          <div><small>时间</small><strong>${wedding.dateDisplay}</strong></div>
          <div><small>地点</small><strong>${wedding.location}</strong></div>
        </div>

        <div class="wedding-sheet__schedule">
          ${wedding.schedule.map((item) => `<div><span>${item.time}</span><strong>${item.title}</strong></div>`).join("")}
        </div>

        <form class="rsvp-form" id="rsvp-form">
          <div class="rsvp-form__heading">
            <p class="wedding-sheet__eyebrow">RSVP</p>
            <h2>赴约登记</h2>
          </div>
          <input name="name" required placeholder="你的姓名" />
          <div class="rsvp-form__row">
            <select name="attendance" required>
              <option value="">是否参加</option>
              <option value="yes">一定到</option>
              <option value="no">很遗憾不能到</option>
            </select>
            <input name="guests" type="number" min="1" max="20" value="1" placeholder="人数" />
          </div>
          <input name="phone" placeholder="联系电话（可选）" />
          <textarea name="message" rows="3" placeholder="想对我们说的话（可选）"></textarea>
          <button type="submit">确认赴约</button>
          <p class="rsvp-form__status" id="rsvp-status">V1 预览版：暂存在当前设备，下一版接云端宾客名单。</p>
        </form>
      </section>
    </div>
  `;
  document.body.appendChild(root);

  const countdown = root.querySelector("#wedding-countdown");
  const sheet = root.querySelector("#wedding-sheet");
  const card = root.querySelector("#wedding-card");
  const form = root.querySelector("#rsvp-form");
  const status = root.querySelector("#rsvp-status");

  const updateCountdown = () => {
    countdown.textContent = `距离婚礼还有 ${getCountdown()}`;
  };
  updateCountdown();
  setInterval(updateCountdown, 60000);

  const openSheet = () => {
    sheet.classList.add("is-open");
    sheet.setAttribute("aria-hidden", "false");
  };
  const closeSheet = () => {
    sheet.classList.remove("is-open");
    sheet.setAttribute("aria-hidden", "true");
  };

  card.addEventListener("click", openSheet);
  root.querySelectorAll("[data-close-sheet]").forEach((el) =>
    el.addEventListener("click", closeSheet),
  );

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    localStorage.setItem(
      "wuhao-shuqian-rsvp-v1",
      JSON.stringify({ ...data, submittedAt: new Date().toISOString() }),
    );
    status.textContent = "收到啦 ❤️ 10月2日，我们等你。";
  });
}
