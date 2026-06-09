<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary/15 text-primary border border-primary/25',
        secondary: 'bg-secondary text-secondary-foreground border border-border',
        destructive: 'bg-destructive/15 text-destructive border border-destructive/25',
        outline: 'border border-border text-muted-foreground',
        up: 'bg-[hsl(142,71%,45%)]/10 text-[hsl(142,71%,55%)] border border-[hsl(142,71%,45%)]/20',
        down: 'bg-[hsl(0,84%,57%)]/10 text-[hsl(0,84%,68%)] border border-[hsl(0,84%,57%)]/20',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

type BadgeVariants = VariantProps<typeof badgeVariants>

const props = withDefaults(defineProps<{ class?: HTMLAttributes['class']; variant?: BadgeVariants['variant'] }>(), {
  variant: 'default',
})
</script>

<template>
  <span :class="cn(badgeVariants({ variant }), props.class)">
    <slot />
  </span>
</template>
