---
description: Mandatory verification step before completing any coding task
---

# Pre-Commit Verification Workflow

You MUST run this workflow before marking _any_ coding task as "Complete" or asking the user for review.

// turbo

1.  Run Type Check

    ```bash
    npm run type-check || tsc --noEmit
    ```

2.  Run Linting

    ```bash
    npm run lint
    ```

3.  **Self-Correction**:
    -   If ANY error exists (even warnings that fail the build), you CANNOT proceed.
    -   Fix it immediately.
    -   Do not blindly retry the same action.
