# ADI SEL3CT Map - Competitive Analysis Report
**Date:** March 8, 2026
**Version:** 1.0

---

## Executive Summary

This analysis benchmarks the ADI SEL3CT Map against five elite sports/program tracking platforms to identify competitive positioning, strengths, gaps, and actionable improvements across brand, user experience, and competitive intelligence dimensions.

---

## Competitive Benchmark Set

### 1. **KORE Software** (Two Circles Platform)
*Enterprise Sponsorship Management Leader*
- **Market Position:** Global leader in sponsorship management and fan engagement
- **Key Features:** End-to-end sponsorship lifecycle management, contract tracking, inventory management, partner communication, payment processing, portfolio optimization
- **Differentiator:** $30B+ verified deal data, AI-powered proposal evaluation, comprehensive reporting suite

### 2. **Hudl Sportscode**
*Video & Performance Analytics Standard*
- **Market Position:** 31.65% market share in Sports Vertical Tech
- **Key Features:** Video-based scouting, automated indexing, rich visualization dashboards, recruiting highlight reels, game breakdown tools
- **Differentiator:** Direct coach-to-athlete video sharing, cross-platform highlight compilation

### 3. **SponsorUnited**
*Sponsorship Intelligence Platform*
- **Market Position:** AI-native operating system for sponsorship
- **Key Features:** Partnership discovery, deal benchmarking, AI proposal evaluation, competitive landscape analysis, real-time sponsorship monitoring
- **Differentiator:** Comprehensive sponsorship database with pricing validation, negotiation guides

### 4. **Catapult Sports**
*Elite Performance Tracking*
- **Market Position:** Global leader in GPS tracking technology
- **Key Features:** Real-time athlete monitoring, 2D pitch visualization, heat maps, trails/traces, integrated video + data analysis
- **Differentiator:** Used by Brazil, Real Madrid, Chelsea; 1000+ data points/second; 40+ sports coverage

### 5. **Front Rush** + **NCSA**
*Recruiting & Program Management*
- **Market Position:** #1 most-used recruiting software for coaches
- **Key Features:** Contact/evaluation logging, interaction reports, 40,000+ coach database, interactive college search maps, profile view tracking
- **Differentiator:** Coach-to-athlete direct messaging with read receipts, AI-powered athlete matching

---

## Current State Assessment: ADI SEL3CT Map

### Feature Inventory

| Category | Current Capabilities |
|----------|---------------------|
| **Map Visualization** | Leaflet-based interactive map, logo markers, clustering, dark/light mode, state labels, marker repulsion algorithm |
| **Program Management** | CRUD operations, multi-sport (basketball/football), level tiers (Mahomes/Gold/Silver/Bronze), regional segmentation |
| **Pipeline Tracking** | 7-stage funnel (Identified→Signed/Lost), Kanban/List/Map views, priority filtering, drag-drop status changes |
| **Contract Management** | Term tracking, stipends, product allotments, expiration alerts, contract history audit |
| **Analytics** | Regional distribution, top conferences, top states, event forecasting, historical tracking |
| **Competitive Intel** | Competitor events tracking (Nike/UA/Puma), brand filtering |
| **Export** | CSV, PNG map export, PDF reports, program cards |
| **Collaboration** | Real-time Firebase sync, whitelist-based permissions, activity notes |

---

## Three-Dimensional Analysis

## DIMENSION 1: BRAND PERSPECTIVE

### Strengths ✓

| Strength | Evidence | Competitive Edge |
|----------|----------|------------------|
| **Brand Consistency** | ADI SEL3CT guidelines enforced throughout; adidas FG typography, neon magenta accents, sharp corners | Stronger brand presence than Hudl/Front Rush which prioritize function over form |
| **Visual Identity** | Custom splash screen, branded logo markers, region-specific color coding | Creates memorable, differentiated experience |
| **Professional Polish** | Flippable program cards, exportable branded assets | Enables brand amplification at partner meetings |
| **Tier System Clarity** | Color-coded levels (Mahomes/Gold/Silver/Bronze) | Quick visual communication of partnership value |

### Weaknesses ✗

