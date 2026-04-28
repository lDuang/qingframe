import { Badge } from "@/components/ui/badge"
import type { QuotaState } from "@/lib/types"

export function AppHeader({ quota }: { quota: QuotaState | null }) {
  return (
    <header className="flex min-h-14 flex-wrap items-center justify-between gap-3 border-b px-4 py-3 xl:h-14 xl:flex-nowrap xl:py-0">
      <div className="flex items-center gap-3">
        <div className="font-semibold">QingFrame</div>
        <div className="text-sm text-muted-foreground">生图</div>
      </div>

      <Badge variant="secondary">
        {quota ? `免费 ${quota.remainingToday} / ${quota.dailyLimit}` : "免费 -- / --"}
      </Badge>
    </header>
  )
}
