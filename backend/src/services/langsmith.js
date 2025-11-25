import { Client, RunTree } from "langsmith"

const client = new Client({
  apiKey: process.env.LANGSMITH_API_KEY,
  apiUrl: process.env.LANGSMITH_ENDPOINT
})

export async function startTrace(meta = {}) {
  const run = new RunTree({
    name: meta.name || "chatbot_run",
    run_type: meta.run_type || "chain",
    inputs: meta.inputs || {},
    metadata: meta.metadata || {},
  })

  await run.postRun()
  return run
}

export async function endTrace(run, result, extraMeta = {}) {
  run.metadata = { ...run.metadata, ...extraMeta }

  await run.end({
    outputs: { result }
  })

  await run.patchRun()
}
