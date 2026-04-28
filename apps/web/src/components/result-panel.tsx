import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import type { Task, Tool } from "@/lib/types"
import { Copy, Download, ImageUp, Loader2, RefreshCw } from "lucide-react"

type ResultPanelProps = {
  activeTool: Tool | null
  selectedTask: Task | null
  previewUrl?: string
  onDownload: () => void
  onCopyNotes: () => Promise<void>
  onReuseSelected: () => Promise<void>
}

const statusLabel: Record<string, string> = {
  queued: "排队中",
  processing: "处理中",
  succeeded: "已完成",
  failed: "失败",
  expired: "已过期",
  idle: "待处理",
}

export function ResultPanel({ activeTool, selectedTask, previewUrl, onDownload, onCopyNotes, onReuseSelected }: ResultPanelProps) {
  const status = selectedTask?.status ?? "idle"

  return (
    <main className="flex min-w-0 flex-1 flex-col p-4">
      <Card className="flex min-h-[26rem] flex-1 flex-col xl:min-h-0">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>当前结果</CardTitle>
              <CardDescription>{activeTool?.name ?? "自定义"}</CardDescription>
            </div>
            <Badge variant={selectedTask?.status === "succeeded" ? "secondary" : "outline"}>{statusLabel[status]}</Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col">
          <div className="flex aspect-square min-h-64 flex-1 items-center justify-center rounded-md bg-muted/50 xl:min-h-0 xl:aspect-auto">
            {selectedTask && previewUrl ? (
              <img alt={selectedTask.toolId} className="h-full w-full rounded-md object-cover" src={previewUrl} />
            ) : (
              <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                {selectedTask?.status === "processing" || selectedTask?.status === "queued" ? (
                  <>
                    <Loader2 className="animate-spin" />
                    处理中
                  </>
                ) : (
                  <>
                    <ImageUp />
                    结果将在这里显示
                  </>
                )}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button className="w-full sm:w-auto" variant="outline" onClick={onDownload} disabled={!selectedTask || !previewUrl}>
              <Download />
              下载
            </Button>
            <Button className="w-full sm:w-auto" variant="outline" onClick={() => void onCopyNotes()} disabled={!selectedTask?.inputs.notes}>
              <Copy />
              复制说明
            </Button>
          </div>
          <Button className="w-full sm:w-auto" variant="secondary" onClick={() => void onReuseSelected()} disabled={!selectedTask}>
            <RefreshCw />
            重新处理
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}
