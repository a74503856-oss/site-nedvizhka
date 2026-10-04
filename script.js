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

function render() {
  const list = properties.filter(p =>
    p.deal === state.deal &&
    (state.type === "all" || p.type === state.type) &&
    (state.district === "all" || p.district === state.district) &&
    (state.rooms === "all" || (state.rooms === "4" ? p.rooms >= 4 : p.rooms === +state.rooms))
  );

  $("#grid").innerHTML = list.map((p, i) => `
    <article class="card" data-id="${p.id}" style="animation-delay:${i * 70}ms">
      <div class="card__media">
        <img src="${p.img}" alt="${p.title}" loading="lazy">
        <span class="card__tag ${p.tag ? "card__tag--new" : ""}">${p.tag || typeNames[p.type]}</span>
        <button class="card__fav ${favorites.has(p.id) ? "is-active" : ""}" data-fav="${p.id}" aria-label="В избранное">${icons.heart}</button>
      </div>
      <div class="card__body">
        <div class="card__price">${formatPrice(p.price, p.deal)}</div>
        <h3 class="card__title">${p.title}</h3>
        <p class="card__addr">${icons.pin}${p.address}</p>
        <ul class="specs">${specsHtml(p)}</ul>
      </div>
    </article>`).join("");

  $("#empty").hidden = list.length > 0;
}

// Чипы-фильтры по типу
$("#filters").addEventListener("click", e => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  state.type = chip.dataset.filter;
  $("#searchForm").type.value = state.type;
  syncChips();
  render();
});

function syncChips() {
  $$(".chip").forEach(c => c.classList.toggle("is-active", c.dataset.filter === state.type));
}

// Вкладки «Купить / Арендовать»
$$(".search__tab").forEach(tab => tab.addEventListener("click", () => {
  $$(".search__tab").forEach(t => t.classList.toggle("is-active", t === tab));
  state.deal = tab.dataset.deal;
}));

// Форма поиска
$("#searchForm").addEventListener("submit", e => {
  e.preventDefault();
  const f = e.target;
  state.type = f.type.value;
  state.district = f.district.value;
  state.rooms = f.rooms.value;
  syncChips();
  render();
  $("#catalog").scrollIntoView({ behavior: "smooth" });
});

// Избранное и открытие карточки
$("#grid").addEventListener("click", e => {
  const fav = e.target.closest("[data-fav]");
  if (fav) {
    const id = +fav.dataset.fav;
    favorites.has(id) ? favorites.delete(id) : favorites.add(id);
    fav.classList.toggle("is-active");
    try { localStorage.setItem("favorites", JSON.stringify([...favorites])); } catch (err) {}
    showToast(favorites.has(id) ? "Добавлено в избранное" : "Удалено из избранного");
    return;
  }
  const card = e.target.closest(".card");
  if (card) openModal(+card.dataset.id);
});

// Модальное окно
const modal = $("#modal");
function openModal(id) {
  const p = properties.find(x => x.id === id);
  $("#modalImg").src = p.img;
  $("#modalImg").alt = p.title;
  $("#modalDistrict").textContent = `${typeNames[p.type]} · ${p.district}`;
  $("#modalTitle").textContent = p.title;
  $("#modalPrice").innerHTML = formatPrice(p.price, p.deal);
  $("#modalSpecs").innerHTML = specsHtml(p) + `<li>${p.address}</li>`;
  $("#modalDesc").textContent = p.desc;
  modal.hidden = false;
  document.body.classList.add("no-scroll");
}
function closeModal() {
  modal.hidden = true;
  document.body.classList.remove("no-scroll");
}
modal.addEventListener("click", e => { if (e.target.closest("[data-close]")) closeModal(); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && !modal.hidden) closeModal(); });

// Шапка при прокрутке
const header = $("#header");
const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 40);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// Мобильное меню
const burger = $("#burger"), nav = $("#nav");
burger.addEventListener("click", () => {
  const open = nav.classList.toggle("is-open");
  burger.classList.toggle("is-open", open);
  document.body.classList.toggle("no-scroll", open);
});
nav.addEventListener("click", e => {
  if (e.target.tagName === "A") {
    nav.classList.remove("is-open");
    burger.classList.remove("is-open");
    document.body.classList.remove("no-scroll");
  }
});

// Появление элементов и счётчики
const animateCount = el => {
  const target = +el.dataset.count, suffix = el.dataset.suffix || "";
  const start = performance.now(), dur = 1600;
  const tick = now => {
    const t = Math.min((now - start) / dur, 1);
    el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3))).toLocaleString("ru-RU") + suffix;
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};

if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      const counter = $("[data-count]", entry.target);
      if (counter) animateCount(counter);
      io.unobserve(entry.target);
    });
  }, { threshold: 0.15 });
  $$(".reveal").forEach((el, i) => {
    el.style.transitionDelay = `${(i % 4) * 90}ms`;
    io.observe(el);
  });
} else {
  $$(".reveal").forEach(el => el.classList.add("is-visible"));
  $$("[data-count]").forEach(animateCount);
}

// Форма заявки
$("#contactForm").addEventListener("submit", e => {
  e.preventDefault();
  const f = e.target;
  let ok = true;
  [f.name, f.phone].forEach(input => {
    const bad = input === f.phone ? input.value.replace(/\D/g, "").length < 10 : !input.value.trim();
    input.closest(".field").classList.toggle("is-invalid", bad);
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

$("#year").textContent = new Date().getFullYear();
render();
