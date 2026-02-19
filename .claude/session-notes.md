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

### Fixed
- Firebase security rules syntax errors (`orderByChild` not supported in rules language; duplicate rules block causing JSON error)
- Contract details not loading — race condition where reset useEffect overwrote subscription data
- Incentive structure text layout — changed from right-aligned to stacked column layout
- Map legend not visible — moved to right side, raised z-index to 9999

### Removed
- Dedicated Schedule tab — replaced with Schedule button in links row (too crowded)

### Decisions Made
- Option A for contract security: separate Firebase collection + `auth != null` rules + frontend gating
- All contract fields as strings (flexibility over rigid types)
- Track contract edit history with user email and timestamp
- Auto-detect expiry year using regex `/\b(20\d{2})\b/g` on term field, fallback to manual checkbox

### Flagged (Not Yet Resolved)
- Map zooms out to world view when editing/saving program data — investigating

### Next Up
- Resolve map zoom-out issue when editing/saving program data

### Session Notes
- User prefers collaborative approach — discuss before executing
- Wants to memorialize sessions to preserve context across conversations
