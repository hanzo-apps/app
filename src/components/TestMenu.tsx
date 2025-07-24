import React from 'react';

type Props = {
  setViewMode: (mode: 'launcher' | 'chat' | 'logs') => void;
};

export const TestMenu: React.FC<Props> = ({ setViewMode }) => {
  if (import.meta.env.MODE !== 'test') {
    return null;
  }

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, zIndex: 9999 }}>
      <button onClick={() => setViewMode('launcher')}>Launcher</button>
      <button onClick={() => setViewMode('chat')}>AI Chat</button>
      <button onClick={() => setViewMode('logs')}>Logs</button>
    </div>
  );
};