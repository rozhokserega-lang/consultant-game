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

Атлас собран скриптом `tools/assets/build_anim_atlas.py` из следующих CC0-паков:

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

Атлас собран скриптом `tools/assets/build_mart_atlas.py`:

### Pixel Mart — ghostpixxells
- https://ghostpixxells.itch.io/pixel-mart
- License: CC0 (public domain)
- Использовано: товары как XP-дропы с покупателей (3 тира по ценности),
  бумажный пакет для «Посылки со склада»;
  часть UI-иконок пассивок/эволюций в `skill_icon_atlas.png`.

## Графические ассеты (skill_icon_atlas.png)

Атлас собран скриптом `tools/assets/build_skill_icons.py` в стиле боевых VFX игры:
- кадры из `spell_atlas.png` / `vfx_atlas.png` / `pickup_fx_atlas.png` — эволюции, ауры, ореолы
- **496 pixel art icons for medieval/fantasy RPG** — Henrique Lazarini (7Soul1), CC0
  https://opengameart.org/content/496-pixel-art-icons-for-medievalfantasy-rpg
  — пассивки и базовое оружие (стадии 1–3)

## Графические ассеты (enemy_mob_atlas.png)

Атлас собран скриптом `tools/assets/build_enemy_mob_atlas.py`:

- **Базовые кадры** (idle / walk / run / strike): первая версия атласа, см. `enemy_mob_atlas_legacy.png`.
- **Дополнительные кадры** (промежуточная ходьба/бег, замах перед ударом): сгенерированы
  в ChatGPT/DALL·E по референсам из `assets_src/mob_gen/mob_*_preview.png` (август 2026).
  Исходные листы лежат в `assets_src/mob_gen/`, фон срезан через `cut_gear_png.py`.
