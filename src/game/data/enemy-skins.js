/** Пулы внешности покупателей и реплики боссов. */

const ENEMY_SKIN_POOLS = {
  normal: ['enemy_elder', 'enemy_woman_purple', 'enemy_cane', 'enemy_manager', 'enemy_fast', 'enemy_tank'],
  fast: ['enemy_fast', 'enemy_woman_purple', 'enemy_cane'],
  tank: ['enemy_tank', 'enemy_boss', 'enemy_manager'],
  fatty: ['enemy_tank', 'enemy_boss'],
  boss: ['enemy_boss'],
  miniboss: ['enemy_boss', 'enemy_manager', 'enemy_tank'],
  queue: ['enemy_woman_purple', 'enemy_elder', 'enemy_fast'],
  returner: ['enemy_cane', 'enemy_elder', 'enemy_manager'],
  manager: ['enemy_manager', 'enemy_boss'],
  influencer: ['enemy_woman_purple', 'enemy_manager'],
  director: ['enemy_boss'],
  child: ['enemy_fast', 'enemy_cane'],
  blogger: ['enemy_woman_purple', 'enemy_manager'],
};

const BOSS_PHRASES = {
  boss: ['Где ваш бейдж?!', 'Я вызову охрану!', 'Смена ещё не закрыта!'],
  miniboss: ['Я тут главный по залу!', 'Очередь за мной!', 'Не смейте спорить!'],
  director: ['ВЫ УВОЛЕНЫ!', 'Подпишите акт!', 'Документы на стол!', 'Очередь из жалоб!'],
};

const STORE_SPRITES = ["store_tech", "store_clothes", "store_food", "store_sport"];
