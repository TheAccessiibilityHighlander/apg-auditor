/**
 * APG Pattern: Carousel (Slide Show)
 * https://www.w3.org/WAI/ARIA/apg/patterns/carousel/
 *
 * Design notes:
 * - A carousel presents a rotating series of content slides. APG identifies two
 *   variants: auto-rotating and static. Auto-rotating carousels MUST have a pause
 *   control; static carousels only have previous/next controls.
 * - The carousel container should have role="region" with an accessible name.
 *   Each slide has role="group" with aria-roledescription="slide" and an accessible
 *   name (e.g., "1 of 5").
 * - aria-roledescription is the key AT signal for this pattern — it announces
 *   "slide" rather than "group" to convey carousel context.
 * - Previous/Next controls must be standard buttons (not divs) and are required.
 * - Rotation controls: the pause/play button is required if auto-rotation is present.
 *   Since passive fingerprinting cannot detect whether rotation is active, the
 *   pause-control signal is optional and scored based on presence.
 * - Tab key must not cycle through inactive slides — only the active slide's
 *   interactive content should be in the tab sequence.
 */
export default {
  patternName: 'Carousel',
  patternUrl: 'https://www.w3.org/WAI/ARIA/apg/patterns/carousel/',

  keyboardInteractions: [
    'Tab: Moves focus through the carousel controls (previous, next, pause/play) and into the active slide.',
    'Enter / Space: Activates the focused control (previous, next, or pause/play button).',
  ],

  requiredRoles: [
    'region (on the carousel container)',
    'group (on each slide, with aria-roledescription="slide")',
    'button (previous/next controls)',
  ],
  requiredAttributes: [
    'aria-label or aria-labelledby (on the carousel region)',
    'aria-roledescription="slide" (on each slide group)',
    'aria-label (on each slide — e.g., "Slide 1 of 5")',
    'aria-label (on previous/next buttons — describing their action)',
  ],
  requiredStates: [
    'aria-hidden="true" on slides that are not currently visible.',
  ],

  commonFailures: [
    'No pause control for auto-rotating carousels — WCAG 2.2.2 violation.',
    'Inactive slides are not hidden from AT (missing aria-hidden) — AT users hear all slide content.',
    'Previous/Next controls are non-semantic divs without role="button" or keyboard support.',
    'aria-roledescription="slide" is absent — AT announces each slide as a generic group.',
  ],

  signals: [
    {
      id: 'role-region',
      description: 'Container has role="region"',
      weight: 7,
      required: false,
      check: { kind: 'role-equals', role: 'region' },
    },
    {
      id: 'aria-label-present',
      description: 'Carousel region has an accessible label',
      weight: 6,
      required: false,
      check: { kind: 'attr-present', attr: 'aria-label' },
    },
    {
      id: 'aria-roledescription-present',
      description: 'Slides carry aria-roledescription (typically "slide")',
      weight: 8,
      required: false,
      check: { kind: 'attr-present', attr: 'aria-roledescription' },
    },
    {
      id: 'has-group-slides',
      description: 'Contains descendant elements with role="group" (the slides)',
      weight: 7,
      required: false,
      check: { kind: 'has-descendant-role', role: 'group' },
    },
    {
      id: 'prev-next-buttons',
      description: 'Contains button controls for navigating slides',
      weight: 8,
      required: true,
      check: { kind: 'has-descendant-role', role: 'button' },
    },
    {
      id: 'in-tab-order',
      description: 'Navigation controls are reachable by Tab',
      weight: 6,
      required: true,
      check: { kind: 'in-tab-order' },
    },
    {
      id: 'enter-activates',
      description: 'Enter activates the focused navigation button',
      weight: 7,
      required: false,
      check: { kind: 'responds-to-key', key: 'Enter', expect: 'activation' },
    },
  ],
};