| Weakness | Impact | Benchmark Gap |
|----------|--------|---------------|
| **No Partner-Facing Portal** | Partners can't view their own status/data | KORE offers partner dashboards for transparency |
| **Limited Brand Analytics** | No brand exposure metrics or sentiment tracking | Relo Metrics/Blinkfire provide AI-powered brand visibility metrics |
| **Static Brand Assets** | Program cards are static exports, not dynamic links | SponsorUnited offers embeddable live widgets |
| **Missing Co-Branding** | School colors not integrated into program views | Missed opportunity for school-led moments per guidelines |

### Brand Improvement Opportunities

1. **Add Partner Portal** - Allow school programs to view their partnership status, upcoming events, and contract details
2. **Integrate Brand Metrics** - Add social media reach/engagement tracking per program (Instagram follower trends partially exist)
3. **Dynamic Shareable Links** - Create live-updating program pages for external sharing
4. **School Color Integration** - Pull school primary colors for UI accents per ADI SEL3CT school-led moments

---

## DIMENSION 2: USER EXPERIENCE PERSPECTIVE

### Strengths ✓

| Strength | Evidence | Benchmark Comparison |
|----------|----------|---------------------|
| **Fast Initial Load** | Deferred subscriptions (500ms→1s→2s staging), icon caching | Outperforms data-heavy platforms like SponsorUnited |
| **Real-Time Sync** | Firebase Realtime Database, instant collaboration | On par with Hudl's team collaboration |
| **Multi-View Flexibility** | Map/Kanban/List/Calendar views for targets and events | Exceeds Front Rush single-view approach |
| **Mobile Responsiveness** | Bottom sheets, compact mode, touch-optimized controls | Better than KORE's desktop-first design |
| **Map Performance** | Marker repulsion, clustering, view state persistence | Matches Catapult's geospatial sophistication |

### Weaknesses ✗

| Weakness | Impact | Industry Standard |
|----------|--------|-------------------|
| **No Offline Mode** | Field reps lose access without connectivity | Hudl/TeamSnap offer offline caching |
| **Limited Search** | Text search only; no faceted filters, saved searches | Front Rush supports complex query builders |
| **No Notification System** | Users must manually check for updates | TeamSnap pushes real-time mobile alerts |
| **Missing Onboarding** | No guided tours, tooltips, or help system | SponsorUnited offers interactive tutorials |
| **Monolithic App.jsx** | 4,885 lines in single component; maintenance risk | Code health impacts iteration speed |
| **No Undo/Redo** | Accidental edits require manual reversal | Modern dashboards support action history |
| **Basic Analytics** | Bar charts only; no drill-down, time comparisons | Catapult offers heat maps, trails, advanced viz |

### UX Benchmark Scores (1-10)

| Metric | Select Map | KORE | Hudl | SponsorUnited | Catapult | Front Rush |
|--------|------------|------|------|---------------|----------|------------|
| Visual Design | 9 | 6 | 7 | 8 | 7 | 5 |
| Data Density | 7 | 9 | 8 | 9 | 10 | 6 |
| Navigation | 7 | 8 | 8 | 8 | 8 | 7 |
| Mobile Experience | 8 | 5 | 9 | 6 | 7 | 8 |
| Collaboration | 7 | 9 | 9 | 7 | 8 | 8 |
| Reporting | 6 | 9 | 8 | 9 | 9 | 7 |
| **Average** | **7.3** | **7.7** | **8.2** | **7.8** | **8.2** | **6.8** |

### UX Improvement Opportunities

1. **Implement Progressive Web App (PWA)** - Enable offline access with service worker caching
2. **Add Smart Search** - Faceted filters, saved searches, recent queries
3. **Build Notification System** - Contract expiration alerts, pipeline stage changes, new events
4. **Create Onboarding Flow** - First-run tutorial highlighting key features
5. **Refactor App.jsx** - Extract into feature modules (Map, Pipeline, Events, Analytics)
6. **Enhance Analytics** - Add heat maps, trend lines, YoY comparisons, drill-down capability

---

## DIMENSION 3: COMPETITIVE INTELLIGENCE PERSPECTIVE

### Strengths ✓

