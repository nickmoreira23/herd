import Link from "next/link"
import { Fragment } from "react"
import { cn } from "@/lib/utils"

export interface Crumb {
  label: string
  href?: string
}

interface PageHeaderProps {
  title: string
  description?: string
  /** Ancestor crumbs rendered muted before the title. Title is the bold final
   * segment. Mirrors the Handbook entry header pattern. */
  crumbs?: Crumb[]
  action?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, crumbs, action, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between mb-8 pl-4 pt-2", className)}>
      <div className="min-w-0 flex-1">
        <h1
          aria-label={title}
          className="m-0 text-2xl flex items-baseline gap-2 flex-wrap"
        >
          {crumbs && crumbs.length > 0 && (
            <span className="flex items-baseline gap-2 text-muted-foreground font-medium">
              {crumbs.map((c, idx) => (
                <Fragment key={idx}>
                  {idx > 0 && (
                    <span className="text-muted-foreground/40 select-none">/</span>
                  )}
                  {c.href ? (
                    <Link
                      href={c.href}
                      className="hover:text-foreground transition-colors"
                    >
                      {c.label}
                    </Link>
                  ) : (
                    <span>{c.label}</span>
                  )}
                </Fragment>
              ))}
              <span className="text-muted-foreground/40 select-none">/</span>
            </span>
          )}
          <span className="font-bold tracking-tight">{title}</span>
        </h1>
        {description && (
          <p className="text-muted-foreground mt-1 text-sm">{description}</p>
        )}
      </div>
      {action && <div className="ml-4 flex-shrink-0 pt-[2px] pr-8 flex items-center gap-4">{action}</div>}
    </div>
  )
}
