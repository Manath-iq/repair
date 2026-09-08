/**
 * Смета. Результат виден без телефона: из проверенных сайтов ниши так делает
 * один из десяти. Человек, увидевший порядок цены, — квалифицированный лид.
 *
 * Контроль: 60 м² · новостройка без отделки · под ключ · 1 санузел
 * → от 594 000 до 683 000 ₽, ≈9 900 ₽/м², 62 дня.
 * Эти числа обязаны совпадать со спецстрокой первого экрана и суммой этапов.
 */
const BASE = {
  cosmetic: { p: 3900, d: 14 }, rough: { p: 4900, d: 25 }, capital: { p: 7400, d: 45 },
  turnkey:  { p: 9900, d: 62 }, design: { p: 12900, d: 85 },
};
const OBJ = { pre: [0.92, 0.85], raw: [1, 1], old: [1.10, 1.08], replan: [1.22, 1.22] };
const MAT = { cosmetic: 0.55, rough: 0.45, capital: 0.62, turnkey: 0.65, design: 0.74 };
const BATH = [1, 1.08, 1.14];
const SPREAD = 1.15;

/** Маленькие квартиры дороже за метр: постоянных работ столько же. */
const areaK = (a) => (a < 35 ? 1.12 : a < 60 ? 1.05 : a < 90 ? 1 : a < 130 ? 0.96 : 0.93);

/** Доли фиксированы, сумма обязана быть 100 — проверяется ниже. */
export const ITEMS = [
  ['Демонтаж и вывоз мусора', 6], ['Перегородки и проёмы', 8], ['Электрика', 14],
  ['Сантехника', 11], ['Стяжка пола', 9], ['Штукатурка стен и потолков', 18],
  ['Плиточные работы', 15], ['Малярные работы', 12], ['Двери, приборы, установка', 7],
];

const total = ITEMS.reduce((a, [, s]) => a + s, 0);
if (total !== 100) throw new Error(`Доли статей сметы дают ${total}%, а должны 100%.`);

const NB = ' ';
export const money = (v) => `${Math.round(v).toLocaleString('ru-RU').replace(/\s/g, NB)}${NB}₽`;
export const days = (v) => {
  const n = v % 100, d = v % 10;
  if (n > 10 && n < 20) return `${v}${NB}дней`;
  if (d === 1) return `${v}${NB}день`;
  if (d >= 2 && d <= 4) return `${v}${NB}дня`;
  return `${v}${NB}дней`;
};

export function estimate({ area, object, level, baths, fast }) {
  const [op, ot] = OBJ[object];
  const b = BASE[level];
  const perM2 = b.p * op * areaK(area) * BATH[baths - 1] * (fast ? 1.15 : 1);
  const low = perM2 * area;
  return {
    perM2: Math.round(perM2),
    low: Math.floor(low / 1000) * 1000,
    high: Math.floor((low * SPREAD) / 1000) * 1000,
    mat: Math.floor((low * MAT[level]) / 1000) * 1000,
    days: Math.round(b.d * (0.45 + (0.55 * area) / 60) * ot * (fast ? 0.82 : 1)),
  };
}

export function initCalc(root) {
  if (!root) return;
  const st = { area: 60, object: 'raw', level: 'turnkey', baths: 1, fast: false };
  // По умолчанию показываем только работы: именно эта цифра стоит
  // в спецстроке первого экрана, и они обязаны совпадать.
  let mode = 'work';
  const $ = (s) => root.querySelector(s);
  const est = $('#est');
  const area = $('#area');

  est.innerHTML = ITEMS.map(([n, s]) =>
    `<li><span class="est__n">${n}</span><span class="est__s">${s}%</span><span class="est__v">—</span></li>`).join('');
  const cells = [...est.querySelectorAll('.est__v')];

  const render = () => {
    const r = estimate(st);
    const p = ((st.area - area.min) / (area.max - area.min)) * 100;
    area.style.setProperty('--p', p + '%');
    $('#area-out').textContent = `${st.area}${NB}м²`;

    cells.forEach((c, i) => { c.textContent = money((r.low * ITEMS[i][1]) / 100); });
    $('#sum-work').textContent = money(r.low);
    $('#sum-mat').textContent = money(r.mat);

    const add = mode === 'all' ? r.mat : 0;
    // Без анимации счётчика: цифра, которая крутится, читается как реклама.
    $('#sum-all').textContent = `${money(r.low + add)} — ${money(r.high + add)}`;
    $('#sum-days').textContent = `${days(r.days)}${NB}·${NB}≈${money(r.perM2)}/м²`;
  };

  area.addEventListener('input', (e) => { st.area = +e.target.value; render(); });

  root.querySelectorAll('[data-g]').forEach((g) => {
    g.addEventListener('click', (e) => {
      const b = e.target.closest('.chip');
      if (!b) return;
      g.querySelectorAll('.chip').forEach((c) => c.classList.remove('on'));
      b.classList.add('on');
      const k = g.dataset.g, v = b.dataset.v;
      if (k === 'baths') st.baths = +v;
      else if (k === 'fast') st.fast = v === '1';
      else st[k] = v;
      render();
    });
  });

  root.querySelectorAll('.seg__b').forEach((b) => {
    b.addEventListener('click', () => {
      root.querySelectorAll('.seg__b').forEach((x) => x.classList.remove('on'));
      b.classList.add('on');
      mode = b.dataset.mode;
      render();
    });
  });

  render();
}
