(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var header = document.querySelector('.header');
  var progress = document.querySelector('.progress');
  var toTop = document.querySelector('.to-top');
  var stickyCta = document.querySelector('.sticky-cta');
  var hero = document.querySelector('.hero');
  var formBox = document.getElementById('form');

  /* ---------- Плавная прокрутка к якорям ---------- */
  function easeInOutCubic(t) {
    return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function scrollToY(targetY) {
    if (reduceMotion) { window.scrollTo(0, targetY); return; }
    var startY = window.pageYOffset;
    var distance = targetY - startY;
    var duration = Math.min(1400, Math.max(600, Math.abs(distance) * 0.5));
    var start = null;
    function step(ts) {
      if (start === null) start = ts;
      var t = Math.min((ts - start) / duration, 1);
      window.scrollTo(0, startY + distance * easeInOutCubic(t));
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href^="#"]');
    if (!link) return;
    var id = link.getAttribute('href');
    var target = id === '#top' ? document.body : document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    var offset = id === '#top' ? 0 : target.getBoundingClientRect().top + window.pageYOffset - 80;
    scrollToY(Math.max(0, offset));
    history.replaceState(null, '', id === '#top' ? location.pathname : id);
  });

  /* ---------- Мобильное меню ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('nav');

  function closeNav() {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  }
  toggle.addEventListener('click', function () {
    var open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) closeNav();
  });

  /* ---------- Состояние при прокрутке ---------- */
  var ticking = false;
  function onScroll() {
    var y = window.pageYOffset;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var p = max > 0 ? y / max : 0;
    progress.style.setProperty('--p', p.toFixed(4));
    toTop.style.setProperty('--p', p.toFixed(4));
    header.classList.toggle('is-scrolled', y > 20);
    toTop.classList.toggle('is-shown', y > window.innerHeight);

    var heroBottom = hero.offsetTop + hero.offsetHeight;
    var formRect = formBox.getBoundingClientRect();
    var formInView = formRect.top < window.innerHeight && formRect.bottom > 0;
    stickyCta.classList.toggle('is-shown', y > heroBottom - 200 && !formInView);

    // Лёгкий параллакс фото и фоновых пятен в первом экране
    if (!reduceMotion && y < heroBottom) {
      document.querySelectorAll('[data-parallax]').forEach(function (el) {
        el.style.transform = 'translateY(' + (y * parseFloat(el.dataset.parallax)) + 'px)';
      });
      hero.querySelector('.hero__bg').style.transform = 'translateY(' + (y * 0.3) + 'px)';
    }
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- Активный пункт меню ---------- */
  var navLinks = {};
  nav.querySelectorAll('a:not(.btn)').forEach(function (a) { navLinks[a.getAttribute('href').slice(1)] = a; });
  if ('IntersectionObserver' in window) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        Object.keys(navLinks).forEach(function (k) { navLinks[k].classList.remove('is-active'); });
        if (navLinks[entry.target.id]) navLinks[entry.target.id].classList.add('is-active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('main section[id]').forEach(function (s) { sectionObserver.observe(s); });
  }

  /* ---------- Появление блоков при прокрутке ---------- */
  document.querySelectorAll('[data-reveal-group]').forEach(function (group) {
    group.querySelectorAll('[data-reveal]').forEach(function (el, i) {
      el.style.setProperty('--rd', (i * 0.12) + 's');
    });
  });

  var revealEls = document.querySelectorAll('[data-reveal], .steps');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Счётчики в первом экране ---------- */
  if (!reduceMotion) {
    document.querySelectorAll('[data-count]').forEach(function (el, i) {
      var end = parseInt(el.dataset.count, 10);
      var duration = 1800;
      var start = null;
      el.textContent = '0';
      setTimeout(function () {
        requestAnimationFrame(function step(ts) {
          if (start === null) start = ts;
          var t = Math.min((ts - start) / duration, 1);
          el.textContent = Math.round(end * (1 - Math.pow(1 - t, 3)));
          if (t < 1) requestAnimationFrame(step);
        });
      }, 700 + i * 150);
    });
  }

  /* ---------- Волна при нажатии на кнопку ---------- */
  document.querySelectorAll('.btn').forEach(function (btn) {
    btn.addEventListener('pointerdown', function (e) {
      if (reduceMotion) return;
      var rect = btn.getBoundingClientRect();
      var size = Math.max(rect.width, rect.height) * 2;
      var r = document.createElement('span');
      r.className = 'ripple';
      r.style.width = r.style.height = size + 'px';
      r.style.left = (e.clientX - rect.left - size / 2) + 'px';
      r.style.top = (e.clientY - rect.top - size / 2) + 'px';
      btn.appendChild(r);
      setTimeout(function () { r.remove(); }, 700);
    });
  });

  /* ---------- Плавное раскрытие FAQ ---------- */
  document.querySelectorAll('.faq details').forEach(function (d) {
    var summary = d.querySelector('summary');
    var body = d.querySelector('.faq__body');
    summary.addEventListener('click', function (e) {
      if (reduceMotion || !body.animate) return;
      e.preventDefault();
      if (d.open) {
        var h = body.offsetHeight;
        body.animate([{ height: h + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 350, easing: 'ease-in-out' })
          .onfinish = function () { d.open = false; };
      } else {
        d.open = true;
        var full = body.offsetHeight;
        body.animate([{ height: '0px', opacity: 0 }, { height: full + 'px', opacity: 1 }], { duration: 450, easing: 'cubic-bezier(.2,.7,.2,1)' });
      }
    });
  });

  /* ---------- Точки слайдера отзывов (телефон) ---------- */
  var reviews = document.querySelector('.reviews');
  var dotsBox = document.querySelector('.reviews__dots');
  var reviewItems = reviews.querySelectorAll('.review');
  reviewItems.forEach(function (_, i) {
    var dot = document.createElement('span');
    if (i === 0) dot.className = 'is-active';
    dotsBox.appendChild(dot);
  });
  reviews.addEventListener('scroll', function () {
    var idx = Math.round(reviews.scrollLeft / (reviewItems[0].offsetWidth + 16));
    dotsBox.querySelectorAll('span').forEach(function (d, i) { d.classList.toggle('is-active', i === idx); });
  }, { passive: true });

  /* ---------- Кнопки в блоке цен подставляют формат в форму ---------- */
  document.querySelectorAll('[data-format]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var radio = document.querySelector('input[name="format"][value="' + btn.dataset.format + '"]');
      if (radio) radio.checked = true;
    });
  });

  document.getElementById('year').textContent = new Date().getFullYear();

  /* ---------- Форма заявки ---------- */
  var form = document.querySelector('.form');
  var status = form.querySelector('.form__status');
  var submit = form.querySelector('button[type="submit"]');
  var success = document.querySelector('.form__success');

  function setStatus(text, type) {
    status.textContent = text;
    status.className = 'form__status' + (type ? ' is-' + type : '');
  }

  function showSuccess() {
    form.hidden = true;
    success.hidden = false;
  }

  document.querySelector('.form__again').addEventListener('click', function () {
    success.hidden = true;
    form.hidden = false;
    setStatus('');
  });

  function validate() {
    var ok = true;
    ['name', 'contact'].forEach(function (n) {
      var input = form.elements[n];
      var field = input.closest('.field');
      var bad = input.value.trim().length < 2;
      field.classList.remove('is-invalid');
      if (bad) { void field.offsetWidth; field.classList.add('is-invalid'); ok = false; }
    });
    var consent = form.elements.consent;
    consent.closest('.check').classList.toggle('is-invalid', !consent.checked);
    if (!consent.checked) ok = false;
    return ok;
  }

  // Результат отправки без JS (редирект с send.php)
  var params = new URLSearchParams(location.search);
  if (params.has('sent')) {
    if (params.get('sent') === '1') showSuccess();
    else setStatus('Не удалось отправить заявку. Пожалуйста, позвоните или напишите в Telegram.', 'error');
    history.replaceState(null, '', location.pathname + '#form');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) {
      setStatus('Заполните имя, контакт и подтвердите согласие.', 'error');
      return;
    }

    submit.disabled = true;
    submit.classList.add('is-loading');
    setStatus('');

    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { 'Accept': 'application/json' }
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok && d.ok, data: d }; }); })
      .then(function (res) {
        if (!res.ok) throw new Error(res.data.error || 'error');
        form.reset();
        showSuccess();
        if (typeof ym === 'function' && window.YM_ID) ym(window.YM_ID, 'reachGoal', 'lead');
      })
      .catch(function () {
        setStatus('Не удалось отправить заявку. Пожалуйста, позвоните или напишите в Telegram.', 'error');
      })
      .finally(function () {
        submit.disabled = false;
        submit.classList.remove('is-loading');
      });
  });
})();
