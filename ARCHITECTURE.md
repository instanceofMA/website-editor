# Project Architecture & Conventions

This document serves as the **source of truth** for architectural decisions, coding standards, and patterns for this project. All contributors (human and AI) should refer to this file before making significant changes.

## 1. Core Technology Stack

-   **Framework**: Next.js 16+ (App Router)
-   **Language**: TypeScript
-   **API**: tRPC (Type-safe API layer)
-   **Database**: SQLite (via Prisma ORM)
-   **Styling**: Tailwind CSS v4
    -   Use `clsx` and `tailwind-merge` (via `cn` utility) for dynamic classes.
    -   Avoid CSS Modules or styled-components unless absolutely necessary.
-   **Icons**: `lucide-react`
-   **Data Fetching**: TanStack Query (via tRPC)

## 2. Directory Structure

We follow a **Feature-Based Architecture**.

-   `src/features/`: Contains self-contained features (e.g., `ticket-widget`).
    -   Each feature should have its own components, hooks, schemas, and types.
-   `src/components/ui/`: Reusable, generic UI components (shadcn/ui style).
-   `src/app/`: Next.js pages/routes ONLY. Logic should be delegated to feature components.
-   `src/lib/`: Shared utilities and global configuration.

## 3. Strict Rules & Conventions

### 3.1 Forms & Validation

**All forms MUST follow this pattern:**

1.  **Library**: Use `react-hook-form` for form state management.
2.  **Validation**: Use `zod` for schema validation with `@hookform/resolvers/zod`.
3.  **Schema Isolation**:
    -   **DO NOT** define Zod schemas inside component files.
    -   **DO** define schemas in a separate file (e.g., `schemas.ts`, `[feature].schema.ts`).
    -   **DO** export the inferred TypeScript type from the schema file.

**Example:**
_src/features/auth/schemas.ts_

```typescript
import { z } from "zod";

export const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});

export type LoginDto = z.infer<typeof LoginSchema>;
```

_src/features/auth/login-form.tsx_

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema, type LoginDto } from "./schemas";

export function LoginForm() {
    const form = useForm<LoginDto>({
        resolver: zodResolver(LoginSchema),
    });
    // ...
}
```

### 3.2 Types & DTOs

-   **Single Source of Truth**: Types for entities and DTOs (Data Transfer Objects) should be primarily defined via Zod schemas where possible to ensure runtime/compile-time parity.
-   **Naming**:
    -   Schemas: `[Entity]Schema` (e.g., `UserSchema`)
    -   Types: `[Entity]` (e.g., `User`)
    -   DTOs: `Create[Entity]Dto`, `Update[Entity]Dto`, `Search[Entity]Dto`
-   **Location**:
    -   **Feature-Specific**: Store in `schemas.ts` or `types.ts` within the relevant feature folder (e.g. `src/features/auth/schemas.ts`).
    -   **Shared/Global**: Store in `src/lib/schemas/` (e.g. `src/lib/schemas/project.ts`).

### 3.3 State Management

#### A. Data Categories

-   **Server State** (Async): **TanStack Query** (via tRPC). Use for all data fetching.
-   **Local Component State** (Ephemeral): `useState` / `useReducer`. Use for form inputs, toggle states.
-   **Global UI State** (Shared): **Zustand**. Use for high-frequency updates (e.g. `sidebarOpen`, `selectedElementId`).
    -   _Why?_ Avoids the "Context Hell" re-render performance penalty.
-   **Complex Logic/Flows** (Critical): **XState**. Use for the Editor Engine core (e.g. Drag-n-Drop finite states).
    -   _Why?_ mathematically impossible to enter invalid states (e.g. "Select" while "Dragging").

#### B. The "Split State" Pattern (Editor)

-   **Logic**: Handled by **XState** (The Brain).
-   **Sync**: XState actions update the **Zustand** store (The Memory).
-   **View**: Components read from **Zustand** via selectors.

### 3.4 Data Access Guidelines

1.  **tRPC Routers** (`src/server/api/routers`)

    -   **Role**: The "Service Layer" & "Controller" combined.
    -   **Rule**: All frontend-backend communication happens here.
    -   **Logic**: Validate input (Zod), call Database/External APIs, return typed data.

2.  **Prisma** (`src/server/db.ts`)

    -   **Role**: Database ORM.
    -   **Rule**: Use `ctx.db` in tRPC procedures to access data.

3.  **External Services**
    -   **Role**: Logic for 3rd party APIs (e.g. Trello).
    -   **Rule**: Can be inline in Router if simple, or separated into `src/server/services` if complex.

### 3.5 Documentation & Standards (Agent-Friendly Code)

To ensure this codebase remains maintainable by both humans and AI agents, strict documentation rules apply to **Public Boundaries**:

1.  **Explicit Interfaces**:

    -   All **Public Functions** (exported from `src/lib`, `src/hooks`, etc.) MUST have explicit TypeScript return types. relying on inference for public APIs is forbidden.
    -   **API Routers**: Inputs must be defined via Zod.

2.  **JSDoc is Mandatory for Complexity**:
    -   Any non-trivial function or component must have JSDoc explaining **Intent** vs **Implementation**.
    -   **Format**:
        ```typescript
        /**
         * Calculates X based on Y.
         * @param someInput - Explanation of constraints (e.g. "must be positive")
         * @returns The calculated value in [unit]
         */
        export const calculateX = (someInput: number): number => { ... }
        ```

### 3.7 Strict State Modeling

**Rule**: Use Discriminated Unions for all complex UI states.
**Why**: Prevents "impossible states" (e.g. `isLoading: true` but `error` is present) and catches typo-based bugs at compile time.

**Bad:**

```typescript
const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
);
```

**Good:**

```typescript
type WidgetState =
    | { status: "IDLE" }
    | { status: "LOADING"; progress?: number }
    | { status: "SUCCESS"; data: TicketData }
    | { status: "ERROR"; error: Error };
