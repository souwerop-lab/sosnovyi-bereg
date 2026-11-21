/* Сосновый берег v3 — демо-сайт, день и ночь. Чистый JS, без сборки. */
(function () {
'use strict';

/* Название и место: менять только здесь, на странице подставится везде */
const SITE = { name: 'Сосновый берег', lake: 'озеро Светлое', lakeGen: 'озера Светлого' };
/* Настройки для запуска настоящего сайта (см. HANDOVER.md):
   endpoint — адрес приёма заявок (серверная функция, которая шлёт их в Telegram и на почту; токен бота хранится там, не здесь);
   metrika  — номер счётчика Яндекс Метрики; пока пусто, счётчик и плашка о cookies не показываются. */
const CONFIG = { endpoint: '', metrika: '', heroVideo: '' };  // heroVideo: 'assets/hero.mp4', когда видео будет готово
document.title = `${SITE.name} — глэмпинг у озера`;
function applySite() {
  document.querySelectorAll('[data-brand]').forEach(e => e.textContent = SITE.name);
  document.querySelectorAll('[data-lake]').forEach(e => e.textContent = SITE.lake);
  document.querySelectorAll('[data-lake-gen]').forEach(e => e.textContent = SITE.lakeGen);
  document.querySelectorAll('[data-brand-h1]').forEach(e => { e.innerHTML = ''; SITE.name.split(' ').forEach((w, i) => { if (i) e.appendChild(document.createElement('br')); e.appendChild(document.createTextNode(w)); }); });
}
applySite();
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const money = n => n.toLocaleString('ru-RU') + ' ₽';

/* ───────────── ДАННЫЕ ───────────── */
const CABINS = [
  { id: 'luna', kind: 'Купол', name: 'Луна', base: 2, max: 3, area: 22, wd: 9500, we: 12500, extra: 1500,
    text: 'Купол 22 м² с круглым окном над кроватью. Двуспальная кровать, тёплый пол, санузел с душем, чайная зона.',
    specs: ['до 3 гостей', '22 м²', 'окно над кроватью', 'тёплый пол'], inner: 'int-luna' },
  { id: 'el', kind: 'A-frame', name: 'Ель', base: 2, max: 4, area: 28, wd: 11000, we: 14500, extra: 1500,
    text: 'Двухэтажный домик 28 м² со стеклянным фасадом. Спальня на втором этаже, печь-камин, терраса с видом на озеро.',
    specs: ['до 4 гостей', '28 м²', 'печь-камин', 'можно с собакой'], inner: 'int-el' },
  { id: 'sem', kind: 'Двойной купол', name: 'Семейный', base: 4, max: 6, area: 40, wd: 15500, we: 19500, extra: 1200,
    text: 'Два соединённых купола, 40 м². Гостиная с кухней и две спальни, терраса со столом на шесть человек.',
    specs: ['до 6 гостей', '40 м²', 'своя кухня', 'две спальни'] },
  { id: 'prichal', kind: 'Дом на сваях', name: 'Причал', base: 2, max: 4, area: 35, wd: 17000, we: 22000, extra: 2000,
    text: 'Домик 35 м² на сваях над водой с собственными мостками. Спуск к озеру с порога, терраса с видом на закат.',
    specs: ['до 4 гостей', '35 м²', 'мостки к воде', 'вид на закат'] }
];
const OPT = { banya: 4500, breakfast: 700, sup: 1500 };
const cabinById = id => CABINS.find(c => c.id === id);
const img = n => `assets/${n}.jpg`;
const pic = (n, alt) => `<img class="n" src="${img(n)}" alt="${alt}" loading="lazy"><img class="d" src="${img(n + '-day')}" alt="" loading="lazy">`;
const theme = () => document.documentElement.dataset.theme || 'night';
const imgT = n => img(theme() === 'day' ? n + '-day' : n);
const GALLERY = [
  ['g-banya', 'Баня на дровах и купель', 'wide'],
  ['g-pier', 'Причал вечером', 'tall'],
  ['g-fire', 'Костровая зона', ''],
  ['int-el', 'Интерьер домика «Ель»', ''],
  ['g-sup', 'Сапы утром', ''],
  ['g-morning', 'Утро на озере', 'wide']
];

/* ───────────── ДОМИКИ ───────────── */
function renderCabins() {
  $('#cabinList').innerHTML = CABINS.map((c, i) => `
    <article class="cabin ${i % 2 ? 'cabin--rev' : ''} reveal">
      <div class="cabin__pic">
        <div class="vw is-on">${pic('cabin-' + c.id, `${c.kind} «${c.name}» снаружи`)}</div>
        ${c.inner ? `<div class="vw">${pic(c.inner, `Интерьер домика «${c.name}»`)}</div>
        <div class="seg" role="tablist" aria-label="Вид">
          <button type="button" role="tab" aria-selected="true" data-v="0">Снаружи</button>
          <button type="button" role="tab" aria-selected="false" data-v="1">Внутри</button>
        </div>` : ''}
      </div>
      <div class="cabin__info">
        <p class="cabin__kind">${c.kind}</p>
        <h3>«${c.name}»</h3>
        <p class="cabin__text">${c.text}</p>
        <ul class="specs">${c.specs.map(s => `<li>${s}</li>`).join('')}</ul>
        <div class="cabin__foot">
          <p class="price"><strong>${money(c.wd)}</strong> <span>за ночь, в выходные ${money(c.we)}</span></p>
          <button class="btn btn--ghost" type="button" data-pick="${c.id}">Выбрать даты</button>
        </div>
      </div>
    </article>`).join('');
  $$('.cabin').forEach(card => {
    $$('.seg button', card).forEach(b => b.addEventListener('click', () => {
      $$('.seg button', card).forEach(x => x.setAttribute('aria-selected', x === b));
      $$('.vw', card).forEach((im, k) => im.classList.toggle('is-on', k === +b.dataset.v));
    }));
  });
  $$('[data-pick]').forEach(b => b.addEventListener('click', () => {
    st.cabin = b.dataset.pick;
    const r = $(`input[name=cabin][value=${st.cabin}]`); if (r) r.checked = true;
    update();
    $('#booking').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  }));
}

function renderGallery() {
  $('#mosaic').innerHTML = GALLERY.map(([n, t, cls]) => `
    <figure class="tile ${cls} reveal"><button type="button" data-img="${n}" data-cap="${t}" aria-label="Открыть: ${t}"><div class="vw is-on">${pic(n, t)}</div></button><figcaption>${t}</figcaption></figure>`).join('');
  const lb = $('#lightbox');
  $$('[data-img]').forEach(b => b.addEventListener('click', () => {
    $('#lbImg').src = imgT(b.dataset.img); $('#lbImg').alt = b.dataset.cap; $('#lbCap').textContent = b.dataset.cap;
    lb.showModal();
  }));
  $('#lbClose').addEventListener('click', () => lb.close());
  lb.addEventListener('click', e => { if (e.target === lb) lb.close(); });
}

/* ───────────── РАСЧЁТ БРОНИ (из v1, без изменений правил) ───────────── */
const pad = n => String(n).padStart(2, '0');
const toStr = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromStr = s => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; };
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const WD = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
const dShort = d => d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }).replace('.', '');
const isWeekendNight = d => d.getDay() === 5 || d.getDay() === 6; // ночь с пт и с сб

