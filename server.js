const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const multer = require('multer');
const db = require('./lib/db');

// --- .env (простой парсер, без зависимостей) ---
const envFile = path.join(__dirname, '.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}

const PORT = Number(process.env.PORT) || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';
if (!process.env.ADMIN_PASSWORD) {
  console.warn('⚠  ADMIN_PASSWORD не задан — используется пароль "admin". Задайте его в файле .env!');
}

const PUBLIC_DIR = path.join(__dirname, 'public');
const UPLOAD_DIR = path.join(PUBLIC_DIR, 'uploads');
fs.mkdirSync(path.join(UPLOAD_DIR, 'photos'), { recursive: true });
fs.mkdirSync(path.join(UPLOAD_DIR, 'videos'), { recursive: true });

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json({ limit: '1mb' }));
app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// ---------- Утилиты ----------
const str = (v, max = 5000) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};
const isHttpUrl = (u) => {
  try {
    return ['http:', 'https:'].includes(new URL(u).protocol);
  } catch {
    return false;
  }
};

// Превращает ссылку YouTube / Rutube / VK в адрес для встраивания (iframe)
function toEmbedUrl(raw) {
  if (!isHttpUrl(raw)) return null;
  const u = new URL(raw);
  const host = u.hostname.replace(/^www\.|^m\./, '');
  if (host === 'youtu.be') return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (u.searchParams.get('v')) return `https://www.youtube.com/embed/${u.searchParams.get('v')}`;
    const m = u.pathname.match(/^\/(?:shorts|live|embed)\/([\w-]+)/);
    if (m) return `https://www.youtube.com/embed/${m[1]}`;
  }
  if (host === 'rutube.ru') {
    const m = u.pathname.match(/^\/(?:video|play\/embed|shorts)\/([\w]+)/);
    if (m) return `https://rutube.ru/play/embed/${m[1]}`;
  }
  if (host === 'vk.com' || host === 'vkvideo.ru') {
    if (u.pathname === '/video_ext.php') return raw;
    const m = (u.pathname + u.search).match(/video(-?\d+)_(\d+)/);
    if (m) return `https://vk.com/video_ext.php?oid=${m[1]}&id=${m[2]}&hd=2`;
  }
  // любой другой адрес считаем уже готовой ссылкой для iframe
  return raw;
}

function removeUpload(publicPath) {
  if (!publicPath || !publicPath.startsWith('/uploads/')) return;
  const abs = path.join(PUBLIC_DIR, publicPath);
  if (!abs.startsWith(UPLOAD_DIR)) return;
  fs.rm(abs, { force: true }, () => {});
}

// ---------- Загрузка файлов ----------
const IMAGE_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'];
const VIDEO_EXT = ['.mp4', '.webm', '.mov', '.m4v'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isVideo = file.fieldname === 'video';
    cb(null, path.join(UPLOAD_DIR, isVideo ? 'videos' : 'photos'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(5).toString('hex')}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 1024, files: 50 }, // до 1 ГБ на файл (видео)
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (file.fieldname === 'video') {
      return VIDEO_EXT.includes(ext) ? cb(null, true) : cb(new Error('Видео: допустимы mp4, webm, mov, m4v'));
    }
    return IMAGE_EXT.includes(ext) ? cb(null, true) : cb(new Error('Фото: допустимы jpg, png, webp, gif, avif'));
  }
});

const toPublic = (file) => '/uploads/' + path.relative(UPLOAD_DIR, file.path).split(path.sep).join('/');

// ---------- Авторизация ----------
const sessions = new Map(); // token -> expiresAt
const SESSION_TTL = 1000 * 60 * 60 * 12;
const loginAttempts = new Map(); // ip -> { count, until }

function parseCookies(req) {
  const out = {};
  (req.headers.cookie || '').split(';').forEach((c) => {
    const i = c.indexOf('=');
    if (i > 0) out[c.slice(0, i).trim()] = decodeURIComponent(c.slice(i + 1).trim());
  });
  return out;
}

function isAuthed(req) {
  const token = parseCookies(req).sid;
  const exp = token && sessions.get(token);
  if (!exp) return false;
  if (exp < Date.now()) {
    sessions.delete(token);
    return false;
  }
  return true;
}

function requireAdmin(req, res, next) {
  if (isAuthed(req)) return next();
  res.status(401).json({ error: 'Требуется вход' });
}

function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