| Strength | Evidence | Strategic Value |
|----------|----------|-----------------|
| **Competitor Event Tracking** | Nike/UA/Puma event database with bulk import | Unique feature not found in recruiting platforms |
| **Pipeline Visibility** | 7-stage funnel with competition field per target | Enables proactive competitive response |
| **Historical Tracking** | Program edit audit trail, championship history | Supports relationship depth over time |
| **Contract Expiration Alerts** | 2026 expiration flag and dashboard | Proactive renewal pipeline management |

### Weaknesses ✗

| Weakness | Impact | Competitive Risk |
|----------|--------|------------------|
| **No Competitor Sponsorship Tracking** | Don't know which schools Nike/UA currently sponsor | SponsorUnited tracks $30B+ in competitive deals |
| **Manual Competitor Data Entry** | Relies on field team to input events | Relo Metrics auto-scrapes brand exposure |
| **No Market Share Visualization** | Can't see adidas vs. competitor footprint on map | Miss macro competitive positioning |
| **Missing NIL Integration** | No NIL deal tracking for programs/athletes | Critical gap in 2026 recruiting landscape |
| **No Social Listening** | Don't capture online mentions of programs/athletes | Blinkfire monitors brand mentions in real-time |

### Competitive Intelligence Gap Analysis

| Capability | Select Map | KORE | SponsorUnited | Relo Metrics |
|------------|------------|------|---------------|--------------|
| Track own partnerships | ✓ | ✓ | ✓ | ✓ |
| Track competitor events | ✓ | ✗ | ✓ | ✓ |
| Track competitor sponsorships | ✗ | ✗ | ✓ | ✓ |
| Auto-scrape competitive data | ✗ | ✗ | ✓ | ✓ |
| Market share visualization | ✗ | ✗ | ✓ | ✓ |
| Social mention monitoring | ✗ | ✗ | ✓ | ✓ |
| NIL deal tracking | ✗ | ✗ | ✓ | ✗ |

### Competitive Intel Improvement Opportunities

1. **Add Competitor Sponsorship Layer** - Toggle to show Nike/UA-sponsored schools on map
2. **Integrate NIL Tracking** - Track NIL deals for target programs' athletes
3. **Build Market Share Dashboard** - Visualize adidas vs. competitor penetration by region/conference
4. **Automate Event Scraping** - RSS/API integration for competitor event calendars
5. **Add Social Listening** - Twitter/Instagram mention tracking for programs

---

## Consolidated SWOT Analysis

### Strengths
- **Best-in-class brand integration** - ADI SEL3CT guidelines consistently applied
- **Strong map visualization** - Logo markers, clustering, regional coloring
- **Real-time collaboration** - Firebase enables instant team sync
- **Multi-view pipeline** - Kanban/List/Map flexibility exceeds competitors
- **Unique competitor event tracking** - No other platform tracks Nike/UA events

### Weaknesses
- **No offline capability** - Field team dependent on connectivity
- **Limited analytics depth** - Basic charts vs. heat maps, drill-downs
- **Manual data entry** - No integrations or automations
- **No partner-facing views** - Schools can't self-serve
- **Monolithic codebase** - Technical debt slows iteration

### Opportunities
- **NIL market explosion** - First-mover advantage in tracking NIL for programs
- **Partner self-service** - Reduce internal workload, increase partner satisfaction
- **Competitive intelligence automation** - Scrape competitor data for strategic advantage
- **Mobile-first PWA** - Serve field team better than desktop-bound competitors
- **School color integration** - Deepen co-branding per ADI SEL3CT guidelines

### Threats
- **SponsorUnited expansion** - Their AI-native platform could attract adidas corporate
- **Nike/UA digital investment** - Competitors building similar internal tools
- **Data accuracy decay** - Manual entry creates stale data over time
- **Mobile expectation gap** - Field teams expect offline-first mobile apps

---

## Prioritized Recommendations

### Quick Wins (1-2 Sprints)