function calcBooking(s) {
  const c = cabinById(s.cabin), a = fromStr(s.inStr), b = fromStr(s.outStr);
  const out = { valid: false, rows: [], total: 0, nights: 0, error: '' };
  if (!c) { out.error = 'Выберите домик.'; return out; }
  if (!a || !b) { out.error = 'Укажите даты заезда и выезда.'; return out; }
  const n = Math.round((b - a) / 864e5);
  if (n < 1) { out.error = 'Выезд должен быть позже заезда.'; return out; }
  if (n > 21) { out.error = 'Дольше 21 ночи онлайн не считаем, напишите нам.'; return out; }
  const g = clamp(s.guests, 1, c.max);
  const rows = [{ grp: 'Проживание' }];
  let total = 0, we = 0;
  for (let i = 0; i < n; i++) {
    const d = addDays(a, i), w = isWeekendNight(d), p = w ? c.we : c.wd;
    if (w) we++;
    total += p;
    rows.push({ label: `${WD[d.getDay()]}, ${dShort(d)}`, we: w, sum: p });
  }
  const extraG = Math.max(0, g - c.base);
  if (extraG) {
    const sum = extraG * c.extra * n; total += sum;
    rows.push({ grp: 'Гости' }, { label: `${extraG} доп. ${extraG === 1 ? 'гость' : 'гостя'} × ${n} ноч. × ${money(c.extra)}`, sum });
  }
  const opts = [];
  if (s.banya) opts.push({ label: 'Баня на дровах', sum: OPT.banya });
  if (s.breakfast) opts.push({ label: `Завтраки: ${g} × ${n} × ${money(OPT.breakfast)}`, sum: OPT.breakfast * g * n });
  if (s.sup) opts.push({ label: 'Сапы, 2 доски', sum: OPT.sup });
  if (opts.length) { rows.push({ grp: 'Услуги' }, ...opts); opts.forEach(o => total += o.sum); }
  return { valid: true, rows, total, nights: n, weekendNights: we, guests: g, cabin: c, from: a, to: b, error: '' };
}
window.calcBooking = calcBooking; // для проверки в консоли