```

### 3.8 Error Handling Strategy

We follow a **Three-Tier** strategy for consistency and security:

1.  **API Level (Backend)**:

    -   **Library**: `TRPCError`.
    -   **Rule**: ALL backend errors must be caught and re-thrown as `TRPCError`.
    -   **Security**: Never leak stack traces or raw database errors to the client.
    -   **Pattern**:
        ```typescript
        throw new TRPCError({
            code: "NOT_FOUND",
            message: "User friendly message",
        });
        ```

2.  **UI Level (Frontend)**:

    -   **Library**: `react-hot-toast` (Global Toaster).
    -   **Rule**: Use `onError` callbacks in tRPC mutations to trigger toast notifications.
    -   **Forms**: Zod validation errors should be displayed inline via `react-hook-form`.

3.  **Logging Level (Developer Observability)**:
    -   **Library**: `console.error` (Dev) / `Sentry` (Prod).
    -   **Rule**: Log full stack traces on the server _before_ throwing the sanitized `TRPCError`.

## 4. Key Decisions Log (ADRs)

### ADR-001: Zod-First Validation

**Decision**: We implement strict Zod schemas for all data structures (forms, API inputs, entities).
**Reasoning**: ensures type safety and runtime validation are always in sync. Reduces bugs caused by mismatched types.

### ADR-002: Feature-Based Folder Structure

**Decision**: Code is organized by "feature" (`src/features/`) rather than by technical type (e.g. `src/components`, `src/hooks`).
**Reasoning**: Keeps related code together, making it easier to delete or refactor entire features without hunting through the codebase.

### ADR-003: Tailwind CSS v4

**Decision**: Use Tailwind v4 alpha/beta features.
**Reasoning**: Performance improvements and simplified configuration.

### ADR-004: Virtual File System (VFS) Abstraction

**Decision**: All file operations for the **Editor Runtime** must go through an `IFileSystem` interface.
**Reasoning**: Decouples the Editor Engine (which runs in-browser) from the physical storage (Database/S3). Enables features like "Preview Mode" and "Undo/Redo" in memory without disk writes.

### ADR-005: Command Pattern for Editor Actions

**Decision**: All state-mutating actions in the editor (e.g., changing styles, moving elements) must be encapsulated as reversible "Commands".
**Reasoning**: Enables Undo/Redo functionality and facilitates future multiplayer collaboration (syncing commands instead of state).

---

### ADR-006: Data Fetching Strategy (TanStack Query)

**Decision**: Use TanStack Query for all server-state management.
**Reasoning**: Replaces manual `useEffect` and `useState` for fetching. Provides built-in caching, deduping, and global error handling.

**Decision**: UI components must implement the `asChild` Slot pattern (via Radix UI) for composition.
**Reasoning**: Decouples component look-and-feel from the rendered HTML tag (e.g. rendering a `Button` style as an `<a>` tag), avoiding hydration errors and improving accessibility.

### ADR-008: Vercel Platform Constraints

**Context**: We deploy to Vercel Serverless. This introduces specific constraints that affect architectural decisions:

1.  **Ephemeral Filesystem**: We cannot save user uploads or generated sites to disk. (Solved by: `ADR-004 VFS` + PostgreSQL/S3).
2.  **Request Body Limit (4.5MB)**: Serverless functions reject large payloads.
    -   **Impact**: We cannot send videos/large images via tRPC JSON.
    -   **Solution**: Use `src/app/api/upload` (Route Handler) for streaming uploads or Client-to-S3 direct uploads.
3.  **Execution Timeout (10s-60s)**: Long-running tasks (e.g. "Export Site") must be async/queued, not synchronous HTTP requests.
4.  **Connection Limits**: Serverless functions can exhaust DB connections. (Solved by: Prisma + Connection Pooling/PgBouncer).

### ADR-009: Unified Patching Strategy (Secure Save)

**Decision**: Instead of saving full file content, the Editor sends granular "Patches" (AST Operations) to the server.
**Mechanism**:

1.  **Auto-Tagging**: On boot, the Engine scans source files (AST for Next.js, DOM for Static) and injects stable `data-lid="uuid"` strings.
2.  **Patching**: The Editor targets these IDs. - **Next.js**: Uses `ts-morph` to update JSX attributes/text in `page.tsx`. - **Static**: Uses `cheerio` to update HTML tags in `index.html`.
    **Reasoning**: Preserves formatting, comments, and imports in complex frameworks like Next.js. Prevents data loss from race conditions.

### ADR-010: Hybrid Engine Architecture

**Decision**: We use two distinct runtime strategies based on project type.

1.  **Next.js Projects**: Spawn a child process (`next dev`) on a random port. The URL is `http://localhost:[port]`.
    -   _Why_: Requires Node.js runtime for SSR/API routes.
2.  **Static Projects**: Served via an Internal API Proxy (`/api/projects/[id/assets`).
    -   _Why_: Zero-overhead. No spawn required. Scalable to thousands of projects.
    -   _Rewrites_: Configured via `next.config.js` to expose cleaner URLs (`/site/[id]/...`).

### ADR-011: Optimistic Client-Side Debouncing

**Decision**: The Editor accumulates patches in a generic queue and compacts them before sending.
**Logic**: If multiple patches target the same `lid` and `property` (e.g. typing text "abc"), only the final state is sent after a 2s debounce.
**Reasoning**: Reduces server load by 90% during active editing sessions without sacrificing data integrity.
