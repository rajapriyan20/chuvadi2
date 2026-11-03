/**
 * Global Back Navigation Manager for Chuvadi
 * Coordinates hardware/browser back button (popstate) across nested modals, drawers, and tabs.
 */

type BackHandler = () => boolean;

interface RegisteredHandler {
  id: string;
  priority: number;
  handler: BackHandler;
}

const backHandlers: RegisteredHandler[] = [];

/**
 * Register a back handler.
 * Higher priority handlers are checked first.
 * The handler should return `true` if it handled/consumed the back press, or `false` to pass through.
 */
export function registerBackHandler(id: string, priority: number, handler: BackHandler): () => void {
  const existingIdx = backHandlers.findIndex(h => h.id === id);
  if (existingIdx >= 0) {
    backHandlers[existingIdx] = { id, priority, handler };
  } else {
    backHandlers.push({ id, priority, handler });
  }

  // Sort descending: highest priority first
  backHandlers.sort((a, b) => b.priority - a.priority);

  return () => {
    const idx = backHandlers.findIndex(h => h.id === id);
    if (idx >= 0) {
      backHandlers.splice(idx, 1);
    }
  };
}

/**
 * Trigger back navigation chain.
 * Iterates through registered handlers in priority order.
 * Returns `true` if any handler consumed the event.
 */
export function triggerBackNavigation(): boolean {
  for (const item of [...backHandlers]) {
    try {
      if (item.handler()) {
        return true;
      }
    } catch (err) {
      console.error(`Error in back handler [${item.id}]:`, err);
    }
  }
  return false;
}
