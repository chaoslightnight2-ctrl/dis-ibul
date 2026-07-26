export const ExpertReasoning = async ({ client }) => {
  const errorLog = []

  return {
    "tool.execute.before": async (input, output) => {
      if (input.tool === 'bash') {
        errorLog.push({ type: 'command', command: output.args.command, time: Date.now() })
      }
    },

    "tool.execute.after": async (input, output) => {
      if (input.tool === 'bash' && output.error) {
        const last = errorLog.filter(e => e.type === 'command').slice(-1)[0]
        if (last) {
          last.error = output.error
          last.failed = true
        }
      }
    },

    "experimental.session.compacting": async (input, output) => {
      const recentFails = errorLog.filter(e => e.failed).slice(-5)

      if (recentFails.length >= 2) {
        const patterns = recentFails.map(e => e.command?.split(' ')[0] || '').filter(Boolean)
        const uniqueCmds = [...new Set(patterns)]
        if (uniqueCmds.length <= 2) {
          output.context.push(`## RECURRING FAILURE DETECTED\nThe last ${recentFails.length} command(s) failed. The same type of command was repeated: ${uniqueCmds.join(', ')}. If you are stuck in a loop, STOP and try a fundamentally different approach. Consider:\n- What assumptions are you making that could be wrong?\n- Is there a completely different way to solve this?\n- Can you simplify the problem first?\n- Search the web for alternative solutions before trying again.`)
        }
      }
    },
  }
}
