// Re-export assets for Sol compatibility
import logoMinimal from './assets/logoMinimal.png';
import logoMinimalWhite from './assets/logoMinimalWhite.png';
import smallLogo from './assets/smallLogo.png';
import macosSettings from './assets/macosSettings.png';
import power from './assets/power.png';
import restart from './assets/restart.png';
import shortcuts from './assets/shortcuts.png';
import toggle from './assets/toggle.png';
import translate from './assets/translate.png';
import close from './assets/close.png';

export const Assets = {
  logoMinimal,
  logoMinimalWhite,
  smallLogo,
  macosSettings,
  power,
  restart,
  shortcuts,
  toggle,
  translate,
  close,
};

// Re-export custom icons
const iconModules = import.meta.glob('./assets/customIcons/*.png', { eager: true });
export const Icons: Record<string, any> = {};

Object.entries(iconModules).forEach(([path, module]) => {
  const name = path.split('/').pop()?.replace('.png', '') || '';
  Icons[name] = (module as any).default || module;
});

export default Assets;