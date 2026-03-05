# Session Notes

> **Process:** At the end of each session, Claude appends a dated entry capturing what was built, fixed, decided, and flagged. The Rolling Summary is updated as patterns emerge. This file is append-only — past entries are never deleted. Git history provides full versioning.

---

## Rolling Summary

### User Preferences
- Discuss architecture/approach before building — wants to understand trade-offs
- Left-align long text fields, use stacked (column) layout for multi-line content
- Legends and secondary UI on right side of map
- All allowed users have equal access (no role-based permissions for now)
- Strings for contract fields (flexible, not rigid data types)

### Established Patterns
- Firebase Realtime Database with client-side access (no backend)
- `allowedUsers` whitelist for authorization, `isUserAllowed` boolean gates features
- Contract data at `contractDetails/{sport}/{programId}`, history at `contractHistory/{sport}/{programId}`
- Competitor events at `competitorEvents/{eventId}` with brand, date range, location, type fields
- Auth-gated features: check `isUserAllowed` before rendering sensitive UI or subscribing to data
- Auto-detect where possible (e.g., expiry year from term field) with manual override fallback

### Things to Avoid
- Don't put state resets in separate useEffect from subscriptions (causes race conditions)
- Don't position map overlays on left side (conflicts with Leaflet controls)
- Avoid right-aligning long text in label-value layouts

---

## 2026-02-19

### Built
- **Contract tab in DetailPanel** — Term, Travel Stipend, Product Allotment, Incentive Structure fields with edit/save functionality and change history
- **Expiring contract badge** — Orange badge in header, auto-detects from term year (regex) or manual checkbox
- **Contract overview dashboard** — Modal with sortable table, status filter pills, summary stats, CSV export
- **Map layer toggle** — "Contracts" button color-codes markers (orange=expiring, green=active, dim=no data)
- **Map legend** — Shows on right side when contract layer is active
- **Product Coverage indicator** — TEAM/SPOMA segmented toggle in contract tab, colored badges in read view
- **Competitor Events tracking** — Modal to track Nike, UA, Puma, and general competitor events with brand-accurate colors, date ranges, locations, event types, and live period indicator

### Fixed
- Firebase security rules syntax errors (`orderByChild` not supported in rules language; duplicate rules block causing JSON error)
- Contract details not loading — race condition where reset useEffect overwrote subscription data
- Incentive structure text layout — changed from right-aligned to stacked column layout
- Map legend not visible — moved to right side, raised z-index to 9999
- Map zoom-out on save — MapViewPreserver now refuses to save zoom < 3, restores if zoom drops unexpectedly

### Removed
- Dedicated Schedule tab — replaced with Schedule button in links row (too crowded)

### Decisions Made
- Option A for contract security: separate Firebase collection + `auth != null` rules + frontend gating
- All contract fields as strings (flexibility over rigid types)
- Track contract edit history with user email and timestamp
- Auto-detect expiry year using regex `/\b(20\d{2})\b/g` on term field, fallback to manual checkbox
- Competitor events as simple filterable list modal (not calendar), brand colors: Nike #F35B04 (EYBL orange), UA #E03A3E, Puma #00857C

### Flagged (Resolved)
- Map zooms out to world view when editing/saving — **fixed** (MapViewPreserver guards against invalid zoom states)

### Next Up
- Test competitor events feature (add/edit/delete, filtering, live period badge)

### Session Notes
- User prefers collaborative approach — discuss before executing
- Wants to memorialize sessions to preserve context across conversations

---

## 2026-03-05

### Built
- **Firebase Database Rules** — Created `database.rules.json`, `firebase.json`, `.firebaserc` to fix PERMISSION_DENIED errors for authenticated admin users
- **CLAUDE.md** — Created persistent project instructions file documenting brand hierarchy

### Decisions Made
- **Brand Hierarchy Established (Permanent):**
  1. ADI SEL3CT Brand Guidelines are **superior/primary** for this application
  2. Everything ties back to adidas Master Brand Guidelines as foundation
  3. When ADI SEL3CT is silent, defer to adidas master brand
  4. Always invoke `/adi-select` skill for design decisions

### Flagged
- Firebase rules need manual deployment: `firebase login && firebase deploy --only database`
- Brand guideline changes identified but awaiting approval before implementation

### Session Notes
- User emphasized: "Select brand guidelines are superior" — this is an adidas Select property
- All proposed changes must be approved before implementation
- Brand consistency is mission-critical
