/**
 * APG Pattern: Landmark Regions
 * https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/
 *
 * Design notes:
 * - Landmark regions provide navigable page structure for AT users. Screen reader
 *   users can jump between landmarks using keyboard shortcuts (F6 or D in NVDA,
 *   R in VoiceOver).
 * - This signature targets a single landmark element. The fingerprinter may match
 *   any element with a landmark role: banner, main, navigation, complementary,
 *   contentinfo, search, form, region.
 * - The signal set is ROLE-ONLY — landmarks are structural, not interactive.
 *   No keyboard interaction signals are used.
 * - Each landmark role has a native HTML equivalent:
 *     banner → <header> (at document level)
 *     main → <main>
 *     navigation → <nav>
 *     complementary → <aside>
 *     contentinfo → <footer> (at document level)
 *     search → <search> (HTML 5.4) or role="search"
 *     form → <form> with accessible name
 *     region → <section> with accessible name
 * - Multiple instances of the same landmark role (e.g., two <nav>s) MUST each
 *   have a unique accessible label (aria-label or aria-labelledby) so AT users
 *   can distinguish them.
 * - The confidences for landmark regions will be lower than widget patterns because
 *   the signal set is small. The scorer should accept this lower ceiling.
 */
export default {
  patternName: 'Landmark Regions',
  patternUrl: 'https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/',

  keyboardInteractions: [
    '(AT-provided shortcuts — not implemented by the page.)',
    'Screen reader shortcut: Navigate to next/previous landmark region.',
  ],

  requiredRoles: [
    'banner (page header — typically <header>)',
    'main (primary page content — <main>)',
    'navigation (nav links — <nav>)',
    'complementary (supporting content — <aside>)',
    'contentinfo (page footer — <footer>)',
    'search (search widget — <search> or role="search")',
    'form (labeled form region — <form> with name)',
    'region (labeled generic section — <section> with name)',
  ],
  requiredAttributes: [
    'aria-label or aria-labelledby (required when multiple landmarks of the same type exist)',
  ],
  requiredStates: [],

  commonFailures: [
    '<div> wrappers are used instead of semantic landmark elements.',
    'Multiple <nav> elements are present without distinguishing aria-label values.',
    'The page has no <main> landmark — AT cannot skip directly to page content.',
    '<header> and <footer> are used inside <article> or <section> (they lose landmark role in that context).',
  ],

  signals: [
    {
      id: 'has-landmark-role',
      description: 'Element has one of the eight landmark roles',
      weight: 10,
      required: true,
      check: {
        kind: 'role-in',
        roles: ['banner', 'main', 'navigation', 'complementary', 'contentinfo', 'search', 'form', 'region'],
      },
    },
    {
      id: 'native-landmark-tag',
      description: 'Implemented with a native semantic HTML landmark element',
      weight: 6,
      required: false,
      check: { kind: 'tag-in', tags: ['header', 'main', 'nav', 'aside', 'footer', 'search', 'form', 'section'] },
    },
    {
      id: 'aria-label-present',
      description: 'Landmark has an accessible label (required when duplicates exist)',
      weight: 5,
      required: false,
      check: { kind: 'attr-present', attr: 'aria-label' },
    },
    {
      id: 'aria-labelledby-present',
      description: 'Landmark is labeled via aria-labelledby',
      weight: 5,
      required: false,
      check: { kind: 'attr-present', attr: 'aria-labelledby' },
    },
  ],
};
