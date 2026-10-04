// Данные объектов. Чтобы добавить объект — добавьте запись в массив.
const properties = [
  {
    id: 1, type: "flat", deal: "sale", rooms: 3, district: "Хамовники",
    title: "Апартаменты с видом на реку", address: "Фрунзенская наб., 30",
    price: 48500000, area: 112, floor: "9/14", tag: "Новинка",
    img: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=900&q=80",
    desc: "Светлая квартира с панорамными окнами, авторским ремонтом и видом на Москву-реку. Закрытая территория, подземный паркинг."
  },
  {
    id: 2, type: "house", deal: "sale", rooms: 5, district: "Подмосковье",
    title: "Дом в сосновом лесу", address: "КП «Лесные дали», Истра",
    price: 72000000, area: 340, floor: "2 этажа", tag: "Эксклюзив",
    img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80",
    desc: "Современный дом на участке 25 соток. Терраса, бассейн, гараж на две машины и охраняемый посёлок."
  },
  {
    id: 3, type: "flat", deal: "sale", rooms: 2, district: "Пресненский",
    title: "Квартира в ЖК бизнес-класса", address: "ул. Пресненский Вал, 17",
    price: 28900000, area: 68, floor: "15/32",
    img: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=900&q=80",
    desc: "Готовая к проживанию квартира с дизайнерской отделкой. Рядом метро, парк и школы."
  },
  {
    id: 4, type: "commercial", deal: "sale", rooms: 0, district: "Центр",
    title: "Помещение под ресторан", address: "ул. Покровка, 8",
    price: 95000000, area: 260, floor: "1 этаж", tag: "Арендатор",
    img: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=900&q=80",
    desc: "Помещение на первой линии с отдельным входом и высокими потолками. Действующий арендатор, доходность 9% годовых."
  },
  {
    id: 5, type: "flat", deal: "rent", rooms: 1, district: "Центр",
    title: "Студия в историческом доме", address: "Малый Козихинский пер., 4",
    price: 140000, area: 42, floor: "4/6", tag: "Новинка",
    img: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80",
    desc: "Уютная студия с высокими потолками в тихом переулке на Патриарших. Полностью меблирована."
  },
  {
    id: 6, type: "house", deal: "rent", rooms: 4, district: "Подмосковье",
    title: "Коттедж у озера", address: "Новорижское ш., 22 км",
    price: 450000, area: 260, floor: "2 этажа",
    img: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80",
    desc: "Дом для большой семьи с выходом к озеру, баней и ландшафтным садом. Возможна долгосрочная аренда."
  },
  {
    id: 7, type: "flat", deal: "sale", rooms: 4, district: "Хамовники",
    title: "Пентхаус с террасой", address: "ул. Остоженка, 11",
    price: 156000000, area: 210, floor: "12/12", tag: "Эксклюзив",
    img: "https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=900&q=80",
    desc: "Двухуровневый пентхаус с собственной террасой 80 м² и видом на храм Христа Спасителя."
  },
  {
    id: 8, type: "commercial", deal: "rent", rooms: 0, district: "Пресненский",
    title: "Офис в башне Сити", address: "Пресненская наб., 12",
    price: 980000, area: 310, floor: "48/62",
    img: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=80",
    desc: "Офис с отделкой и мебелью, 4 переговорные и панорамный вид. Готов к въезду."
  },
  {
    id: 9, type: "flat", deal: "sale", rooms: 1, district: "Пресненский",
    title: "Евродвушка у парка", address: "ул. Заморёнова, 5",
    price: 17400000, area: 45, floor: "7/9",
    img: "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=900&q=80",
    desc: "Компактная квартира с кухней-гостиной и спальней. В пяти минутах от Краснопресненского парка."
  }
];

const typeNames = { flat: "Квартира", house: "Дом", commercial: "Коммерция" };

const state = { type: "all", deal: "sale", district: "all", rooms: "all" };
let favorites = new Set();
try { favorites = new Set(JSON.parse(localStorage.getItem("favorites") || "[]")); } catch (e) {}

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
const hasGsap = !!(window.gsap && window.ScrollTrigger) && !reduceMotion;
if (hasGsap) {
  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add("has-gsap");
}

// Если фото не загрузилось — прячем «битую» картинку, остаётся красивая подложка
document.addEventListener("error", e => {
  if (e.target.tagName === "IMG") e.target.classList.add("is-broken");
}, true);

