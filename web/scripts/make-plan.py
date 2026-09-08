#!/usr/bin/env python3
"""
Чертежи, которые считаются, а не рисуются руками.

Пишет два ассета:
  media/plan.svg.inc   — план двушки, 6 групп data-layer, инлайн в index.html
  media/plan.svg       — то же отдельным файлом, для просмотра в отрыве
  media/level-N.svg    — пять разрезов стены для блока уровней

Почему генератором, а не руками: слои плана обязаны совпадать по геометрии
до пикселя. Стоит подвинуть перегородку в одном слое и забыть в другом —
квартира на скролле «дышит», и это видно сразу.

Цвета сюда не попадают: всё рисуется currentColor и классами, палитра живёт
в tokens.css. Единственное исключение — штриховки внутри чертежа, это
тональная шкала одного объекта, а не палитра страницы.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MEDIA = ROOT / "media"

# ── План квартиры ───────────────────────────────────────────────────────
# 62 м², две комнаты. Габарит в единицах: 540 × 380 при 40px поля.
X0, Y0, X1, Y1 = 40, 40, 580, 420
WALL = 10            # толщина несущей стены в единицах чертежа
PART = 7             # толщина перегородки

# Внутренние оси
AX = 340             # перегородка гостиная / спальня
BY = 250             # перегородка верх / низ
CX = 250             # прихожая / санузел
EX = 400             # санузел / лоджия

ROOMS = [
    ("Кухня-гостиная", (X0, Y0, AX, BY), "24,6 м²"),
    ("Спальня",        (AX, Y0, X1, BY), "16,2 м²"),
    ("Прихожая",       (X0, BY, CX, Y1), "9,4 м²"),
    ("Санузел",        (CX, BY, EX, Y1), "5,1 м²"),
    ("Лоджия",         (EX, BY, X1, Y1), "6,7 м²"),
]

# Проёмы: (ось, координата стены, от, до) — вырезаются из перегородок
DOORS = [
    ("v", AX, 150, 210),   # в спальню
    ("h", BY, 90,  150),   # из прихожей в гостиную
    ("v", CX, 300, 360),   # в санузел
    ("h", BY, 430, 500),   # из спальни на лоджию
]


def rect(x0, y0, x1, y1, cls="", extra=""):
    return (f'<rect x="{x0}" y="{y0}" width="{x1 - x0}" height="{y1 - y0}"'
            f'{f" class=\"{cls}\"" if cls else ""}{extra}/>')


def seg(x0, y0, x1, y1, cls=""):
    return f'<path d="M{x0} {y0}L{x1} {y1}"{f" class=\"{cls}\"" if cls else ""}/>'


def hatch(x0, y0, x1, y1, step=14, cls="hx"):
    """Штриховка под 45°, обрезанная по прямоугольнику через clip-path."""
    uid = f"c{x0}{y0}{x1}{y1}"
    lines = []
    d = x1 - x0
    t = y0 - (x1 - x0)
    while t < y1 + d:
        lines.append(f'M{x0} {t}l{d + (y1 - y0)} {d + (y1 - y0)}')
        t += step
    return (f'<clipPath id="{uid}">{rect(x0, y0, x1, y1)}</clipPath>'
            f'<g clip-path="url(#{uid})" class="{cls}"><path d="{"".join(lines)}"/></g>')


def door_arc(x, y, r, rot):
    """Створка с дугой раскрытия — как в настоящем плане, а не просто разрыв."""
    import math
    a0 = math.radians(rot)
    a1 = math.radians(rot + 90)
    x1, y1 = x + r * math.cos(a0), y + r * math.sin(a0)
    x2, y2 = x + r * math.cos(a1), y + r * math.sin(a1)
    return (f'<path d="M{x1:.1f} {y1:.1f}A{r} {r} 0 0 1 {x2:.1f} {y2:.1f}" class="arc"/>'
            f'<path d="M{x} {y}L{x1:.1f} {y1:.1f}" class="leaf"/>')


def layer_demolition():
    """01 · Демонтаж. Пунктиром — то, что уходит: старые перегородки и проём."""
    o = ['<g data-layer="demolition" class="ly-g">']
    o.append(seg(AX - 60, Y0 + WALL, AX - 60, BY, "dash"))
    o.append(seg(X0 + WALL, BY - 70, CX, BY - 70, "dash"))
    for cx, cy in ((AX - 60, 150), (200, BY - 70)):
        o.append(f'<g class="xm"><path d="M{cx-9} {cy-9}l18 18M{cx+9} {cy-9}l-18 18"/></g>')
    o.append('</g>')
    return "".join(o)


def layer_walls():
    """02 · Перегородки и проёмы. Планировка становится окончательной."""
    o = ['<g data-layer="walls" class="ly-g">']
    parts = [
        (AX - PART / 2, Y0, AX + PART / 2, BY),
        (X0, BY - PART / 2, X1, BY + PART / 2),
        (CX - PART / 2, BY, CX + PART / 2, Y1),
        (EX - PART / 2, BY, EX + PART / 2, Y1),
    ]
    for x0, y0, x1, y1 in parts:
        o.append(rect(x0, y0, x1, y1, "part"))
    for axis, c, a, b in DOORS:
        if axis == "v":
            o.append(rect(c - PART / 2 - 1, a, c + PART / 2 + 1, b, "cut"))
        else:
            o.append(rect(a, c - PART / 2 - 1, b, c + PART / 2 + 1, "cut"))
    o.append(door_arc(AX + 6, 210, 52, -90))
    o.append(door_arc(CX + 6, 360, 52, -90))
    o.append('</g>')
    return "".join(o)


def layer_mep():
    """03 · Инженерия. Щиток, четыре линии, точки розеток, вода в мокрые зоны."""
    o = ['<g data-layer="mep" class="ly-g">']
    px, py = X0 + 26, BY + 40
    o.append(rect(px - 11, py - 14, px + 11, py + 14, "box"))
    o.append(seg(px - 6, py - 7, px + 6, py - 7, "hair"))
    o.append(seg(px - 6, py, px + 6, py, "hair"))
    o.append(seg(px - 6, py + 7, px + 6, py + 7, "hair"))
    routes = [
        f"M{px} {py-14}L{px} {Y0+60}L{AX-30} {Y0+60}",
        f"M{px} {py}L{CX-30} {py}L{CX-30} {Y1-40}",
        f"M{px+11} {py}L{AX+40} {py}L{AX+40} {Y0+110}L{X1-50} {Y0+110}",
        f"M{px} {py+14}L{px} {Y1-30}L{CX-40} {Y1-30}",
    ]
    for r in routes:
        o.append(f'<path d="{r}" class="wire"/>')
    dots = [(AX - 30, Y0 + 60), (X1 - 50, Y0 + 110), (CX - 30, Y1 - 40),
            (CX - 40, Y1 - 30), (X0 + 90, Y0 + 60), (AX + 40, Y0 + 110)]
    for x, y in dots:
        o.append(f'<circle cx="{x}" cy="{y}" r="4.5" class="dot"/>')
    o.append(f'<path d="M{CX+22} {Y1-20}L{CX+22} {BY+30}L{EX-24} {BY+30}" class="pipe"/>')
    o.append('</g>')
    return "".join(o)


def layer_rough():
    """04 · Черновая. Стяжка ложится по всей квартире — штриховка по комнатам."""
    o = ['<g data-layer="rough" class="ly-g">']
    for name, (x0, y0, x1, y1), _ in ROOMS:
        if name == "Лоджия":
            continue
        o.append(hatch(x0 + 8, y0 + 8, x1 - 8, y1 - 8, 16, "hx"))
    o.append('</g>')
    return "".join(o)


def layer_finish():
    """05 · Чистовая. Доска в комнатах, плитка в мокрых зонах и прихожей."""
    o = ['<g data-layer="finish" class="ly-g">']
    for name, (x0, y0, x1, y1), _ in ROOMS:
        if name in ("Кухня-гостиная", "Спальня"):
            y = y0 + 20
            while y < y1 - 10:
                o.append(seg(x0 + 10, y, x1 - 10, y, "brd"))
                y += 13
        elif name in ("Санузел", "Прихожая"):
            step = 26
            x = x0 + 10
            while x < x1 - 10:
                o.append(seg(x, y0 + 10, x, y1 - 10, "tile"))
                x += step
            y = y0 + 10
            while y < y1 - 10:
                o.append(seg(x0 + 10, y, x1 - 10, y, "tile"))
                y += step
    o.append('</g>')
    return "".join(o)


def layer_final():
    """06 · Финиш. Приборы, свет, двери — квартира становится квартирой."""
    o = ['<g data-layer="final" class="ly-g">']
    # ванна, унитаз, раковина
    o.append(rect(CX + 14, BY + 18, CX + 60, Y1 - 74, "fix"))
    o.append(f'<circle cx="{CX+96}" cy="{BY+40}" r="13" class="fix"/>')
    o.append(rect(CX + 78, Y1 - 62, CX + 116, Y1 - 24, "fix"))
    # кухонный фронт
    o.append(rect(X0 + 12, Y0 + 12, X0 + 46, Y0 + 130, "fix"))
    o.append(f'<circle cx="{X0+29}" cy="{Y0+52}" r="11" class="fix"/>')
    # светильники
    for x, y in ((190, 140), (460, 140), (145, 335), (325, 320)):
        o.append(f'<circle cx="{x}" cy="{y}" r="7" class="lamp"/>')
        o.append(f'<path d="M{x-13} {y}h26M{x} {y-13}v26" class="lamp-x"/>')
    o.append('</g>')
    return "".join(o)


def base():
    """Несущий контур и подписи комнат — видны всегда, до включения слоёв."""
    o = ['<g class="pl-base">']
    o.append(rect(X0, Y0, X1, Y1, "env"))
    o.append(rect(X0 + WALL, Y0 + WALL, X1 - WALL, Y1 - WALL, "env-in"))
    # окна: разрывы в наружной стене
    for x0, x1 in ((110, 230), (400, 520)):
        o.append(rect(x0, Y0 + 1, x1, Y0 + WALL - 1, "win"))
    o.append(rect(X1 - WALL + 1, 120, X1 - 1, 210, "win"))
    for name, (x0, y0, x1, y1), area in ROOMS:
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        o.append(f'<text x="{cx:.0f}" y="{cy - 4:.0f}" class="rm">{name}</text>')
        o.append(f'<text x="{cx:.0f}" y="{cy + 14:.0f}" class="rm-a">{area}</text>')
    o.append('</g>')
    return "".join(o)


def plan(inline: bool) -> str:
    body = (base() + layer_demolition() + layer_walls() + layer_mep()
            + layer_rough() + layer_finish() + layer_final())
    cls = 'class="plan"'
    if inline:
        return f'<svg {cls} viewBox="0 0 620 460" role="img" aria-label="План двухкомнатной квартиры 62 м², слои собираются по этапам ремонта">{body}</svg>'
    style = """<style>
    .plan{fill:none;stroke:#55555E;stroke-width:1.4}
    .env{stroke:#14141A;stroke-width:2}.env-in{stroke:#14141A;stroke-width:2}
    .win{stroke:#14141A;stroke-width:1;fill:#FFFFFF}
    .part{fill:#14141A;stroke:none}.cut{fill:#FFFFFF;stroke:none}
    .dash{stroke-dasharray:7 6;stroke:#D3CEC5}.xm path{stroke:#B4622F;stroke-width:1.6}
    .arc{stroke:#D3CEC5;stroke-dasharray:4 4}.leaf{stroke:#14141A;stroke-width:1.6}
    .wire{stroke:#B4622F;stroke-width:1.4}.pipe{stroke:#55555E;stroke-dasharray:9 5}
    .dot{fill:#B4622F;stroke:none}.box{stroke:#14141A;stroke-width:1.6}.hair{stroke:#55555E;stroke-width:.8}
    .hx path{stroke:#EAE7E1;stroke-width:1}
    .brd{stroke:#EAE7E1;stroke-width:1}.tile{stroke:#EAE7E1;stroke-width:1}
    .fix{stroke:#55555E;stroke-width:1.4}.lamp{stroke:#B4622F;stroke-width:1.2}.lamp-x{stroke:#B4622F;stroke-width:1.2}
    text{font:500 11px 'Onest',sans-serif;fill:#55555E;text-anchor:middle;stroke:none}
    .rm-a{font-family:'Martian Mono',monospace;font-size:9px;fill:#666670}
    </style>"""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620 460" {cls}>'
            f'{style}{body}</svg>')


# ── Разрезы стены для блока уровней ─────────────────────────────────────
# Чем дороже уровень, тем больше слоёв. Ширина полосы пропорциональна
# толщине: у «под ключ» звукоизоляция физически шире всего остального.
LEVELS = [
    [("основание", 34, "brick"), ("шпаклёвка", 5, "thin"), ("краска", 4, "paint")],
    [("основание", 34, "brick"), ("грунт", 3, "thin"), ("штукатурка", 22, "plaster")],
    [("основание", 34, "brick"), ("грунт", 3, "thin"), ("штукатурка", 22, "plaster"),
     ("шпаклёвка", 5, "thin"), ("покрытие", 6, "paint")],
    [("основание", 34, "brick"), ("звукоизоляция", 30, "wool"), ("грунт", 3, "thin"),
     ("штукатурка", 22, "plaster"), ("шпаклёвка", 5, "thin"), ("покрытие", 6, "paint")],
    [("основание", 34, "brick"), ("звукоизоляция", 30, "wool"), ("грунт", 3, "thin"),
     ("штукатурка", 22, "plaster"), ("шпаклёвка", 5, "thin"), ("покрытие", 6, "paint"),
     ("декор", 8, "deco")],
]

FILLS = {
    "brick": 'url(#p-brick)', "wool": 'url(#p-wool)', "plaster": 'url(#p-plaster)',
    "thin": '#D3CEC5', "paint": '#14141A', "deco": 'url(#p-deco)',
}

DEFS = """<defs>
<pattern id="p-brick" width="14" height="10" patternUnits="userSpaceOnUse">
  <rect width="14" height="10" fill="#FFFFFF"/><path d="M0 5h14M7 0v5M0 5v5" stroke="#D3CEC5" stroke-width="1"/></pattern>
<pattern id="p-wool" width="8" height="8" patternUnits="userSpaceOnUse">
  <rect width="8" height="8" fill="#FFFFFF"/><path d="M0 8 8 0M-2 2 2-2M6 10l4-4" stroke="#D3CEC5" stroke-width="1"/></pattern>
<pattern id="p-plaster" width="6" height="6" patternUnits="userSpaceOnUse">
  <rect width="6" height="6" fill="#FFFFFF"/><circle cx="3" cy="3" r=".8" fill="#D3CEC5"/></pattern>
<pattern id="p-deco" width="6" height="6" patternUnits="userSpaceOnUse">
  <rect width="6" height="6" fill="#FFFFFF"/><path d="M0 6 6 0" stroke="#B4622F" stroke-width="1"/></pattern>
</defs>"""


def level_svg(layers, n):
    W, H = 280, 150
    total = sum(t for _, t, _ in layers)
    gap = 2
    x = 22
    scale = (W - 90 - gap * (len(layers) - 1)) / total
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" fill="none">', DEFS]
    o.append(f'<style>text{{font:400 8px "Martian Mono",monospace;fill:#666670}}'
             f'.ed{{stroke:#14141A;stroke-width:1}}.dim{{stroke:#D3CEC5;stroke-width:1}}</style>')
    top, bot = 30, 112
    for name, t, kind in layers:
        w = t * scale
        o.append(f'<rect x="{x:.1f}" y="{top}" width="{w:.1f}" height="{bot - top}" '
                 f'fill="{FILLS[kind]}" class="ed"/>')
        x += w + gap
    right = x - gap
    # размерная линия снизу и номер уровня
    o.append(f'<path d="M22 {bot + 12}h{right - 22}" class="dim"/>')
    o.append(f'<path d="M22 {bot + 8}v8M{right:.1f} {bot + 8}v8" class="dim"/>')
    o.append(f'<text x="22" y="{bot + 28}">{len(layers)} слоя</text>' if len(layers) < 5
             else f'<text x="22" y="{bot + 28}">{len(layers)} слоёв</text>')
    o.append(f'<text x="22" y="20">— 0{n}</text>')
    o.append('</svg>')
    return "".join(o)


if __name__ == "__main__":
    MEDIA.mkdir(exist_ok=True)
    (MEDIA / "plan.svg.inc").write_text(plan(True), encoding="utf-8")
    (MEDIA / "plan.svg").write_text(plan(False), encoding="utf-8")
    for i, ls in enumerate(LEVELS, 1):
        (MEDIA / f"level-{i}.svg").write_text(level_svg(ls, i), encoding="utf-8")
    print(f"план: {len((MEDIA / 'plan.svg').read_text())} байт · уровней: {len(LEVELS)}")
