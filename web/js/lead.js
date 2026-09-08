/**
 * Заявка. Пять шагов, контакты последними.
 *
 * Выбор варианта сразу ведёт на следующий шаг: кнопка «Дальше» на каждом
 * шаге — это четыре лишних касания и заметный отвал. Исключение — шаги
 * со слайдером и с контактами, там подтверждение обязательно.
 *
 * Демо ничего никуда не отправляет: телефон-маска из нулей и отсутствующий
 * бэкенд — часть демо-сборки, а не недоделка.
 */
const LAST = 5;

export function initLead(root) {
  if (!root) return;
  const form = root.querySelector('[data-lead-form]');
  const fill = root.querySelector('[data-lead-fill]');
  const lab = root.querySelector('[data-lead-step]');
  const back = root.querySelector('[data-back]');
  const steps = [...root.querySelectorAll('.stp')];
  if (!form) return;

  const data = { object: '', area: 60, level: '', when: '', way: 'WhatsApp' };
  let cur = 1;

  const go = (n) => {
    cur = Math.min(6, Math.max(1, n));
    steps.forEach((s) => s.classList.toggle('on', +s.dataset.step === cur));
    if (fill) fill.style.width = Math.min(100, (cur / LAST) * 100) + '%';
    if (lab) lab.textContent = cur > LAST ? 'заявка отправлена' : `шаг ${cur} из ${LAST}`;
    if (back) back.hidden = cur === 1 || cur > LAST;
  };

  root.querySelectorAll('[data-pick]').forEach((g) => {
    g.addEventListener('click', (e) => {
      const b = e.target.closest('.opt');
      if (!b) return;
      const key = g.dataset.pick;
      g.querySelectorAll('.opt').forEach((o) => o.classList.remove('on'));
      b.classList.add('on');
      data[key] = b.dataset.v;
      // Способ связи — часть последнего шага, дальше по нему не уходим.
      if (key !== 'way') setTimeout(() => go(cur + 1), 160);
    });
  });

  const area = root.querySelector('[data-area]');
  const areaOut = root.querySelector('[data-area-out]');
  const paint = () => {
    if (!area) return;
    const p = ((area.value - area.min) / (area.max - area.min)) * 100;
    area.style.setProperty('--p', p + '%');
    data.area = +area.value;
    if (areaOut) areaOut.textContent = `${area.value} м²`;
  };
  area?.addEventListener('input', paint);
  paint();

  root.querySelector('[data-next]')?.addEventListener('click', () => go(cur + 1));
  back?.addEventListener('click', () => go(cur - 1));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const phone = form.querySelector('[name=phone]');
    if (!phone.value.trim()) { phone.focus(); phone.reportValidity?.(); return; }
    go(6);
  });

  go(1);
}
