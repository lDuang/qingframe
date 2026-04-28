export function AppFooter() {
  return (
    <footer className="flex min-h-12 flex-col items-start justify-center gap-2 border-t px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:py-0">
      <a
        href="https://github.com/wangxu-dev"
        target="_blank"
        rel="noreferrer"
        className="transition-colors hover:text-foreground"
      >
        wangxu-dev
      </a>

      <a
        href="https://github.com/lDuang/qingframe.git"
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-2 transition-colors hover:text-foreground"
        aria-label="QingFrame GitHub repository"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-4"
          fill="currentColor"
        >
          <path d="M12 .5C5.649.5.5 5.649.5 12a11.5 11.5 0 0 0 7.86 10.911c.575.106.786-.25.786-.556 0-.274-.01-1-.015-1.962-3.197.694-3.872-1.54-3.872-1.54-.523-1.328-1.278-1.682-1.278-1.682-1.045-.714.079-.699.079-.699 1.156.081 1.764 1.187 1.764 1.187 1.028 1.762 2.697 1.253 3.354.958.104-.745.402-1.253.731-1.541-2.552-.29-5.236-1.276-5.236-5.682 0-1.255.448-2.282 1.183-3.086-.119-.29-.513-1.457.112-3.038 0 0 .965-.309 3.162 1.179A10.985 10.985 0 0 1 12 6.07c.976.004 1.96.132 2.879.388 2.195-1.488 3.159-1.179 3.159-1.179.627 1.581.233 2.748.114 3.038.737.804 1.182 1.831 1.182 3.086 0 4.417-2.688 5.389-5.248 5.673.413.356.781 1.059.781 2.135 0 1.542-.014 2.785-.014 3.164 0 .309.207.668.79.555A11.502 11.502 0 0 0 23.5 12C23.5 5.649 18.351.5 12 .5Z" />
        </svg>
        <span>qingframe</span>
      </a>
    </footer>
  )
}
