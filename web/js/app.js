import { initCalc } from './calc.js';
import { initLead } from './lead.js';
import { initNb } from './newbuilds.js';

/**
 * Всё движение страницы. Ни GSAP, ни Lenis: на эту страницу библиотека
 * не даёт ничего, чего не даёт IntersectionObserver, а весит больше
 * всего остального скрипта вместе взятого.
 */
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── Появление блоков ───────────────────────────────────────────────── */
const io = 'IntersectionObserver' in window && !still
  ? new IntersectionObserver((es) => {
      for (const e of es) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('on');
        io.unobserve(e.target);          // показали — отпустили
      }
    }, { threshold: .16, rootMargin: '0px 0px -6% 0px' })
  : null;

const watch = (sel, root = document) => root.querySelectorAll(sel)
  .forEach((el) => (io ? io.observe(el) : el.classList.add('on')));

watch('.rv');
watch('[data-stack]');

/* ── Выноски hero: длина линии считается по факту, а не на глаз ─────── */
document.querySelectorAll('.hero__calls path').forEach((p) => {
  p.style.setProperty('--len', Math.ceil(p.getTotalLength()) + 1);
});

/* ── Шапка и липкая панель ──────────────────────────────────────────── */
const hdr = document.querySelector('.hdr');
const bar = document.getElementById('bar');
const hero = document.querySelector('.hero');
// Объявлено до onScroll: при перезагрузке страницы со скроллом браузер
// восстанавливает позицию, первый же вызов доходит до menuOpen — и весь
// модуль падает в temporal dead zone вместе с калькулятором и формой.
let menuOpen = false;

const onScroll = () => {
  hdr?.classList.toggle('is-stuck', scrollY > 40);
  if (bar && hero) {
    const past = scrollY > hero.offsetHeight * .7;
    bar.classList.toggle('on', past && !menuOpen);
  }
};
addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ── Меню ───────────────────────────────────────────────────────────── */
const burger = document.getElementById('burger');
const menu = document.getElementById('menu');

const setMenu = (open) => {
  menuOpen = open;
  burger?.setAttribute('aria-expanded', String(open));
  if (menu) menu.hidden = !open;
  document.body.style.overflow = open ? 'hidden' : '';
  onScroll();
};
burger?.addEventListener('click', () => setMenu(!menuOpen));
menu?.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
addEventListener('keydown', (e) => e.key === 'Escape' && menuOpen && setMenu(false));

/* ── План квартиры по слоям ─────────────────────────────────────────── */
/* Слой включается, когда карточка этапа входит в экран, и больше не гаснет:
   квартира отделывается, а не мигает. */
const plan = document.querySelector('.plan');
const fill = document.getElementById('prg-fill');
const payL = document.getElementById('prg-pay');
const dayL = document.getElementById('prg-day');
const cards = [...document.querySelectorAll('.stg__c')];

if (plan && cards.length) {
  const show = (card) => {
    // Слои накопительные: включается не только свой, но и все предыдущие.
    // Иначе при быстром пролистывании или переходе по якорю квартира
    // оказывается с чистовой отделкой, но без перегородок.
    const i = cards.indexOf(card);
    cards.slice(0, i + 1).forEach((c) => {
      plan.querySelector(`[data-layer="${c.dataset.stage}"]`)?.classList.add('on');
    });
    card.classList.add('is-live');
    // Прогресс идёт только вперёд: пролистав вверх, оплаченное не отматываем.
    const pay = +card.dataset.pay;
    if (pay >= (show.max || 0)) {
      show.max = pay;
      if (fill) fill.style.width = pay + '%';
      if (payL) payL.textContent = `оплачено ${pay}%`;
      if (dayL) dayL.textContent = `день ${card.dataset.day} из 62`;
    }
  };

  if (still) {
    cards.forEach(show);
  } else {
    const pio = new IntersectionObserver((es) => {
      for (const e of es) if (e.isIntersecting) { show(e.target); pio.unobserve(e.target); }
    }, { threshold: .35, rootMargin: '0px 0px -10% 0px' });
    cards.forEach((c) => pio.observe(c));
  }
}

/* ── Слайдер «до / после» ───────────────────────────────────────────── */
document.querySelectorAll('[data-ba]').forEach((ba) => {
  // Внутренняя картинка держит ширину всей рамки в пикселях, а не в процентах
  // от обрезанной обёртки — иначе «после» едет вместе с границей и кадры
  // перестают совпадать пиксель в пиксель.
  const sync = () => ba.style.setProperty('--iw', ba.clientWidth + 'px');
  const set = (x) => {
    const r = ba.getBoundingClientRect();
    const p = Math.min(98, Math.max(2, ((x - r.left) / r.width) * 100));
    ba.style.setProperty('--x', p + '%');
  };
  ba.style.setProperty('--x', '50%');
  sync();
  addEventListener('resize', sync, { passive: true });

  let drag = false;
  const down = (e) => { drag = true; set(e.clientX ?? e.touches[0].clientX); };
  const move = (e) => { if (drag) set(e.clientX ?? e.touches[0].clientX); };
  const up = () => { drag = false; };

  ba.addEventListener('pointerdown', down);
  addEventListener('pointermove', move, { passive: true });
  addEventListener('pointerup', up);
  ba.addEventListener('click', (e) => set(e.clientX));
});

/* ── Дневник объекта: девять карточек из одного массива ─────────────── */
// Одна квартира, одна точка съёмки во всех девяти кадрах. В этом весь смысл
// блока: видно, как меняется одно и то же место, а не девять разных квартир.
const WEEKS = [
  ['Демонтаж: снята старая отделка, вывезено 4,2 т мусора', 10],
  ['Возведены две перегородки, расширен проём на кухню', 20],
  ['Электрика: щиток на 14 групп, разводка по потолку', 27],
  ['Сантехника, гидроизоляция санузла, опрессовка', 40],
  ['Стяжка полусухая 60 мм по всей квартире', 48],
  ['Штукатурка стен по маякам, сушка', 58],
  ['Плитка в санузле и на кухонном фартуке', 72],
  ['Малярные работы, натяжные потолки, ламинат', 90],
  ['Двери, приборы, светильники, уборка, приёмка', 100],
];

const rail = document.getElementById('diary-rail');
if (rail) {
  rail.innerHTML = WEEKS.map(([txt, paid], i) => `
    <article class="wk-c">
      <div class="ph"><img src="media/diary-${i + 1}.webp" alt="Неделя ${i + 1}: ${txt}" width="600" height="450" loading="lazy"></div>
      <div class="wk-c__n"><b>Неделя ${i + 1}</b><span>оплачено ${paid}%</span></div>
      <p class="wk-c__t">${txt}</p>
    </article>`).join('');
}

initCalc(document.querySelector('[data-calc]'));
initLead(document.querySelector('[data-lead]'));
initNb(document.querySelector('[data-nb]'));
