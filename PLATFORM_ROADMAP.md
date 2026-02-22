# Website Editor Platform: Architecture Roadmap & Future Features

This document outlines the architectural roadmap for the Website Editor platform. It addresses the transition to a purely browser-based development environment (WebContainers) while ensuring the architecture is scalable enough to handle future enterprise and AI features.

## Core Architectural Shift: Client-Side Compute (WebContainers)

To remain scalable and compatible with Vercel's serverless environment while supporting Node.js stacks (Next.js, Vite, Remix, etc.), the platform will pivot to **WebContainers**.

Instead of backend servers running `npm run dev`, the user's browser will run a full Node.js environment via WebAssembly.

### 1. Storage & State Management

- **Database (Prisma) MVP:** Project source code is currently stored as a single JSON `FileSystemTree` column in the `Project` table. This maps 1:1 with WebContainers for rapid prototyping.
- **Database (Prisma) Scaled Architecture (Step 2):** Before scaling, the database must be migrated to a Relational File Storage model (e.g., a `Files` table mapping `projectId` -> `filePath` -> `content`). This prevents JSON column bloat and write contention.
- **Object Storage Architecture (Step 3):** To support massive projects, raw file content should move out of the database entirely. A `Files` database table acts as a pointer, while the actual `content` is stored in an object store like **AWS S3** or **Vercel Blob**. Content-Addressable Storage (hashing file contents) can be used to deduplicate identical files across thousands of projects.
- **Git-Backed Architecture (The Holy Grail):** The ultimate evolution replaces custom database storage entirely. The backend simply clones repository branches from GitHub/GitLab. Every visual edit in the editor translates to a `git commit` and `git push` on behalf of the user.
- **Frontend Boot:** The React Editor fetches the files (from whichever storage backend is currently implemented), mounts them into a local WebContainer, and runs `npm run dev` entirely within the browser.
- **Surgical Editing (AST):** The frontend Editor intercepts property panel changes (e.g., color picked), uses an in-browser AST parser (`ts-morph` or similar) to read the specific `page.tsx` file from the WebContainer, makes a surgical change to the code string, and writes it back.

### 2. Previewing & Custom Domains

- **Development Preview:** WebContainers automatically issue a `<port>.webcontainer.io` URL. This serves as the live editor iframe source.
- **Custom Domain Workaround (For Editor Preview):** Because the `webcontainer.io` URL is dynamically generated entirely on the client, you cannot easily map your own `preview.instanceofma.com` to it _during editing_. The `webcontainer.io` URL acts simply as an internal, secure sandbox.
- **Production Hosting (Future Feature #2):** When the user clicks "Publish", your platform will take the JSON File System Tree from the database, send it to a CI/CD pipeline (e.g., GitHub Actions, Vercel API, or AWS Amplify), build the static HTML/Next.js bundle, and host it on your own infrastructure under a custom domain (e.g., `user.yourplatform.com`).

---

## Future Feature Architecture Considerations

### 1. GitHub Integration (Bi-directional Sync)

- **Architecture Impact:** High.
- **How it works:** Instead of storing the "Source of Truth" strictly in your database, your database becomes a caching layer.
- **WebContainers Advantage:** WebContainers support Git out of the box. When a user imports a project, you can literally run `git clone` inside the WebContainer. When they make visual edits (which are translated to surgical AST code changes), they can click "Commit", and your WebContainer runs `git commit` and `git push` back to their GitHub repo.

### 2. Managed Web Hosting

- **Architecture Impact:** High.
- **How it works:** As mentioned above, you will decouple the "Editor Compute" (WebContainers) from the "Production Compute". When a user publishes, you will trigger a Vercel Build Output API workflow or generate static assets to host on AWS S3/CloudFront. The visual editor is just a mechanism for manipulating code safely.

### 3. AI-Powered Editing

- **Architecture Impact:** Medium.
- **How it works:** When a user asks "Change this button to yellow":
    1. The frontend sends the AI the prompt + the isolated AST node of that button.
    2. The AI returns a JSON patch (e.g., `{ action: "updateClass", lid: "xyz", value: "bg-yellow-500" }`).
    3. The frontend AST engine applies the patch surgically to the WebContainer file.
- **Generative Pages:** For "Build a pricing page", the AI streams raw JSX code. The frontend AST engine writes this stream into a new `src/app/pricing/page.tsx` file inside the WebContainer. The editor's file explorer instantly updates.

### 4. Rich-Text Editor (CMS / Articles)

- **Architecture Impact:** Low.
- **How it works:** If you are building Next.js apps, articles should likely be stored as Markdown (`.md` or `.mdx`) files.
    - The user opens the "Blog Writer" panel.
    - They write rich text using a standard WYSIWYG editor (like TipTap).
    - On save, the editor translates the rich text to Markdown, creates a new file (e.g., `src/content/blog/my-article.md`), and writes it to the WebContainer filesystem.

### 5. Undo/Redo & Version Control

- **Architecture Impact:** Medium.
- **How it works:** The JSON patches sent from the visual UI to the AST engine form a perfect ledger.
    - You maintain an array of `AppliedPatches[]` in React State.
    - "Undo" simply takes the inverse of the last patch and applies it to the AST.
    - Because WebContainers execute locally, storing 100 historical code states in browser memory is extremely fast and cheap.

### 6. Headless Editor (NPM Package)

- **Architecture Impact:** High (Requires strict separation of concerns).
- **How it works:** To allow companies like `stunning.so` to use your editor inside their own Next.js/React apps, you must build the editor as a set of unstyled (or cleanly styled) React Contexts and Components.
    - **The Engine Package:** You publish `@website-editor/core` which contains the WebContainer boot logic, the AST JSON patcher, and the WebSocket relays. It has no UI.
    - **The UI Package:** You publish `@website-editor/react` which provides components like `<PropertiesPanel />`, `<Explorer />`, and `<EditorCanvas />`. The consumer wraps their app in `<EditorProvider>` and can heavily style your components using Tailwind or CSS variables.
    - This forces a highly modular architecture from day one. Your internal `website-editor` Vercel app will simply consume its own NPM packages just like your customers do.

---

## Next Immediate Steps

Before attacking the complex future features, the foundation must be solidified:

1.  **Migrate Project Storage:** Stop writing to `/tmp` and `.projects`. Convert templates to JSON File Trees and store them in Prisma.
2.  **Implement WebContainers:** Integrate `@webcontainer/api` into `EditorPage.tsx`. Boot the environment and render the `webcontainer.io` URL in the iframe.
3.  **Migrate AST Patching:** Move `NextjsEngine.ts` AST patching logic to a client-side utility that writes to the WebContainer filesystem.
