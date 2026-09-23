// T24.18 — the "see all" shortcut on the Offers rail has to land on a category
// section that `MenuBody` owns, but the rail is a *sibling* of `MenuBody` in the
// page tree, not a child. Scrolling to `#category-<id>` directly is not enough:
// under the CATEGORIES_FIRST layout `MenuBody` starts on the icon grid, so the
// section is not mounted at all, and a Foods/Drinks filter can hide it too.
//
// A cancelable window event is the least invasive channel — no shared store, no
// prop drilling through two separate server pages. `MenuBody` calls
// `preventDefault()` to claim the jump; if nothing does, the caller falls back
// to a plain scroll.

export const JUMP_TO_CATEGORY_EVENT = 'menu:jump-to-category';

/**
 * Ask `MenuBody` to reveal and scroll to a category. Returns true if it handled
 * the request, false if no menu body was listening.
 */
export function requestCategoryJump(categoryId: string): boolean {
  if (typeof window === 'undefined') return false;
  const event = new CustomEvent(JUMP_TO_CATEGORY_EVENT, {
    detail: categoryId,
    cancelable: true,
  });
  // dispatchEvent returns false exactly when a listener called preventDefault.
  return !window.dispatchEvent(event);
}
