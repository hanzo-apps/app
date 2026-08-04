'use client';

import { Button, Input } from '@hanzo/ui';
import { YStack, Image, XStack, SizableText } from '@hanzo/gui';
import React, { useRef, useState } from 'react';
import { Camera, ImageUp, X, Loader2 } from 'lucide-react';
import { compressImage } from '@/lib/utils/image-compress';
interface ThumbnailAreaProps {
  image: string | undefined;
  onCapture?: () => Promise<string | null>;  // undefined = capture unavailable
  onImageChange: (image: string | undefined) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export function ThumbnailArea({
  image,
  onCapture,
  onImageChange,
  size = 'md',
  className,
}: ThumbnailAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      onImageChange(compressed);
    } catch {
      // silently fail — user can retry
    }
    // Reset input so re-selecting the same file triggers onChange
    e.target.value = '';
  };

  const handleCapture = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onCapture) return;
    setIsCapturing(true);
    try {
      const result = await onCapture();
      if (result) onImageChange(result);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onImageChange(undefined);
  };

  const handleUploadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const isSm = size === 'sm';


  const iconSize = isSm ? 'h-3 w-3' : 'h-3.5 w-3.5';

  const stopProp = (e: React.MouseEvent) => e.stopPropagation();

  if (image) {
    return (
      <YStack position="relative" group className={`${className}`} onClick={stopProp}>
        {isSm ? (
          <YStack width="$10" height="$8" borderRadius="$3" overflow="hidden" backgroundColor="$color3" flexShrink={0}>
            <Image src={image} alt="Thumbnail" width="100%" height="100%" objectFit="cover" />
          </YStack>
        ) : (
          <YStack width="100%" backgroundColor="$color3">
            <Image src={image} alt="Thumbnail" width="100%" height="100%" objectFit="cover" />
          </YStack>
        )}
        <Button
          type="button"
          onClick={handleRemove}
          position="absolute" alignItems="center" justifyContent="center" backgroundColor="$background" opacity={0} borderWidth={1} borderColor="$borderColor" elevation={1} $group-hover={{ opacity: 1 }} {...{ top: isSm ? "$0" : "$1.5", right: isSm ? "$0" : "$1.5", y: isSm ? "33.333%" : undefined, x: isSm ? "33.333%" : undefined }} {...(isSm ? { width: 20, height: 20, borderRadius: 4 } : { width: 28, height: 28, borderRadius: 6 })}
          title="Remove thumbnail"
        >
          <SizableText color="$color"><X /></SizableText>
        </Button>
      </YStack>
    );
  }

  // No image state
  return (
    <YStack position="relative" className={`${className}`} onClick={stopProp}>
      {isSm ? (
        <XStack width="$10" height="$8" borderRadius="$3" backgroundColor="$color3" alignItems="center" justifyContent="center" gap="$1" flexShrink={0}>
          {onCapture && (
            <Button
              type="button"
              onClick={handleCapture}
              disabled={isCapturing}
              variant="ghost"
              height="$5" width="$5" borderRadius="$2" alignItems="center" justifyContent="center" hoverStyle={{ backgroundColor: "$color11" }}
              title="Capture"
            >
              <SizableText color="$color11">{isCapturing ? <Loader2 size={12} /> : <Camera size={12} />}</SizableText>
            </Button>
          )}
          <Button
            type="button"
            onClick={handleUploadClick}
            variant="ghost"
            height="$5" width="$5" borderRadius="$2" alignItems="center" justifyContent="center" hoverStyle={{ backgroundColor: "$color11" }}
            title="Upload image"
          >
            <SizableText color="$color11"><ImageUp size={12} /></SizableText>
          </Button>
        </XStack>
      ) : (
        <XStack width="100%" backgroundColor="$color3" alignItems="center" justifyContent="center" gap="$3">
          {onCapture && (
            <Button
              type="button"
              onClick={handleCapture}
              disabled={isCapturing}
              height={36} width={36} borderRadius="$5" alignItems="center" justifyContent="center" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" elevation={1} hoverStyle={{ backgroundColor: "$background" }}
              title="Capture screenshot"
            >
              <SizableText color="$color11">{isCapturing ? <Loader2 size={16} /> : <Camera size={16} />}</SizableText>
            </Button>
          )}
          <Button
            type="button"
            onClick={handleUploadClick}
            height={36} width={36} borderRadius="$5" alignItems="center" justifyContent="center" borderWidth={1} borderColor="$borderColor" backgroundColor="$background" elevation={1} hoverStyle={{ backgroundColor: "$background" }}
            title="Upload image"
          >
            <SizableText color="$color11"><ImageUp size={16} /></SizableText>
          </Button>
        </XStack>
      )}
      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        display="none"
        onChange={handleUpload}
  />
    </YStack>
  );
}
