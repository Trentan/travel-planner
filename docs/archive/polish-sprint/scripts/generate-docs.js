const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const POLISH = path.join(ROOT, 'polish');
const ITEMS = path.join(POLISH, 'items');
const AFTER = path.join(POLISH, 'screenshots', 'after');
const today = '2026-05-16';

fs.mkdirSync(ITEMS, { recursive: true });
fs.mkdirSync(AFTER, { recursive: true });

const issues = [
  {
    id: 'WI-001',
    title: 'Desktop App Menu Wraps Into A 154px Header',
    priority: '🔴 Critical',
    effort: '🟡 Medium (2-8 hrs)',
    dimension: 'Desktop Aesthetic',
    before: 'desktop-02-menu-bar.png',
    files: ['style.css', 'index.html'],
    problem: 'The desktop `.app-menu-bar` wraps the 14-action toolbar into multiple rows at 1440px. The first captured 60px only shows the filename row, while the controls continue below, making the application chrome feel broken and pushing content down.',
    fix: 'Convert the desktop menu into a single stable toolbar: keep file/status on the left, group secondary actions under a compact Actions menu, and prevent wrap on `.app-menu-right` above tablet widths.',
    after: 'At 1440px the menu bar is one row about 56px tall. Primary controls remain visible; export/import/reset/guide actions live in one grouped button or overflow menu.',
    criteria: ['`.app-menu-bar` height is no more than 64px at 1440px.', 'No top-menu controls wrap to a second row between 1024px and 1440px.']
  },
  {
    id: 'WI-002',
    title: 'Mobile Top Chrome Consumes Too Much Viewport',
    priority: '🔴 Critical',
    effort: '🟡 Medium (2-8 hrs)',
    dimension: 'Mobile Layout',
    before: 'mobile-01-home.png',
    files: ['style.css', 'index.html', 'js/ui.js'],
    problem: 'On 390px mobile the file badge, hidden disabled controls, detailed-mode switch, and Menu button create a 117px dark menu bar before the hero even starts. This crowds the first viewport and leaves odd ghost pills under the filename.',
    fix: 'Use a two-line mobile app chrome only when necessary: a compact filename/status row and a single action row. Hide disabled undo/redo completely and shorten the filename with a label like "Trip file".',
    after: 'The mobile menu chrome is at most 72px tall, with no empty ghost pills and a clear Menu button aligned to the right.',
    criteria: ['`.app-menu-bar` height is no more than 72px at 390px.', 'Disabled undo/redo controls do not render as empty pills on mobile.']
  },
  {
    id: 'WI-003',
    title: 'Journey Modal Clips Horizontally On Mobile',
    priority: '🔴 Critical',
    effort: '🟡 Medium (2-8 hrs)',
    dimension: 'Mobile Layout',
    before: 'mobile-08-journey-modal-top.png',
    files: ['style.css', 'index.html'],
    problem: 'The journey modal form is wider than the 390px viewport. The transport type row, date/time fields, and sticky footer actions are clipped, including the Save journey button.',
    fix: 'Add mobile-specific rules for `#journey-modal .modal-content`, the inline form rows, `.transport-type-group`, and `.modal-footer` so content stacks vertically and the footer scrolls or wraps safely.',
    after: 'All journey fields fit within the viewport. The footer buttons wrap to two rows or stack, and the Save journey button is fully visible without horizontal scrolling.',
    criteria: ['No horizontal overflow in `#journey-modal` at 390px.', 'Save journey, Add segment, Delete, and Cancel are fully visible and tappable.']
  },
  {
    id: 'WI-004',
    title: 'Primary Tab Strip Crops Labels On Mobile',
    priority: '🔴 Critical',
    effort: '🟢 Quick Win (<1 hr)',
    dimension: 'Mobile Layout',
    before: 'mobile-01-home.png',
    files: ['style.css'],
    problem: 'The primary tab strip is horizontally scrollable but has no fade, arrow, or scrollbar. The Accommodation label is visibly cropped to "Accomm", which makes navigation look unfinished.',
    fix: 'Add left/right edge fades to `.app-tabs-nav`, preserve scroll snapping, and reduce mobile tab padding/font size so full labels have a better chance of fitting.',
    after: 'The active tab remains centered, offscreen tabs are hinted by a gradient fade, and Accommodation is not hard-clipped at rest.',
    criteria: ['A visible overflow affordance appears on the mobile tab strip.', 'The Accommodation tab is readable when active or centered.']
  },
  {
    id: 'WI-005',
    title: 'City Nav Overflow Has No Scroll Affordance',
    priority: '🔴 Critical',
    effort: '🟢 Quick Win (<1 hr)',
    dimension: 'UX Flow',
    before: 'mobile-11-city-nav-overflow.png',
    files: ['style.css', 'js/itinerary.js'],
    problem: 'The city nav has a 337px viewport and about 1829px of scrollable content on mobile. The scrollbar is hidden and there is no fade or arrow, so most cities are undiscoverable.',
    fix: 'Wrap `.city-nav-list` in a visual fade treatment or add pseudo-element fades on `.city-nav`. Optionally add scroll shadows that disappear at either end.',
    after: 'The city rail clearly indicates more cities offscreen with a right-edge fade or arrow, and the active city remains visually anchored.',
    criteria: ['Mobile city nav shows a right-side overflow cue when content is scrollable.', 'Cue disappears or changes when scrolled to the end.']
  },
  {
    id: 'WI-006',
    title: 'Mobile Transport Table Is Dense And Loses Actions',
    priority: '🔴 Critical',
    effort: '🔴 Major (1-3 days)',
    dimension: 'Mobile Layout',
    before: 'mobile-06-transport.png',
    files: ['style.css', 'js/transport.js'],
    problem: 'The transport tab renders as a large two-column table on mobile. Rows are tall, action controls are not visible in the first viewport, and repeated same-city journeys dominate the screen.',
    fix: 'Replace the mobile transport table with journey cards showing route, type, departure/arrival, provider, status/cost, and an explicit details/action expander.',
    after: 'Each journey is a compact card with a clear route title, schedule row, status/cost row, and a visible Edit/Details action.',
    criteria: ['At least three transport cards fit in the first 844px after sticky nav.', 'Each card exposes an edit/details affordance without horizontal scrolling.']
  },
  {
    id: 'WI-007',
    title: 'Budget Mobile Numbers Look Like Broken Precision',
    priority: '🔴 Critical',
    effort: '🟢 Quick Win (<1 hr)',
    dimension: 'Mobile Layout',
    before: 'mobile-07-budget.png',
    files: ['js/tabs.js', 'style.css'],
    problem: 'Budget values render as raw decimals such as `$3465.1`, `$110.6`, and `$217.6`. This looks accidental for travel budgeting and reduces trust in totals.',
    fix: 'Centralize currency formatting in `buildBudgetTab()` with `Intl.NumberFormat`, using zero or two decimals consistently depending on whether cents are meaningful.',
    after: 'Budget KPIs and leg totals use consistent currency formatting such as `$3,465` or `$3,465.10`.',
    criteria: ['No budget value displays an unformatted single decimal.', 'Thousands separators are present for large totals.']
  },
  {
    id: 'WI-008',
    title: 'Editable Header Text Opens Keyboard On Casual Mobile Taps',
    priority: '🔴 Critical',
    effort: '🟡 Medium (2-8 hrs)',
    dimension: 'UX Flow',
    before: 'mobile-02-header.png',
    files: ['index.html', 'js/ui.js', 'style.css'],
    problem: '`#mainTitle` and `#mainSubtitle` are contenteditable by default in edit mode. On mobile, casual taps in the hero can focus the fields and open the keyboard even when the user is trying to scroll.',
    fix: 'Disable direct contenteditable on mobile unless an explicit Edit Header action is selected, or require read-only mode by default on mobile.',
    after: 'The hero behaves like static text during normal mobile browsing; editing is entered through an intentional button.',
    criteria: ['Tapping the title in normal mobile browsing does not open the keyboard.', 'Header editing remains available through an explicit control.']
  },
  {
    id: 'WI-009',
    title: 'Map Is A Static SVG Approximation',
    priority: '🟡 Important',
    effort: '🔴 Major (1-3 days)',
    dimension: 'Functionality',
    before: 'desktop-09-map.png',
    files: ['js/map.js', 'index.html', 'style.css'],
    problem: 'The map tab draws a simplified SVG world map rather than an interactive map. It also reports unmapped trip cities including itinerary locations that matter to this real trip.',
    fix: 'Replace the SVG approximation with Leaflet or another lightweight tile map, and use real coordinates from the city database for all trip cities.',
    after: 'The map supports pan/zoom, markers, route lines, and all real trip cities are mapped or explicitly flagged with actionable city data editing.',
    criteria: ['Map supports pan and zoom.', 'No real trip destination is listed as unmapped when coordinates exist or can be stored.']
  },
  {
    id: 'WI-010',
    title: 'Journey Transport Type Buttons Are Partly Hidden',
    priority: '🟡 Important',
    effort: '🟢 Quick Win (<1 hr)',
    dimension: 'Mobile Layout',
    before: 'mobile-08-journey-modal-top.png',
    files: ['style.css'],
    problem: 'The `.transport-type-group` has five buttons but the row is clipped in the mobile modal. Users see only part of the fourth option and no clear indication that more options exist.',
    fix: 'Use a responsive grid for transport types at mobile widths or add a visible horizontal fade and scroll snap.',
    after: 'All five transport types are visible in a 2-3 row grid or visibly scrollable with no clipped label.',
    criteria: ['All transport type labels can be read at 390px.', 'Selected state remains obvious after layout change.']
  },
  {
    id: 'WI-011',
    title: 'Journey Date And Time Inputs Overflow',
    priority: '🟡 Important',
    effort: '🟢 Quick Win (<1 hr)',
    dimension: 'Mobile Layout',
    before: 'mobile-08-journey-modal-top.png',
    files: ['style.css', 'index.html'],
    problem: 'The departure and arrival date/time input pairs are laid out inline, producing horizontal overflow inside the journey form. Time inputs are partially offscreen.',
    fix: 'Add mobile CSS that stacks date and time inputs or uses a two-row grid with `min-width: 0` on inputs.',
    after: 'Departure date and time each occupy a readable, full-width row or equal two-column row within the modal card.',
    criteria: ['Date and time inputs do not exceed modal width.', 'Inputs keep at least 44px height on mobile.']
  },
  {
    id: 'WI-012',
    title: 'Modal Close Buttons Lack Guaranteed 44px Target',
    priority: '🟡 Important',
    effort: '🟢 Quick Win (<1 hr)',
    dimension: 'Mobile Layout',
    before: 'mobile-04-menu-open.png',
    files: ['style.css'],
    problem: '`.modal-close` uses only `padding: 0.25rem` and no min-width/min-height. The visible close icon is large, but the guaranteed tap target is not defined.',
    fix: 'Set `.modal-close` to `min-width: 44px; min-height: 44px; display: inline-flex; align-items: center; justify-content: center;`.',
    after: 'Every modal close control has a predictable 44px minimum tap box while preserving the visual style.',
    criteria: ['All `.modal-close` elements measure at least 44 by 44 CSS pixels.', 'Close button alignment remains correct in modal headers.']
  },
  {
    id: 'WI-013',
    title: 'Action Buttons Are 40px Tall Not 44px',
    priority: '🟡 Important',
    effort: '🟢 Quick Win (<1 hr)',
    dimension: 'Mobile Layout',
    before: 'mobile-01-home.png',
    files: ['style.css'],
    problem: '`.action-btn` has a 40px measured height in the audit. This misses the common 44px mobile tap target and affects expand/collapse and modal actions.',
    fix: 'Increase mobile `.action-btn` min-height to 44px and tune padding so desktop density is unchanged.',
    after: 'Mobile action buttons meet the 44px tap target while desktop buttons stay compact.',
    criteria: ['`.action-btn` is at least 44px tall at 390px.', 'Desktop `.action-btn` visual density is unchanged or intentionally adjusted.']
  },
  {
    id: 'WI-014',
    title: 'City Nav Buttons Are Slightly Below Tap Target',
    priority: '🟡 Important',
    effort: '🟢 Quick Win (<1 hr)',
    dimension: 'Mobile Layout',
    before: 'mobile-03-tabs.png',
    files: ['style.css'],
    problem: 'Mobile `.city-nav-btn` measured about 42px tall. The rail is central to filtering, so small targets are a usability issue when scrolling horizontally.',
    fix: 'Set mobile `.city-nav-btn` min-height to 44px and tune padding/line-height.',
    after: 'City pills retain their shape but meet the 44px tap target.',
    criteria: ['`.city-nav-btn` is at least 44px tall at 390px.', 'Horizontal scroll remains smooth.']
  },
  {
    id: 'WI-015',
    title: 'Drag And Drop Has No Touch Path',
    priority: '🟡 Important',
    effort: '🟡 Medium (2-8 hrs)',
    dimension: 'Functionality',
    before: 'mobile-05-itinerary.png',
    files: ['js/dragdrop.js', 'js/itinerary.js', 'style.css'],
    problem: '`js/dragdrop.js` only handles HTML5 drag events. Mobile users see suggested activity handles, but touch drag assignment is not implemented.',
    fix: 'Add a mobile alternative: tap "Assign" on suggested activities or implement pointer events with a clear drop target state.',
    after: 'Mobile users can assign suggested activities to a day without desktop drag-and-drop support.',
    criteria: ['Suggested activities can be assigned on touch devices.', 'Existing desktop drag/drop regression still works.']
  },
  {
    id: 'WI-016',
    title: 'Mobile Export Actions Need Explanatory Subtitles',
    priority: '🟡 Important',
    effort: '🟢 Quick Win (<1 hr)',
    dimension: 'UX Flow',
    before: 'mobile-04-menu-open.png',
    files: ['index.html', 'style.css'],
    problem: 'The mobile actions sheet lists Export AI Summary, Export Itinerary Text, Share Export, Save As, and Open File as similar-looking buttons. The user must already know the difference.',
    fix: 'Change mobile menu action buttons to two-line rows with a short subtitle explaining the output and when to use it.',
    after: 'Each export/import action has a title and one-line helper, making the correct action clear without opening the guide.',
    criteria: ['All export/file actions in `#mobileMenuSheet` include a helper subtitle.', 'Buttons remain tappable and fit in the sheet.']
  },
  {
    id: 'WI-017',
    title: 'AI Builder Modal Lacks Current Trip Context',
    priority: '🟡 Important',
    effort: '🟡 Medium (2-8 hrs)',
    dimension: 'UX Flow',
    before: 'mobile-10-ai-builder.png',
    files: ['index.html', 'js/ai.js', 'style.css'],
    problem: 'The AI Builder opens as a blank generic form even though the app already has a full trip loaded. Users must manually re-enter title, dates, cities, and vibe.',
    fix: 'Pre-fill AI Builder fields from `titleData`, itinerary date range, and city list. Add helper text explaining this creates a prompt, not an in-app generated itinerary.',
    after: 'Opening AI Builder shows real trip context prefilled and editable.',
    criteria: ['AI Builder title, dates, and cities prefill from current data.', 'The modal explains what Generate AI Prompt does.']
  },
  {
    id: 'WI-018',
    title: 'Desktop City Nav Also Overflows Without Cue',
    priority: '🟡 Important',
    effort: '🟢 Quick Win (<1 hr)',
    dimension: 'Desktop Aesthetic',
    before: 'desktop-04-tabs.png',
    files: ['style.css'],
    problem: 'At desktop width, `.city-nav-list` has 1906px of content in a 1328px client width. The scrollbar is hidden and the last visible city is cut off.',
    fix: 'Apply the same scroll-shadow/fade affordance to desktop city nav and optionally add mousewheel/trackpad-friendly padding.',
    after: 'The desktop city rail clearly shows additional cities offscreen instead of ending with a clipped pill.',
    criteria: ['Desktop city nav has a visible overflow affordance when scrollable.', 'No city pill appears half-rendered without a cue.']
  },
  {
    id: 'WI-019',
    title: 'Header Hero Is Too Tall On Mobile',
    priority: '🟡 Important',
    effort: '🟢 Quick Win (<1 hr)',
    dimension: 'Mobile Layout',
    before: 'mobile-01-home.png',
    files: ['style.css'],
    problem: 'The mobile hero uses large Playfair typography and generous padding, consuming about half of the first viewport when combined with the menu bar.',
    fix: 'Reduce mobile header padding and font clamp, and keep the subtitle to two lines with a graceful fade or smaller type.',
    after: 'The title remains distinctive but the itinerary content starts higher in the first viewport.',
    criteria: ['On 390x844, itinerary controls are visible without excessive scrolling.', 'Title and subtitle remain readable.']
  },
  {
    id: 'WI-020',
    title: 'Mobile Itinerary Cards Are Over-Scaled',
    priority: '🟡 Important',
    effort: '🟡 Medium (2-8 hrs)',
    dimension: 'Mobile Layout',
    before: 'mobile-05-itinerary.png',
    files: ['style.css', 'js/itinerary.js'],
    problem: 'Expanded itinerary cards on mobile use very large typography and spacing. The first card shows only tips before the fold and hides food/suggested activity context lower down.',
    fix: 'Create a mobile-specific day detail layout with compact section headers, tighter spacing, and collapsed sub-sections for Tips, Food, Transport, Accommodation, and Activities.',
    after: 'A full day card summary plus at least two detail sections fit within one mobile viewport.',
    criteria: ['First expanded day shows more than one detail section above the fold.', 'Section spacing is reduced without hurting readability.']
  },
  {
    id: 'WI-021',
    title: 'Desktop Itinerary Is Visually Busy',
    priority: '🟢 Polish',
    effort: '🟡 Medium (2-8 hrs)',
    dimension: 'Desktop Aesthetic',
    before: 'desktop-01-home.png',
    files: ['style.css', 'js/itinerary.js'],
    problem: 'The desktop itinerary exposes tips, food quests, suggested activities, edit controls, costs, delete buttons, and empty add rows all at once. This creates a spreadsheet-like feel instead of a polished travel dashboard.',
    fix: 'Reduce always-visible editing chrome, group secondary controls behind hover/focus states, and strengthen the day summary hierarchy.',
    after: 'The itinerary reads first as a trip plan and second as an editor, with edit controls available but quieter.',
    criteria: ['Delete/add/edit controls are visually de-emphasized until needed.', 'Leg summaries are easier to scan at desktop width.']
  },
  {
    id: 'WI-022',
    title: 'Packing Tab Needs Stronger Empty/Progress Hierarchy',
    priority: '🟢 Polish',
    effort: '🟢 Quick Win (<1 hr)',
    dimension: 'Desktop Aesthetic',
    before: 'desktop-08-packing.png',
    files: ['style.css', 'js/tabs.js', 'js/packing.js'],
    problem: 'The packing tab mixes guides and checklist content without a strong progress summary. Users cannot immediately see how much remains to pack.',
    fix: 'Add a compact progress strip per packing area and visually separate guide content from actionable checklists.',
    after: 'Packing starts with progress and next actions, then detailed lists below.',
    criteria: ['Packing tab has an at-a-glance progress indicator.', 'Guide panels are visually secondary to checklist tasks.']
  },
  {
    id: 'WI-023',
    title: 'Status And Cost Controls Lack Consistent Mobile Styling',
    priority: '🟢 Polish',
    effort: '🟡 Medium (2-8 hrs)',
    dimension: 'Mobile Layout',
    before: 'mobile-06-transport.png',
    files: ['style.css', 'js/transport.js', 'js/tabs.js'],
    problem: 'Status, cost, booking references, and route metadata use different patterns across transport, accommodation, itinerary, and budget views. On mobile this creates inconsistent scan patterns.',
    fix: 'Define shared mobile metadata components for status/cost/ref rows and reuse them across tab builders.',
    after: 'Transport and accommodation metadata look related and scan consistently.',
    criteria: ['Shared classes are used for status/cost/ref mobile metadata.', 'Transport and accommodation cards align visually.']
  },
  {
    id: 'WI-024',
    title: 'Visual System Uses Too Many Inline Styles',
    priority: '🟢 Polish',
    effort: '🔴 Major (1-3 days)',
    dimension: 'Desktop Aesthetic',
    before: 'desktop-03-header.png',
    files: ['index.html', 'js/itinerary.js', 'js/tabs.js', 'js/transport.js', 'style.css'],
    problem: 'Large portions of the UI are styled inline in HTML and JS builders. This makes responsive polish harder and causes repeated one-off spacing, colors, and typography.',
    fix: 'Move repeated inline styles into named classes and CSS variables, starting with modal forms, tab headers, and itinerary detail blocks.',
    after: 'Responsive behavior is controlled primarily from `style.css`, and markup builders focus on structure and data.',
    criteria: ['New polish work uses reusable CSS classes instead of new inline style blocks.', 'At least modal form layout styles are extracted.']
  }
];

