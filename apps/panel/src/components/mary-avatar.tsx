import Image from 'next/image';
export function MaryAvatar({
  size = 40,
  variant = 'portrait',
  className = '',
  decorative = false,
}: {
  size?: number;
  variant?: 'portrait' | 'community';
  className?: string;
  decorative?: boolean;
}) {
  return (
    <Image
      src={
        variant === 'community'
          ? '/images/mary-community.png'
          : '/images/mary-avatar.png'
      }
      alt={decorative ? '' : 'Avatar da Mary Hunter'}
      width={size}
      height={size}
      sizes={`${size}px`}
      className={`mary-avatar ${className}`}
    />
  );
}