/* ============ Плавная прокрутка ============ */
let lenis = null;
if (window.Lenis && !reduceMotion) {
  lenis = new Lenis({ lerp: 0.085 });
  if (hasGsap) {
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  } else {
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
}

function scrollToTarget(hash) {
  const el = hash === "#top" ? 0 : document.querySelector(hash);
  if (el === null) return;
  if (lenis) lenis.scrollTo(el, { offset: el === 0 ? 0 : -60, duration: 1.6 });
  else if (el === 0) window.scrollTo({ top: 0, behavior: "smooth" });
  else el.scrollIntoView({ behavior: "smooth" });
}

document.addEventListener("click", e => {
  const a = e.target.closest('a[href^="#"]');
  if (!a || a.getAttribute("href").length < 2) return;
  e.preventDefault();
  scrollToTarget(a.getAttribute("href"));
});

/* ============ Каталог ============ */
const formatPrice = (p, deal) =>
  p.toLocaleString("ru-RU") + " ₽" + (deal === "rent" ? "<small> / мес</small>" : "");

const icons = {
  heart: '<svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-9.5-9.3C1 8 3.4 4 7.2 4c2.1 0 3.6 1.1 4.8 2.7C13.2 5.1 14.7 4 16.8 4 20.6 4 23 8 21.5 11.7 19.5 16.4 12 21 12 21z"/></svg>',
  pin: '<svg viewBox="0 0 24 24"><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>'
};

function specsHtml(p) {
  return `
    <li><b>${p.area}</b> м²</li>
    ${p.rooms ? `<li><b>${p.rooms}</b> ${p.rooms === 1 ? "комната" : p.rooms < 5 ? "комнаты" : "комнат"}</li>` : ""}
    <li>${p.floor}</li>`;
}

const grid = $("#grid");
const searchForm = $("#searchForm");

function render() {
  const list = properties.filter(p =>
    p.deal === state.deal &&
    (state.type === "all" || p.type === state.type) &&
    (state.district === "all" || p.district === state.district) &&
    (state.rooms === "all" || (state.rooms === "4" ? p.rooms >= 4 : p.rooms === +state.rooms))
  );

  grid.innerHTML = list.map((p, i) => `
    <article class="card" data-id="${p.id}" style="animation-delay:${i * 90}ms">
      <div class="card__media">
        <img src="${p.img}" alt="${p.title}" loading="lazy">
        <span class="card__tag ${p.tag ? "card__tag--new" : ""}">${p.tag || typeNames[p.type]}</span>
        <button class="card__fav ${favorites.has(p.id) ? "is-active" : ""}" data-fav="${p.id}" aria-label="В избранное">${icons.heart}</button>
        <span class="card__more">Подробнее <span aria-hidden="true">→</span></span>
      </div>
      <div class="card__body">
        <div class="card__price">${formatPrice(p.price, p.deal)}</div>
        <h3 class="card__title">${p.title}</h3>
        <p class="card__addr">${icons.pin}${p.address}</p>
        <ul class="specs">${specsHtml(p)}</ul>
      </div>
    </article>`).join("");

  $("#empty").hidden = list.length > 0;
  if (hasGsap) requestAnimationFrame(() => ScrollTrigger.refresh());
}

/* «Пилюля», которая плавно переезжает к активной кнопке */
function movePill(group) {
  const pill = $(".pill", group), active = $(".is-active", group);
  if (!pill || !active) return;
  pill.style.width = active.offsetWidth + "px";
  pill.style.height = active.offsetHeight + "px";
  pill.style.transform = `translate(${active.offsetLeft}px, ${active.offsetTop}px)`;
}
const updatePills = () => $$(".pill-group").forEach(movePill);
window.addEventListener("resize", updatePills);
if (document.fonts) document.fonts.ready.then(updatePills);

function syncChips() {
  $$(".chip").forEach(c => c.classList.toggle("is-active", c.dataset.filter === state.type));
  movePill($("#filters"));
}

$("#filters").addEventListener("click", e => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  state.type = chip.dataset.filter;
  searchForm.type.value = state.type;
  syncChips();
  render();
});

