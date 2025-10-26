/**
 * Lazy Image Component
 * Optimized image loading with lazy loading, WebP support, and responsive sizing
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';

export interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  placeholder?: string;
  blurDataURL?: string;
  sizes?: string;
  priority?: boolean;
  quality?: number;
  onLoad?: () => void;
  onError?: () => void;
  fallbackSrc?: string;
  enableWebP?: boolean;
  loading?: 'lazy' | 'eager';
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  placeholder,
  blurDataURL,
  sizes,
  priority = false,
  quality = 75,
  onLoad,
  onError,
  fallbackSrc,
  enableWebP = true,
  loading = 'lazy'
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);
  
  // Use intersection observer for lazy loading (unless priority)
  const { isIntersecting } = useIntersectionObserver(imgRef, {
    threshold: 0.1,
    triggerOnce: true,
    skip: priority
  });

  // Should load image if it's priority or intersecting
  const shouldLoad = priority || isIntersecting;

  // Generate optimized image sources
  const generateSources = useCallback((originalSrc: string) => {
    const sources: { src: string; type?: string }[] = [];
    
    // WebP version if enabled
    if (enableWebP && !originalSrc.endsWith('.svg')) {
      const webpSrc = originalSrc.replace(/\.(jpg|jpeg|png)$/i, '.webp');
      sources.push({ src: webpSrc, type: 'image/webp' });
    }
    
    // Original format
    sources.push({ src: originalSrc });
    
    return sources;
  }, [enableWebP]);

  // Handle image load success
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setIsError(false);
    onLoad?.();
  }, [onLoad]);

  // Handle image load error
  const handleError = useCallback(() => {
    setIsError(true);
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setIsError(false);
    } else {
      onError?.();
    }
  }, [fallbackSrc, currentSrc, onError]);

  // Set image source when it should load
  useEffect(() => {
    if (shouldLoad && !currentSrc && src) {
      setCurrentSrc(src);
    }
  }, [shouldLoad, currentSrc, src]);

  // Base styles for the image
  const imageStyles: React.CSSProperties = {
    width: width || 'auto',
    height: height || 'auto',
    transition: 'opacity 0.3s ease-in-out',
    opacity: isLoaded ? 1 : 0,
  };

  // Placeholder styles
  const placeholderStyles: React.CSSProperties = {
    width: width || '100%',
    height: height || '200px',
    backgroundColor: '#f3f4f6',
    backgroundImage: blurDataURL ? `url(${blurDataURL})` : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: isLoaded ? 0 : 1,
    transition: 'opacity 0.3s ease-in-out',
  };

  if (!shouldLoad) {
    return (
      <div
        ref={imgRef}
        className={`lazy-image-placeholder ${className}`}
        style={placeholderStyles}
        aria-label={`Loading ${alt}`}
      >
        {placeholder ? (
          <img src={placeholder} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs">Loading...</span>
          </div>
        )}
      </div>
    );
  }

  if (isError && !fallbackSrc) {
    return (
      <div
        className={`lazy-image-error ${className}`}
        style={placeholderStyles}
        role="img"
        aria-label={`Failed to load ${alt}`}
      >
        <div className="flex flex-col items-center justify-center text-muted-foreground">
          <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span className="text-xs">Failed to load</span>
        </div>
      </div>
    );
  }

  // Use picture element for WebP support
  if (enableWebP && !src.endsWith('.svg')) {
    const sources = generateSources(currentSrc);
    
    return (
      <div className={`relative ${className}`} ref={imgRef}>
        {!isLoaded && (
          <div
            className="absolute inset-0"
            style={placeholderStyles}
          >
            {placeholder ? (
              <img src={placeholder} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="flex items-center justify-center text-muted-foreground">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
        )}
        
        <picture>
          {sources.slice(0, -1).map((source, index) => (
            <source key={index} srcSet={source.src} type={source.type} />
          ))}
          <img
            src={sources[sources.length - 1].src}
            alt={alt}
            style={imageStyles}
            loading={loading}
            sizes={sizes}
            onLoad={handleLoad}
            onError={handleError}
            className="w-full h-full object-cover"
          />
        </picture>
      </div>
    );
  }

  // Fallback to regular img element
  return (
    <div className={`relative ${className}`} ref={imgRef}>
      {!isLoaded && (
        <div
          className="absolute inset-0"
          style={placeholderStyles}
        >
          {placeholder ? (
            <img src={placeholder} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="flex items-center justify-center text-muted-foreground">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>
      )}
      
      <img
        src={currentSrc}
        alt={alt}
        style={imageStyles}
        loading={loading}
        sizes={sizes}
        onLoad={handleLoad}
        onError={handleError}
        className="w-full h-full object-cover"
      />
    </div>
  );
};

// Avatar component with lazy loading
export interface LazyAvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallbackIcon?: React.ReactNode;
  priority?: boolean;
}

export const LazyAvatar: React.FC<LazyAvatarProps> = ({
  src,
  name,
  size = 'md',
  className = '',
  fallbackIcon,
  priority = false
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg'
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const fallbackContent = fallbackIcon || (
    <span className="font-medium text-white">
      {getInitials(name)}
    </span>
  );

  if (!src) {
    return (
      <div
        className={`${sizeClasses[size]} bg-primary-500 rounded-full flex items-center justify-center ${className}`}
        title={name}
      >
        {fallbackContent}
      </div>
    );
  }

  return (
    <LazyImage
      src={src}
      alt={`${name} avatar`}
      className={`${sizeClasses[size]} rounded-full overflow-hidden ${className}`}
      priority={priority}
      fallbackSrc=""
      onError={() => {
        // Will show fallback content on error
      }}
    />
  );
};

// Background image component with lazy loading
export interface LazyBackgroundImageProps {
  src: string;
  children?: React.ReactNode;
  className?: string;
  overlay?: boolean;
  overlayColor?: string;
  priority?: boolean;
}

export const LazyBackgroundImage: React.FC<LazyBackgroundImageProps> = ({
  src,
  children,
  className = '',
  overlay = false,
  overlayColor = 'rgba(0, 0, 0, 0.5)',
  priority = false
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const { isIntersecting } = useIntersectionObserver(containerRef, {
    threshold: 0.1,
    triggerOnce: true,
    skip: priority
  });

  const shouldLoad = priority || isIntersecting;

  useEffect(() => {
    if (shouldLoad && !currentSrc) {
      const img = new Image();
      img.onload = () => {
        setCurrentSrc(src);
        setIsLoaded(true);
      };
      img.src = src;
    }
  }, [shouldLoad, currentSrc, src]);

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{
        backgroundImage: isLoaded ? `url(${currentSrc})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: '#f3f4f6'
      }}
    >
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
          <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}
      
      {overlay && isLoaded && (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: overlayColor }}
        />
      )}
      
      {children && (
        <div className="relative z-10">
          {children}
        </div>
      )}
    </div>
  );
};