const st = { cabin: 'luna', inStr: '', outStr: '', guests: 2, banya: false, breakfast: false, sup: false };
let lastTotal = 0, tween = 0, current = null, photoId = null;

function initCalc() {
  $('#pickCabin').innerHTML = CABINS.map((c, i) => `
    <label><input type="radio" name="cabin" value="${c.id}" ${i === 0 ? 'checked' : ''}>
      <span class="pc"><b>${c.kind} «${c.name}»</b><small>до ${c.max} гостей · ${c.area} м²</small><em>от ${money(c.wd)}</em></span></label>`).join('');

  const now = new Date(); const t0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const toFri = (5 - t0.getDay() + 7) % 7 || 7;
  const fri = addDays(t0, toFri);
  ['#dIn', '#qIn'].forEach(s => $(s).min = toStr(t0));
  ['#dOut', '#qOut'].forEach(s => $(s).min = toStr(addDays(t0, 1)));
  st.inStr = toStr(fri); st.outStr = toStr(addDays(fri, 2));
  $('#dIn').value = $('#qIn').value = st.inStr; $('#dOut').value = $('#qOut').value = st.outStr;

  $('#calcForm').addEventListener('change', e => {
    const t = e.target;
    if (t.name === 'cabin') st.cabin = t.value;
    if (t.id === 'dIn') setIn(t.value);
    if (t.id === 'dOut') st.outStr = t.value;
    if (t.id === 'oBanya') st.banya = t.checked;
    if (t.id === 'oBreak') st.breakfast = t.checked;
    if (t.id === 'oSup') st.sup = t.checked;
    update();
  });
  $('#gMinus').addEventListener('click', () => { st.guests--; update(); });
  $('#gPlus').addEventListener('click', () => { st.guests++; update(); });
  $('#calcForm').addEventListener('submit', e => e.preventDefault());
  $('#bookBtn').addEventListener('click', openModal);

  /* быстрый выбор на первом экране */
  $('#qIn').addEventListener('change', e => { setIn(e.target.value); $('#qOut').value = st.outStr; });
  $('#quick').addEventListener('submit', e => {
    e.preventDefault();
    st.outStr = $('#qOut').value; st.inStr = $('#qIn').value; st.guests = +$('#qG').value;
    syncDates(); update();
    $('#booking').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  });
  update();
}
function setIn(v) {
  st.inStr = v;
  const a = fromStr(st.inStr), b = fromStr(st.outStr);
  if (a && (!b || b <= a)) st.outStr = toStr(addDays(a, 1));
  if (a) ['#dOut', '#qOut'].forEach(s => $(s).min = toStr(addDays(a, 1)));
  syncDates();
}
function syncDates() { $('#dIn').value = $('#qIn').value = st.inStr; $('#dOut').value = $('#qOut').value = st.outStr; }
const nightsWord = n => n === 1 ? 'ночь' : n < 5 ? 'ночи' : 'ночей';
const guestsWord = g => g === 1 ? 'гость' : g < 5 ? 'гостя' : 'гостей';

