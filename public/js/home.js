// Главная страница: данные компании, последние проекты, калькулятор.
settingsPromise.then((s) => {
  document.querySelectorAll('[data-s]').forEach((el) => {
    const v = s[el.dataset.s];
    if (v) el.textContent = v;
  });
  document.querySelectorAll('[data-s-tel]').forEach((a) => {
    a.textContent = s.phone || '';
    a.href = telHref(s.phone);
  });
  document.querySelectorAll('[data-s-mail]').forEach((a) => {
    a.textContent = s.email || '';
    a.href = 'mailto:' + (s.email || '');
  });

  document.querySelector('[data-stats]').innerHTML = (s.stats || [])
    .map((x) => `<div class="stat"><div class="stat__value">${esc(x.value)}</div><div class="stat__label">${esc(x.label)}</div></div>`)
    .join('');

  document.querySelector('[data-advantages]').innerHTML = (s.advantages || [])
    .map(
      (a, i) => `<div class="card feature"><div class="feature__num">${String(i + 1).padStart(2, '0')}</div>
        <h3>${esc(a.title)}</h3><p>${esc(a.text)}</p></div>`
    )
    .join('');

  initCalculator(s.calculator || {});
});

api('/api/projects')
  .then((list) => {
    if (!list.length) return document.querySelector('[data-latest-wrap]').classList.add('hidden');
    document.querySelector('[data-latest]').innerHTML = list.slice(0, 3).map(projectCard).join('');
    const photo = list.find((p) => p.photos?.length);
    if (photo) {
      document.querySelector('[data-about-img]').src = photo.photos[0];
      document.querySelector('.hero').style.setProperty('--hero-img', `url("${photo.photos[0]}")`);
    }
  })
  .catch(() => document.querySelector('[data-latest-wrap]').classList.add('hidden'));

function initCalculator(cfg) {
  const area = document.getElementById('area');
  const areaOut = document.getElementById('area-out');

  const renderChips = (key, multi) => {
    const box = document.querySelector(`[data-calc="${key}"]`);
    const items = cfg[key] || [];
    box.closest('.calc__group').classList.toggle('hidden', !items.length);
    box.innerHTML = items
      .map((it, i) => {
        // по умолчанию выбираем второй вариант (обычно «средний»), если он есть
        const def = !multi && i === Math.min(1, items.length - 1) ? 'checked' : '';
        const hint = multi ? ` +${(it.price / 1000).toLocaleString('ru-RU')} тыс.` : '';
        return `<label class="chip"><input type="${multi ? 'checkbox' : 'radio'}" name="${key}" value="${esc(it.id)}" ${def}>
          <span>${esc(it.name)}${hint}</span></label>`;
      })
      .join('');
  };
  renderChips('materials');
  renderChips('floors');
  renderChips('finishes');
  renderChips('extras', true);
  document.getElementById('calc-note').textContent = cfg.note || '';

  const pick = (key) => {
    const v = document.querySelector(`[name="${key}"]:checked`)?.value;
    return (cfg[key] || []).find((x) => x.id === v);
  };

  function calc() {
    const a = Number(area.value);
    const mat = pick('materials');
    const fl = pick('floors');
    const fin = pick('finishes');
    const extras = [...document.querySelectorAll('[name="extras"]:checked')]
      .map((el) => (cfg.extras || []).find((x) => x.id === el.value))
      .filter(Boolean);
    const house = a * (mat?.price || 0) * (fl?.k ?? 1) * (fin?.k ?? 1);
    const extrasSum = extras.reduce((s, x) => s + x.price, 0);
    const total = house + extrasSum;
    return { a, mat, fl, fin, extras, house, total };
  }

  function update() {
    const r = calc();
    areaOut.textContent = `${r.a} м²`;
    document.getElementById('calc-total').textContent = money(r.total);
    document.getElementById('calc-per').textContent = r.a ? `≈ ${money(r.total / r.a)} за м²` : '';
    document.getElementById('calc-breakdown').innerHTML = [
      [`Дом ${r.a} м²${r.mat ? ', ' + r.mat.name.toLowerCase() : ''}`, r.house],
      ...r.extras.map((x) => [x.name, x.price])
    ]
      .map(([n, v]) => `<li><span>${esc(n)}</span><span>${money(v)}</span></li>`)
      .join('');
  }

  // Краткое описание расчёта — прикладывается к заявке
  window.currentCalcSummary = () => {
    const r = calc();
    return [
      `${r.a} м²`,
      r.mat?.name,
      r.fl?.name,
      r.fin?.name,
      r.extras.length && 'доп.: ' + r.extras.map((x) => x.name).join(', '),
      'итого ≈ ' + money(r.total)
    ]
      .filter(Boolean)
      .join('; ');
  };

  document.getElementById('calc').addEventListener('input', update);
  document.getElementById('calc').addEventListener('change', update);
  update();

  // Кнопка «Получить точную смету» прикладывает расчёт к заявке из модального окна
  document.getElementById('calc-order').addEventListener('click', () => {
    setTimeout(() => {
      const f = document.querySelector('#callback-modal form');
      f.dataset.withCalc = '1';
      f.dataset.source = 'Калькулятор';
    });
  });
}