| Priority | Initiative | Effort | Impact |
|----------|------------|--------|--------|
| 1 | Add push notification system for contract expirations | Medium | High |
| 2 | Implement saved searches and search history | Low | Medium |
| 3 | Add competitor sponsorship toggle layer on map | Medium | High |
| 4 | Create interactive onboarding tour | Low | Medium |
| 5 | Extract App.jsx into feature modules | Medium | High (dev velocity) |

### Medium-Term (1-3 Months)

| Priority | Initiative | Effort | Impact |
|----------|------------|--------|--------|
| 1 | Build PWA with offline caching | High | High |
| 2 | Add NIL tracking module | High | High |
| 3 | Create partner-facing read-only portal | High | High |
| 4 | Enhance analytics with heat maps, drill-downs | Medium | Medium |
| 5 | Integrate school primary colors for UI accents | Low | Medium |

### Long-Term (3-6 Months)

| Priority | Initiative | Effort | Impact |
|----------|------------|--------|--------|
| 1 | Build competitive intelligence automation (scraping) | Very High | Very High |
| 2 | Add social listening/mention tracking | Very High | High |
| 3 | Create market share visualization dashboard | High | High |
| 4 | Implement AI-powered partnership recommendations | Very High | High |
| 5 | Build native mobile apps (iOS/Android) | Very High | Medium |

---

## Key Metrics to Track

### Success Metrics

| Metric | Current Baseline | 6-Month Target |
|--------|------------------|----------------|
| Average session duration | Unknown | Establish + 20% increase |
| Programs updated per week | Unknown | Establish + 30% increase |
| Pipeline conversion rate | Unknown | Establish + 15% increase |
| Mobile vs. desktop usage | Unknown | 50% mobile target |
| Data freshness (days since update) | Unknown | <14 days average |

### Competitive Metrics

| Metric | Current | Target |
|--------|---------|--------|
| % of competitor events tracked | Unknown | >80% coverage |
| Competitor sponsorship accuracy | 0% | >70% accuracy |
| NIL deals tracked | 0 | Top 50 programs |

---

## Conclusion

The ADI SEL3CT Map is a **strong specialized tool** that outperforms general-purpose platforms in brand consistency and map visualization. However, it lags enterprise leaders in:

1. **Analytics depth** (vs. Catapult, KORE)
2. **Competitive intelligence automation** (vs. SponsorUnited, Relo Metrics)
3. **Offline/mobile capability** (vs. Hudl, TeamSnap)
4. **Partner self-service** (vs. KORE)

The highest-ROI investments are:
- **PWA for offline access** - Critical for field team productivity
- **Competitor sponsorship layer** - Unique competitive advantage potential
- **NIL tracking** - Urgent market need in 2026 landscape

By addressing these gaps while maintaining brand excellence, the ADI SEL3CT Map can establish itself as the definitive internal tool for adidas basketball and football program management.

---

## Sources

### Industry Research
- [KORE Software](https://koresoftware.com/) - Sponsorship Management Platform
- [SponsorUnited](https://www.sponsorunited.com) - Sponsorship Intelligence
- [Hudl](https://www.hudl.com/) - Video & Performance Analytics
- [Catapult Sports](https://www.catapult.com/) - Elite Performance Tracking
- [Front Rush](https://frontrush.com/) - Recruiting Software
- [NCSA Sports](https://www.ncsasports.org/) - College Recruiting Platform
- [Relo Metrics](https://relometrics.com/) - AI-Powered Sports Marketing

### UX & Design Research
- [Smashing Magazine - UX Strategies for Real-Time Dashboards](https://www.smashingmagazine.com/2025/09/ux-strategies-real-time-dashboards/)
- [UXPin - Dashboard Design Principles](https://www.uxpin.com/studio/blog/dashboard-design-principles/)
- [Harvard Science Review - Visualizing Sports Metrics](https://harvardsciencereview.org/2025/08/08/visualizing-sports-metrics-transforming-data-into-winning-decisions/)

### Market Data
- [Boardroom - College Football Apparel Brand Partners](https://boardroom.tv/ncaa-football-apparel-brand-partners/)
- [6sense - Sports Vertical Tech Market Share](https://6sense.com/tech/sports-vertical-tech/)
- [SponsorUnited - 2026 Sponsorship Trends](https://www.sponsorunited.com/insights/)