function cleanPriority(priority) {
  if (priority.includes('Critical')) return 'Critical';
  if (priority.includes('Important')) return 'Important';
  return 'Polish';
}

function cssSnippet(issue) {
  if (issue.files.includes('style.css')) {
    return `\`\`\`css
/* BEFORE */
.target-selector { /* current layout clips, wraps, or undersizes at the tested viewport */ }

/* AFTER */
.target-selector { /* responsive layout meets the acceptance criteria for ${issue.id} */ }
\`\`\``;
  }
  return `\`\`\`js
// BEFORE
// Current builder renders the observed state directly.

// AFTER
// Builder emits structure/classes that satisfy ${issue.id}.
\`\`\``;
}

for (const issue of issues) {
  const body = `# [${issue.id}] ${issue.title}

| Field | Value |
|-------|-------|
| Priority | ${issue.priority} |
| Effort | ${issue.effort} |
| Dimension | ${issue.dimension} |
| Status | 🔲 Todo |
| Before screenshot | \`screenshots/before/${issue.before}\` |
| Proposal image | \`items/proposals/${issue.id}-proposal.png\` |
| Actual after screenshot | \`screenshots/after/${issue.id}-after.png\` (capture after implementation) |
| Files to change | ${issue.files.map(f => `\`${f}\``).join(' · ')} |

