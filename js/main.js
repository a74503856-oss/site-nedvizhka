(function () {
  // Мобильное меню
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
    if (e.target.tagName === 'A') closeNav();
  });

  // Кнопки в блоке цен подставляют формат в форму
  document.querySelectorAll('[data-format]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var radio = document.querySelector('input[name="format"][value="' + btn.dataset.format + '"]');
      if (radio) radio.checked = true;
    });
  });

  document.getElementById('year').textContent = new Date().getFullYear();

  // Форма заявки
  var form = document.querySelector('.form');
  var status = form.querySelector('.form__status');
  var submit = form.querySelector('button[type="submit"]');

  function setStatus(text, type) {
    status.textContent = text;
    status.className = 'form__status' + (type ? ' is-' + type : '');
  }

  function validate() {
    var ok = true;
    ['name', 'contact'].forEach(function (n) {
      var input = form.elements[n];
      var bad = input.value.trim().length < 2;
      input.closest('.field').classList.toggle('is-invalid', bad);
      if (bad) ok = false;
    });
    var consent = form.elements.consent;
    consent.closest('.check').classList.toggle('is-invalid', !consent.checked);
    if (!consent.checked) ok = false;
    return ok;
  }

  // Результат отправки без JS (редирект с send.php)
  var params = new URLSearchParams(location.search);
  if (params.has('sent')) {
    setStatus(params.get('sent') === '1'
      ? 'Спасибо! Заявка отправлена, я свяжусь с вами в ближайшее время.'
      : 'Не удалось отправить заявку. Пожалуйста, позвоните или напишите в Telegram.',
      params.get('sent') === '1' ? 'ok' : 'error');
    history.replaceState(null, '', location.pathname + '#form');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) {
      setStatus('Заполните имя, контакт и подтвердите согласие.', 'error');
      return;
    }

    submit.disabled = true;
    setStatus('Отправляем…');

    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { 'Accept': 'application/json' }
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok && d.ok, data: d }; }); })
      .then(function (res) {
        if (!res.ok) throw new Error(res.data.error || 'error');
        form.reset();
        setStatus('Спасибо! Заявка отправлена, я свяжусь с вами в ближайшее время.', 'ok');
        if (typeof ym === 'function' && window.YM_ID) ym(window.YM_ID, 'reachGoal', 'lead');
      })
      .catch(function () {
        setStatus('Не удалось отправить заявку. Пожалуйста, позвоните или напишите в Telegram.', 'error');
      })
      .finally(function () { submit.disabled = false; });
  });
})();
