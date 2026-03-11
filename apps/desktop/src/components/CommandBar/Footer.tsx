import React from 'react'
import { invoke } from '@tauri-apps/api/core'

interface FooterProps {
  onShowSettings?: () => void
  onShowOnboarding?: () => void
}

export const Footer: React.FC<FooterProps> = ({ onShowSettings, onShowOnboarding }) => {
  const handleSettingsClick = () => {
    if (onShowSettings) {
      onShowSettings()
    }
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-end">
      {/* Settings Button */}
      <button
        onClick={handleSettingsClick}
        className="text-white/60 hover:text-white transition-colors p-2"
        title="Settings (⌘,)"
      >
        <svg 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M12 1v6m0 6v6m11-11h-6m-6 0H1m20.485-6.071l-4.243 4.243m-2.828 2.828l-4.243 4.243m0-14.142l4.243 4.243m2.828 2.828l4.243 4.243"></path>
        </svg>
      </button>
    </div>
  )
}