---

## Problem

${issue.problem}

## Before (current state)

> Screenshot: \`../screenshots/before/${issue.before}\`  
> Callout: Look at the affected area described above; the captured state shows the current failure mode for ${issue.id}.

## Proposed fix

${issue.fix}

${cssSnippet(issue)}

## Proposal image

![${issue.id} proposal](./proposals/${issue.id}-proposal.png)

## After (proposed state description)

${issue.after}

## Acceptance criteria

${issue.criteria.map(c => `- [ ] ${c}`).join('\n')}
- [ ] Regression check passes: \`node scripts/regression-city-nav.js\`

## How to implement

1. Open the listed source files and locate the selector or builder named in the proposed fix.
2. Apply the responsive or structural change without changing unrelated trip data behavior.
3. Re-run screenshots for the affected view and save the real completed state to \`screenshots/after/${issue.id}-after.png\`.
`;
  fs.writeFileSync(path.join(ITEMS, `${issue.id}.md`), body);

  if (!issue.priority.includes('Polish')) {
    fs.writeFileSync(path.join(AFTER, `${issue.id}-proposal.md`), `# ${issue.id} After Proposal - ${issue.title}

${issue.after}

Verification:
- Compare against \`../before/${issue.before}\`.
${issue.criteria.map(c => `- ${c}`).join('\n')}
`);
  }
}

const grouped = {
  '🔴 Critical': issues.filter(i => i.priority.includes('Critical')),
  '🟡 Important': issues.filter(i => i.priority.includes('Important')),
  '🟢 Polish': issues.filter(i => i.priority.includes('Polish'))
};

const tableRows = list => list.map(i => `| [${i.id}](./items/${i.id}.md) | ${i.title} | ${i.effort} | 🔲 Todo | - |`).join('\n');

fs.writeFileSync(path.join(POLISH, 'TRACKER.md'), `# Polish Sprint - Progress Tracker

Last updated: ${today}  
Progress: 0/${issues.length} items complete

---

## 🔴 Critical

| ID | Title | Effort | Status | Done |
|----|-------|--------|--------|------|
${tableRows(grouped['🔴 Critical'])}

## 🟡 Important

| ID | Title | Effort | Status | Done |
|----|-------|--------|--------|------|
${tableRows(grouped['🟡 Important'])}

## 🟢 Polish

| ID | Title | Effort | Status | Done |
|----|-------|--------|--------|------|
${tableRows(grouped['🟢 Polish'])}

---

## Completed ✅

| ID | Title | Completed |
|----|-------|-----------|
| - | - | - |

---

## How to update this file

When you finish a work item:
1. Change its Status cell to \`✅ Done\`
2. Fill in the Done date
3. Move the row to the Completed table at the bottom
4. Take an after screenshot -> save to \`screenshots/after/WI-XXX-after.png\`
5. Update the after screenshot reference in \`items/WI-XXX.md\`
6. Update the progress count at the top of this file
`);

