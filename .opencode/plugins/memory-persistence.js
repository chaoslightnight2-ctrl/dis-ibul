export const MemoryPersistence = async ({ project, client, $, directory, worktree }) => {
  const fs = await import('fs')
  const path = await import('path')

  const memoryDir = path.join(directory, '.opencode', 'memory')

  return {
    "experimental.session.compacting": async (input, output) => {
      const files = ['decisions.md', 'patterns.md', 'preferences.md', 'context.md', 'learnings.md']
      const summaries = []

      for (const file of files) {
        const filePath = path.join(memoryDir, file)
        try {
          const content = fs.readFileSync(filePath, 'utf-8')
          const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#')).slice(0, 15)
          if (lines.length > 0) {
            summaries.push(`## ${file.replace('.md', '')}\n${lines.join('\n').slice(0, 500)}`)
          }
        } catch {}
      }

      if (summaries.length > 0) {
        output.context.push(`## Persistent Memory Summary\n${summaries.join('\n\n')}`)
      }
    },
  }
}
