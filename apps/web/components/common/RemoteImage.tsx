import Image from 'next/image';
import { shouldUseNativeImg } from '@/lib/imageHosts';

type RemoteImageProps = {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
};

/**
 * Remote URLs use `next/image` when the host is allowlisted; otherwise falls back to a lazy `img`
 * so arbitrary API/CDN URLs still work without blowing up the optimizer.
 */
export function RemoteImage({
  src,
  alt,
  className,
  width,
  height,
  fill,
  sizes,
  priority,
}: RemoteImageProps) {
  const imgClass =
    fill && className
      ? `absolute inset-0 h-full w-full ${className}`
      : fill
        ? 'absolute inset-0 h-full w-full object-cover'
        : className;

  if (shouldUseNativeImg(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        className={imgClass}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      {...(fill
        ? {
            fill: true,
            sizes: sizes ?? '(max-width: 768px) 100vw, 50vw',
          }
        : { width: width ?? 1, height: height ?? 1 })}
      priority={priority}
    />
  );
}
