// Простое файловое хранилище (JSON). Для сайта компании этого достаточно:
// данных немного, бэкап — это копия папки data/ и public/uploads/.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const DEFAULT_DATA = {
  settings: {
    companyName: 'СтройДом',
    tagline: 'Строим дома под ключ — от проекта до новоселья',
    about:
      'Мы проектируем и строим частные дома с 2010 года. Собственная бригада, фиксированная смета в договоре, ' +
      'поэтапная оплата и гарантия на конструктив. Вы видите каждый этап стройки — в том числе через камеры на объекте.',
    phone: '+7 (900) 000-00-00',
    email: 'info@example.ru',
    address: 'г. Москва, ул. Строителей, 1',
    workHours: 'Пн–Сб, 9:00–19:00',
    stats: [
      { value: '15+', label: 'лет на рынке' },
      { value: '320', label: 'построенных домов' },
      { value: '5 лет', label: 'гарантия' },
      { value: '0 ₽', label: 'доплат сверх сметы' }
    ],
    advantages: [
      { title: 'Фиксированная смета', text: 'Цена закрепляется в договоре и не меняется в процессе строительства.' },
      { title: 'Свои бригады', text: 'Не привлекаем субподрядчиков — отвечаем за качество каждого этапа.' },
      { title: 'Онлайн-контроль', text: 'Камеры на объекте и фотоотчёты — следите за стройкой из любой точки.' },
      { title: 'Гарантия 5 лет', text: 'Официальная гарантия на фундамент, стены и кровлю.' }
    ],
    calculator: {
      // цена за м² по технологии, ₽
      materials: [
        { id: 'gasblock', name: 'Газобетон', price: 32000 },
        { id: 'brick', name: 'Кирпич', price: 42000 },
        { id: 'frame', name: 'Каркасный', price: 24000 },
        { id: 'timber', name: 'Клеёный брус', price: 38000 }
      ],
      // множитель по этажности
      floors: [
        { id: '1', name: '1 этаж', k: 1 },
        { id: '1.5', name: '1 этаж + мансарда', k: 0.95 },
        { id: '2', name: '2 этажа', k: 0.92 }
      ],
      // множитель по комплектации
      finishes: [
        { id: 'box', name: 'Коробка', k: 0.7 },
        { id: 'warm', name: 'Тёплый контур', k: 1 },
        { id: 'turnkey', name: 'Под ключ', k: 1.45 }
      ],
      // доп. опции, фиксированная стоимость, ₽
      extras: [
        { id: 'foundation', name: 'Фундамент (плита)', price: 650000 },
        { id: 'terrace', name: 'Терраса', price: 280000 },
        { id: 'garage', name: 'Гараж', price: 900000 },
        { id: 'engineering', name: 'Инженерные сети', price: 750000 }
      ],
      note: 'Расчёт предварительный. Точную смету подготовим после консультации.'
    }
  },
  projects: [],
  videos: [],
  cameras: [],
  leads: []
};

let cache = null;

function load() {
  if (cache) return cache;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(DB_FILE)) {
    cache = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    // дополняем новыми полями, если структура расширилась
    for (const key of Object.keys(DEFAULT_DATA)) {
      if (cache[key] === undefined) cache[key] = structuredClone(DEFAULT_DATA[key]);
    }
  } else {
    cache = structuredClone(DEFAULT_DATA);
    save();
  }
  return cache;
}

function save() {
  // атомарная запись: сначала во временный файл, потом rename
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(cache, null, 2));
  fs.renameSync(tmp, DB_FILE);
}

function id() {
  return crypto.randomBytes(8).toString('hex');
}

module.exports = { load, save, id };
