import { api, ApiError } from "@/lib/api"
import { getDeviceId } from "@/lib/device"
import type { QuotaState, Task, Tool, UploadedFile } from "@/lib/types"
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react"
import { AppFooter } from "@/components/app-footer"
import { AppHeader } from "@/components/app-header"
import { ComposerPanel } from "@/components/composer-panel"
import { HistoryPanel } from "@/components/history-panel"
import { ResultPanel } from "@/components/result-panel"

const MAX_FILES = 9

export default function App() {
  const [tools, setTools] = useState<Tool[]>([])
  const [activeToolId, setActiveToolId] = useState("")
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTaskId, setSelectedTaskId] = useState("")
  const [quota, setQuota] = useState<QuotaState | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({})
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([])
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const blobUrls = useRef<string[]>([])

  const activeTool = useMemo(() => tools.find((tool) => tool.id === activeToolId) ?? null, [tools, activeToolId])
  const selectedTask = useMemo(() => tasks.find((task) => task.id === selectedTaskId) ?? tasks[0] ?? null, [tasks, selectedTaskId])

  useEffect(() => {
    void Promise.all([
      api.getTools().then((data) => {
        setTools(data.tools)
        setQuota(data.quota)
        const defaultTool = data.tools.find((tool) => tool.id === "custom_prompt") ?? data.tools[0]
        setActiveToolId((current) => current || defaultTool?.id || "")
      }),
      api.getTasks().then((data) => {
        setTasks(data.tasks)
        setSelectedTaskId(data.tasks[0]?.id || "")
      }),
    ]).catch((reason: Error) => setError(reason.message))
  }, [])

  useEffect(() => {
    if (!activeTool) return
    setFieldValues({
      quality: activeTool.defaults.quality,
      size: activeTool.defaults.size,
      notes: "",
    })
    setSelectedFileIds([])
  }, [activeTool])

  useEffect(() => {
    if (!tasks.length) return
    if (!selectedTaskId || !tasks.some((task) => task.id === selectedTaskId)) {
      setSelectedTaskId(tasks[0].id)
    }
  }, [tasks, selectedTaskId])

  useEffect(() => {
    const pending = tasks.some((task) => task.status === "queued" || task.status === "processing")
    if (!pending) return

    const timer = window.setInterval(() => {
      void api.getTasks().then((data) => setTasks(data.tasks)).catch(() => undefined)
    }, 4000)

    return () => window.clearInterval(timer)
  }, [tasks])

  useEffect(() => {
    const succeeded = tasks.filter((task) => task.status === "succeeded" && task.resultUrl)
    for (const task of succeeded) {
      if (previewUrls[task.id]) continue
      void fetch(task.resultUrl!, {
        headers: { "x-device-id": getDeviceId() },
      })
        .then(async (response) => {
          if (!response.ok) return
          const objectUrl = URL.createObjectURL(await response.blob())
          blobUrls.current.push(objectUrl)
          setPreviewUrls((current) => ({ ...current, [task.id]: objectUrl }))
        })
        .catch(() => undefined)
    }
  }, [tasks, previewUrls])

  useEffect(
    () => () => {
      for (const url of blobUrls.current) {
        URL.revokeObjectURL(url)
      }
    },
    []
  )

  const handleTaskCreated = (task: Task, nextQuota: QuotaState) => {
    setQuota(nextQuota)
    setTasks((current) => [task, ...current])
    setSelectedTaskId(task.id)
  }

  const handleApiError = (reason: unknown, fallback: string) => {
    if (reason instanceof ApiError && reason.quota) {
      setQuota(reason.quota)
    }
    setError(reason instanceof Error ? reason.message : fallback)
  }

  const onUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    if (!files.length) return

    setUploading(true)
    setError(null)

    try {
      const next: UploadedFile[] = []
      for (const file of files.slice(0, MAX_FILES)) {
        const response = await api.uploadFile(file)
        next.push(response.file)
      }
      setUploadedFiles((current) => [...next, ...current])
      setSelectedFileIds(next.map((file) => file.id))
    } catch (reason) {
      handleApiError(reason, "上传失败")
    } finally {
      setUploading(false)
      event.target.value = ""
    }
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!activeTool) return

    setSubmitting(true)
    setError(null)

    try {
      const response = await api.createTask({
        toolId: activeTool.id,
        inputs: fieldValues,
        fileIds: selectedFileIds,
      })
      handleTaskCreated(response.task, response.quota)
    } catch (reason) {
      handleApiError(reason, "提交失败")
    } finally {
      setSubmitting(false)
    }
  }

  const onReuseSelected = async () => {
    if (!selectedTask) return

    setSubmitting(true)
    setError(null)

    try {
      const response = await api.createTask({
        toolId: selectedTask.toolId,
        inputs: selectedTask.inputs,
        fileIds: selectedTask.sourceFileIds,
      })
      handleTaskCreated(response.task, response.quota)
    } catch (reason) {
      handleApiError(reason, "重新提交失败")
    } finally {
      setSubmitting(false)
    }
  }

  const onCopyNotes = async () => {
    const content = selectedTask?.inputs.notes || ""
    if (!content) return
    await navigator.clipboard.writeText(content)
  }

  const onDownload = () => {
    if (!selectedTask || !previewUrls[selectedTask.id]) return
    const anchor = document.createElement("a")
    anchor.href = previewUrls[selectedTask.id]
    anchor.download = `${selectedTask.toolId}-${selectedTask.id}.png`
    anchor.click()
  }

  return (
    <div className="flex h-screen w-full flex-col bg-background text-foreground">
      <AppHeader quota={quota} />

      <div className="flex flex-1 overflow-hidden">
        <ComposerPanel
          activeTool={activeTool}
          activeToolId={activeToolId}
          tools={tools}
          fieldValues={fieldValues}
          selectedFileIds={selectedFileIds}
          uploadedFiles={uploadedFiles}
          quota={quota}
          error={error}
          submitting={submitting}
          uploading={uploading}
          onToolChange={(value) => {
            setActiveToolId(value)
            setError(null)
          }}
          onFieldChange={(key, value) => setFieldValues((current) => ({ ...current, [key]: value }))}
          onUpload={onUpload}
          onSubmit={onSubmit}
        />

        <ResultPanel
          activeTool={activeTool}
          selectedTask={selectedTask}
          previewUrl={selectedTask ? previewUrls[selectedTask.id] : undefined}
          onDownload={onDownload}
          onCopyNotes={onCopyNotes}
          onReuseSelected={onReuseSelected}
        />

        <HistoryPanel
          tasks={tasks}
          tools={tools}
          previewUrls={previewUrls}
          selectedTaskId={selectedTask?.id ?? ""}
          onSelectTask={setSelectedTaskId}
        />
      </div>

      <AppFooter />
    </div>
  )
}