$$(".search__tab").forEach(tab => tab.addEventListener("click", () => {
  $$(".search__tab").forEach(t => t.classList.toggle("is-active", t === tab));
  state.deal = tab.dataset.deal;
  movePill($(".search__tabs"));
}));

searchForm.addEventListener("submit", e => {
  e.preventDefault();
  state.type = searchForm.type.value;
  state.district = searchForm.district.value;
  state.rooms = searchForm.rooms.value;
  syncChips();
  render();
  scrollToTarget("#catalog");
});

$("#resetFilters").addEventListener("click", () => {
  Object.assign(state, { type: "all", district: "all", rooms: "all" });
  searchForm.reset();
  syncChips();
  render();
});

// Клик по району — фильтруем каталог (прокрутку делает обработчик ссылок)
$$(".district[data-district]").forEach(d => d.addEventListener("click", () => {
  state.district = d.dataset.district;
  searchForm.district.value = state.district;
  render();
}));

// Избранное и открытие карточки
grid.addEventListener("click", e => {
  const fav = e.target.closest("[data-fav]");
  if (fav) {
    const id = +fav.dataset.fav;
    favorites.has(id) ? favorites.delete(id) : favorites.add(id);
    fav.classList.toggle("is-active");
    fav.classList.remove("is-pop");
    void fav.offsetWidth;
    fav.classList.add("is-pop");
    try { localStorage.setItem("favorites", JSON.stringify([...favorites])); } catch (err) {}
    showToast(favorites.has(id) ? "Добавлено в избранное" : "Удалено из избранного");
    return;
  }
  const card = e.target.closest(".card");
  if (card) openModal(+card.dataset.id);
});

/* ============ Модальное окно ============ */
const modal = $("#modal");
function openModal(id) {
  const p = properties.find(x => x.id === id);
  const img = $("#modalImg");
  img.classList.remove("is-broken");
  img.src = p.img;
  img.alt = p.title;
  $("#modalDistrict").textContent = `${typeNames[p.type]} · ${p.district}`;
  $("#modalTitle").textContent = p.title;
  $("#modalPrice").innerHTML = formatPrice(p.price, p.deal);
  $("#modalSpecs").innerHTML = specsHtml(p) + `<li>${p.address}</li>`;
  $("#modalDesc").textContent = p.desc;
  modal.classList.remove("is-closing");
  modal.hidden = false;
  document.body.classList.add("no-scroll");
  lenis?.stop();
}
function closeModal() {
  if (modal.hidden || modal.classList.contains("is-closing")) return;
  modal.classList.add("is-closing");
  document.body.classList.remove("no-scroll");
  lenis?.start();
  setTimeout(() => { modal.hidden = true; modal.classList.remove("is-closing"); }, reduceMotion ? 0 : 340);
}
modal.addEventListener("click", e => { if (e.target.closest("[data-close]")) closeModal(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });

/* ============ Мобильное меню ============ */
const burger = $("#burger"), nav = $("#nav");
function setMenu(open) {
  nav.classList.toggle("is-open", open);
  burger.classList.toggle("is-open", open);
  document.body.classList.toggle("no-scroll", open);
  open ? lenis?.stop() : lenis?.start();
}
burger.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));
nav.addEventListener("click", e => { if (e.target.tagName === "A") setMenu(false); });

/* ============ Шапка, прогресс, «наверх», активный пункт меню ============ */
const header = $("#header"), progressBar = $("#progressBar"), toTop = $("#toTop"), ring = $("#toTopRing");
const spy = $$("#nav a").map(a => [a, document.querySelector(a.getAttribute("href"))]);
let lastY = window.scrollY;

function onScroll() {
  const y = window.scrollY;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const p = max > 0 ? Math.min(y / max, 1) : 0;
  progressBar.style.transform = `scaleX(${p})`;
  ring.style.strokeDashoffset = 138.2 * (1 - p);
  header.classList.toggle("is-scrolled", y > 40);
  header.classList.toggle("is-hidden", y > lastY + 2 && y > 600 && !nav.classList.contains("is-open"));
  if (y < lastY - 2) header.classList.remove("is-hidden");
  lastY = y;
  toTop.classList.toggle("is-visible", y > 700);

  let current = null;
  spy.forEach(([a, sec]) => { if (sec && sec.getBoundingClientRect().top < window.innerHeight * 0.4) current = a; });
  spy.forEach(([a]) => a.classList.toggle("is-active", a === current));
}
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* ============ Кнопки: перекат текста, волна, магнит ============ */
$$(".btn").forEach(btn => {
  const t = [...btn.childNodes].find(n => n.nodeType === 3 && n.textContent.trim());
  if (!t) return;
  const wrap = document.createElement("span");
  const inner = document.createElement("span");
  wrap.className = "btn__text";
  inner.textContent = t.textContent.trim();
  wrap.append(inner);
  btn.replaceChild(wrap, t);
});

