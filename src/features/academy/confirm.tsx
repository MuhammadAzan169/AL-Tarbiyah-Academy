import { useEffect, useState, type ReactNode } from "react";

type Pending = { title: string; body: string; action: string; run: () => void };

// Returns a dialog to render and an ask() that holds the action until it is confirmed.
// Leaving a workspace or signing out is easy to click by accident, so these ask first.
export function useConfirm() {
  const [pending, setPending] = useState<Pending | null>(null);

  useEffect(() => {
    if (!pending) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setPending(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pending]);

  const dialog: ReactNode = pending ? (
    <div className="confirm-backdrop" onClick={() => setPending(null)}>
      <div className="confirm-card" role="alertdialog" aria-modal="true" aria-label={pending.title} onClick={event => event.stopPropagation()}>
        <h2>{pending.title}</h2>
        <p>{pending.body}</p>
        <div className="confirm-actions">
          <button type="button" className="academy-button outline" onClick={() => setPending(null)}>Stay here</button>
          <button type="button" className="academy-button" autoFocus onClick={() => { const run = pending.run; setPending(null); run(); }}>{pending.action}</button>
        </div>
      </div>
    </div>
  ) : null;

  return { ask: (next: Pending) => setPending(next), dialog };
}