function update() {
  const c = cabinById(st.cabin);
  st.guests = clamp(st.guests, 1, c.max);
  $('#gVal').textContent = st.guests; $('#qG').value = st.guests;
  $('#gMinus').disabled = st.guests <= 1;
  $('#gPlus').disabled = st.guests >= c.max;
  $('#gHint').textContent = `В цену входят ${c.base} ${guestsWord(c.base)}. Каждый следующий: +${money(c.extra)} за ночь. Максимум ${c.max}.`;

  const r = calcBooking(st); current = r;
  $('#sCabin').textContent = `${c.kind} «${c.name}»`;
  const hint = $('#dateHint');
  hint.classList.toggle('bad', !r.valid);
  if (r.valid) {
    hint.textContent = `${r.nights} ${nightsWord(r.nights)}, из них пятница и суббота: ${r.weekendNights}. Заезд с 15:00, выезд до 12:00.`;
    $('#sMeta').textContent = `${dShort(r.from)} → ${dShort(r.to)} · ${r.nights} ${nightsWord(r.nights)} · ${r.guests} ${guestsWord(r.guests)}`;
    $('#sNote').textContent = r.weekendNights ? 'В расчёте есть выходные ночи по повышенной цене.' : 'Все ночи по будничной цене.';
  } else {
    hint.textContent = r.error; $('#sMeta').textContent = ''; $('#sNote').textContent = r.error;
  }
  $('#sRows').innerHTML = r.rows.map(x => x.grp
    ? `<li class="grp"><span>${x.grp}</span></li>`
    : `<li class="${x.we ? 'we' : ''}"><span>${x.label}</span><span>${money(x.sum)}</span></li>`).join('');
  $('#bookBtn').disabled = !r.valid;
  setTotal(r.total);
  setPhoto(c.id);
}
function setPhoto(id) {
  if (id === photoId) return;
  photoId = id;
  const box = $('#sumPhoto');
  const im = document.createElement('div');
  im.className = 'vw'; im.innerHTML = pic('cabin-' + id, '');
  box.appendChild(im);
  requestAnimationFrame(() => im.classList.add('is-on'));
  setTimeout(() => $$('.vw', box).filter(x => x !== im).forEach(x => x.remove()), 700);
}
function setTotal(to) {
  const el = $('#sTotal'); cancelAnimationFrame(tween);
  if (reduced) { el.textContent = money(to); lastTotal = to; return; }
  const from = lastTotal, t0 = performance.now();
  const step = now => {
    const k = clamp((now - t0) / 500), v = Math.round(lerp(from, to, 1 - Math.pow(1 - k, 3)));
    el.textContent = money(v); lastTotal = v;
    if (k < 1) tween = requestAnimationFrame(step); else { lastTotal = to; el.textContent = money(to); }
  };
  tween = requestAnimationFrame(step);
}

/* ───────────── ЗАЯВКИ, МЕТРИКА, COOKIES ───────────── */
/* Отправка заявки. Без CONFIG.endpoint (демо) заявка никуда не уходит, форма показывает успех. */
function sendLead(data, form) {
  if (form.querySelector('.hp')?.value) return Promise.resolve(true);          // ловушка для спам-ботов
  if (!CONFIG.endpoint) return new Promise(r => setTimeout(() => r(true), 400));
  return fetch(CONFIG.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, site: SITE.name, page: location.href }) })
    .then(r => r.ok).catch(() => false);
}
const goal = g => { try { if (CONFIG.metrika && window.ym) ym(+CONFIG.metrika, 'reachGoal', g); } catch (e) {} };
function initMetrika() {
  document.addEventListener('click', e => { const a = e.target.closest('[data-goal]'); if (a) goal(a.dataset.goal); });
  if (!CONFIG.metrika) return;
  (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,'script','https://mc.yandex.ru/metrika/tag.js','ym');
  ym(+CONFIG.metrika, 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: true });
  let seen = null; try { seen = localStorage.getItem('cookie-ok'); } catch (e) {}
  if (seen) return;
  const c = document.createElement('div'); c.className = 'cookie';
  c.innerHTML = '<p>Сайт использует cookies и Яндекс Метрику для статистики посещений. <a href="privacy.html">Подробнее</a></p><button class="btn btn--sm" type="button">Понятно</button>';
  c.querySelector('button').onclick = () => { c.remove(); try { localStorage.setItem('cookie-ok', '1'); } catch (e) {} };
  document.body.append(c);
}

