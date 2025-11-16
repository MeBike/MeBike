import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        success:
          "border-transparent bg-emerald-500 text-white [a&]:hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700",
        info: "border-transparent bg-cyan-500 text-white [a&]:hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700",
        warning:
          "border-transparent bg-amber-500 text-white [a&]:hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700",
        pending:
          "border-transparent bg-blue-500 text-white [a&]:hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700",
        destructive:
          "border-transparent bg-red-500 text-white [a&]:hover:bg-red-600 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-red-600 dark:hover:bg-red-700",
        outline:
          "border border-foreground bg-transparent text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        processing:
          "border-transparent bg-blue-400 text-white [a&]:hover:bg-blue-400/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);


function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
