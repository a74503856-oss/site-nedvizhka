// Анимации сайта: плавная прокрутка, появление блоков, параллакс, счётчики,
// прогресс чтения, «умная» шапка, кнопка «наверх», наклон карточек, волна на кнопках.
// Всё отключается, если в системе включено «уменьшить движение».
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const escHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  // ---------- Прелоадер (один раз за сессию) ----------
  let seen = false;
  try {
    seen = sessionStorage.getItem('preloaded') === '1';
    sessionStorage.setItem('preloaded', '1');
  } catch {}
  if (!seen && !reduce) {
    const pre = document.createElement('div');
    pre.className = 'preloader';
    pre.innerHTML = '<img src="/img/logo.svg" alt="">';
    document.body.appendChild(pre);
    const started = performance.now();
    const hide = () => {
      setTimeout(() => {
        pre.classList.add('done');
        setTimeout(() => pre.remove(), 1000);
      }, Math.max(0, 600 - (performance.now() - started)));
    };
    if (document.readyState === 'complete') hide();
    else addEventListener('load', hide, { once: true });
    setTimeout(hide, 2500); // на случай медленной загрузки картинок
  }

  // ---------- Плавная (инерционная) прокрутка ----------
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1, smoothWheel: true });
    const raf = (t) => {
      lenis.raf(t);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }
  const headerOffset = () => -(document.querySelector('.header')?.offsetHeight || 0);
  function scrollToTarget(target) {
    if (lenis) lenis.scrollTo(target, { offset: typeof target === 'number' ? 0 : headerOffset(), duration: 1.4 });
    else if (typeof target === 'number') scrollTo({ top: target, behavior: reduce ? 'auto' : 'smooth' });
    else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }
  // Якорные ссылки (#calc, /#contacts) — плавно и с учётом шапки
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href*="#"]');
    if (!a || a.target === '_blank') return;
    const url = new URL(a.href, location.href);
    if (url.pathname !== location.pathname || !url.hash) return;
    const el = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (!el) return;
    e.preventDefault();
    history.pushState(null, '', url.hash);
    scrollToTarget(el);
  });

  // ---------- Служебные элементы: прогресс, «наверх» ----------
  const progress = document.createElement('div');
  progress.className = 'scroll-progress';
  document.body.appendChild(progress);

  const toTop = document.createElement('button');
  toTop.className = 'to-top';
  toTop.setAttribute('aria-label', 'Наверх');
  toTop.innerHTML = '<svg viewBox="0 0 54 54"><circle cx="27" cy="27" r="24"/></svg><span>↑</span>';
  toTop.addEventListener('click', () => scrollToTarget(0));
  document.body.appendChild(toTop);

  // ---------- Появление блоков при прокрутке ----------
  // [селектор, вариант анимации, каскад (задержка по порядку среди соседей)]
  const AUTO = [
    ['.section__head', '', false],
    ['.feature', '', true],
    ['.project-card', '', true],
    ['.video-card', '', true],
    ['.step', '', true],
    ['.calc > .card', '', true],
    ['.about > div:first-child', 'left', false],
    ['.about__media', 'right', false],
    ['.contact > *', '', true],
    ['.cta', 'zoom', false],
    ['.project', '', false],
    ['.filters, .tabs', '', false],
    ['.empty', '', false],
    ['.project__about', '', false]
  ];

  const io =
    !reduce &&
    'IntersectionObserver' in window &&
    new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          const el = en.target;
          io.unobserve(el);
          el.classList.add('is-visible');
          // после анимации убираем служебные классы — работают обычные hover-эффекты
          const delay = parseFloat(el.style.getPropertyValue('--d')) || 0;
          setTimeout(() => {
            el.classList.remove('reveal', 'reveal--left', 'reveal--right', 'reveal--zoom', 'is-visible');
            el.style.removeProperty('--d');
          }, 1000 + delay);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );

  const countIO =
    !reduce &&
    'IntersectionObserver' in window &&
    new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          countIO.unobserve(en.target);
          countUp(en.target);
        }),
      { threshold: 0.5 }
    );

  function scan() {
    if (io) {
      for (const [sel, variant, stagger] of AUTO) {
        document.querySelectorAll(sel).forEach((el) => {
          if (el.dataset.rv || el.closest('.modal')) return;
          el.dataset.rv = '1';
          el.classList.add('reveal');
          if (variant) el.classList.add('reveal--' + variant);
          if (stagger) {
            const sibs = [...el.parentElement.children].filter((c) => c.matches(sel));
            el.style.setProperty('--d', (sibs.indexOf(el) % 6) * 110 + 'ms');
          }
          io.observe(el);
        });
      }
    }
    if (countIO) {
      document.querySelectorAll('.stat__value:not([data-counted])').forEach((el) => {
        el.dataset.counted = '1';
        countIO.observe(el);
      });
    }
  }

  // Счётчик «0 → 320»
  function countUp(el) {
    const m = el.textContent.match(/^(\D*)(\d+(?:[\s ]\d{3})*)(.*)$/);
    if (!m) return;
    const target = parseInt(m[2].replace(/\s/g, ''), 10);
    if (!target) return;
    const dur = 1800;
    const t0 = performance.now();
    const step = (t) => {
      const k = clamp((t - t0) / dur);
      const eased = 1 - Math.pow(2, -10 * k); // easeOutExpo
      el.textContent = m[1] + Math.round(target * (k === 1 ? 1 : eased)).toLocaleString('ru-RU') + m[3];
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  let scanQueued = false;
  new MutationObserver((muts) => {
    // реагируем только на добавление элементов (смена классов сама по себе не важна)
    if (!scanQueued && muts.some((m) => m.type === 'childList' && m.addedNodes.length)) {
      scanQueued = true;
      requestAnimationFrame(() => {
        scanQueued = false;
        scan();
        onScroll();
      });
    }
    // модальное окно / лайтбокс — останавливаем плавную прокрутку страницы
    if (lenis && muts.some((m) => m.type === 'attributes' && m.target.matches?.('.modal, .lightbox'))) {
      document.querySelector('.modal.open, .lightbox.open') ? lenis.stop() : lenis.start();
    }
  }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  scan();

  // ---------- Обработка прокрутки ----------
  let lastY = scrollY;
  let ticking = false;
  function onScroll() {
    const y = scrollY;
    const vh = innerHeight;
    const max = document.documentElement.scrollHeight - vh;
    const p = max > 0 ? clamp(y / max) : 0;
    progress.style.setProperty('--p', p);
    toTop.style.setProperty('--p', p);
    toTop.classList.toggle('show', y > vh * 0.8);

    const header = document.querySelector('.header');
    if (header) {
      header.classList.toggle('header--solid', y > 40);
      const navOpen = header.querySelector('.nav.open');
      // «умная» шапка: прячется при прокрутке вниз, появляется при прокрутке вверх
      if (!navOpen && y > vh * 0.6 && y > lastY + 4) header.classList.add('header--hidden');
      else if (y < lastY - 4 || y < vh * 0.6 || navOpen) header.classList.remove('header--hidden');
    }
    lastY = y;

    if (reduce) return;

    // Параллакс: data-parallax="0.3" — скорость смещения относительно прокрутки
    document.querySelectorAll('[data-parallax]').forEach((el) => {
      const r = el.parentElement.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      const speed = parseFloat(el.dataset.parallax) || 0.2;
      const center = r.top + r.height / 2 - vh / 2;
      el.style.translate = `0 ${(-center * speed).toFixed(1)}px`;
    });

    // Линия «Этапы работы» заполняется по мере прокрутки
    document.querySelectorAll('.steps').forEach((steps) => {
      const r = steps.getBoundingClientRect();
      const k = clamp((vh * 0.7 - r.top) / (r.height || 1));
      steps.style.setProperty('--progress', k.toFixed(3));
      const items = [...steps.querySelectorAll('.step')];
      items.forEach((s, i) => s.classList.toggle('is-active', k >= (items.length > 1 ? i / (items.length - 1) : 0) * 0.98));
    });
  }
  addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        onScroll();
      });
    },
    { passive: true }
  );
  addEventListener('resize', onScroll);
  onScroll();

  // ---------- Волна при нажатии на кнопку ----------
  document.addEventListener('pointerdown', (e) => {
    const btn = e.target.closest('.btn');
    if (!btn || reduce) return;
    const r = btn.getBoundingClientRect();
    const size = Math.max(r.width, r.height) * 2.2;
    const s = document.createElement('span');
    s.className = 'ripple';
    s.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`;
    btn.appendChild(s);
    setTimeout(() => s.remove(), 700);
  });

  // ---------- 3D-наклон карточек проектов за курсором ----------
  if (finePointer && !reduce) {
    document.addEventListener('pointermove', (e) => {
      const card = e.target.closest?.('.project-card');
      if (!card || card.classList.contains('reveal')) return;
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.setProperty('--ry', (x * 8).toFixed(2) + 'deg');
      card.style.setProperty('--rx', (-y * 8).toFixed(2) + 'deg');
    });
    document.addEventListener('pointerout', (e) => {
      const card = e.target.closest?.('.project-card');
      if (card && !card.contains(e.relatedTarget)) {
        card.style.removeProperty('--rx');
        card.style.removeProperty('--ry');
      }
    });
  }

  // ---------- Публичные помощники для скриптов страниц ----------
  window.Motion = {
    lenis,
    scrollTo: scrollToTarget,
    // Пословное появление заголовка
    split(el) {
      if (!el) return;
      const text = el.textContent.trim();
      el.classList.add('split');
      if (reduce || !text) return;
      el.setAttribute('aria-label', text);
      el.innerHTML = text
        .split(/\s+/)
        .map((w, i) => `<span class="w" aria-hidden="true"><span style="--i:${i}">${escHtml(w)}</span></span>`)
        .join(' ');
    },
    // Плавное изменение числа (сумма в калькуляторе)
    tween(el, to, format, dur = 600) {
      const from = el._tweenVal ?? to;
      el._tweenVal = to;
      cancelAnimationFrame(el._tweenRaf);
      if (reduce || from === to) {
        el.textContent = format(to);
        return;
      }
      el.classList.remove('bump');
      void el.offsetWidth;
      el.classList.add('bump');
      const t0 = performance.now();
      const step = (t) => {
        const k = clamp((t - t0) / dur);
        const e = 1 - Math.pow(1 - k, 3);
        el.textContent = format(from + (to - from) * e);
        if (k < 1) el._tweenRaf = requestAnimationFrame(step);
      };
      el._tweenRaf = requestAnimationFrame(step);
    }
  };

  // Статичные заголовки страниц с data-split (на главной заголовок приходит из настроек)
  document.querySelectorAll('[data-split]:not([data-s])').forEach((el) => window.Motion.split(el));
})();
