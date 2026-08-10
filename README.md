# Consultant

HTML-игра для браузера и Telegram Mini App. Без сборщика: обычные `<script src>`,
выкладывается на GitHub Pages как есть.

- **Прод** (`main`): https://rozhokserega-lang.github.io/consultant-game/
- **Дев** (`dev`): https://rozhokserega-lang.github.io/consultant-game/dev/

## Запуск локально

Нужен http-сервер — через `file://` не заработает service worker:

```
npx serve .
```

## Структура

```
index.html            каркас страницы и порядок подключения скриптов
assets/               картинки: atlases/, icons/, gear/, app-icons/, images/
src/
  app/                бутстрап, Telegram, обработка падений, регистрация SW
  shared/             lib/ (утилиты), ui/ (кнопки и прочий кит), styles/ (база и токены)
  game/
    core/             class Game, ввод, камера, сохранения, главный цикл
    render/           загрузка атласов и все draw-хелперы
    entities/         игрок, враги, снаряды, пикапы, частицы
    arena/            забор, препятствия, зоны, декор
    audio/            звуки и музыка
    data/             таблицы баланса и координаты кадров атласов
    modes/sale/       режим «Распродажа»: данные, боссы, оружие, события, хаб
    modes/gear/       снаряжение и KPI-прогрессия
  widgets/            самостоятельные куски UI (меню, попапы, хаб, HUD)
tools/                скрипты сборки ассетов и проверки целостности
docs/                 ROADMAP, TELEGRAM, ATTRIBUTION
reference/            сторонний проект для сверки, в сборку не попадает
```

Порядок подключения скриптов в `index.html` значим: файлы объявляют глобальные
`const`/`class`, а `src/game/modes/**` и `src/widgets/**` дописывают методы в
`Game.prototype`. Ярусы описаны комментарием прямо перед списком скриптов.

## Проверка

```
node tools/check-integrity.mjs
```

Убеждается, что все пути из `index.html`, JS и списка прекеша `sw.js` существуют
и что каждый скрипт парсится.

Подробнее про Telegram: [docs/TELEGRAM.md](docs/TELEGRAM.md).
