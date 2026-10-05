// Общие функции для всех публичных страниц: шапка, подвал, форма заявки, утилиты.
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const money = (n) => Math.round(n).toLocaleString('ru-RU') + ' ₽';
const telHref = (p) => 'tel:' + String(p || '').replace(/[^\d+]/g, '');

async function api(url, opts = {}) {
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Ошибка ' + res.status);
  return data;
}

const settingsPromise = api('/api/settings').catch(() => ({}));

function renderLayout(s) {
  const path = location.pathname;
  const active = (href) => (href === '/' ? path === '/' || path === '/index.html' : path.startsWith(href)) ? 'active' : '';
  const name = esc(s.companyName || 'Компания');

  const header = document.querySelector('[data-header]');
  if (header) {
    header.innerHTML = `
      <div class="container header__inner">
        <a class="logo" href="/"><img src="/img/logo.svg" alt="">${name}</a>
        <button class="burger" aria-label="Меню" aria-expanded="false"><span></span><span></span><span></span></button>
        <nav class="nav">
          <a href="/" class="${active('/')}">О компании</a>
          <a href="/projects" class="${active('/projects')}">Проекты домов</a>
          <a href="/video" class="${active('/video')}">Видео и камеры</a>
          <a href="/#contacts">Контакты</a>
        </nav>
        <a class="header__phone" href="${telHref(s.phone)}">${esc(s.phone)}</a>
        <button class="btn btn--sm" data-open-callback>Заказать звонок</button>`;
    const burger = header.querySelector('.burger');
    const nav = header.querySelector('.nav');
    burger.addEventListener('click', () => {
      nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', nav.classList.contains('open'));
    });
    nav.addEventListener('click', (e) => e.target.tagName === 'A' && nav.classList.remove('open'));
  }

  const footer = document.querySelector('[data-footer]');
  if (footer) {
    footer.innerHTML = `
      <div class="container">
        <div class="footer__inner">
          <div>
            <a class="logo" href="/"><img src="/img/logo.svg" alt="">${name}</a>
            <p style="max-width:340px;margin-top:12px">${esc(s.tagline)}</p>
          </div>
          <div class="footer__nav">
            <a href="/">О компании</a><a href="/projects">Проекты домов</a><a href="/video">Видео и камеры</a>
          </div>
          <div class="footer__nav">
            <a href="${telHref(s.phone)}">${esc(s.phone)}</a>
            <a href="mailto:${esc(s.email)}">${esc(s.email)}</a>
            <span>${esc(s.address)}</span>
            <span>${esc(s.workHours)}</span>
          </div>
        </div>
        <div class="footer__copy">© ${new Date().getFullYear()} ${name}. Все права защищены.</div>
      </div>`;
  }

  // Модальное окно «Заказать звонок» — одно на все страницы
  if (!document.getElementById('callback-modal')) {
    document.body.insertAdjacentHTML(
      'beforeend',
      `<div class="modal" id="callback-modal" role="dialog" aria-modal="true" aria-labelledby="cb-title">
        <div class="modal__box">
          <button class="modal__close" aria-label="Закрыть" data-close>×</button>
          <h3 id="cb-title">Заказать звонок</h3>
          <p class="muted">Оставьте номер — перезвоним в течение 15 минут в рабочее время.</p>
          <form class="form" data-lead-form data-source="Заказать звонок">
            <input class="form__hp" name="website" tabindex="-1" autocomplete="off">
            <label class="field"><span>Имя</span><input type="text" name="name" required maxlength="100"></label>
            <label class="field"><span>Телефон</span><input type="tel" name="phone" required placeholder="+7 (___) ___-__-__"></label>
            <button class="btn btn--block" type="submit">Жду звонка</button>
            <div class="form__agree">Нажимая кнопку, вы соглашаетесь на обработку персональных данных.</div>
          </form>
        </div>
      </div>`
    );
  }
  const modal = document.getElementById('callback-modal');
  const open = (source) => {
    const f = modal.querySelector('form');
    f.dataset.source = source || 'Заказать звонок';
    delete f.dataset.withCalc;
    modal.classList.add('open');
    setTimeout(() => f.querySelector('[name=name]').focus(), 50);
  };
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-open-callback]');
    if (btn) open(btn.dataset.openCallback);
    if (e.target === modal || e.target.closest('[data-close]')) modal.classList.remove('open');
  });
  document.addEventListener('keydown', (e) => e.key === 'Escape' && modal.classList.remove('open'));
  window.openCallback = open;

  document.querySelectorAll('[data-lead-form]').forEach(bindLeadForm);
}

function bindLeadForm(form) {
  if (form.dataset.bound) return;
  form.dataset.bound = '1';
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('[type=submit]');
    form.querySelector('.form__msg')?.remove();
    const body = Object.fromEntries(new FormData(form));
    body.source = form.dataset.source || document.title;
    if (form.dataset.withCalc && window.currentCalcSummary) body.calc = window.currentCalcSummary();
    btn.disabled = true;
    try {
      await api('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      form.reset();
      form.insertAdjacentHTML('beforeend', '<div class="form__msg form__msg--ok">Спасибо! Заявка отправлена, скоро свяжемся с вами.</div>');
    } catch (err) {
      form.insertAdjacentHTML('beforeend', `<div class="form__msg form__msg--err">${esc(err.message)}</div>`);
    } finally {
      btn.disabled = false;
    }
  });
}

settingsPromise.then(renderLayout);

// Карточка проекта (используется на главной и на странице проектов)
function projectCard(p) {
  const meta = [
    p.area && `${p.area} м²`,
    p.floors && `Этажей: ${esc(p.floors)}`,
    p.bedrooms && `Спален: ${p.bedrooms}`,
    p.size && esc(p.size)
  ].filter(Boolean);
  return `
    <a class="project-card" href="/projects/${encodeURIComponent(p.id)}">
      <img class="project-card__img" loading="lazy" src="${esc(p.photos?.[0] || '/img/placeholder.svg')}" alt="${esc(p.title)}">
      <div class="project-card__body">
        ${p.material ? `<div style="margin-bottom:8px"><span class="badge">${esc(p.material)}</span></div>` : ''}
        <h3>${esc(p.title)}</h3>
        <div class="project-card__meta">${meta.map((m) => `<span>${m}</span>`).join('')}</div>
        <div class="project-card__price">${p.price ? 'от ' + money(p.price) : 'Цена по запросу'}</div>
      </div>
    </a>`;
}
