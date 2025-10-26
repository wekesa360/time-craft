import * as React from 'react'
import { cn } from '../../lib/utils'

interface AvatarProps extends React.ComponentProps<'div'> {
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

function Avatar({ className, size = 'md', ...props }: AvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-14 h-14',
    xl: 'w-16 h-16'
  }

  return (
    <div
      className={cn(
        'relative flex shrink-0 overflow-hidden rounded-full border-2 border-primary',
        sizeClasses[size],
        className
      )}
      {...props}
    />
  )
}

interface AvatarImageProps extends React.ComponentProps<'img'> {}

function AvatarImage({ className, ...props }: AvatarImageProps) {
  return (
    <img
      className={cn('aspect-square h-full w-full object-cover', className)}
      {...props}
    />
  )
}

interface AvatarFallbackProps extends React.ComponentProps<'div'> {}

function AvatarFallback({ className, ...props }: AvatarFallbackProps) {
  return (
    <div
      className={cn(
        'flex h-full w-full items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold',
        className
      )}
      {...props}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback }