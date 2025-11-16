import { Client, RunTree } from "langsmith";

const client = new Client({
  apiKey: process.env.LANGSMITH_API_KEY,
  apiUrl: process.env.LANGSMITH_ENDPOINT
});

export async function startTrace(meta = {}) {
  const run = new RunTree({
    name: meta.name || "chatbot_run",
    run_type: meta.run_type || "chain",
    inputs: meta.inputs || {},
    metadata: meta.metadata || {},
  });

  await run.postRun();
  console.log("Starting LangSmith trace:", run.id);
  return run;
}

export async function endTrace(run, result) {
  await run.end({
    outputs: { result },
  });
  
  await run.patchRun();
  console.log("Ending LangSmith trace:", run.id);
}
