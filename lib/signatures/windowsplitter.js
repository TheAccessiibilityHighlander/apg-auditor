/**
 * APG Pattern: Window Splitter
 * https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/
 *
 * Design notes:
 * - A Window Splitter is a draggable separator that resizes two adjacent panels.
 *   It uses role="separator" with aria-valuenow to represent the current split position.
 * - role="separator" has two modes: static (non-focusable, purely visual) and
 *   focusable (interactive, resizes panels). Only the focusable variant is a Window
 *   Splitter; static separators are not interactive and don't need this signature.
 * - aria-valuenow, aria-valuemin, aria-valuemax define the splitter's position range.
 *   aria-valuetext may provide a human-readable description (e.g., "sidebar: 240px").
 * - Arrow keys move the splitter:
 *   - Horizontal splitter (aria-orientation="horizontal"): Up/Down keys
 *   - Vertical splitter (default): Left/Right keys
 * - Home moves the splitter to minimum position; End moves to maximum.
 *   Enter may restore a default/previous position.
 * - The responds-to-key check uses expect:'value-change' since the aria-valuenow
 *   changes, not focus position.
 */
export default {
  patternName: 'Window Splitter',
  patternUrl: 'https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/',

  keyboardInteractions: [
    'ArrowLeft / ArrowRight: Moves a vertical splitter left or right by one step.',
    'ArrowUp / ArrowDown: Moves a horizontal splitter up or down by one step.',
    'Home: Moves splitter to minimum position (collapses one panel).',
    'End: Moves splitter to maximum position (maximizes one panel).',
    'Enter (optional): Restores the splitter to a default or last non-collapsed position.',
  ],

  requiredRoles: ['separator (focusable variant — must be in the tab sequence)'],
  requiredAttributes: [
    'aria-valuenow (current position as a numeric value)',
    'aria-valuemin (minimum position)',
    'aria-valuemax (maximum position)',
    'aria-orientation ("horizontal" or "vertical" — defaults to "horizontal" per ARIA spec)',
    'aria-controls (references the IDs of the panels being separated)',
  ],
  requiredStates: [
    'aria-valuenow updates as the splitter moves.',
  ],

  commonFailures: [
    'role="separator" is non-focusable — keyboard users cannot resize panels.',
    'aria-valuenow is absent — AT cannot announce the current panel size.',
    'Arrow keys do not change the splitter position.',
  ],

  signals: [
    {
      id: 'role-separator',
      description: 'Element has role="separator" (focusable)',
      weight: 10,
      required: true,
      check: { kind: 'role-equals', role: 'separator' },
    },
    {
      id: 'in-tab-order',
      description: 'Splitter is keyboard focusable (tabindex >= 0)',
      weight: 8,
      required: true,
      check: { kind: 'in-tab-order' },
    },
    {
      id: 'aria-valuenow-present',
      description: 'aria-valuenow specifies the current split position',
      weight: 9,
      required: true,
      check: { kind: 'attr-present', attr: 'aria-valuenow' },
    },
    {
      id: 'aria-valuemin-present',
      description: 'aria-valuemin specifies the minimum position',
      weight: 7,
      required: false,
      check: { kind: 'attr-present', attr: 'aria-valuemin' },
    },
    {
      id: 'aria-valuemax-present',
      description: 'aria-valuemax specifies the maximum position',
      weight: 7,
      required: false,
      check: { kind: 'attr-present', attr: 'aria-valuemax' },
    },
    {
      id: 'aria-orientation-present',
      description: 'aria-orientation specifies the split axis',
      weight: 5,
      required: false,
      check: { kind: 'attr-present', attr: 'aria-orientation' },
    },
    {
      id: 'aria-controls-present',
      description: 'aria-controls links splitter to the panels it resizes',
      weight: 6,
      required: false,
      check: { kind: 'attr-present', attr: 'aria-controls' },
    },
    {
      id: 'arrow-right-changes-value',
      description: 'ArrowRight moves the splitter position',
      weight: 9,
      required: false,
      check: { kind: 'responds-to-key', key: 'ArrowRight', expect: 'value-change' },
    },
    {
      id: 'arrow-left-changes-value',
      description: 'ArrowLeft moves the splitter position',
      weight: 8,
      required: false,
      check: { kind: 'responds-to-key', key: 'ArrowLeft', expect: 'value-change' },
    },
  ],
};
