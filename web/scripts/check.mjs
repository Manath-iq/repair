/**
 * Проверка страницы без сборщика: цифры обязаны сходиться, палитра — держать
 * контраст, хексов вне токенов быть не должно.
 * Запуск: node scripts/check.mjs
 *
 * Проверяется всё, что может молча разъехаться при правке текстов: сумма долей
 * сметы, сходимость статей до рубля, совпадение спецстроки первого экрана
 * с расчётом, сумма дней и долей оплаты по этапам, контраст всех пар
 * «текст / фон» и правило единственного места с цветами.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { estimate, ITEMS } from '../js/calc.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const tokens = readFileSync(join(root, 'css', 'tokens.css'), 'utf8');

let bad = 0;
const ok = (cond, msg) => { console.log(`  ${cond ? 'ok' : '✗ '} ${msg}`); if (!cond) bad++; };

// ── Смета ───────────────────────────────────────────────────────────────
const shares = ITEMS.reduce((a, [, s]) => a + s, 0);
ok(shares === 100, `доли статей сметы = ${shares}%`);

const r = estimate({ area: 60, object: 'raw', level: 'turnkey', baths: 1, fast: false });
const itemsSum = ITEMS.reduce((a, [, s]) => a + Math.round((r.low * s) / 100), 0);
ok(itemsSum === r.low, `статьи складываются в итог: ${itemsSum} = ${r.low}`);
ok(r.low === 594000 && r.high === 683000, `контрольный расчёт ${r.low}–${r.high} ₽`);
ok(r.perM2 === 9900, `цена за м² ${r.perM2}`);
ok(r.days === 62, `срок ${r.days} дней`);

// Цифры первого экрана обязаны совпадать с расчётом
ok(html.includes('от 9 900 ₽/м²'), 'цена в спецстроке совпадает с базой');
ok(html.includes('62 дня на 60 м²'), 'срок в спецстроке совпадает с расчётом');

// ── Этапы ───────────────────────────────────────────────────────────────
const st = [...html.matchAll(/<span>(\d+) дней<\/span><i>·<\/i><span>оплата (\d+)%/g)]
  .map((m) => [+m[1], +m[2]]);
const days = st.reduce((a, [d]) => a + d, 0);
const pay = st.reduce((a, [, p]) => a + p, 0);
ok(st.length === 6, `этапов ${st.length}`);
ok(days === r.days, `сумма дней по этапам ${days} = база «под ключ» ${r.days}`);
ok(pay === 100, `доли оплаты ${pay}%`);

// Накопительная оплата в data-pay обязана заканчиваться на 100%
const paid = [...html.matchAll(/data-pay="(\d+)"/g)].map((m) => +m[1]);
ok(paid.length === 6 && paid.at(-1) === 100, `накопительная оплата доходит до ${paid.at(-1)}%`);
ok(paid.every((v, i) => i === 0 || v > paid[i - 1]), 'накопительная оплата только растёт');

// ── Палитра ─────────────────────────────────────────────────────────────
const tok = (n) => tokens.match(new RegExp(`--${n}:\\s*(#[0-9a-fA-F]{6})`))?.[1];
const lum = (h) => {
  const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    .map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

// --accent сюда не попадает намеренно: он не дотягивает до 4,5:1 и живёт
// только на заливках, линиях и крупном тексте. Для текста есть --accent-ink.
const pairs = [
  ['ink', 'canvas', 4.5], ['ink', 'surface', 4.5],
  ['ink-2', 'canvas', 4.5], ['ink-3', 'canvas', 4.5],
  ['accent-ink', 'canvas', 4.5], ['accent-ink', 'surface', 4.5],
  ['ink-2', 'surface-sunk', 4.5], ['ink-3', 'canvas-2', 4.5],
  ['dark-ink', 'dark-bg', 4.5], ['dark-ink-2', 'dark-bg', 4.5],
  ['dark-accent', 'dark-bg', 4.5], ['dark-ink-2', 'dark-surface', 4.5],
];
for (const [fg, bg, min] of pairs) {
  const v = ratio(tok(fg), tok(bg));
  ok(v >= min, `--${fg} на --${bg}: ${v.toFixed(2)} : 1 (нужно ≥ ${min})`);
}

const accentOnSurface = ratio(tok('accent'), tok('surface'));
ok(accentOnSurface >= 3, `--accent на --surface: ${accentOnSurface.toFixed(2)} : 1 — годен для графики и текста 18px+`);

// ── Правило «ни одного хекса вне токенов» ───────────────────────────────
const sections = readFileSync(join(root, 'css', 'sections.css'), 'utf8');
const base = readFileSync(join(root, 'css', 'base.css'), 'utf8');

// Штриховки разрезов — тональная шкала одного объекта, а не палитра страницы:
// это единственное место, где хекс допустим вне токенов.
const strayCss = [...`${base}\n${sections}`.matchAll(/^(?!\s*\.bar--).*?(#[0-9a-fA-F]{3,8})\b/gm)]
  .map((m) => m[1]);
ok(strayCss.length === 0, `хексы в стилях вне токенов: ${strayCss.join(', ') || 'нет'}`);

const strayHtml = [...html.matchAll(/#[0-9a-fA-F]{6}\b/g)].map((m) => m[0]);
ok(strayHtml.length <= 1, `хексы в разметке: ${strayHtml.join(', ') || 'нет'} (допустим только theme-color)`);
ok(/theme-color" content="(#[0-9a-fA-F]{6})"/.exec(html)?.[1] === tok('canvas'),
   'theme-color совпадает с --canvas');

// ── Тон ─────────────────────────────────────────────────────────────────
// Список из 02-ideya-i-pozicionirovanie.md: эти формулировки не появляются
// на странице ни при каких условиях.
const text = html.replace(/<[^>]+>/g, ' ');
const banned = [
  'индивидуальный подход', 'команда профессионалов', 'дом вашей мечты',
  'преображаем пространства', 'создаём уют', 'лидер рынка', 'ведущая компания',
  'в ближайшее время', 'успейте', 'осталось', 'скидк', 'акци', '24/7',
];
const hits = banned.filter((b) => text.toLowerCase().includes(b));
ok(hits.length === 0, `запрещённые формулировки: ${hits.join(', ') || 'нет'}`);
ok(!/[^\d]![^\d]/.test(text.replace(/&\w+;/g, '')), 'ни одного восклицательного знака');

// Одно сквозное действие: все главные кнопки начинаются с «Рассчитать»
const primary = [...html.matchAll(/class="btn btn--pri[^"]*"[^>]*>\s*([^<]+)/g)]
  .map((m) => m[1].trim())
  .filter((t) => t && !t.startsWith('Написать') && !t.startsWith('Дальше'));
ok(primary.every((t) => t.startsWith('Рассчитать')),
   `глагол действия один на всю страницу: ${[...new Set(primary)].join(' · ')}`);

// ── Демо-статус объявлен в трёх местах ─────────────────────────────────
ok(html.includes('noindex'), 'noindex в head');
ok(html.includes('class="demo"'), 'полоса демо-статуса над шапкой');
ok(html.includes('ftr__demo'), 'оговорка в подвале');
ok(html.includes('+7 000 000-00-00'), 'телефон — маска из нулей');
ok(html.includes('rovno.example'), 'домен в зоне .example');

console.log(bad ? `\nне проходит проверок: ${bad}` : '\nвсё сходится.');
process.exit(bad ? 1 : 0);