document.addEventListener("pointerdown", e => {
  const btn = e.target.closest(".btn");
  if (!btn) return;
  const r = btn.getBoundingClientRect();
  const s = document.createElement("span");
  s.className = "ripple";
  s.style.left = e.clientX - r.left + "px";
  s.style.top = e.clientY - r.top + "px";
  btn.append(s);
  s.addEventListener("animationend", () => s.remove());
});

if (finePointer && !reduceMotion) {
  $$("[data-magnetic]").forEach(el => {
    el.addEventListener("mousemove", e => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
      el.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
    });
    el.addEventListener("mouseleave", () => { el.style.transform = ""; });
  });

  // 3D-наклон карточек
  grid.addEventListener("mousemove", e => {
    const card = e.target.closest(".card");
    if (!card) return;
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
    card.style.transform = `translateY(-8px) rotateY(${px * 7}deg) rotateX(${-py * 7}deg)`;
  });
  grid.addEventListener("mouseout", e => {
    const card = e.target.closest(".card");
    if (card && !card.contains(e.relatedTarget)) card.style.transform = "";
  });

  // Подсветка карточек преимуществ за курсором
  $$(".feature").forEach(f => f.addEventListener("mousemove", e => {
    const r = f.getBoundingClientRect();
    f.style.setProperty("--mx", e.clientX - r.left + "px");
    f.style.setProperty("--my", e.clientY - r.top + "px");
  }));

  // Собственный курсор
  const cursor = $("#cursor"), label = $("#cursorLabel");
  let mx = -100, my = -100, cx = -100, cy = -100;
  window.addEventListener("mousemove", e => { mx = e.clientX; my = e.clientY; cursor.classList.add("is-active"); });
  document.addEventListener("mouseleave", () => cursor.classList.remove("is-active"));
  const follow = () => {
    cx += (mx - cx) * 0.2;
    cy += (my - cy) * 0.2;
    cursor.style.transform = `translate(${cx}px, ${cy}px)`;
    requestAnimationFrame(follow);
  };
  follow();
  document.addEventListener("mouseover", e => {
    const card = e.target.closest(".card, .district");
    const onCard = card && !e.target.closest(".card__fav");
    const hover = e.target.closest("a, button, select, input, label");
    cursor.classList.toggle("is-label", !!onCard);
    cursor.classList.toggle("is-hover", !onCard && !!hover);
    label.textContent = onCard ? (card.classList.contains("card") ? "Открыть" : card.classList.contains("district--cta") ? "Написать" : "Смотреть") : "";
  });
}

/* ============ Счётчики ============ */
const animateCount = el => {
  const target = +el.dataset.count, suffix = el.dataset.suffix || "";
  const start = performance.now(), dur = 2000;
  const tick = now => {
    const t = Math.min((now - start) / dur, 1);
    el.textContent = Math.round(target * (1 - Math.pow(1 - t, 4))).toLocaleString("ru-RU") + suffix;
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};
const startCounters = () => $$("[data-count]").forEach(animateCount);

/* ============ Разбивка текста на слова / буквы ============ */
function splitWords(el) {
  const walk = node => {
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(" "); return; }
          const w = document.createElement("span"), i = document.createElement("span");
          w.className = "w";
          i.textContent = part;
          w.append(i);
          frag.append(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName !== "BR") {
        walk(n);
      }
    });
  };
  walk(el);
  return $$(".w > span", el);
}

/* ============ Анимации прокрутки (GSAP) ============ */
let heroWords = [];

