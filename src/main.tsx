import './styles/globals.css';
import './App'; // App self-registers with React Native Web

// Disable context menu in production
if (!import.meta.env.DEV) {
  document.addEventListener('contextmenu', (e) => e.preventDefault());
}