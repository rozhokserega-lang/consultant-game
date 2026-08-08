# Telegram Mini App

Два URL — два бота. Токены в репозиторий не кладём.

| Бот | Ветка | URL |
|-----|-------|-----|
| **Прод** (старый) | `main` | https://rozhokserega-lang.github.io/consultant-game/ |
| **Дев** (новый) | `dev` | https://rozhokserega-lang.github.io/consultant-game/dev/ |

После `git push` в `main` или `dev` GitHub Actions пересобирает оба пути (1–3 минуты). Смотри вкладку Actions → **Deploy Pages**.

## Новый дев-бот (BotFather)

1. [@BotFather](https://t.me/BotFather) → `/newbot` → имя и username (например `ConsultantSaleDevBot`).
2. `/mybots` → этот бот → **Bot Settings → Menu Button** (или Configure Mini App).
3. URL: `https://rozhokserega-lang.github.io/consultant-game/dev/`
4. Открывай кнопкой меню или `https://t.me/<dev_bot>?startapp`.

## Старый (прод) бот

Оставь Menu Button / Mini App на:

`https://rozhokserega-lang.github.io/consultant-game/`

(без `/dev/`).

## Проверка в браузере

- Прод: https://rozhokserega-lang.github.io/consultant-game/
- Дев: https://rozhokserega-lang.github.io/consultant-game/dev/  
  На деве в хабе версия должна быть свежая (`v0.3.x-sale`), файл `DEPLOY.txt` показывает короткий SHA.

## Что в коде

- WebApp bootstrap в `index.html` (`ready` / `expand` / цвета).
- Workflow: [`.github/workflows/pages.yml`](.github/workflows/pages.yml) — root из `main`, `/dev/` из `dev`.