function setupScrollAnimations() {
  // Начальные состояния главного экрана
  heroWords = splitWords($("#heroTitle"));
  gsap.set(heroWords, { yPercent: 115 });
  gsap.set(".hero .intro", { opacity: 0, y: 40 });
  gsap.set(".intro-float", { opacity: 0, scale: 0.85 });

  // Параллакс главного экрана
  const heroST = { trigger: ".hero", start: "top top", end: "bottom top", scrub: true };
  gsap.to("#heroBg", { yPercent: 16, ease: "none", scrollTrigger: heroST });
  gsap.to("#heroContent", { y: -120, opacity: 0.15, ease: "none", scrollTrigger: { ...heroST } });

  // Заголовки секций — слова выезжают снизу
  $$(".split").forEach(el => {
    if (el.id === "heroTitle") return;
    const words = splitWords(el);
    gsap.set(words, { yPercent: 115 });
    const show = () => gsap.to(words, { yPercent: 0, duration: 1.2, ease: "expo.out", stagger: 0.06 });
    ScrollTrigger.create({ trigger: el, start: "top 88%", once: true, onEnter: show, onLeave: show });
  });

  // Плавное появление блоков
  // Блоки, появившиеся на экране одновременно, выезжают «лесенкой»
  gsap.set(".reveal", { opacity: 0, y: 50 });
  const revealIO = new IntersectionObserver(entries => {
    const shown = entries.filter(en => en.isIntersecting).map(en => en.target);
    if (!shown.length) return;
    shown.forEach(el => revealIO.unobserve(el));
    gsap.to(shown, { opacity: 1, y: 0, duration: 1.2, ease: "expo.out", stagger: 0.12 });
  }, { rootMargin: "0px 0px -8% 0px" });
  $$(".reveal").forEach(el => revealIO.observe(el));

  // Бегущая строка: ускоряется и меняет направление вместе с прокруткой
  const mq = gsap.to("#marqueeTrack", { xPercent: -50, repeat: -1, duration: 30, ease: "none" });
  mq.totalTime(30 * 100);
  let dir = 1;
  ScrollTrigger.create({
    onUpdate: self => {
      dir = self.direction;
      const boost = Math.min(Math.abs(self.getVelocity()) / 250, 8);
      gsap.to(mq, {
        timeScale: dir * (1 + boost), duration: 0.25, overwrite: true,
        onComplete: () => gsap.to(mq, { timeScale: dir, duration: 1.4, ease: "power2.out" })
      });
    }
  });

  // Районы: на десктопе — горизонтальная прокрутка с закреплением
  const mm = gsap.matchMedia();
  mm.add("(min-width: 861px)", () => {
    const track = $("#districtsTrack");
    const dist = () => track.scrollWidth - document.documentElement.clientWidth;
    const tween = gsap.to(track, {
      x: () => -dist(), ease: "none",
      scrollTrigger: {
        trigger: "#districtsPin", start: "top top", end: () => "+=" + dist(),
        pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1
      }
    });
    $$(".district img").forEach(img => gsap.fromTo(img,
      { xPercent: -6, scale: 1.18 },
      { xPercent: 6, scale: 1.18, ease: "none", scrollTrigger: { trigger: img.parentElement, containerAnimation: tween, start: "left right", end: "right left", scrub: true } }
    ));
  });

  // Параллакс фото в блоке «Как мы работаем»
  gsap.fromTo("#processImg", { yPercent: -15 }, {
    yPercent: 0, ease: "none",
    scrollTrigger: { trigger: ".process__frame", start: "top bottom", end: "bottom top", scrub: true }
  });

  // Линия этапов заполняется по мере прокрутки
  const steps = $("#steps"), stepItems = $$("li", steps);
  ScrollTrigger.create({
    trigger: steps, start: "top 65%", end: "bottom 55%", scrub: true,
    onUpdate: self => {
      steps.style.setProperty("--fill", self.progress.toFixed(3));
      stepItems.forEach((li, i) => li.classList.toggle("is-done", self.progress > (i / (stepItems.length - 1)) * 0.97));
    }
  });

  // Блок заявки «раскрывается» при приближении
  gsap.fromTo("#cta", { scale: 0.9, borderRadius: 80 }, {
    scale: 1, borderRadius: 32, ease: "none",
    scrollTrigger: { trigger: "#cta", start: "top bottom", end: "top 45%", scrub: true }
  });

  // Большая надпись в подвале — буквы поднимаются
  const word = $("#footerWord");
  word.innerHTML = [...word.textContent].map(ch => `<span>${ch}</span>`).join("");
  gsap.from($$("span", word), {
    yPercent: 100, duration: 1.4, ease: "expo.out", stagger: 0.07,
    scrollTrigger: { trigger: ".footer", start: "top 85%" }
  });

  // Карточки на главном экране слегка следуют за мышью
  if (finePointer) {
    $(".hero").addEventListener("mousemove", e => {
      const x = e.clientX / window.innerWidth - 0.5, y = e.clientY / window.innerHeight - 0.5;
      $$(".float-card").forEach(c => gsap.to(c, { x: x * c.dataset.depth, y: y * c.dataset.depth, duration: 1.2, ease: "power3.out" }));
    });
  }

  if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener("load", () => ScrollTrigger.refresh());
}

