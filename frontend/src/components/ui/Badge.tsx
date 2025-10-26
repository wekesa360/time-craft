import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80',
        secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80',
        success: 'border-transparent bg-success text-success-foreground shadow hover:bg-success/80',
        warning: 'border-transparent bg-warning text-warning-foreground shadow hover:bg-warning/80',
        info: 'border-transparent bg-info text-info-foreground shadow hover:bg-info/80',
        outline: 'text-foreground border-border',
        // Fitness app specific variants
        orange: 'bg-orange-50 text-orange-700 border border-orange-100',
        purple: 'bg-purple-50 text-purple-700 border border-purple-100',
        blue: 'bg-blue-50 text-blue-700 border border-blue-100',
        green: 'bg-green-50 text-green-700 border border-green-100',
        pink: 'bg-pink-50 text-pink-700 border border-pink-100',
        yellow: 'bg-yellow-50 text-yellow-700 border border-yellow-100',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }