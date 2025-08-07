import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        paid: "bg-status-paid/10 text-status-paid border border-status-paid/20",
        pending: "bg-status-pending/10 text-status-pending border border-status-pending/20",
        overdue: "bg-status-overdue/10 text-status-overdue border border-status-overdue/20",
        draft: "bg-status-draft/10 text-status-draft border border-status-draft/20",
      },
    },
    defaultVariants: {
      variant: "draft",
    },
  }
)

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function StatusBadge({ className, variant, ...props }: StatusBadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { StatusBadge, badgeVariants }