# Technical Debt & Architecture To-Do

This file tracks architectural debt, pending refactors, and "nice-to-have" improvements that we've identified but haven't yet implemented.

## High Priority (Architectural Compliance)

-   [ ] **Implement IFileSystem Interface** (ADR-004)

    -   Create `src/lib/filesystem/interface.ts`.
    -   Refactor `EngineManager`, `StaticEngine`, and `NextjsEngine` to use this interface instead of `fs/promises`.
    -   Create `NodeFileSystem` implementation.

-   [ ] **Implement Command Pattern** (ADR-005)

    -   Create `Command` interface.
    -   Refactor `editor-script.ts` to dispatch commands.
    -   Create a Command Manager to handle Stack (Undo/Redo).

-   [ ] **Migrate Schemas to tRPC Routers**

    -   Convert `src/lib/schemas` to Zod schemas in `src/server/api/routers`.

-   [ ] **Refactor Editor Engine to use IFileSystem**

    -   Abstract Editor file operations behind `IFileSystem`.
    -   Create `NodeFileSystem` implementation.

-   [ ] **Migrate Project Persistence to Database** (Critical for Serverless/Vercel)

    -   **Context**: Currently, projects are stored as folders on disk (`src/lib/storage.ts`). This fails on Vercel (ephemeral filesystem) and is slow to query.
    -   **Goal**: Move project metadata and content-reference to Postgres.
    -   **Steps**:
        1.  Create `Project` and `Page` models in `prisma/schema.prisma`.
        2.  Update `src/lib/storage.ts` to query Prisma instead of `fs.readdir`.
        3.  Update `src/server/api/routers/project.ts` to write to DB.
        4.  (Optional) Store actual page content in DB or S3, instead of local JSON files.

-   [ ] **Refactor Editor State Management** (Performance & Stability)

    -   **Goal**: Move away from React Context for high-frequency editor state.
    -   **Steps**:
        1.  Install `zustand` and `xstate`.
        2.  Migrate `EditorContext` (currently in `page.tsx` or similar) to a Zustand store.
        3.  Implement XState machine for the "Drag & Drop" logic (Idle -> Dragging -> Dropped).
        4.  Connect XState to update Zustand.

-   [ ] **Refactor Legacy State to tRPC Mutations**
    -   **Context**: Some components (like `ticket-window.tsx`) still use manual `useState` for loading/error/success states.
    -   **Action**: Replace `useState` logic with tRPC's native `isPending`, `isSuccess`, `isError` flags.
    -   **Target Components**: `TicketWindow`, `PropertiesPanel`, `SaveStatus`.

## Medium Priority (Consistency & Cleanup)

-   [ ] **Delete Legacy API Routes** (T3 Migration)

    -   **Context**: T3 uses tRPC. Next.js API Routes (`src/app/api`) are legacy.
    -   **Action**: Audit `src/app/api`, port logic to `src/server/api/routers`, and DELETE the implementation folders.

-   [ ] **Component Standardization**

    -   [Placeholder: Check after exploring components]

-   [ ] **Documentation & Type Audit** (Agent-Friendly)

    -   **Goal**: Ensure all public boundaries have explicit types and JSDoc to facilitate AI reasoning.
    -   **Target Files**:
        -   `src/server/api/routers/project.ts` (API Contracts)
        -   `src/lib/engine-manager.ts` (Core Logic)
        -   `src/lib/storage.ts` (Data Access)
        -   `src/lib/utils.ts` (Shared Utils)
    -   **Action**: Add JSDoc with @param/@returns and explicit TS return types.

-   [ ] **Standardize Error Handling** (UX & Security)
    -   **Goal**: Implement the Three-Tier Error Strategy.
    -   **Steps**:
        1.  Install `react-hot-toast` (or similar).
        2.  Create a `TRPCLoggerMiddleware` to catch/log server errors before sending `TRPCError`.
        3.  Refactor `src/server/api/routers/*` to ensure no raw errors are thrown.
        4.  Update frontend mutations to use `toast.error(e.message)`.
