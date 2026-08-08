# Telegram Mini App (dev)

Дев-сборка Sale крутится на GitHub Pages с ветки **`dev`**.

## URL

https://rozhokserega-lang.github.io/consultant-game/

Открой в браузере или встроь в бота — после каждого `git push` в `dev` Pages обновляется (обычно 1–2 минуты).

## BotFather

Токен бота в репозиторий не кладём. Настройку делает владелец бота:

1. Открой [@BotFather](https://t.me/BotFather) → `/mybots` → свой бот.
2. **Bot Settings → Menu Button** (или **Configure Mini App** / Web App).
3. Вставь URL: `https://rozhokserega-lang.github.io/consultant-game/`
4. Сохрани. В чате с ботом появится кнопка меню / Mini App.

Альтернатива: команда `/newapp` у BotFather → привязать тот же URL как Mini App.

Открытие: кнопка меню бота или ссылка вида `https://t.me/<bot_username>?startapp`.

## Что уже в коде

- `telegram-web-app.js` + `ready` / `expand` / цвета шапки под тёмный UI.
- Относительные пути и SW учитывают базу `/consultant-game/`.

## Вернуть прод на `main`

```bash
gh api repos/rozhokserega-lang/consultant-game/pages -X PUT --input - <<'EOF'
{"build_type":"legacy","source":{"branch":"main","path":"/"}}
EOF
```