app.post('/api/admin/login', (req, res) => {
  const ip = req.ip;
  const att = loginAttempts.get(ip);
  if (att && att.count >= 5 && att.until > Date.now()) {
    return res.status(429).json({ error: 'Слишком много попыток. Попробуйте через 15 минут.' });
  }
  if (!safeEqual(req.body?.password || '', ADMIN_PASSWORD)) {
    const next = att && att.until > Date.now() ? att.count + 1 : 1;
    loginAttempts.set(ip, { count: next, until: Date.now() + 15 * 60 * 1000 });
    return res.status(401).json({ error: 'Неверный пароль' });
  }
  loginAttempts.delete(ip);
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, Date.now() + SESSION_TTL);
  const secure = req.secure ? '; Secure' : '';
  res.set('Set-Cookie', `sid=${token}; HttpOnly; Path=/; SameSite=Strict; Max-Age=${SESSION_TTL / 1000}${secure}`);
  res.json({ ok: true });
});

app.post('/api/admin/logout', (req, res) => {
  sessions.delete(parseCookies(req).sid);
  res.set('Set-Cookie', 'sid=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0');
  res.json({ ok: true });
});

app.get('/api/admin/me', (req, res) => res.json({ authed: isAuthed(req) }));

// ---------- Публичное API ----------
app.get('/api/settings', (req, res) => res.json(db.load().settings));

const byNewest = (a, b) => (b.order ?? 0) - (a.order ?? 0) || b.createdAt.localeCompare(a.createdAt);

app.get('/api/projects', (req, res) => {
  res.json(db.load().projects.filter((p) => p.published !== false).sort(byNewest));
});

app.get('/api/projects/:id', (req, res) => {
  const p = db.load().projects.find((x) => x.id === req.params.id && x.published !== false);
  p ? res.json(p) : res.status(404).json({ error: 'Проект не найден' });
});

app.get('/api/videos', (req, res) => {
  let list = db.load().videos.filter((v) => v.published !== false);
  if (req.query.category) list = list.filter((v) => v.category === req.query.category);
  res.json(list.sort(byNewest));
});

app.get('/api/cameras', (req, res) => {
  res.json(db.load().cameras.filter((c) => c.published !== false));
});

app.post('/api/leads', async (req, res) => {
  const name = str(req.body?.name, 100);
  const phone = str(req.body?.phone, 40);
  if (!name || phone.replace(/\D/g, '').length < 6) {
    return res.status(400).json({ error: 'Укажите имя и телефон' });
  }
  if (str(req.body?.website)) return res.json({ ok: true }); // honeypot от спам-ботов
  const lead = {
    id: db.id(),
    name,
    phone,
    message: str(req.body?.message, 2000),
    calc: str(req.body?.calc, 2000),
    source: str(req.body?.source, 100),
    status: 'new',
    createdAt: new Date().toISOString()
  };
  const data = db.load();
  data.leads.unshift(lead);
  db.save();
  notifyTelegram(lead).catch((e) => console.error('Telegram:', e.message));
  res.json({ ok: true });
});

async function notifyTelegram(lead) {
  const { TELEGRAM_BOT_TOKEN: token, TELEGRAM_CHAT_ID: chat } = process.env;
  if (!token || !chat) return;
  const text = [
    '🏠 Новая заявка с сайта',
    `Имя: ${lead.name}`,
    `Телефон: ${lead.phone}`,
    lead.message && `Сообщение: ${lead.message}`,
    lead.calc && `Расчёт: ${lead.calc}`,
    lead.source && `Источник: ${lead.source}`
  ]
    .filter(Boolean)
    .join('\n');
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chat, text })
  });
}

// ---------- Админ API ----------
const admin = express.Router();
admin.use(requireAdmin);

// Настройки компании и калькулятора
admin.put('/settings', (req, res) => {
  const data = db.load();
  const s = req.body || {};
  const cur = data.settings;
  for (const k of ['companyName', 'tagline', 'about', 'phone', 'email', 'address', 'workHours']) {
    if (s[k] !== undefined) cur[k] = str(s[k]);
  }
  if (Array.isArray(s.stats)) cur.stats = s.stats.map((x) => ({ value: str(x.value, 30), label: str(x.label, 80) }));
  if (Array.isArray(s.advantages)) {
    cur.advantages = s.advantages.map((x) => ({ title: str(x.title, 100), text: str(x.text, 500) }));
  }
  if (s.calculator && typeof s.calculator === 'object') {
    const c = s.calculator;
    const list = (arr, field) =>
      (Array.isArray(arr) ? arr : [])
        .filter((x) => str(x.name))
        .map((x) => ({ id: str(x.id, 40) || db.id(), name: str(x.name, 100), [field]: num(x[field]) }));
    cur.calculator = {
      materials: list(c.materials, 'price'),
      floors: list(c.floors, 'k'),
      finishes: list(c.finishes, 'k'),
      extras: list(c.extras, 'price'),
      note: str(c.note, 500)
    };
  }
  db.save();
  res.json(cur);
});

