// Re-export assets for Hanzo compatibility
import HanzoBlackSmall from './assets/HanzoBlackSmall.png';
import HanzoWhiteSmall from './assets/HanzoWhiteSmall.png';
import SolBlackSmall from './assets/SolBlackSmall.png';
import SolWhiteSmall from './assets/SolWhiteSmall.png';
import Logo from './assets/Logo.png';
import SettingsIcon from './assets/SettingsIcon.png';
import google_translate from './assets/google_translate.png';

export const Assets = {
  logoMinimal: HanzoBlackSmall,
  logoMinimalWhite: HanzoWhiteSmall,
  smallLogo: Logo,
  macosSettings: SettingsIcon,
  power: SettingsIcon, // fallback
  restart: SettingsIcon, // fallback
  shortcuts: SettingsIcon, // fallback
  toggle: SettingsIcon, // fallback
  translate: google_translate,
  close: SettingsIcon, // fallback
  Safari: SettingsIcon, // fallback
  Brave: SettingsIcon, // fallback
  Chrome: SettingsIcon, // fallback
  DarkModeIcon: SettingsIcon, // fallback
  SleepIcon: SettingsIcon, // fallback
  Airdrop: SettingsIcon, // fallback
  LockIcon: SettingsIcon, // fallback
  SettingsIcon: SettingsIcon,
  googleLogo: google_translate, // use translate icon as fallback
};

// Re-export custom icons
const iconModules = import.meta.glob('./assets/customIcons/*.png', { eager: true });
export const Icons: Record<string, any> = {};

Object.entries(iconModules).forEach(([path, module]) => {
  const name = path.split('/').pop()?.replace('.png', '') || '';
  Icons[name] = (module as any).default || module;
});

export default Assets;