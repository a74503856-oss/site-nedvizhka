// Админ-панель
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const money = (n) => Math.round(n).toLocaleString('ru-RU') + ' ₽';
const fmtDate = (iso) => new Date(iso).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' });

function toast(msg, isErr) {
  const t = $('#toast');
  t.textContent = msg;
  t.className = 'toast show' + (isErr ? ' err' : '');
  clearTimeout(t._h);
  t._h = setTimeout(() => (t.className = 'toast'), 3500);
}

async function api(url, opts = {}) {
  if (opts.json !== undefined) {
    opts.body = JSON.stringify(opts.json);
    opts.headers = { 'Content-Type': 'application/json' };
  }
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && !url.endsWith('/login')) showLogin();
  if (!res.ok) throw new Error(data.error || 'Ошибка ' + res.status);
  return data;
}

// Отправка FormData с индикатором прогресса (для больших видео)
function upload(url, method, formData, progressEl) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    const bar = progressEl?.firstElementChild;
    if (progressEl) {
      progressEl.classList.remove('hidden');
      bar.style.width = '0';
    }
    xhr.upload.onprogress = (e) => e.lengthComputable && bar && (bar.style.width = (e.loaded / e.total) * 100 + '%');
    xhr.onload = () => {
      progressEl?.classList.add('hidden');
      let data = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {}
      if (xhr.status === 401) showLogin();
      xhr.status < 300 ? resolve(data) : reject(new Error(data.error || 'Ошибка ' + xhr.status));
    };
    xhr.onerror = () => {
      progressEl?.classList.add('hidden');
      reject(new Error('Ошибка сети'));
    };
    xhr.send(formData);
  });
}

// ---------- Вход ----------
function showLogin() {
  $('#panel').classList.add('hidden');
  $('#login').classList.remove('hidden');
}

async function showPanel() {
  $('#login').classList.add('hidden');
  $('#panel').classList.remove('hidden');
  await Promise.all([loadLeads(), loadProjects(), loadVideos(), loadCameras(), loadSettings()]);
}

$('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const err = $('#login-err');
  err.classList.add('hidden');
  try {
    await api('/api/admin/login', { method: 'POST', json: { password: e.target.password.value } });
    e.target.reset();
    showPanel();
  } catch (ex) {
    err.textContent = ex.message;
    err.classList.remove('hidden');
  }
});

$('#logout').addEventListener('click', async () => {
  await api('/api/admin/logout', { method: 'POST' }).catch(() => {});
  showLogin();
});

// ---------- Вкладки ----------
function openTab(name) {
  $$('.side-nav button').forEach((b) => b.classList.toggle('active', b.dataset.tab === name));
  $$('[data-pane]').forEach((p) => p.classList.toggle('hidden', p.dataset.pane !== name));
  history.replaceState(null, '', '#' + name);
}
$('.side-nav').addEventListener('click', (e) => {
  const b = e.target.closest('[data-tab]');
  if (b) openTab(b.dataset.tab);
});
if (location.hash && $(`[data-pane="${location.hash.slice(1)}"]`)) openTab(location.hash.slice(1));

// Кнопки «Отмена» в формах
$$('[data-cancel]').forEach((b) => b.addEventListener('click', () => b.closest('form').classList.add('hidden')));

// Подсветка dropzone при перетаскивании
function bindDropzone(zone, onFiles) {
  const input = $('input[type=file]', zone);
  ['dragenter', 'dragover'].forEach((ev) =>
    zone.addEventListener(ev, (e) => {
      e.preventDefault();
      zone.classList.add('drag');
    })
  );
  ['dragleave', 'drop'].forEach((ev) => zone.addEventListener(ev, () => zone.classList.remove('drag')));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    onFiles([...e.dataTransfer.files]);
  });
  input.addEventListener('change', () => {
    onFiles([...input.files]);
  });
}

// ---------- Заявки ----------
const STATUS = { new: 'Новая', in_progress: 'В работе', done: 'Обработана' };

