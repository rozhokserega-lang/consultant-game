# Attribution

## LONG NIGHT
Механики арены (warm-start сложности/монет, структура debug API, подход к VS-петле)
вдохновлены проектом:

- https://github.com/emorozoff/long-night
- License: MIT
- Author: emorozoff

Полный исходник LN **не** включён в runtime; при копировании фрагментов кода
сохраняйте MIT notice.

## Графические ассеты (anim_fx_atlas.png)

Атлас собран скриптом `assets_src/build_anim_atlas.py` из следующих CC0-паков:

### Free Pixel Effects Pack — CodeManu
- https://opengameart.org/content/free-pixel-effects-pack
- License: CC0 (public domain)
- Использовано: взрывы, левел-ап, появление/смерть боссов, вихрь магнита,
  огонь пожара, пузыри яда, хил, искры попаданий, кольца ударной волны.

### Particle Pack — Kenney (kenney.nl)
- https://kenney.nl/assets/particle-pack
- License: CC0 (public domain)
- Использовано: тонируемые частицы — слэш-телеграф рывка охраны,
  мягкие зоны опасности (ценники), подпалины после взрывов, свечение.

### Pixel Art Spells — DevWizard (скачан, пока не в runtime)
- https://opengameart.org/content/pixel-art-spells
- License: CC0 (public domain)

## Графические ассеты (mart_atlas.png)

Атлас собран скриптом `assets_src/build_mart_atlas.py`:

### Pixel Mart — ghostpixxells
- https://ghostpixxells.itch.io/pixel-mart
- License: CC0 (public domain)
- Использовано: товары как XP-дропы с покупателей (3 тира по ценности),
  бумажный пакет для «Посылки со склада»;
  часть UI-иконок пассивок/эволюций в `skill_icon_atlas.png`.

## Графические ассеты (skill_icon_atlas.png)

Атлас собран скриптом `assets_src/build_skill_icons.py` в стиле боевых VFX игры:
- кадры из `spell_atlas.png` / `vfx_atlas.png` / `pickup_fx_atlas.png` — эволюции и ауры
- **496 pixel art icons for medieval/fantasy RPG** — Henrique Lazarini (7Soul1), CC0
  https://opengameart.org/content/496-pixel-art-icons-for-medievalfantasy-rpg
  — предметные пассивки (ключи, медали, зелья, свитки, обувь…)
