import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { formatTime } from "@/lib/format"
import type { Task, Tool } from "@/lib/types"
import { ImageUp } from "lucide-react"

type HistoryPanelProps = {
  tasks: Task[]
  tools: Tool[]
  previewUrls: Record<string, string>
  selectedTaskId: string
  onSelectTask: (taskId: string) => void
}

export function HistoryPanel({ tasks, tools, previewUrls, selectedTaskId, onSelectTask }: HistoryPanelProps) {
  return (
    <aside className="border-t xl:w-80 xl:shrink-0 xl:border-t-0 xl:border-l">
      <div className="flex items-center justify-between px-4 py-4">
        <div className="text-sm font-semibold">最近记录</div>
        <Badge variant="outline">{tasks.length}</Badge>
      </div>
      <Separator />
      <ScrollArea className="max-h-80 xl:h-[calc(100vh-6.5rem-1px)] xl:max-h-none">
        <div className="space-y-3 p-4">
          {tasks.length ? (
            tasks.map((task) => (
              <Card
                key={task.id}
                size="sm"
                className={selectedTaskId === task.id ? "cursor-pointer bg-muted/50" : "cursor-pointer"}
                onClick={() => onSelectTask(task.id)}
              >
                <CardContent className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-md bg-muted">
                    {previewUrls[task.id] ? (
                      <img alt={task.id} className="h-full w-full object-cover" src={previewUrls[task.id]} />
                    ) : (
                      <ImageUp className="size-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {tools.find((tool) => tool.id === task.toolId)?.name ?? task.toolId}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">{task.inputs.notes || "无说明"}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{formatTime(task.createdAt)}</div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="px-4 py-6 text-sm text-muted-foreground">暂无记录</div>
          )}
        </div>
      </ScrollArea>
    </aside>
  )
}
