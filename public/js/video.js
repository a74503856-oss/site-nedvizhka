// Видео-страница: камеры на объектах + видео по категориям
const CATEGORY_NAMES = { projects: 'Видео проекта', reviews: 'Отзыв', works: 'Видео работ' };

function playerHtml(v) {
  if (v.type === 'file') {
    return `<video controls preload="metadata" playsinline src="${esc(v.src)}"${v.poster ? ` poster="${esc(v.poster)}"` : ''}></video>`;
  }
  return `<iframe src="${esc(v.src)}" loading="lazy" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen title="${esc(v.title)}"></iframe>`;
}

const videosEl = document.querySelector('[data-videos]');
let allVideos = [];

function renderVideos(cat) {
  const list = cat ? allVideos.filter((v) => v.category === cat) : allVideos;
  videosEl.innerHTML = list.length
    ? list
        .map(
          (v) => `<article class="video-card">
            <div class="video-card__player">${playerHtml(v)}</div>
            <div class="video-card__body">
              <span class="badge">${CATEGORY_NAMES[v.category] || ''}</span>
              <h3 style="margin-top:10px">${esc(v.title)}</h3>
              ${v.description ? `<p>${esc(v.description)}</p>` : ''}
            </div>
          </article>`
        )
        .join('')
    : '<div class="empty" style="grid-column:1/-1">В этом разделе пока нет видео.</div>';
}

api('/api/videos')
  .then((list) => {
    allVideos = list;
    const hash = location.hash.slice(1);
    const start = CATEGORY_NAMES[hash] ? hash : '';
    document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t.dataset.cat === start));
    renderVideos(start);
  })
  .catch((e) => (videosEl.innerHTML = `<div class="empty">${esc(e.message)}</div>`));

document.querySelector('.tabs').addEventListener('click', (e) => {
  const t = e.target.closest('.tab');
  if (!t) return;
  document.querySelectorAll('.tab').forEach((x) => x.classList.toggle('active', x === t));
  history.replaceState(null, '', t.dataset.cat ? '#' + t.dataset.cat : location.pathname);
  renderVideos(t.dataset.cat);
});

// ---------- Камеры ----------
// Поддерживаются: iframe (страница трансляции Ivideon, RTSP.me, YouTube Live и т.п.),
// HLS-поток (.m3u8) и картинка-снимок (обновляется каждые 5 секунд).
api('/api/cameras').then((cams) => {
  const wrap = document.querySelector('[data-cameras-wrap]');
  if (!cams.length) return wrap.classList.add('hidden');
  const box = document.querySelector('[data-cameras]');
  box.innerHTML = cams
    .map(
      (c, i) => `<article class="video-card">
        <div class="video-card__player" data-cam="${i}"></div>
        <div class="video-card__body">
          <span class="live-dot">LIVE</span>
          <h3 style="margin-top:8px">${esc(c.title)}</h3>
          ${c.description ? `<p>${esc(c.description)}</p>` : ''}
        </div>
      </article>`
    )
    .join('');

  cams.forEach((c, i) => {
    const el = box.querySelector(`[data-cam="${i}"]`);
    const offline = () => (el.innerHTML = '<div class="cam-offline">Камера временно недоступна</div>');
    if (c.type === 'iframe') {
      el.innerHTML = `<iframe src="${esc(c.url)}" allow="autoplay; fullscreen" allowfullscreen title="${esc(c.title)}"></iframe>`;
    } else if (c.type === 'image') {
      const img = new Image();
      img.alt = c.title;
      img.onerror = offline;
      const refresh = () => (img.src = c.url + (c.url.includes('?') ? '&' : '?') + '_=' + Date.now());
      refresh();
      el.appendChild(img);
      setInterval(() => document.visibilityState === 'visible' && img.isConnected && refresh(), 5000);
    } else if (c.type === 'hls') {
      const video = document.createElement('video');
      Object.assign(video, { muted: true, autoplay: true, playsInline: true, controls: true });
      el.appendChild(video);
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = c.url; // Safari / iOS умеют HLS нативно
        video.onerror = offline;
      } else if (window.Hls && Hls.isSupported()) {
        const hls = new Hls({ liveDurationInfinity: true });
        hls.loadSource(c.url);
        hls.attachMedia(video);
        hls.on(Hls.Events.ERROR, (_, d) => d.fatal && offline());
      } else offline();
    }
  });
});