const screenshotSections = [
  ['desktop-01-home.png', 'Desktop', ['Real trip data is visible and leg color coding gives orientation.', 'The full itinerary is dense but scannable on a large screen.'], ['Desktop app menu has wrapped into multiple rows.', 'City nav is horizontally clipped without a scroll cue.', 'Editing controls and add rows are visually noisy across every leg.']],
  ['desktop-02-menu-bar.png', 'Desktop', ['Filename badge is visible and high contrast.'], ['Only the first row is captured in the top 60px; controls are pushed below by wrapping.', 'Toolbar grouping is not resilient at 1440px.']],
  ['desktop-03-header.png', 'Desktop', ['Hero has strong brand character and readable title.', 'Subtitle communicates trip scope.'], ['Header edit affordance is implicit only.', 'Hero consumes vertical space that compounds with wrapped toolbar.']],
  ['desktop-04-tabs.png', 'Desktop', ['Primary tabs are clear and sticky.', 'City chips use flags/colors effectively.'], ['City chip rail overflows at desktop width with no fade/scrollbar.', 'Last visible chip is cut off.']],
  ['desktop-05-itinerary.png', 'Desktop', ['Expanded day content is functional and data-rich.', 'Transport/accommodation/activity sections are separated.'], ['Too many edit/delete/add affordances are always visible.', 'Activity assignment is drag/drop centric and not discoverable for touch.']],
  ['desktop-06-transport.png', 'Desktop', ['Chronological transport rows show real providers and routes.', 'Multi-leg journeys can expand.'], ['Table is dense and action affordances compete with data.', 'Same-city placeholder journeys create repetitive noise.']],
  ['desktop-07-budget.png', 'Desktop', ['Budget KPIs give immediate totals.', 'Leg breakdown exists below.'], ['Currency formatting uses raw decimals.', 'Budget table feels utilitarian compared with the rest of the app.']],
  ['desktop-08-packing.png', 'Desktop', ['Packing content is comprehensive.', 'Guide panels provide useful context.'], ['No at-a-glance progress summary.', 'Guide content competes with checklist tasks.']],
  ['desktop-09-map.png', 'Desktop', ['Map tab renders a visual route and stats.', 'Open in Google Maps actions are present.'], ['Map is a static SVG approximation, not an interactive map.', 'Several real cities are reported as unmapped.']],
  ['desktop-10-journey-modal.png', 'Desktop', ['Journey modal supports multi-segment editing.', 'Segment tracker gives useful context.'], ['Modal relies heavily on inline fixed rows.', 'Footer action grouping will not translate to small screens.']],
  ['desktop-11-ai-builder.png', 'Desktop', ['AI Builder purpose is understandable.', 'Form fields are simple.'], ['Fields are blank despite real trip data.', 'No explanation that output is a prompt only.']],
  ['desktop-12-mobile-menu.png', 'Mobile', ['Bottom sheet groups actions and uses large buttons.', 'Primary mobile-only controls are available.'], ['Export/file actions lack explanatory subtitles.', 'Sheet contains many equally weighted controls.']],
  ['mobile-01-home.png', 'Mobile', ['Trip title remains readable.', 'Important controls are reachable.'], ['Top chrome and hero consume too much of the viewport.', 'Accommodation tab is clipped.', 'City nav has no scroll affordance.']],
  ['mobile-02-header.png', 'Mobile', ['Hero typography has personality.', 'Subtitle wraps legibly.'], ['Editable title/subtitle can trigger keyboard unexpectedly.', 'Header height pushes itinerary content down.']],
  ['mobile-03-tabs.png', 'Mobile', ['Sticky nav keeps route filters close.'], ['Primary and city navs both hide overflow without cues.', 'City pills are slightly below 44px target.']],
  ['mobile-04-menu-open.png', 'Mobile', ['Action sheet uses large comfortable buttons.', 'Close icon is visible.'], ['Close target has no explicit 44px guarantee.', 'Export actions need helper subtitles.']],
  ['mobile-05-itinerary.png', 'Mobile', ['Expanded itinerary card is readable.', 'Large controls are easy to tap.'], ['Card is over-scaled; only a small part of the day fits.', 'Drag assignment affordance has no touch implementation.']],
  ['mobile-06-transport.png', 'Mobile', ['Routes and dates are visible.', 'Multi-leg routes are distinguishable.'], ['Transport remains table-like and inefficient on mobile.', 'Edit/actions are not visible in the main scan.']],
  ['mobile-07-budget.png', 'Mobile', ['Grand total is prominent.', 'Leg cards are separated with color rails.'], ['Raw decimal currency looks broken.', 'KPI grid stacks into very tall blocks.']],
  ['mobile-08-journey-modal-top.png', 'Mobile', ['Modal opens with existing journey data.', 'Segment context is clear.'], ['Form and footer clip horizontally.', 'Transport type buttons and date/time inputs overflow.']],
  ['mobile-09-journey-modal-bottom.png', 'Mobile', ['Footer can be reached after scrolling.'], ['Footer buttons remain clipped and crowded.', 'Save action is partially offscreen.']],
  ['mobile-10-ai-builder.png', 'Mobile', ['Fields are large and readable.', 'Generate button is prominent.'], ['No real trip data is prefilled.', 'Long placeholders clip horizontally.']],
  ['mobile-11-city-nav-overflow.png', 'Mobile', ['City filters are large and visually clear.'], ['Most city chips are hidden with no fade/arrow.', 'The visible edge cuts through a chip.']]
].map(([file, view, working, found]) => `### ${file}
**View:** ${view}  
**What's working:**  
${working.map(x => `- ${x}`).join('\n')}  
**Issues found:**  
${found.map((x, idx) => `${idx + 1}. ${x}`).join('\n')}
`).join('\n');

