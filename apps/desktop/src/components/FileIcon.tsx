import React from 'react';

interface FileIconProps {
  path?: string;
  extension?: string;
  size?: number;
}

export const FileIcon: React.FC<FileIconProps> = ({ path, extension, size = 16 }) => {
  const getIcon = () => {
    const ext = extension || path?.split('.').pop()?.toLowerCase();
    
    switch (ext) {
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
        return '📜';
      case 'json':
        return '📋';
      case 'md':
        return '📝';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
        return '🖼️';
      case 'pdf':
        return '📄';
      case 'zip':
      case 'tar':
      case 'gz':
        return '📦';
      default:
        return '📁';
    }
  };

  return (
    <span style={{ fontSize: size }}>
      {getIcon()}
    </span>
  );
};