/* ───────────── ФОРМЫ ───────────── */
const phoneOk = v => v.replace(/\D/g, '').length >= 10;
function openModal() {
  if (!current || !current.valid) return;
  $('#mStep1').hidden = false; $('#mStep2').hidden = true; $('#fErr').textContent = '';
  $('#mSum').textContent = `${current.cabin.kind} «${current.cabin.name}», ${dShort(current.from)} → ${dShort(current.to)}, ${current.guests} ${guestsWord(current.guests)}. Итого ${money(current.total)}.`;
  $('#modal').showModal();
}
function initForms() {
  const modal = $('#modal');
  $('#mClose').addEventListener('click', () => modal.close());
  $('#mOk').addEventListener('click', () => modal.close());
  modal.addEventListener('click', e => { if (e.target === modal) modal.close(); });
  $('#bookForm').addEventListener('submit', e => {
    e.preventDefault();
    const n = $('#fName').value.trim(), p = $('#fPhone').value.trim();
    if (n.length < 2) { $('#fErr').textContent = 'Введите имя.'; return; }
    if (!phoneOk(p)) { $('#fErr').textContent = 'Введите телефон полностью, не меньше 10 цифр.'; return; }
    if (!$('#fOk').checked) { $('#fErr').textContent = 'Отметьте согласие на обработку данных.'; return; }
    $('#fErr').textContent = ''; const btn = $('#fSend'); btn.disabled = true;
    sendLead({ type: 'Бронь', name: n, phone: p, details: $('#mSum').textContent }, e.target).then(ok => {
      btn.disabled = false;
      if (!ok) { $('#fErr').textContent = 'Не получилось отправить. Позвоните нам: +7 900 000-00-00.'; return; }
      goal('booking');
      $('#mDone').textContent = `${n}, мы свяжемся по номеру ${p}, чтобы подтвердить бронь на ${money(current.total)}.`;
      $('#mStep1').hidden = true; $('#mStep2').hidden = false;
    });
  });
  $('#askForm').addEventListener('submit', e => {
    e.preventDefault();
    const n = $('#aName').value.trim(), p = $('#aPhone').value.trim(), t = $('#aText').value.trim();
    const err = $('#aErr'), btn = $('#aSend');
    if (n.length < 2) { err.textContent = 'Введите имя.'; return; }
    if (!phoneOk(p) && !/^@\w{4,}$/.test(p)) { err.textContent = 'Укажите телефон или Telegram вида @name.'; return; }
    if (t.length < 5) { err.textContent = 'Напишите вопрос.'; return; }
    if (!$('#aOk').checked) { err.textContent = 'Отметьте согласие на обработку данных.'; return; }
    err.textContent = ''; btn.disabled = true;
    sendLead({ type: 'Вопрос', name: n, phone: p, details: t }, e.target).then(ok => {
      if (!ok) { btn.disabled = false; err.textContent = 'Не получилось отправить. Позвоните нам: +7 900 000-00-00.'; return; }
      goal('question'); btn.textContent = 'Заявка отправлена'; e.target.reset();
      setTimeout(() => { btn.textContent = 'Отправить'; btn.disabled = false; }, 2500);
    });
  });
}

/* ───────────── FAQ, ПОЯВЛЕНИЕ, ШАПКА ───────────── */
function initAcc() {
  $$('.acc__item button').forEach(b => b.addEventListener('click', () => {
    const it = b.parentElement, open = !it.classList.contains('open');
    $$('.acc__item.open').forEach(o => { o.classList.remove('open'); $('button', o).setAttribute('aria-expanded', 'false'); });
    if (open) { it.classList.add('open'); b.setAttribute('aria-expanded', 'true'); }
  }));
}
function initReveal() {
  const els = $$('.reveal');
  if (reduced || !('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
  document.documentElement.classList.add('js');
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0, rootMargin: '0px 0px -6% 0px' });
  els.forEach(e => io.observe(e));
}
function initHero() {
  let v = $('.hero__video');
  if (!CONFIG.heroVideo) { v.remove(); v = null; }
  else { v.src = CONFIG.heroVideo;
  const ok = () => { if (theme() === 'night') v.classList.add('on'); };
  v.addEventListener('canplay', ok);
  v.addEventListener('error', () => v.remove());
  v.play && v.play().catch(() => {}); }
  const top = $('#top');
  const f = () => top.classList.toggle('solid', scrollY > 40);
  addEventListener('scroll', f, { passive: true }); f();
}