async function loadLeads() {
  const leads = await api('/api/admin/leads');
  const newCount = leads.filter((l) => l.status === 'new').length;
  $('#leads-count').textContent = newCount || '';
  $('#leads-list').innerHTML = leads.length
    ? leads
        .map(
          (l) => `<div class="lead" data-status="${l.status}" data-id="${l.id}">
            <div class="lead__top">
              <div><b>${esc(l.name)}</b> · <a href="tel:${esc(l.phone.replace(/[^\d+]/g, ''))}">${esc(l.phone)}</a></div>
              <div class="actions">
                <select data-status-select>${Object.entries(STATUS)
                  .map(([k, v]) => `<option value="${k}" ${k === l.status ? 'selected' : ''}>${v}</option>`)
                  .join('')}</select>
                <button class="btn btn--sm btn--ghost" data-del>Удалить</button>
              </div>
            </div>
            <small>${fmtDate(l.createdAt)}${l.source ? ' · ' + esc(l.source) : ''}</small>
            ${l.message ? `<p>${esc(l.message)}</p>` : ''}
            ${l.calc ? `<p><small>Калькулятор:</small> ${esc(l.calc)}</p>` : ''}
          </div>`
        )
        .join('')
    : '<div class="empty">Заявок пока нет. Они появятся здесь, когда посетители заполнят форму на сайте.</div>';
}

$('#leads-list').addEventListener('change', async (e) => {
  if (!e.target.matches('[data-status-select]')) return;
  const id = e.target.closest('.lead').dataset.id;
  await api('/api/admin/leads/' + id, { method: 'PATCH', json: { status: e.target.value } });
  loadLeads();
});
$('#leads-list').addEventListener('click', async (e) => {
  if (!e.target.matches('[data-del]') || !confirm('Удалить заявку?')) return;
  await api('/api/admin/leads/' + e.target.closest('.lead').dataset.id, { method: 'DELETE' });
  loadLeads();
});

// ---------- Проекты ----------
let projects = [];
let photoState = []; // [{ src } — уже на сервере, { file, url } — новое]
const pForm = $('#project-form');

async function loadProjects() {
  projects = await api('/api/admin/projects');
  $('#materials-list').innerHTML = [...new Set(projects.map((p) => p.material).filter(Boolean))]
    .map((m) => `<option value="${esc(m)}">`)
    .join('');
  $('#projects-list').innerHTML = projects.length
    ? projects
        .map(
          (p) => `<div class="item ${p.published === false ? 'off' : ''}" data-id="${p.id}">
            <img class="item__thumb" src="${esc(p.photos[0] || '/img/placeholder.svg')}" alt="">
            <div class="item__body">
              <h3>${esc(p.title)}</h3>
              <div class="muted">${[p.area && p.area + ' м²', p.material, p.price && 'от ' + money(p.price), p.photos.length + ' фото']
                .filter(Boolean)
                .join(' · ')}</div>
            </div>
            <div class="item__actions">
              <a class="btn btn--sm btn--ghost" href="/projects/${p.id}" target="_blank">На сайте</a>
              <button class="btn btn--sm" data-edit>Изменить</button>
              <button class="btn btn--sm btn--danger" data-del>Удалить</button>
            </div>
          </div>`
        )
        .join('')
    : '<div class="empty">Проектов пока нет. Нажмите «Добавить проект».</div>';
}

function renderPhotos() {
  $('#project-photos').innerHTML = photoState
    .map(
      (ph, i) => `<div class="photo ${ph.file ? 'new' : ''}" data-i="${i}">
        <img src="${esc(ph.src || ph.url)}" alt="">
        ${i === 0 ? '<span class="cover">Обложка</span>' : ''}
        <div class="tools">
          <button type="button" data-move="-1" title="Левее">←</button>
          <button type="button" data-remove title="Удалить">✕</button>
          <button type="button" data-move="1" title="Правее">→</button>
        </div>
      </div>`
    )
    .join('');
}

$('#project-photos').addEventListener('click', (e) => {
  const box = e.target.closest('.photo');
  if (!box) return;
  const i = Number(box.dataset.i);
  if (e.target.matches('[data-remove]')) {
    const [removed] = photoState.splice(i, 1);
    if (removed.url) URL.revokeObjectURL(removed.url);
  } else if (e.target.dataset.move) {
    const j = i + Number(e.target.dataset.move);
    if (j < 0 || j >= photoState.length) return;
    [photoState[i], photoState[j]] = [photoState[j], photoState[i]];
  } else return;
  renderPhotos();
});

