import type { ComponentChildren } from "preact";

// The game owns the whole page; see App.tsx.
export function Layout({ children }: { children: ComponentChildren }) {
  return <>{children}</>;
}
