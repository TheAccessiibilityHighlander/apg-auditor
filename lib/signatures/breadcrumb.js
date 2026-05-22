/**
 * APG Pattern: Breadcrumb
 * https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/
 *
 * Design notes:
 * - Breadcrumb is a navigation landmark (<nav>) containing an ordered list of links
 *   representing the current page's position in the site hierarchy.
 * - The <nav> must have an accessible name (aria-label="Breadcrumb" or similar) to
 *   distinguish it from other navigation landmarks on the page.
 * - The current page link (last item) must carry aria-current="page". This is the
 *   primary AT signal for the breadcrumb pattern.
 * - Breadcrumb is primarily a structural/semantic pattern. Keyboard interaction is
 *   standard link behavior (Tab to focus, Enter to activate) — no custom key handling.
 * - The ordered list (<ol>) is semantically appropriate but not strictly required;
 *   an unordered list or flat list of links can also form a valid breadcrumb.
 */
export default {
  patternName: 'Breadcrumb',
  patternUrl: 'https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/',

  keyboardInteractions: [
    'Tab: Moves focus to each link in the breadcrumb trail.',
    'Enter: Navigates to the focused link\'s destination.',
  ],

  requiredRoles: ['navigation (wrapping <nav> element)'],
  requiredAttributes: [
    'aria-label (on the <nav> — e.g., "Breadcrumb" — to distinguish from other navs)',
    'aria-current="page" (on the link representing the current page)',
  ],
  requiredStates: [
    'aria-current="page" on the last/current item in the breadcrumb trail.',
  ],

  commonFailures: [
    'aria-current="page" is absent on the current page item — AT cannot identify the user\'s current location.',
    'The breadcrumb <nav> lacks an aria-label — screen readers announce it as a generic "navigation" landmark.',
    'Links are replaced with non-interactive spans for the current page — the current page item should still be a link or carry aria-current.',
  ],

  signals: [
    {
      id: 'nav-landmark',
      description: 'Wrapped in a <nav> element or element with role="navigation"',
      weight: 8,
      required: true,
      check: { kind: 'role-equals', role: 'navigation' },
    },
    {
      id: 'aria-label-present',
      description: 'The nav element carries an accessible label (aria-label or aria-labelledby)',
      weight: 7,
      required: false,
      check: { kind: 'attr-present', attr: 'aria-label' },
    },
    {
      id: 'aria-current-present',
      description: 'aria-current="page" marks the current page item',
      weight: 9,
      required: true,
      check: { kind: 'attr-present', attr: 'aria-current' },
    },
    {
      id: 'has-link-role',
      description: 'Contains descendant elements with role="link"',
      weight: 7,
      required: false,
      check: { kind: 'has-descendant-role', role: 'link' },
    },
    {
      id: 'ordered-list-tag',
      description: 'Built on an <ol> element (semantically appropriate for ordered trail)',
      weight: 3,
      required: false,
      check: { kind: 'tag-in', tags: ['ol'] },
    },
  ],
};