function playIntro() {
  if (!hasGsap) { startCounters(); return; }
  gsap.timeline({ defaults: { ease: "expo.out" } })
    .fromTo("#heroBgImg", { scale: 1.25 }, { scale: 1, duration: 2.6, ease: "power3.out" }, 0)
    .from("#header", { opacity: 0, duration: 1.2, clearProps: "opacity" }, 0.2)
    .to(heroWords, { yPercent: 0, duration: 1.4, stagger: 0.08 }, 0.15)
    .to(".hero .intro", { opacity: 1, y: 0, duration: 1.3, stagger: 0.1 }, 0.5)
    .to(".intro-float", { opacity: 1, scale: 1, duration: 1.5, stagger: 0.15 }, 0.8)
    .add(startCounters, 0.9);
}

/* ============ Прелоадер ============ */
function runPreloader(done) {
  const pre = $("#preloader");
  if (!pre || reduceMotion) { pre?.remove(); done(); return; }
  lenis?.stop();
  const bar = $("#preloaderBar"), count = $("#preloaderCount");
  let loaded = document.readyState === "complete";
  window.addEventListener("load", () => { loaded = true; });
  const start = performance.now();
  const tick = now => {
    const elapsed = now - start;
    // минимум 1,4 с для красоты, максимум 3,5 с даже если фото ещё грузятся
    const finished = elapsed > 3500 || (loaded && elapsed > 1400);
    const p = finished ? 1 : Math.min(elapsed / 1400, 0.92);
    bar.style.transform = `scaleX(${p})`;
    count.textContent = Math.round(p * 100);
    if (!finished) { requestAnimationFrame(tick); return; }
    setTimeout(() => {
      pre.classList.add("is-done");
      lenis?.start();
      setTimeout(done, 250);
      setTimeout(() => pre.remove(), 1100);
    }, 200);
  };
  requestAnimationFrame(tick);
}

/* Запасной вариант без GSAP: простое появление при прокрутке */
function setupFallbackReveal() {
  const steps = $("#steps");
  steps.style.setProperty("--fill", 1);
  $$("li", steps).forEach(li => li.classList.add("is-done"));
  if (!("IntersectionObserver" in window)) { $$(".reveal").forEach(el => el.classList.add("is-visible")); return; }
  const io = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add("is-visible");
    io.unobserve(entry.target);
  }), { threshold: 0.15 });
  $$(".reveal").forEach((el, i) => { el.style.transitionDelay = `${(i % 4) * 90}ms`; io.observe(el); });
}

/* ============ Форма заявки ============ */
$("#contactForm").addEventListener("submit", e => {
  e.preventDefault();
  const f = e.target;
  let ok = true;
  [f.elements.name, f.elements.phone].forEach(input => {
    const bad = input.name === "phone" ? input.value.replace(/\D/g, "").length < 10 : !input.value.trim();
    const field = input.closest(".field");
    field.classList.remove("is-invalid");
    void field.offsetWidth;
    field.classList.toggle("is-invalid", bad);
    if (bad) ok = false;
  });
  if (!ok) return showToast("Пожалуйста, заполните имя и телефон");
  f.reset();
  showToast("Спасибо! Мы перезвоним в течение 15 минут");
});

let toastTimer;
function showToast(text) {
  const t = $("#toast");
  t.textContent = text;
  t.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("is-visible"), 2800);
}

/* ============ Старт ============ */
$("#year").textContent = new Date().getFullYear();
render();
updatePills();
if (hasGsap) setupScrollAnimations(); else setupFallbackReveal();
runPreloader(playIntro);