bindDropzone($('#project-drop'), (files) => {
  files.filter((f) => f.type.startsWith('image/')).forEach((file) => photoState.push({ file, url: URL.createObjectURL(file) }));
  $('#project-drop input').value = '';
  renderPhotos();
});

function openProjectForm(p) {
  pForm.reset();
  pForm.elements.id.value = p?.id || '';
  $('#project-form-title').textContent = p ? 'Редактирование проекта' : 'Новый проект';
  if (p) {
    for (const k of ['title', 'area', 'floors', 'bedrooms', 'bathrooms', 'size', 'material', 'price', 'order', 'description']) {
      pForm.elements[k].value = p[k] === 0 && k !== 'order' ? '' : p[k] ?? '';
    }
    pForm.elements.published.checked = p.published !== false;
  }
  photoState = (p?.photos || []).map((src) => ({ src }));
  renderPhotos();
  pForm.classList.remove('hidden');
  pForm.scrollIntoView({ behavior: 'smooth' });
}

$('#project-new').addEventListener('click', () => openProjectForm(null));

$('#projects-list').addEventListener('click', async (e) => {
  const id = e.target.closest('.item')?.dataset.id;
  const p = projects.find((x) => x.id === id);
  if (!p) return;
  if (e.target.matches('[data-edit]')) openProjectForm(p);
  if (e.target.matches('[data-del]') && confirm(`Удалить проект «${p.title}» вместе с фотографиями?`)) {
    await api('/api/admin/projects/' + id, { method: 'DELETE' });
    toast('Проект удалён');
    loadProjects();
  }
});

pForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData();
  for (const k of ['title', 'area', 'floors', 'bedrooms', 'bathrooms', 'size', 'material', 'price', 'order', 'description']) {
    fd.append(k, pForm.elements[k].value);
  }
  fd.append('published', pForm.elements.published.checked);
  let n = 0;
  const order = photoState.map((ph) => {
    if (ph.src) return ph.src;
    fd.append('photos', ph.file);
    return 'new:' + n++;
  });
  fd.append('photoOrder', JSON.stringify(order));
  const id = pForm.elements.id.value;
  const btn = $('[type=submit]', pForm);
  btn.disabled = true;
  try {
    await upload(id ? '/api/admin/projects/' + id : '/api/admin/projects', id ? 'PUT' : 'POST', fd, $('.progress', pForm));
    toast('Проект сохранён');
    pForm.classList.add('hidden');
    loadProjects();
  } catch (ex) {
    toast(ex.message, true);
  } finally {
    btn.disabled = false;
  }
});

// ---------- Видео ----------
let videos = [];
const vForm = $('#video-form');
const CAT = { projects: 'Видео проектов', reviews: 'Отзывы', works: 'Видео работ' };

async function loadVideos() {
  videos = await api('/api/admin/videos');
  $('#videos-list').innerHTML = videos.length
    ? videos
        .map(
          (v) => `<div class="item ${v.published === false ? 'off' : ''}" data-id="${v.id}">
            ${v.poster ? `<img class="item__thumb" src="${esc(v.poster)}" alt="">` : `<div class="item__thumb">${v.type === 'file' ? '🎬 файл' : '▶ ссылка'}</div>`}
            <div class="item__body">
              <h3>${esc(v.title)}</h3>
              <div class="muted">${CAT[v.category]} · ${esc(v.src)}</div>
            </div>
            <div class="item__actions">
              <button class="btn btn--sm" data-edit>Изменить</button>
              <button class="btn btn--sm btn--danger" data-del>Удалить</button>
            </div>
          </div>`
        )
        .join('')
    : '<div class="empty">Видео пока нет. Нажмите «Добавить видео».</div>';
}

const syncSource = () => {
  const t = $('[name=sourceType]:checked', vForm).value;
  $$('[data-src]', vForm).forEach((el) => el.classList.toggle('hidden', el.dataset.src !== t));
};
$$('[name=sourceType]', vForm).forEach((r) => r.addEventListener('change', syncSource));

