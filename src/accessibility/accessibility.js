const STORAGE_KEY = 'spellbound-accessibility-v1';

const defaults = { palette: 'default', reducedMotion: false, highContrast: false, largeHud: false };

export function initAccessibility(){
  let settings = { ...defaults };
  try { settings = { ...settings, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; } catch {}
  const root = document.documentElement;
  const panel = document.querySelector('#accessibility-panel');
  const open = document.querySelector('#accessibility-open');
  const close = document.querySelector('#accessibility-close');
  const palette = document.querySelector('#accessibility-palette');
  const reducedMotion = document.querySelector('#accessibility-motion');
  const highContrast = document.querySelector('#accessibility-contrast');
  const largeHud = document.querySelector('#accessibility-hud');
  const apply = () => {
    root.dataset.palette = settings.palette;
    root.classList.toggle('reduced-motion', settings.reducedMotion);
    root.classList.toggle('high-contrast', settings.highContrast);
    root.classList.toggle('large-hud', settings.largeHud);
    if (palette) palette.value = settings.palette;
    if (reducedMotion) reducedMotion.checked = settings.reducedMotion;
    if (highContrast) highContrast.checked = settings.highContrast;
    if (largeHud) largeHud.checked = settings.largeHud;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch {}
    window.dispatchEvent(new CustomEvent('spellbound-accessibility', { detail: settings }));
  };
  const update = () => {
    settings = { palette: palette.value, reducedMotion: reducedMotion.checked, highContrast: highContrast.checked, largeHud: largeHud.checked };
    apply();
  };
  open?.addEventListener('click', () => panel?.classList.remove('hidden'));
  close?.addEventListener('click', () => panel?.classList.add('hidden'));
  panel?.addEventListener('click', event => { if (event.target === panel) panel.classList.add('hidden'); });
  for (const control of [palette, reducedMotion, highContrast, largeHud]) control?.addEventListener('change', update);
  apply();
  return { get settings(){ return settings; } };
}
