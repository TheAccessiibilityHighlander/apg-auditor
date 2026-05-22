/**
 * APG Pattern: Grid
 * https://www.w3.org/WAI/ARIA/apg/patterns/grid/
 *
 * Design notes:
 * - Grid vs Table is the primary distinction this signature must get right.
 *   The decisive signals are: role="grid" (explicit declaration) AND
 *   two-dimensional arrow key navigation between cells AND roving-tabindex.
 *   A <table> with role="grid" but NO arrow-key handling scores Table > Grid
 *   (see scorer fixture in the spec). The role alone is insufficient.
 * - role-grid is required:true. A table without it cannot be a Grid in the
 *   APG sense regardless of keyboard behavior.
 * - Arrow key signals are required:true because they are the DEFINING
 *   behavioral difference from the Table pattern. Without them, the component
 *   is a table with a misapplied role, not a grid.
 * - has-gridcell is required:true because gridcell is the atomic interactive
 *   unit — its absence means there is nothing to navigate to.
 * - Native <table> tag gets a moderate bonus; grids are often but not always
 *   table-based (CSS grid layouts with role="grid" are valid too).
 */
export default {
  patternName: 'Grid',
  patternUrl: 'https://www.w3.org/WAI/ARIA/apg/patterns/grid/',

  keyboardInteractions: [
    'ArrowRight: Moves focus one cell to the right.',
    'ArrowLeft: Moves focus one cell to the left.',
    'ArrowDown: Moves focus one cell down.',
    'ArrowUp: Moves focus one cell up.',
    'Home: Moves focus to first cell in the row; with Ctrl, first cell in the grid.',
    'End: Moves focus to last cell in the row; with Ctrl, last cell in the grid.',
    'Page Down / Page Up: Moves focus down/up by author-determined number of rows.',
    'Tab: Moves focus to next interactive element within the focused cell.',
    'Enter: If cell contains an actionable widget, opens edit mode or activates the widget.',
  ],

  requiredRoles: [
    'grid (on the container)',
    'row (on each row)',
    'gridcell (on each data cell)',
    'columnheader (on column headers, if present)',
    'rowheader (on row headers, if present)',
  ],
  requiredAttributes: [
    'aria-rowcount (when not all rows are rendered in the DOM)',
    'aria-colcount (when not all columns are rendered in the DOM)',
    'aria-rowindex (on each row when using aria-rowcount)',
    'aria-colindex (on each cell when using aria-colcount)',
  ],
  requiredStates: [
    'aria-selected (on rows or cells when selection is supported)',
    'aria-readonly (on cells that cannot be edited)',
    'aria-expanded (on rows that can be expanded in a hierarchical grid)',
  ],

  commonFailures: [
    'role="grid" is declared but arrow key navigation between cells is not implemented — the component behaves as a plain table.',
    'Cells are missing role="gridcell" or role="columnheader" — the grid structure is invisible to assistive technology.',
    'roving tabindex is absent — all cells are in the tab sequence instead of only the active cell, creating an overwhelming Tab stop count.',
  ],

  signals: [
    {
      id: 'role-grid',
      description: 'Container has role="grid"',
      weight: 10,
      required: true,
      check: { kind: 'role-equals', role: 'grid' },
    },
    {
      id: 'native-table-tag',
      description: 'Built on a native <table> element',
      weight: 4,
      required: false,
      check: { kind: 'tag-in', tags: ['table'] },
    },
    {
      id: 'has-gridcell',
      description: 'Contains descendant elements with role="gridcell"',
      weight: 9,
      required: true,
      check: { kind: 'has-descendant-role', role: 'gridcell' },
    },
    {
      id: 'roving-tabindex',
      description: 'Uses roving tabindex — only one cell is in the tab sequence at a time',
      weight: 8,
      required: true,
      check: { kind: 'roving-tabindex' },
    },
    {
      id: 'arrow-right-moves-focus',
      description: 'ArrowRight moves focus to adjacent cell',
      weight: 9,
      required: true,
      check: { kind: 'responds-to-key', key: 'ArrowRight', expect: 'focus-move' },
    },
    {
      id: 'arrow-down-moves-focus',
      description: 'ArrowDown moves focus to cell below',
      weight: 9,
      required: true,
      check: { kind: 'responds-to-key', key: 'ArrowDown', expect: 'focus-move' },
    },
    {
      id: 'arrow-left-moves-focus',
      description: 'ArrowLeft moves focus to adjacent cell',
      weight: 7,
      required: false,
      check: { kind: 'responds-to-key', key: 'ArrowLeft', expect: 'focus-move' },
    },
    {
      id: 'arrow-up-moves-focus',
      description: 'ArrowUp moves focus to cell above',
      weight: 7,
      required: false,
      check: { kind: 'responds-to-key', key: 'ArrowUp', expect: 'focus-move' },
    },
    {
      id: 'has-row-role',
      description: 'Contains descendant elements with role="row"',
      weight: 5,
      required: false,
      check: { kind: 'has-descendant-role', role: 'row' },
    },
  ],
};