// Проекты
admin.get('/projects', (req, res) => res.json(db.load().projects.slice().sort(byNewest)));

function projectFields(body, target) {
  target.title = str(body.title, 200) || target.title || 'Без названия';
  target.description = str(body.description, 20000);
  target.area = num(body.area);
  target.floors = str(body.floors, 30);
  target.bedrooms = num(body.bedrooms);
  target.bathrooms = num(body.bathrooms);
  target.size = str(body.size, 50);
  target.material = str(body.material, 100);
  target.price = num(body.price);
  target.order = num(body.order);
  target.published = body.published !== 'false' && body.published !== false;
  return target;
}

// photoOrder — JSON-массив итогового порядка фото: существующие пути и метки "new:N"
// (N — индекс нового загруженного файла). Без photoOrder: старые фото + новые в конце.
function orderPhotos(rawOrder, existing, uploaded) {
  let order;
  try {
    order = JSON.parse(rawOrder);
  } catch {}
  if (!Array.isArray(order)) return [...existing, ...uploaded];
  const result = [];
  for (const item of order) {
    const m = typeof item === 'string' && item.match(/^new:(\d+)$/);
    const src = m ? uploaded[Number(m[1])] : existing.includes(item) ? item : null;
    if (src && !result.includes(src)) result.push(src);
  }
  // новые файлы, не упомянутые в порядке, не теряем
  uploaded.forEach((u) => !result.includes(u) && result.push(u));
  return result;
}

admin.post('/projects', upload.array('photos', 50), (req, res) => {
  const p = projectFields(req.body, { id: db.id(), createdAt: new Date().toISOString(), photos: [] });
  p.photos = orderPhotos(req.body.photoOrder, [], (req.files || []).map(toPublic));
  const data = db.load();
  data.projects.push(p);
  db.save();
  res.json(p);
});

admin.put('/projects/:id', upload.array('photos', 50), (req, res) => {
  const data = db.load();
  const p = data.projects.find((x) => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Не найдено' });
  projectFields(req.body, p);
  const next = orderPhotos(req.body.photoOrder, p.photos, (req.files || []).map(toPublic));
  p.photos.filter((ph) => !next.includes(ph)).forEach(removeUpload);
  p.photos = next;
  db.save();
  res.json(p);
});

admin.delete('/projects/:id', (req, res) => {
  const data = db.load();
  const p = data.projects.find((x) => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Не найдено' });
  p.photos.forEach(removeUpload);
  data.projects = data.projects.filter((x) => x !== p);
  db.save();
  res.json({ ok: true });
});

// Видео
const VIDEO_CATEGORIES = ['projects', 'reviews', 'works'];

admin.get('/videos', (req, res) => res.json(db.load().videos.slice().sort(byNewest)));

admin.post(
  '/videos',
  upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'poster', maxCount: 1 }
  ]),
  (req, res) => {
    const file = req.files?.video?.[0];
    const poster = req.files?.poster?.[0];
    const cleanup = () => [file, poster].filter(Boolean).forEach((f) => removeUpload(toPublic(f)));
    const v = {
      id: db.id(),
      title: str(req.body.title, 200) || 'Видео',
      description: str(req.body.description, 5000),
      category: VIDEO_CATEGORIES.includes(req.body.category) ? req.body.category : 'works',
      order: num(req.body.order),
      published: req.body.published !== 'false',
      createdAt: new Date().toISOString()
    };
    if (file) {
      v.type = 'file';
      v.src = toPublic(file);
    } else {
      const embed = toEmbedUrl(str(req.body.url, 1000));
      if (!embed) {
        cleanup();
        return res.status(400).json({ error: 'Загрузите файл или укажите ссылку (YouTube, Rutube, VK)' });
      }
      v.type = 'embed';
      v.src = embed;
    }
    if (poster) v.poster = toPublic(poster);
    const data = db.load();
    data.videos.push(v);
    db.save();
    res.json(v);
  }
);