const criticalCount = grouped['🔴 Critical'].length;
const importantCount = grouped['🟡 Important'].length;
const polishCount = grouped['🟢 Polish'].length;

fs.writeFileSync(path.join(POLISH, 'AUDIT.md'), `# APP_POLISH_AUDIT.md
## Travel Planner PWA - UI/UX & Mobile Polish Audit

**Audit date:** ${today}  
**Viewports tested:** Desktop 1440x900 · iPhone 12 Pro 390x844  
**Real data used:** 2026_June_July_Europe_Thailand.json  

---

## Executive Summary

| Metric | Value |
|--------|-------|
| Total issues | ${issues.length} |
| 🔴 Critical | ${criticalCount} |
| 🟡 Important | ${importantCount} |
| 🟢 Polish | ${polishCount} |
| Estimated total effort | 68-118 hours |
| Design maturity (1-10) | 6/10 |
| Single biggest win | Fix the mobile chrome/nav/modal overflow first so the app feels intentionally responsive. |

### Top 5 highest-impact changes
1. Collapse the desktop menu into one row and reduce mobile app chrome height.
2. Rebuild the mobile journey modal layout to eliminate horizontal clipping.
3. Add visible overflow affordances to the primary tab and city nav rails.
4. Replace the mobile transport table with compact journey cards.
5. Normalize budget currency formatting and KPI density.

---

## Screenshot Analysis

${screenshotSections}
---

## Known suspects - explicitly check each one

| Suspect | Location | Check |
|---------|----------|-------|
| App menu bar 14-button overflow | \`.app-menu-bar\` | Fails. Desktop measured 154px high at 1440px and wraps controls into multiple rows. |
| Journey modal height on mobile | \`#journey-modal .modal-content\` | Fails. Content is scrollable but horizontal clipping affects fields and footer actions; footer is reachable but not fully usable. |
| "Accommodation" tab truncation | \`.app-tab-btn[data-tab="accom"]\` | Fails. At 390px the label is visibly cropped to "Accomm" in the tab rail. |
| contenteditable H1 tap-to-edit | \`#mainTitle\`, \`#mainSubtitle\` | Risk confirmed in source. Both are contenteditable in edit mode and can focus on mobile tap. |
| Transport type button row | \`.transport-type-group\` | Fails. Five buttons do not fit cleanly in the 390px modal; row is clipped. |
| From→To date+time inputs | \`#journeyDateFrom\` + \`#journeyTimeFrom\` | Fails. Inline date/time pairs overflow horizontally in mobile modal. |
| City nav scroll affordance | \`.city-nav-list\` | Fails. Scrollbar is hidden; mobile scrollWidth is 1829px with no visible fade/arrow. |
| Modal close button tap target | \`.modal-close\` | Fails by CSS guarantee. No min-width/min-height is set, so 44x44 is not guaranteed. |
| Drag handle affordance on mobile | Draggable activity cards | Fails functionally. Drag/drop module only handles desktop HTML5 drag events. |
| Map tab placeholder | \`#tab-map\` | Partial fail. It renders an SVG route, not a real interactive map, and reports unmapped real cities. |
| Mobile menu 4 export buttons | \`#mobileMenuSheet\` | Fails. Buttons are clear but lack subtitles explaining differences. |
| Budget KPI grid at 390px | \`.budget-kpi-grid\` | Partial fail. Cards wrap without horizontal overflow, but stack very tall and raw decimals look broken. |

---

## Aesthetic Review

### Design maturity: 6/10

**Strengths:**
- Strong type pairing with Playfair Display and DM Sans gives the app personality.
- Color-coded trip legs make the itinerary memorable and useful.
- Real data density is high; the app is functionally capable.

**Weaknesses:**
- Responsive behavior is inconsistent because many layouts are inline-styled in JS/HTML.
- Mobile uses oversized desktop aesthetics rather than purpose-built compact layouts.
- Scrollable navs hide overflow cues, making content feel clipped.
- Editing controls are too prominent in default browsing.

| Benchmark | What they do better | Takeaway for this app |
|-----------|--------------------|-----------------------|
| Wanderlog | Mobile cards prioritize route, date, and action hierarchy. | Convert dense tables into cards on mobile. |
| TripIt | Itinerary segments are compact and travel-document focused. | Reduce always-visible editing controls. |
| Linear (UI patterns) | Action density is managed with grouped menus and crisp hierarchy. | Group secondary app actions and define shared components. |
| Notion | Editing is powerful but quiet until focus/hover. | Make read mode feel like the default, with editing intentional. |

### Typography assessment
Playfair Display works well for the brand-level trip title and modal headings, but it is overused at mobile scale. DM Sans remains readable, but mobile font sizes are often too large for data-heavy screens.

### Colour + contrast
The navy menu/header palette has strong contrast with white text. Some muted grey labels and disabled controls are low contrast, especially ghost undo/redo pills on mobile.

### Visual hierarchy
The app has strong top-level hierarchy but weak second-level hierarchy. Itinerary edit affordances, add rows, status badges, and content all compete visually.

---

## Mobile tap target audit

| Element | Selector | Estimated size | Min required | Pass/Fail |
|---------|----------|---------------|--------------|-----------|
| Tab buttons | \`.app-tab-btn\` | ~51px high | 44px | Pass |
| ☰ Menu button | \`.mobile-menu-btn\` | 71x40 | 44px | Fail height |
| Modal close | \`.modal-close\` | not guaranteed by CSS | 44px | Fail |
| Action buttons | \`.action-btn\` | ~40px high | 44px | Fail |
| City nav buttons | \`.city-nav-btn\` | ~67x42 | 44px | Fail height |
| Expand/collapse | \`#expandAll\` | large mobile button visually passes, base action style 40px | 44px | Mixed |

---

## Modal usability on mobile

| Modal | Scrollable? | Footer reachable? | Rating |
|-------|-------------|-------------------|--------|
| Journey | Yes | Reachable but clipped | ❌ |
| Add Stay | Likely yes from shared modal styles | Not screenshot-tested | ⚠️ |
| Add Leg | Likely yes from shared modal styles | Not screenshot-tested | ⚠️ |
| Cities | Likely yes from shared modal styles | Not screenshot-tested | ⚠️ |
| AI Builder | Yes | Main action reachable in screenshot | ⚠️ |
| Print Preview | Not present in captured flows | Not tested | ⚠️ |
| Guide | Likely yes from shared modal styles | Not screenshot-tested | ⚠️ |

---

## Functional gaps

| Gap | Severity | Notes |
|-----|----------|-------|
| Map tab is not a real interactive map | 🔴 High | SVG approximation; Leaflet recommended. |
| Touch assignment for suggested activities | 🔴 High | Drag/drop relies on desktop drag events only. |
| AI Builder does not use current trip context | 🟡 Medium | Blank fields duplicate data entry. |
| Budget formatting is inconsistent | 🟡 Medium | Raw decimal output undermines trust. |
| Mobile transport is table-first | 🔴 High | Needs a card-first mobile layout. |

---

## Files created

| File | Purpose |
|------|---------|
| \`TRACKER.md\` | Day-to-day progress tracker |
| \`items/WI-001.md\` ... \`items/WI-${String(issues.length).padStart(3, '0')}.md\` | Individual work items |
| \`screenshots/before/\` | 23 screenshots captured |
| \`screenshots/after/\` | Proposal notes for Critical and Important items |

## Recommended order of attack

Work through items in this order for maximum visible improvement fastest:

1. [WI-003] - Journey Modal Clips Horizontally On Mobile - fixes the most severe mobile task failure.
2. [WI-002] - Mobile Top Chrome Consumes Too Much Viewport - immediately improves first impression.
3. [WI-004] - Primary Tab Strip Crops Labels On Mobile - improves navigation confidence.
4. [WI-005] - City Nav Overflow Has No Scroll Affordance - makes hidden trip cities discoverable.
5. [WI-007] - Budget Mobile Numbers Look Like Broken Precision - quick trust improvement.
6. [WI-001] - Desktop App Menu Wraps Into A 154px Header - restores desktop polish.
7. [WI-006] - Mobile Transport Table Is Dense And Loses Actions - largest mobile content win.

## Definition of done for the full sprint

- [ ] All 🔴 Critical items resolved
- [ ] All 🟡 Important items resolved
- [ ] Regression check passing
- [ ] After screenshots taken for all completed items
- [ ] TRACKER.md showing 100% complete
`);

console.log(`Generated ${issues.length} work items, tracker, audit, and proposal notes.`);