bindDropzone($('[data-src=file]', vForm), (files) => {
  const zone = $('[data-src=file]', vForm);
  const input = $('input', zone);
  if (files[0] && input.files[0] !== files[0]) {
    const dt = new DataTransfer();
    dt.items.add(files[0]);
    input.files = dt.files;
  }
  $('.picked', zone)?.remove();
  if (files[0]) zone.insertAdjacentHTML('beforeend', `<div class="picked">${esc(files[0].name)} (${(files[0].size / 1048576).toFixed(1)} МБ)</div>`);
});

function openVideoForm(v) {
  vForm.reset();
  $('.picked', vForm)?.remove();
  vForm.elements.id.value = v?.id || '';
  $('#video-form-title').textContent = v ? 'Редактирование видео' : 'Новое видео';
  $('[data-source-block]', vForm).classList.toggle('hidden', !!v); // источник меняется только созданием нового видео
  if (v) {
    vForm.elements.title.value = v.title;
    vForm.elements.category.value = v.category;
    vForm.elements.order.value = v.order || 0;
    vForm.elements.description.value = v.description || '';
    vForm.elements.published.checked = v.published !== false;
  }
  syncSource();
  vForm.classList.remove('hidden');
  vForm.scrollIntoView({ behavior: 'smooth' });
}

$('#video-new').addEventListener('click', () => openVideoForm(null));

$('#videos-list').addEventListener('click', async (e) => {
  const id = e.target.closest('.item')?.dataset.id;
  const v = videos.find((x) => x.id === id);
  if (!v) return;
  if (e.target.matches('[data-edit]')) openVideoForm(v);
  if (e.target.matches('[data-del]') && confirm(`Удалить видео «${v.title}»?`)) {
    await api('/api/admin/videos/' + id, { method: 'DELETE' });
    toast('Видео удалено');
    loadVideos();
  }
});

vForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = vForm.elements.id.value;
  const fd = new FormData();
  for (const k of ['title', 'category', 'order', 'description']) fd.append(k, vForm.elements[k].value);
  fd.append('published', vForm.elements.published.checked);
  if (vForm.elements.poster.files[0]) fd.append('poster', vForm.elements.poster.files[0]);
  if (!id) {
    if ($('[name=sourceType]:checked', vForm).value === 'file') {
      if (!vForm.elements.video.files[0]) return toast('Выберите видеофайл', true);
      fd.append('video', vForm.elements.video.files[0]);
    } else {
      if (!vForm.elements.url.value) return toast('Вставьте ссылку на видео', true);
      fd.append('url', vForm.elements.url.value);
    }
  }
  const btn = $('[type=submit]', vForm);
  btn.disabled = true;
  try {
    await upload(id ? '/api/admin/videos/' + id : '/api/admin/videos', id ? 'PUT' : 'POST', fd, $('.progress', vForm));
    toast('Видео сохранено');
    vForm.classList.add('hidden');
    loadVideos();
  } catch (ex) {
    toast(ex.message, true);
  } finally {
    btn.disabled = false;
  }
});

// ---------- Камеры ----------
let cameras = [];
const cForm = $('#camera-form');
const CAM_TYPE = { iframe: 'Плеер (iframe)', hls: 'HLS-поток', image: 'Снимок JPEG' };

async function loadCameras() {
  cameras = await api('/api/admin/cameras');
  $('#cameras-list').innerHTML = cameras.length
    ? cameras
        .map(
          (c) => `<div class="item ${c.published === false ? 'off' : ''}" data-id="${c.id}">
            <div class="item__thumb">📹</div>
            <div class="item__body"><h3>${esc(c.title)}</h3><div class="muted">${CAM_TYPE[c.type]} · ${esc(c.url)}</div></div>
            <div class="item__actions">
              <button class="btn btn--sm" data-edit>Изменить</button>
              <button class="btn btn--sm btn--danger" data-del>Удалить</button>
            </div>
          </div>`
        )
        .join('')
    : '<div class="empty">Камер пока нет.</div>';
}

