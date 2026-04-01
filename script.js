/* eslint-disable no-console */

const STORAGE_KEY = "cloudery_reviews_v1";
const LIKE_STORAGE_KEY = "cloudery_like_count_v1";

function qs(sel, root = document) {
  return root.querySelector(sel);
}

function qsa(sel, root = document) {
  return [...root.querySelectorAll(sel)];
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function formatTime(ts) {
  const d = new Date(ts);
  const pad = (x) => String(x).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function loadReviews() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed
      .filter((r) => r && typeof r === "object")
      .map((r) => ({
        id: String(r.id ?? crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`),
        name: String(r.name ?? "Ẩn danh").slice(0, 40),
        rating: clamp(Number(r.rating ?? 5), 1, 5),
        comment: String(r.comment ?? "").slice(0, 280),
        ts: Number(r.ts ?? Date.now()),
      }));
  } catch {
    return null;
  }
}

function saveReviews(reviews) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
}

function defaultReviews() {
  const now = Date.now();
  return [
    {
      id: "seed-1",
      name: "Bạn Mây",
      rating: 5,
      comment: "Mịn đúng kiểu “ăn một muỗng là bay”. Nhìn cũng cute nữa.",
      ts: now - 1000 * 60 * 60 * 26,
    },
    {
      id: "seed-2",
      name: "Trái Dâu",
      rating: 4,
      comment: "Mix trái cây nhìn vui mắt, vị trứng thơm mà không bị ngấy.",
      ts: now - 1000 * 60 * 60 * 13,
    },
    {
      id: "seed-3",
      name: "Team Lá Dứa",
      rating: 5,
      comment: "Lá dứa thơm dịu, vibe fresh. Chấm 5 sao luôn.",
      ts: now - 1000 * 60 * 60 * 7,
    },
  ];
}

function starString(rating) {
  const full = "★".repeat(rating);
  const empty = "☆".repeat(5 - rating);
  return full + empty;
}

function renderReviewCard(r) {
  return `
    <article class="review reveal" data-review-id="${escapeHtml(r.id)}">
      <div class="review__top">
        <div class="review__name">${escapeHtml(r.name)}</div>
        <div class="review__stars" aria-label="${r.rating} sao">${starString(r.rating)}</div>
      </div>
      <p class="review__text">${escapeHtml(r.comment)}</p>
      <div class="review__time">${escapeHtml(formatTime(r.ts))}</div>
    </article>
  `.trim();
}

function mountReviews(reviews) {
  const list = qs("#reviewsList");
  if (!list) return;
  list.innerHTML = reviews.map(renderReviewCard).join("");
}

function prependReview(reviews, review) {
  reviews.unshift(review);
  saveReviews(reviews);
  const list = qs("#reviewsList");
  if (!list) return;
  list.insertAdjacentHTML("afterbegin", renderReviewCard(review));

  const el = list.firstElementChild;
  if (el) {
    requestAnimationFrame(() => el.classList.add("is-in"));
    el.animate(
      [
        { transform: "translateY(12px) rotate(-1deg) scale(0.96)", opacity: 0 },
        { transform: "translateY(0) rotate(0deg) scale(1)", opacity: 1 },
      ],
      { duration: 520, easing: "cubic-bezier(.2,.9,.2,1)" },
    );
  }
}

function setupRevealOnScroll() {
  const els = qsa(".reveal");
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.12 },
  );
  for (const el of els) io.observe(el);
}

function setupCounters() {
  const stats = qsa(".stat[data-counter]");
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const stat = e.target;
        io.unobserve(stat);

        const target = clamp(Number(stat.getAttribute("data-counter") || "0"), 0, 10);
        const counterEl = qs(".counter", stat);
        if (!counterEl) return;

        const duration = 900;
        const start = performance.now();
        const from = 0;

        function tick(now) {
          const t = clamp((now - start) / duration, 0, 1);
          const eased = 1 - Math.pow(1 - t, 3);
          const val = Math.round(from + (target - from) * eased);
          counterEl.textContent = String(val);
          if (t < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      }
    },
    { threshold: 0.35 },
  );
  for (const s of stats) io.observe(s);
}

function setupStoryLines() {
  const story = qs("#story");
  const lines = qsa("[data-story-line]");
  if (!story || lines.length === 0) return;

  const io = new IntersectionObserver(
    (entries) => {
      const shown = entries.some((e) => e.isIntersecting);
      if (!shown) return;
      io.disconnect();

      let i = 0;
      const step = () => {
        const el = lines[i];
        if (!el) return;
        el.classList.add("is-shown");
        i += 1;
        if (i < lines.length) setTimeout(step, 260);
      };
      step();
    },
    { threshold: 0.25 },
  );

  io.observe(story);
}

function setupRatingHint() {
  const hint = qs("#ratingHint");
  if (!hint) return;
  const radios = qsa('input[name="rating"]');
  const labels = ["1 sao (ok)", "2 sao (hơi ổn)", "3 sao (ổn áp)", "4 sao (thích)", "5 sao (mê)"];

  const update = () => {
    const checked = radios.find((r) => r.checked);
    const val = clamp(Number(checked?.value ?? 5), 1, 5);
    hint.textContent = `${val} sao — ${labels[val - 1]}`;
  };

  for (const r of radios) r.addEventListener("change", update);
  update();
}

function setupForm(reviews) {
  const form = qs("#reviewForm");
  if (!form) return;

  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const fd = new FormData(form);
    const name = String(fd.get("name") || "").trim();
    const comment = String(fd.get("comment") || "").trim();
    const rating = clamp(Number(fd.get("rating") || 5), 1, 5);

    if (!name || !comment) return;

    const id =
      crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const review = { id, name: name.slice(0, 40), rating, comment: comment.slice(0, 280), ts: Date.now() };
    prependReview(reviews, review);

    form.reset();
    const r5 = qs("#r5");
    if (r5) r5.checked = true;
    const hint = qs("#ratingHint");
    if (hint) hint.textContent = "5 sao nha!";
  });

  const btnClear = qs("#btnClearReviews");
  btnClear?.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    reviews.splice(0, reviews.length, ...defaultReviews());
    saveReviews(reviews);
    mountReviews(reviews);
    setupRevealOnScroll();
  });
}

function setupButtons() {
  qs("#btnScrollForm")?.addEventListener("click", () => {
    qs("#form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function setupTiltHover() {
  // Optional extra “sticker hover tilt”: only on pointer fine devices.
  if (!matchMedia("(pointer: fine)").matches) return;
  const cards = qsa("[data-tilt]");

  for (const card of cards) {
    card.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `translateY(-4px) rotate(${x * 2}deg) scale(1.02)`;
      card.style.boxShadow =
        "0 16px 0 rgba(0,0,0,.14), 0 26px 34px rgba(0,0,0,.2)";
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
      card.style.boxShadow = "";
    });
  }
}

function setupConfetti() {
  const canvas = qs("#confetti");
  const btn = qs("#btnLike");
  const likeValue = qs("#likeCountValue");
  if (!canvas || !btn) return;

  const ctx = canvas.getContext("2d");
  const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  let w = 0;
  let h = 0;

  const colors = ["#2f78ff", "#27c07d", "#ffe44d", "#ff67b3", "#ffffff"];
  let particles = [];
  let raf = 0;
  let endAt = 0;

  function readLikeCount() {
    const raw = localStorage.getItem(LIKE_STORAGE_KEY);
    const num = Number(raw);
    return Number.isFinite(num) && num >= 0 ? Math.floor(num) : 0;
  }

  function writeLikeCount(count) {
    localStorage.setItem(LIKE_STORAGE_KEY, String(count));
  }

  function renderLikeCount(count) {
    if (!likeValue) return;
    likeValue.textContent = count.toLocaleString("vi-VN");
  }

  function resize() {
    const r = canvas.getBoundingClientRect();
    w = Math.floor(r.width);
    h = Math.floor(r.height);
    canvas.width = Math.floor(w * DPR);
    canvas.height = Math.floor(h * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function spawn() {
    const count = 120;
    particles = Array.from({ length: count }, () => ({
      x: w * (0.2 + Math.random() * 0.6),
      y: h * 0.18,
      vx: (Math.random() - 0.5) * 5,
      vy: Math.random() * -6 - 2,
      g: 0.22 + Math.random() * 0.16,
      s: 5 + Math.random() * 6,
      r: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.25,
      c: colors[Math.floor(Math.random() * colors.length)],
      o: 1,
    }));
  }

  function draw(now) {
    ctx.clearRect(0, 0, w, h);
    for (const p of particles) {
      p.vy += p.g;
      p.x += p.vx;
      p.y += p.vy;
      p.r += p.vr;
      p.o = clamp((endAt - now) / 900, 0, 1);

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.globalAlpha = 0.95 * p.o;
      ctx.fillStyle = p.c;
      ctx.strokeStyle = "rgba(0,0,0,.18)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.rect(-p.s / 2, -p.s / 2, p.s, p.s * 0.7);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    particles = particles.filter((p) => p.y < h + 40 && p.o > 0.02);
    if (now < endAt || particles.length) {
      raf = requestAnimationFrame(draw);
    } else {
      canvas.classList.remove("is-on");
    }
  }

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();
  renderLikeCount(readLikeCount());

  btn.addEventListener("click", () => {
    const nextCount = readLikeCount() + 1;
    writeLikeCount(nextCount);
    renderLikeCount(nextCount);

    cancelAnimationFrame(raf);
    resize();
    spawn();
    endAt = performance.now() + 1200;
    canvas.classList.add("is-on");
    raf = requestAnimationFrame(draw);
  });
}

function setupEggBurst() {
  const targets = qsa(".product, .flavor-card__imgwrap");
  if (!targets.length) return;

  function spawnEggs(originX, originY, count = 8) {
    for (let i = 0; i < count; i += 1) {
      const egg = document.createElement("span");
      egg.className = "egg-pop";
      document.body.appendChild(egg);

      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const distance = 80 + Math.random() * 70;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance - 20;
      const rot = (Math.random() - 0.5) * 70;
      const dur = 700 + Math.random() * 260;

      egg.style.transform = `translate(${originX - 20}px, ${originY - 20}px) scale(0.45) rotate(0deg)`;
      egg.style.opacity = "0";

      const anim = egg.animate(
        [
          {
            transform: `translate(${originX - 20}px, ${originY - 20}px) scale(0.45) rotate(0deg)`,
            opacity: 0,
          },
          {
            transform: `translate(${originX - 20 + tx * 0.35}px, ${originY - 20 + ty * 0.35}px) scale(1.02) rotate(${rot}deg)`,
            opacity: 1,
            offset: 0.36,
          },
          {
            transform: `translate(${originX - 20 + tx}px, ${originY - 20 + ty + 24}px) scale(0.86) rotate(${rot * 1.4}deg)`,
            opacity: 0,
          },
        ],
        {
          duration: dur,
          easing: "cubic-bezier(.2,.85,.25,1)",
          fill: "forwards",
        },
      );

      anim.onfinish = () => egg.remove();
    }
  }

  for (const target of targets) {
    target.addEventListener("click", (e) => {
      const rect = target.getBoundingClientRect();
      const x = e.clientX || rect.left + rect.width / 2;
      const y = e.clientY || rect.top + rect.height / 2;
      spawnEggs(x, y, target.classList.contains("product") ? 10 : 7);
    });
  }
}

function bootstrap() {
  const stored = loadReviews();
  const reviews = stored && stored.length ? stored : defaultReviews();
  if (!stored) saveReviews(reviews);

  mountReviews(reviews);
  setupRevealOnScroll();
  setupCounters();
  setupStoryLines();
  setupRatingHint();
  setupForm(reviews);
  setupButtons();
  setupTiltHover();
  setupConfetti();
  setupEggBurst();

  // Ensure newly mounted review cards reveal immediately on first load
  requestAnimationFrame(() => {
    for (const el of qsa("#reviewsList .reveal")) el.classList.add("is-in");
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap);
} else {
  bootstrap();
}

