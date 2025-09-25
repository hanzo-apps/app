'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useInView } from 'react-intersection-observer';
import { cn } from '@/lib/utils';

export interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  containerClassName?: string;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  quality?: number;
  sizes?: string;
  fill?: boolean;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: () => void;
  lazy?: boolean;
  threshold?: number;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className,
  containerClassName,
  placeholder = 'blur',
  blurDataURL,
  quality = 75,
  sizes,
  fill = false,
  style,
  onLoad,
  onError,
  lazy = true,
  threshold = 0.1,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { ref, inView } = useInView({
    threshold,
    triggerOnce: true,
    skip: !lazy || priority,
  });

  const shouldLoad = !lazy || priority || inView;

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  if (hasError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gray-100 dark:bg-gray-800',
          containerClassName,
          fill && 'absolute inset-0'
        )}
      >
        <div className="text-center p-4">
          <svg
            className="w-12 h-12 mx-auto text-gray-400"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="mt-2 text-sm text-gray-500">Failed to load image</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className={cn('relative', containerClassName)}>
      {shouldLoad ? (
        <Image
          src={src}
          alt={alt}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          priority={priority}
          className={cn(
            'transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            className
          )}
          placeholder={placeholder}
          blurDataURL={blurDataURL || generateBlurDataURL()}
          quality={quality}
          sizes={sizes || generateSizes(width)}
          fill={fill}
          style={style}
          onLoad={handleLoad}
          onError={handleError}
        />
      ) : (
        <div
          className={cn(
            'bg-gray-200 dark:bg-gray-700 animate-pulse',
            className
          )}
          style={{
            width: fill ? '100%' : width,
            height: fill ? '100%' : height,
            ...style,
          }}
        />
      )}
    </div>
  );
}

// Progressive Image Component with multiple sources
export interface ProgressiveImageProps extends OptimizedImageProps {
  lowQualitySrc?: string;
  sources?: Array<{
    srcSet: string;
    type: string;
    media?: string;
  }>;
}

export function ProgressiveImage({
  lowQualitySrc,
  sources,
  ...props
}: ProgressiveImageProps) {
  const [currentSrc, setCurrentSrc] = useState(lowQualitySrc || props.src);
  const [isHighQualityLoaded, setIsHighQualityLoaded] = useState(false);

  useEffect(() => {
    if (lowQualitySrc && !isHighQualityLoaded) {
      const img = new window.Image();
      img.src = props.src;
      img.onload = () => {
        setCurrentSrc(props.src);
        setIsHighQualityLoaded(true);
      };
    }
  }, [lowQualitySrc, props.src, isHighQualityLoaded]);

  if (sources && sources.length > 0) {
    return (
      <picture>
        {sources.map((source, index) => (
          <source
            key={index}
            srcSet={source.srcSet}
            type={source.type}
            media={source.media}
          />
        ))}
        <OptimizedImage {...props} src={currentSrc} />
      </picture>
    );
  }

  return <OptimizedImage {...props} src={currentSrc} />;
}

// Background Image with lazy loading
export interface BackgroundImageProps {
  src: string;
  className?: string;
  children?: React.ReactNode;
  lazy?: boolean;
  threshold?: number;
  overlay?: boolean;
  overlayOpacity?: number;
}

export function BackgroundImage({
  src,
  className,
  children,
  lazy = true,
  threshold = 0.1,
  overlay = false,
  overlayOpacity = 0.5,
}: BackgroundImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const { ref, inView } = useInView({
    threshold,
    triggerOnce: true,
    skip: !lazy,
  });

  useEffect(() => {
    if (inView || !lazy) {
      const img = new window.Image();
      img.src = src;
      img.onload = () => setIsLoaded(true);
    }
  }, [inView, src, lazy]);

  return (
    <div
      ref={ref}
      className={cn('relative overflow-hidden', className)}
      style={{
        backgroundImage: isLoaded ? `url(${src})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
      )}
      {overlay && (
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: overlayOpacity }}
        />
      )}
      {children && <div className="relative z-10">{children}</div>}
    </div>
  );
}

// Helper functions
function generateBlurDataURL(): string {
  // Generate a simple blur placeholder
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGZpbHRlciBpZD0iYSI+PGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj0iMTIiIC8+PC9maWx0ZXI+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlMGUwZTAiIGZpbHRlcj0idXJsKCNhKSIgLz48L3N2Zz4=';
}

function generateSizes(width?: number): string {
  if (!width) {
    return '100vw';
  }

  // Generate responsive sizes based on common breakpoints
  return `(max-width: 640px) 100vw, (max-width: 768px) 75vw, (max-width: 1024px) 50vw, ${width}px`;
}

// Image Gallery with virtualization for large sets
export interface ImageGalleryProps {
  images: Array<{
    src: string;
    alt: string;
    width?: number;
    height?: number;
  }>;
  columns?: number;
  gap?: number;
  className?: string;
}

export function ImageGallery({
  images,
  columns = 3,
  gap = 4,
  className,
}: ImageGalleryProps) {
  return (
    <div
      className={cn('grid', className)}
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: `${gap * 0.25}rem`,
      }}
    >
      {images.map((image, index) => (
        <OptimizedImage
          key={index}
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          className="w-full h-auto"
          lazy={true}
          priority={index < columns} // Priority for first row
        />
      ))}
    </div>
  );
}

export default OptimizedImage;