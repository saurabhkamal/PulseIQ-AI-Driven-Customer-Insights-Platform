---
description: Prompt logging rule — save every user prompt for PulseIQ project
---

Prompt logging behavior:
- At the start of every conversation turn where the user sends a prompt, append a record of that prompt to the file `docs/prompt-log.md` in the project root.
- Use the Write or Edit tool to append the entry — never skip this step.

Log entry format:
```
## [YYYY-MM-DD HH:MM] Session prompt
**Prompt:** <the user's full prompt text>
---
```

Rules:
- Always log the prompt before doing any other work.
- If `docs/prompt-log.md` does not exist, create it with a header line: `# PulseIQ — Prompt Log`.
- Append entries; never overwrite previous entries.
- Include the full prompt text verbatim — do not summarize or truncate.
- If the prompt references a file or selection, note that in the log entry.

Purpose:
- Maintain a full audit trail of all instructions given to Claude for this project.
- Enables the team to review what was asked, when, and in what order across sessions.
