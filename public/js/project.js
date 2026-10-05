// Страница одного проекта: галерея, характеристики, описание
const root = document.querySelector('[data-project]');
const id = decodeURIComponent(location.pathname.split('/').filter(Boolean).pop());

api('/api/projects/' + encodeURIComponent(id))
  .then((p) => {
    document.title = p.title;
    const photos = p.photos?.length ? p.photos : ['/img/placeholder.svg'];
    const specs = [
      ['Площадь', p.area && `${p.area} м²`],
      ['Этажность', p.floors],
      ['Спальни', p.bedrooms],
      ['Санузлы', p.bathrooms],
      ['Габариты', p.size],
      ['Технология', p.material]
    ].filter(([, v]) => v);

    root.innerHTML = `
      <div class="breadcrumbs"><a href="/">Главная</a> / <a href="/projects">Проекты</a> / ${esc(p.title)}</div>
      <div class="project">
        <div>
          <img class="gallery__main" src="${esc(photos[0])}" alt="${esc(p.title)}">
          ${photos.length > 1 ? `<div class="gallery__thumbs">${photos
            .map((ph, i) => `<button class="${i ? '' : 'active'}" data-i="${i}"><img src="${esc(ph)}" alt="" loading="lazy"></button>`)
            .join('')}</div>` : ''}
        </div>
        <aside class="card">
          <h1 style="font-size:1.8rem">${esc(p.title)}</h1>
          <ul class="specs">${specs.map(([k, v]) => `<li><span>${k}</span><span>${esc(v)}</span></li>`).join('')}</ul>
          <div class="calc__total" style="color:var(--brand)">${p.price ? 'от ' + money(p.price) : 'Цена по запросу'}</div>
          <p class="muted">Стоимость строительства</p>
          <button class="btn btn--block" data-open-callback="Проект: ${esc(p.title)}">Хочу такой дом</button>
        </aside>
      </div>
      ${p.description ? `<div style="max-width:820px;margin-top:48px"><h2>Описание проекта</h2><div class="project__desc">${esc(p.description)}</div></div>` : ''}`;

    // Галерея и лайтбокс
    let cur = 0;
    const main = root.querySelector('.gallery__main');
    const lb = document.getElementById('lightbox');
    const lbImg = lb.querySelector('img');
    const show = (i) => {
      cur = (i + photos.length) % photos.length;
      main.src = photos[cur];
      lbImg.src = photos[cur];
      root.querySelectorAll('.gallery__thumbs button').forEach((b, j) => b.classList.toggle('active', j === cur));
    };
    root.querySelector('.gallery__thumbs')?.addEventListener('click', (e) => {
      const b = e.target.closest('[data-i]');
      if (b) show(Number(b.dataset.i));
    });
    main.addEventListener('click', () => {
      lbImg.src = photos[cur];
      lb.classList.add('open');
    });
    lb.querySelector('.lightbox__close').onclick = () => lb.classList.remove('open');
    lb.querySelector('.lightbox__prev').onclick = () => show(cur - 1);
    lb.querySelector('.lightbox__next').onclick = () => show(cur + 1);
    lb.addEventListener('click', (e) => e.target === lb && lb.classList.remove('open'));
    document.addEventListener('keydown', (e) => {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') lb.classList.remove('open');
      if (e.key === 'ArrowLeft') show(cur - 1);
      if (e.key === 'ArrowRight') show(cur + 1);
    });
    if (photos.length < 2) lb.querySelectorAll('.lightbox__prev, .lightbox__next').forEach((b) => b.classList.add('hidden'));
  })
  .catch(() => {
    root.innerHTML = '<div class="empty">Проект не найден. <a href="/projects">Вернуться к каталогу</a></div>';
  });
