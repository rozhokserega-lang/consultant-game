/**
 * Сборка страницы: index.html держит только пустые корни, разметку в них
 * вставляют виджеты. Выполняется до new Game() — конструктор кэширует узлы.
 */

const mountWidget = (rootId, widget) => {
  const root = document.getElementById(rootId);
  if (root) widget.mount(root);
};

mountWidget('battle-bar', BattleBar);
mountWidget('hud', LegacyHud);
mountWidget('mobile-controls-root', MobileControls);
mountWidget('settings-overlay', SettingsPopup);
mountWidget('end-overlay', EndPopup);
mountWidget('boosters-overlay', BoostersHub);
mountWidget('main-menu-overlay', MainMenu);
mountWidget('crash-overlay', CrashOverlay);
