# Manual QA Checklist

Manual verification steps for behaviors that automated tests can't reasonably
cover — typically anything that requires real devices, real networks, or
multi-minute background timers.

## Phase 19 — Shared Table (T19.10)

The Playwright suite covers the happy path against `localhost`. The items
below need a real two-device setup over a non-loopback network and explicit
human observation. Run them on a release-candidate build before promoting
shared-table to production.

### Prereqs

- A PRO café-owner account on the staging app, with a PUBLISHED menu and
  `sharedTableEnabled` toggled ON in `Menu Settings → Shared Table`.
- The staging app must be reachable from a phone — e.g. via a public preview
  URL or a tunnel — so the public pages are NOT served from `localhost`.
- Two real phones (host + guest), ideally on different networks (one on
  Wi-Fi, one on cellular) to verify Pusher works across NATs.
- Up-to-date Pusher credentials configured for the environment under test.

### 1. Two-phone host + guest sync over a public network

1. **Phone A (host)** — scan the menu's QR code, land on `/m/<slug>`.
   - [ ] The "Create Shared Table" CTA is visible at the bottom of the page.
2. Tap the CTA, fill name + PIN + capacity, submit.
   - [ ] Lands on `/m/<slug>/t/<code>/host` with the table QR rendered inline.
   - [ ] The host's name appears as the only guest card with a Crown badge.
3. **Phone B (guest)** — scan the on-screen table QR (NOT the menu QR).
   - [ ] Lands on the join form for that exact `<code>`.
4. Enter a different name + the correct PIN, submit.
   - [ ] Phone A's host view adds a second guest card within ~3 seconds with
         no manual reload.
   - [ ] Phone B sees the menu in table mode with the "My picks · 0" pill.
5. On Phone B, add 2 items via the "+" buttons.
   - [ ] Phone A's host view shows both selections under Phone B's card
         within ~3 seconds, no manual reload.
   - [ ] Phone B's tray pill shows "My picks · 2".
6. On Phone A, tap the trash icon on one of Phone B's selections.
   - [ ] That row disappears from Phone A's host view immediately.
   - [ ] On Phone B, pulling-to-refresh (or backgrounding/foregrounding the
         tab) reflects the removal — the tray drops to "My picks · 1".

### 2. Refresh / kill-and-relaunch mid-session

1. With the same setup as above, leave Phone B sitting on the table-mode menu
   with "My picks · 2".
2. Pull-to-refresh in the guest's browser.
   - [ ] Still in the table — selections persist, tray pill still shows
         "My picks · 2".
3. Force-quit the browser app on Phone B and relaunch it; reopen the tab.
   - [ ] Still in the table on first load — the guest cookie is intact.
   - [ ] No re-prompt for name/PIN.
4. On Phone B, switch tabs / lock the device for ~30 seconds, then return.
   - [ ] Tray contents intact, no error toast on resume.

### 3. Backgrounded tab keeps receiving Pusher events

1. Open the host view on Phone A.
2. Background the browser tab on Phone A — switch to another app, lock the
   screen — for **at least 5 minutes**.
3. While Phone A is backgrounded, on Phone B add another selection.
4. Bring Phone A back to the foreground.
   - [ ] Within ~3 seconds of foregrounding, Phone A's host view reflects the
         new selection that Phone B added during the background window — no
         manual reload required.
   - [ ] The realtime status footer reads "connected" (not "offline").
5. From Phone A, tap "Close table" → confirm.
   - [ ] Phone A navigates back to `/m/<slug>` immediately.
   - [ ] On Phone B, the next interaction (e.g. tap "+" on a product) surfaces
         the "Table is no longer accepting picks" toast and a refresh lands
         on the join form / base menu.

### Sign-off

- Tester name + date: ____________________
- Build / commit SHA: ____________________
- Pusher cluster used: ____________________
- Notes: ____________________