/* ───────────── ТЕМА: ДЕНЬ / НОЧЬ ───────────── */
const root = document.documentElement;
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
let switching = false;
function initStars() {
  const box = $('#stars'); let h = '';
  const r = (() => { let a = 7; return () => (a = (a * 16807) % 2147483647) / 2147483647; })();
  for (let i = 0; i < 70; i++) h += `<i style="left:${(r() * 100).toFixed(1)}%;top:${(r() * 100).toFixed(1)}%;--dl:${(.3 + r() * 1.1).toFixed(2)}s;--tw:${(r() * 3).toFixed(2)}s;transform:scale(${(.6 + r() * .9).toFixed(2)})"></i>`;
  box.innerHTML = h;
}
function arc(x0, y0, xm, ym, x1, y1, n = 16) { // парабола через три точки, координаты в % экрана
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    pts.push([u * u * x0 + 2 * u * t * xm + t * t * x1, u * u * y0 + 2 * u * t * ym + t * t * y1]);
  }
  return pts;
}
function flyOrb(cls, pts, fade, dur) {
  const media = $('#heroMedia'), el = document.createElement('div');
  el.className = 'orb ' + cls; media.appendChild(el);
  const W = media.clientWidth, H = media.clientHeight;
  const kf = pts.map(([x, y], i) => ({ transform: `translate(${x / 100 * W}px, ${y / 100 * H}px)`, opacity: fade(i / (pts.length - 1)), offset: i / (pts.length - 1) }));
  el.animate(kf, { duration: dur, easing: 'cubic-bezier(.45,.05,.4,1)', fill: 'forwards' }).onfinish = () => el.remove();
}
function setTheme(next, animate, save) {
  const prev = theme();
  if (save) { try { localStorage.setItem('theme', next); } catch (e) {} }
  const btn = $('#themeBtn'); btn.setAttribute('aria-checked', next === 'night');
  btn.title = next === 'night' ? 'Включить день' : 'Включить ночь';
  const meta = $('meta[name=theme-color]'); if (meta) meta.content = next === 'day' ? '#f4f6f1' : '#080706';
  if (prev === next && !animate) return;
  if (!animate || reduced || switching) { root.dataset.theme = next; return; }
  switching = true;
  const DUR = 1400, toDay = next === 'day';
  const d = $('.im-d'), tint = $('#tint'), fog = $('.fog'), glows = $$('.glow'), vid = $('.hero__video');
  root.classList.add('theming');
  /* дневной кадр лежит поверх ночного, его видимая часть сдвигается по линии горизонта */
  const mask = f => { const p = f * 130 - 15; const g = `linear-gradient(to top, #000 ${p - 15}%, transparent ${p + 15}%)`; d.style.webkitMaskImage = g; d.style.maskImage = g; };
  d.style.opacity = '1'; d.style.transition = 'none';
  const f0 = toDay ? 0 : 1, f1 = toDay ? 1 : 0; mask(f0);
  root.dataset.theme = next;           // палитра страницы, звёзды и фото домиков меняются через CSS
  d.style.opacity = '1';
  tint.style.background = toDay ? 'linear-gradient(0deg, rgba(255,196,140,.75), rgba(255,226,190,.25) 55%, transparent)' : 'linear-gradient(180deg, rgba(20,34,70,.7), rgba(60,40,70,.35) 55%, transparent)';
  fog.classList.remove('swell'); void fog.offsetWidth; fog.classList.add('swell');
  glows.forEach(g => { g.classList.remove('lit'); void g.offsetWidth; if (!toDay) g.classList.add('lit'); });
  if (toDay && vid) vid.classList.remove('on');
  /* солнце и луна по дуге */
  if (toDay) {
    flyOrb('orb--moon', arc(40, 11, 52, 18, 68, 62), t => t > .7 ? Math.max(0, 1 - (t - .7) / .25) : .9, DUR + 200);
    flyOrb('orb--sun', arc(2, 66, 20, 6, 44, 22), t => t < .2 ? t / .2 : t > .75 ? Math.max(0, 1 - (t - .75) / .25) : 1, DUR + 200);
  } else {
    flyOrb('orb--sun', arc(44, 22, 56, 14, 72, 66), t => t < .1 ? 1 : Math.max(0, 1 - (t - .1) / .75), DUR);
    flyOrb('orb--moon', arc(2, 66, 16, 6, 40, 11), t => t < .15 ? t / .15 * .9 : .9, DUR + 100);
  }
  const t0 = performance.now();
  const finish = () => {
    d.style.cssText = ''; tint.style.opacity = '0';
    root.classList.remove('theming'); switching = false;
    if (!toDay && vid) vid.dispatchEvent(new Event('canplay'));
  };
  const step = now => {
    const k = clamp((now - t0) / DUR), e = ease(k);
    mask(lerp(f0, f1, e));
    tint.style.opacity = (Math.sin(Math.PI * k) * .85).toFixed(3);
    if (k < 1) requestAnimationFrame(step); else finish();
  };
  requestAnimationFrame(step);
  setTimeout(() => { if (switching) finish(); }, DUR + 400);
}
function initTheme() {
  initStars();
  setTheme(theme(), false, false);
  $('#themeBtn').addEventListener('click', () => setTheme(theme() === 'day' ? 'night' : 'day', true, true));
}

renderCabins(); renderGallery(); initCalc(); initForms(); initMetrika(); initAcc(); initReveal(); initHero(); initTheme();
})();
