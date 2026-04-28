import type { ChangeEvent, FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { qualityLabelMap, reverseSizeMap, SIZE_OPTIONS, sizeMap } from "@/lib/format"
import type { QuotaState, Tool, UploadedFile } from "@/lib/types"
import { Loader2, Sparkles } from "lucide-react"

type ComposerPanelProps = {
  activeTool: Tool | null
  activeToolId: string
  tools: Tool[]
  fieldValues: Record<string, string>
  selectedFileIds: string[]
  uploadedFiles: UploadedFile[]
  quota: QuotaState | null
  error: string | null
  submitting: boolean
  uploading: boolean
  onToolChange: (value: string) => void
  onFieldChange: (key: string, value: string) => void
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void
  onSubmit: (event: FormEvent) => void
}

export function ComposerPanel(props: ComposerPanelProps) {
  const {
    activeTool,
    activeToolId,
    tools,
    fieldValues,
    selectedFileIds,
    uploadedFiles,
    quota,
    error,
    submitting,
    uploading,
    onToolChange,
    onFieldChange,
    onUpload,
    onSubmit,
  } = props

  const qualityField = activeTool?.fields.find((field) => field.key === "quality")
  const notesPlaceholder = activeTool?.fields.find((field) => field.key === "notes")?.placeholder || "输入说明"
  const currentRatio = reverseSizeMap[fieldValues.size || activeTool?.defaults.size || "1024x1024"] || "1:1"

  return (
    <aside className="border-b bg-background xl:w-80 xl:shrink-0 xl:border-r xl:border-b-0">
      <ScrollArea className="max-h-[40rem] xl:h-full xl:max-h-none">
        <form className="space-y-6 p-4" onSubmit={onSubmit}>
          <section className="space-y-3">
            <div className="space-y-1">
              <h2 className="text-sm font-medium">能力</h2>
              <p className="text-sm text-muted-foreground">默认自定义，模板只是辅助</p>
            </div>
            <Select value={activeToolId} onValueChange={onToolChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="选择能力" />
              </SelectTrigger>
              <SelectContent>
                {tools.map((tool) => (
                  <SelectItem key={tool.id} value={tool.id}>
                    {tool.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </section>

          <Separator />

          <section className="space-y-3">
            <h2 className="text-sm font-medium">说明</h2>
            <Textarea
              placeholder={notesPlaceholder}
              className="min-h-32 resize-none"
              value={fieldValues.notes ?? ""}
              onChange={(event) => onFieldChange("notes", event.target.value)}
            />
          </section>

          <Separator />

          <section className="space-y-4">
            <h2 className="text-sm font-medium">参数</h2>

            <Select value={fieldValues.quality ?? ""} onValueChange={(value) => onFieldChange("quality", value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="生成质量" />
              </SelectTrigger>
              <SelectContent>
                {(qualityField?.options ?? ["auto", "high", "medium"]).map((option) => (
                  <SelectItem key={option} value={option}>
                    {qualityLabelMap[option] ?? option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Tabs value={currentRatio} onValueChange={(value) => onFieldChange("size", sizeMap[value as (typeof SIZE_OPTIONS)[number]])}>
              <TabsList className="grid h-auto w-full grid-cols-5">
                {SIZE_OPTIONS.map((ratio) => (
                  <TabsTrigger key={ratio} value={ratio} className="px-2 text-xs sm:text-sm">
                    {ratio}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {activeTool?.acceptsImages ? (
              <div className="space-y-2">
                <Input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  onChange={onUpload}
                />
                <p className="text-xs text-muted-foreground">最多上传 9 张</p>
                {selectedFileIds.length ? (
                  <div className="space-y-2">
                    {selectedFileIds.map((fileId) => {
                      const file = uploadedFiles.find((item) => item.id === fileId)
                      if (!file) return null

                      return (
                        <div key={file.id} className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                          <span className="truncate">{file.originalName}</span>
                          <span>{Math.round(file.sizeBytes / 1024)} KB</span>
                        </div>
                      )
                    })}
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>

          <Separator />

          <section className="space-y-3">
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {quota?.retryAfterSeconds ? (
              <p className="text-xs text-muted-foreground">冷却中，还需 {quota.retryAfterSeconds} 秒</p>
            ) : null}
            <Button type="submit" disabled={submitting || uploading} className="w-full">
              {submitting || uploading ? <Loader2 className="animate-spin" /> : <Sparkles />}
              {submitting ? "创建中" : uploading ? "上传中" : "开始处理"}
            </Button>
          </section>
        </form>
      </ScrollArea>
    </aside>
  )
}
