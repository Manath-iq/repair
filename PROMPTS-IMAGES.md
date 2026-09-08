# Промпты для генерации фотографий

Расширение Claude in Chrome не может работать с `chatgpt.com` в этом профиле — блокирует
политика `ExtensionsSettings`. Поэтому промпты готовы к тому, чтобы вставить их самому.

**Как пользоваться:**

1. Открыть [chatgpt.com](https://chatgpt.com), новый чат.
2. **Все картинки — в одном чате подряд**, тогда модель держит единый стиль.
3. Первым сообщением отправить style-guide (ниже), дальше — промпты по одному.
4. Скачать, положить в `site/public/media/` под именем из таблицы, расширение **`.webp` или `.jpg`**.
5. Прогнать: `cd site && node scripts/adopt-photos.mjs` — скрипт переключит вёрстку
   с SVG-заглушек на настоящие файлы и проверит, каких не хватает.

Приоритет: **1 → 2 → 3**. Даже одна первая картинка меняет впечатление от страницы сильнее,
чем все остальные вместе.

---

## Style-guide — отправить первым сообщением

```
I need a series of consistent interior photographs for a renovation company landing page.
Style guide for every image in this series, keep it identical throughout:

Location: a modern apartment in a Russian new-build (Kazan). This is important:
European-style tilt-and-turn window profiles, a panel radiator mounted under the window,
Russian-standard door handles and outlets. NOT an American home: no wide colonial
baseboards, no US electrical outlets, no open-plan McMansion layout, no shiplap.

Palette: warm off-white walls (#f3f1ed), oak-toned floor, graphite accents (#14141a),
exactly one warm terracotta accent (#b4622f) per image, nothing else saturated.

Light: soft natural daylight from a window, slightly overcast, no hard shadows,
no warm tungsten glow, no colored gels.

Camera: editorial interior photography, shot on a tripod at eye level, 24-35mm,
vertical lines perfectly straight, no fisheye, no tilted horizon.

Mood: calm, precise, expensive but restrained. Empty and clean, not styled to death.

Always: no text, no watermark, no logos, no brand names, no people unless I ask.

Reply "ready" and wait for my first image request.
```

---

## Приоритет 1 — первый экран

### `hero` · 16:9

Самая важная картинка на сайте. Нижняя левая треть обязана остаться спокойной — на неё
ложится заголовок. Поверх встают четыре выноски: пол, стена, потолок/свет, окно.

```
Same style guide as above. 16:9 horizontal hero image.

Scene: a finished living room in a two-room apartment right after a turnkey renovation.
Completely empty of clutter: one low graphite sofa against the right wall, one small oak
side table, nothing else. Bare oak-toned floor with a visible, perfectly flat wall-to-floor
junction line. Smooth matte off-white walls. A single terracotta object - a ceramic vase
on the side table - as the only accent.

Details that must be visible and sharp, because technical callouts will point at them:
the floor plane in the lower left, the flat wall surface on the left, the ceiling-to-wall
line in the upper left, and the window with its radiator underneath on the right.

Composition: window on the right third, light falling across the floor to the left.
Keep the LOWER LEFT THIRD visually calm and uncluttered - a headline will be overlaid there.

for a landing page hero. no text, no watermark, no people.
```

### `crew-shot` · 4:3

```
Same style guide. 4:3 horizontal.

Scene: three workers on an active renovation site, mid-work, during the plastering stage.
Bare plastered walls with visible metal guide beacons, a level rule leaning against the wall,
protective film on the floor. One worker checking a wall with a 2-meter straightedge,
one mixing plaster, one out of focus in the background.

Faces visible and calm, ordinary working clothes, no hard hats, no thumbs up, no posing,
no smiling at the camera. Documentary, not stock photography.

Light: daylight through an uncovered window, dusty air.

for a trust section on a landing page. no text, no watermark, no logos on clothing.
```

---

## Приоритет 2 — портфолио, 6 кадров

Все шесть — 4:3, кроме первого. Держи их разными по типу помещения, иначе бенто
выглядит как одна квартира с шести ракурсов.

| Файл | Пропорции | Что в кадре |
|---|---|---|
| `work-1` | **16:9** | кухня-гостиная, 62 м², двушка в новостройке |
| `work-2` | 4:3 | студия, переделанная в однокомнатную: зона спальни за перегородкой |
| `work-3` | 4:3 | сталинка: высокий потолок, лепнина, широкий подоконник |
| `work-4` | 4:3 | маленькая студия 36 м², светлая, минимум мебели |
| `work-5` | 4:3 | хрущёвка после капремонта: компактная кухня |
| `work-6` | 4:3 | дизайнерский санузел: крупная плитка, скрытые двери |

Шаблон, подставить строку из таблицы:

```
Same style guide. [16:9 / 4:3] horizontal.

Scene: [описание из таблицы] after a completed renovation. Empty, clean, no clutter,
minimal furniture. Show the quality of the finish: flat walls, tight tile joints,
clean junctions between materials.

One terracotta accent object only. Daylight from the window.

for a portfolio grid on a landing page. no text, no watermark, no people.
```

---

## Приоритет 3 — дневник объекта и бригада

### `week-1` … `week-9` · 4:3

Главное требование: **одна и та же комната с одной и той же точки во всех девяти кадрах.**
В этом весь смысл блока — видно, как меняется одно и то же место.

```
Same style guide. 4:3 horizontal. This is image [N] of a 9-image series showing the SAME
room from the EXACT SAME camera position and focal length as the previous images.
Do not move the camera between images.

Room: a 62 sqm two-room apartment living room, window on the right.

Stage shown in this image: [этап из списка ниже]

Keep identical across the series: camera position, focal length, window position,
room proportions, time of day, light direction.

no text, no watermark.
```

Этапы по неделям:

```
1  bare concrete walls and ceiling after full demolition, construction debris bags by the wall
2  new plasterboard partitions built, a widened doorway opening, framing visible
3  electrical stage: chased channels in the walls, cables running along the ceiling, an open distribution box
4  plumbing stage: pipes routed along the floor, waterproofing membrane in the wet zone
5  fresh semi-dry floor screed poured across the whole room, still damp and grey
6  walls freshly plastered to metal beacons, drying, beacons still visible
7  tiling stage: large-format tiles installed on the wet-zone wall, spacers still in place
8  painted walls, stretched ceiling installed, laminate flooring laid
9  finished room: doors hung, sockets and switches installed, lights on, floor clean
```

### `crew-1` … `crew-6` · 3:4 портреты

```
Same style guide. 3:4 vertical portrait.

Scene: a head-and-shoulders portrait of a [role] on a renovation site,
photographed against a plain plastered wall. Ordinary working clothes.
Neutral expression, looking at the camera, not smiling, not posing.

Light: soft daylight from the left. Documentary portrait, not corporate stock.

for a team section. no text, no watermark, no logos.
```

Роли по порядку: `site foreman` · `electrician` · `plumber` · `plasterer` · `tiler` · `estimator`.

> Портреты — единственное место, где реальные лица важнее качества картинки.
> У боевого клиента здесь должны стоять фотографии его настоящей бригады, а не генерация.

### `contract` · 3:4

```
Same style guide. 3:4 vertical.

Scene: a printed contract and an estimate spreadsheet lying on an oak table,
a pen on top, a tape measure and a folded floor plan beside them. Shot from above
at a slight angle. No hands, no faces.

The papers are blurred enough that no text is legible.

for a contract section on a landing page. no readable text, no watermark, no logos.
```

---

## После скачивания

```bash
cd /Users/manath/myAI/repair/site

# посмотреть, что за файл на самом деле пришёл
python3 ~/.claude/skills/chatgpt-image/scripts/imgtool.py inspect public/media/hero.png

# привести к нужному размеру и весу
python3 ~/.claude/skills/chatgpt-image/scripts/imgtool.py fit public/media/hero.png -o public/media/hero.jpg --size 1920x1080
python3 ~/.claude/skills/chatgpt-image/scripts/imgtool.py web public/media/hero.jpg -o public/media/hero.webp --quality 82

# переключить вёрстку на настоящие фото
node scripts/adopt-photos.mjs
```

Бюджет веса: **hero < 180 КБ**, остальные **< 120 КБ**. Скрипт `web` предупредит, если не уложился.