function openCameraForm(c) {
  cForm.reset();
  cForm.elements.id.value = c?.id || '';
  $('#camera-form-title').textContent = c ? 'Редактирование камеры' : 'Новая камера';
  if (c) {
    cForm.elements.title.value = c.title;
    cForm.elements.type.value = c.type;
    cForm.elements.url.value = c.url;
    cForm.elements.description.value = c.description || '';
    cForm.elements.published.checked = c.published !== false;
  }
  cForm.classList.remove('hidden');
  cForm.scrollIntoView({ behavior: 'smooth' });
}

$('#camera-new').addEventListener('click', () => openCameraForm(null));

$('#cameras-list').addEventListener('click', async (e) => {
  const id = e.target.closest('.item')?.dataset.id;
  const c = cameras.find((x) => x.id === id);
  if (!c) return;
  if (e.target.matches('[data-edit]')) openCameraForm(c);
  if (e.target.matches('[data-del]') && confirm(`Удалить камеру «${c.title}»?`)) {
    await api('/api/admin/cameras/' + id, { method: 'DELETE' });
    loadCameras();
  }
});

cForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = cForm.elements.id.value;
  const body = {
    title: cForm.elements.title.value,
    type: cForm.elements.type.value,
    url: cForm.elements.url.value,
    description: cForm.elements.description.value,
    published: cForm.elements.published.checked
  };
  try {
    await api(id ? '/api/admin/cameras/' + id : '/api/admin/cameras', { method: id ? 'PUT' : 'POST', json: body });
    toast('Камера сохранена');
    cForm.classList.add('hidden');
    loadCameras();
  } catch (ex) {
    toast(ex.message, true);
  }
});

// ---------- Настройки ----------
const sForm = $('#settings-form');
const getPath = (obj, path) => path.split('.').reduce((o, k) => o?.[k], obj);

function rowHtml(cols, item = {}) {
  return `<div class="row" ${item.id ? `data-row-id="${esc(item.id)}"` : ''}>
    ${cols.map(([key, label, type]) => `<input type="${type}" ${type === 'number' ? 'step="any" min="0"' : ''} data-key="${key}" placeholder="${label}" value="${esc(item[key] ?? '')}">`).join('')}
    <button type="button" title="Удалить строку" data-row-del>✕</button>
  </div>`;
}

function renderRows(container, items) {
  const cols = JSON.parse(container.dataset.cols);
  container.innerHTML =
    (items || []).map((it) => rowHtml(cols, it)).join('') +
    '<div><button type="button" class="btn btn--sm btn--ghost" data-row-add>+ Добавить строку</button></div>';
}

sForm.addEventListener('click', (e) => {
  if (e.target.matches('[data-row-del]')) e.target.closest('.row').remove();
  if (e.target.matches('[data-row-add]')) {
    const container = e.target.closest('.rows');
    e.target.parentElement.insertAdjacentHTML('beforebegin', rowHtml(JSON.parse(container.dataset.cols)));
  }
});

async function loadSettings() {
  const s = await api('/api/settings');
  $$('input[name], textarea[name]', sForm).forEach((el) => (el.value = getPath(s, el.name) ?? ''));
  $$('[data-rows]', sForm).forEach((c) => renderRows(c, getPath(s, c.dataset.rows)));
}

function collectRows(container) {
  return $$('.row', container).map((row) => {
    const item = row.dataset.rowId ? { id: row.dataset.rowId } : {};
    $$('input', row).forEach((inp) => (item[inp.dataset.key] = inp.type === 'number' ? Number(inp.value) : inp.value));
    return item;
  });
}

sForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const body = { calculator: {} };
  $$('input[name], textarea[name]', sForm).forEach((el) => {
    const [a, b] = el.name.split('.');
    b ? (body[a][b] = el.value) : (body[a] = el.value);
  });
  $$('[data-rows]', sForm).forEach((c) => {
    const [a, b] = c.dataset.rows.split('.');
    b ? (body[a][b] = collectRows(c)) : (body[a] = collectRows(c));
  });
  try {
    await api('/api/admin/settings', { method: 'PUT', json: body });
    toast('Настройки сохранены');
    loadSettings();
  } catch (ex) {
    toast(ex.message, true);
  }
});

// ---------- Старт ----------
api('/api/admin/me').then((r) => (r.authed ? showPanel() : showLogin()));
