export const EnvProtection = async ({ project, client, $, directory, worktree }) => {
  return {
    "tool.execute.before": async (input, output) => {
      const sensitivePatterns = ['.env', '.env.local', '.env.production', '.env.development', 'credentials', 'secret', 'token', 'api-key', 'apikey']
      if (input.tool === 'read' || input.tool === 'edit' || input.tool === 'write') {
        const filePath = output.args.filePath || output.args.path || ''
        const lowerPath = filePath.toLowerCase()
        if (sensitivePatterns.some(p => lowerPath.includes(p))) {
          if (lowerPath.includes('.env.example') || lowerPath.includes('.env.sample')) {
            return
          }
          throw new Error(`Access denied: '${filePath}' contains sensitive data (env/secret/credential). Use .env.example as a template instead.`)
        }
      }
    },
  }
}
