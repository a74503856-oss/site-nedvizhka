// Каталог проектов с фильтром по технологии
const listEl = document.querySelector('[data-list]');
const filtersEl = document.querySelector('[data-filters]');

api('/api/projects')
  .then((projects) => {
    if (!projects.length) {
      listEl.outerHTML = '<div class="empty">Проекты скоро появятся. Позвоните нам — расскажем о текущих объектах.</div>';
      return;
    }
    const materials = [...new Set(projects.map((p) => p.material).filter(Boolean))];
    let current = '';
    const render = () => {
      const list = current ? projects.filter((p) => p.material === current) : projects;
      listEl.innerHTML = list.map(projectCard).join('');
    };
    if (materials.length > 1) {
      filtersEl.innerHTML = ['', ...materials]
        .map((m) => `<button class="tab ${m === '' ? 'active' : ''}" data-m="${esc(m)}">${m ? esc(m) : 'Все'}</button>`)
        .join('');
      filtersEl.addEventListener('click', (e) => {
        const b = e.target.closest('[data-m]');
        if (!b) return;
        current = b.dataset.m;
        filtersEl.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t === b));
        render();
      });
    }
    render();
  })
  .catch((e) => (listEl.innerHTML = `<div class="empty">${esc(e.message)}</div>`));