admin.put('/videos/:id', upload.single('poster'), (req, res) => {
  const data = db.load();
  const v = data.videos.find((x) => x.id === req.params.id);
  if (!v) return res.status(404).json({ error: 'Не найдено' });
  if (req.body.title !== undefined) v.title = str(req.body.title, 200) || v.title;
  if (req.body.description !== undefined) v.description = str(req.body.description, 5000);
  if (VIDEO_CATEGORIES.includes(req.body.category)) v.category = req.body.category;
  if (req.body.order !== undefined) v.order = num(req.body.order);
  if (req.body.published !== undefined) v.published = req.body.published !== 'false' && req.body.published !== false;
  if (req.file) {
    removeUpload(v.poster);
    v.poster = toPublic(req.file);
  }
  db.save();
  res.json(v);
});

admin.delete('/videos/:id', (req, res) => {
  const data = db.load();
  const v = data.videos.find((x) => x.id === req.params.id);
  if (!v) return res.status(404).json({ error: 'Не найдено' });
  if (v.type === 'file') removeUpload(v.src);
  removeUpload(v.poster);
  data.videos = data.videos.filter((x) => x !== v);
  db.save();
  res.json({ ok: true });
});

// Камеры
function cameraFields(body, target) {
  const url = str(body.url, 1000);
  if (!isHttpUrl(url)) throw new Error('Укажите корректную ссылку на трансляцию (http/https)');
  let type = ['iframe', 'hls', 'image'].includes(body.type) ? body.type : 'auto';
  if (type === 'auto') type = /\.m3u8(\?|$)/i.test(url) ? 'hls' : /\.(jpe?g|png|mjpe?g|cgi)(\?|$)/i.test(url) ? 'image' : 'iframe';
  target.title = str(body.title, 200) || 'Камера';
  target.description = str(body.description, 1000);
  target.type = type;
  target.url = type === 'iframe' ? toEmbedUrl(url) : url;
  target.published = body.published !== false;
  return target;
}

admin.get('/cameras', (req, res) => res.json(db.load().cameras));

admin.post('/cameras', (req, res) => {
  try {
    const c = cameraFields(req.body || {}, { id: db.id(), createdAt: new Date().toISOString() });
    db.load().cameras.push(c);
    db.save();
    res.json(c);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

admin.put('/cameras/:id', (req, res) => {
  const c = db.load().cameras.find((x) => x.id === req.params.id);
  if (!c) return res.status(404).json({ error: 'Не найдено' });
  try {
    cameraFields(req.body || {}, c);
    db.save();
    res.json(c);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

admin.delete('/cameras/:id', (req, res) => {
  const data = db.load();
  data.cameras = data.cameras.filter((x) => x.id !== req.params.id);
  db.save();
  res.json({ ok: true });
});

// Заявки
admin.get('/leads', (req, res) => res.json(db.load().leads));

admin.patch('/leads/:id', (req, res) => {
  const l = db.load().leads.find((x) => x.id === req.params.id);
  if (!l) return res.status(404).json({ error: 'Не найдено' });
  if (['new', 'in_progress', 'done'].includes(req.body?.status)) l.status = req.body.status;
  if (req.body?.note !== undefined) l.note = str(req.body.note, 2000);
  db.save();
  res.json(l);
});

admin.delete('/leads/:id', (req, res) => {
  const data = db.load();
  data.leads = data.leads.filter((x) => x.id !== req.params.id);
  db.save();
  res.json({ ok: true });
});

app.use('/api/admin', admin);

// Ошибки загрузки/API -> JSON
app.use('/api', (err, req, res, next) => {
  if (!err) return next();
  const msg = err.code === 'LIMIT_FILE_SIZE' ? 'Файл слишком большой' : err.message || 'Ошибка сервера';
  res.status(400).json({ error: msg });
});
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// ---------- Страницы ----------
const page = (file) => (req, res) => res.sendFile(path.join(PUBLIC_DIR, file));
app.get('/projects', page('projects.html'));
app.get('/projects/:id', page('project.html'));
app.get('/video', page('video.html'));
app.get('/admin', page('admin/index.html'));

app.use(express.static(PUBLIC_DIR, { extensions: ['html'], maxAge: '1h' }));
app.use((req, res) => res.status(404).sendFile(path.join(PUBLIC_DIR, '404.html')));

db.load();
app.listen(PORT, () => console.log(`Сайт запущен: http://localhost:${PORT}  (админка: /admin)`));
