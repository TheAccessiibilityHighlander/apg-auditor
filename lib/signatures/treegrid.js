/**
 * APG Pattern: Treegrid
 * https://www.w3.org/WAI/ARIA/apg/patterns/treegrid/
 *
 * Design notes:
 * - Treegrid combines Tree View (hierarchical rows) with Grid (two-axis navigation
 *   and interactive cells). Each row is a treeitem; each cell in the row is a gridcell.
 * - role="treegrid" on the container. Rows have role="row" (with treeitem behavior);
 *   cells have role="gridcell".
 * - The decisive distinguisher from Tree View: gridcell children + horizontal arrow
 *   key navigation between cells. Without gridcells, it is a plain tree.
 * - The decisive distinguisher from Grid: aria-expanded on rows + vertical tree
 *   navigation (rows can be expanded/collapsed). Without tree behavior, it is a grid.
 * - Both axis navigations are required: ArrowDown/Up for row navigation,
 *   ArrowRight/Left for cell navigation. Row expand/collapse is also ArrowRight/Left
 *   depending on context (at first cell: ArrowRight expands; at row level: ArrowLeft collapses).
 * - roving-tabindex is used to manage which cell is in the tab sequence.
 */
export default {
  patternName: 'Treegrid',
  patternUrl: 'https://www.w3.org/WAI/ARIA/apg/patterns/treegrid/',

  keyboardInteractions: [
    'ArrowRight: If row is collapsed, expands it. If expanded, moves to first cell.',
    'ArrowLeft: If at first cell, collapses the row. Otherwise, moves to previous cell.',
    'ArrowDown: Moves focus to same cell in next row.',
    'ArrowUp: Moves focus to same cell in previous row.',
    'Tab: Moves focus to next interactive element in the focused cell.',
    'Home: Moves focus to first cell in the row; Ctrl+Home moves to first cell in the grid.',
    'End: Moves focus to last cell in the row; Ctrl+End moves to last cell.',
  ],

  requiredRoles: [
    'treegrid (on the container)',
    'row (on each row)',
    'gridcell (on each data cell)',
  ],
  requiredAttributes: [
    'aria-expanded="true"/"false" (on rows that have child rows)',
    'aria-level (on each row — depth in the hierarchy)',
    'aria-setsize / aria-posinset (on rows within their parent group)',
  ],
  requiredStates: [
    'aria-expanded reflects row expanded/collapsed state.',
  ],

  commonFailures: [
    'role="gridcell" is absent on cells — AT cannot navigate cells horizontally.',
    'aria-expanded is absent on parent rows — AT cannot announce tree structure.',
    'Arrow key navigation (both axes) is not implemented.',
  ],

  signals: [
    {
      id: 'role-treegrid',
      description: 'Container has role="treegrid"',
      weight: 10,
      required: true,
      check: { kind: 'role-equals', role: 'treegrid' },
    },
    {
      id: 'has-row-role',
      description: 'Contains descendant elements with role="row"',
      weight: 7,
      required: false,
      check: { kind: 'has-descendant-role', role: 'row' },
    },
    {
      id: 'has-gridcell-role',
      description: 'Contains descendant elements with role="gridcell"',
      weight: 9,
      required: true,
      check: { kind: 'has-descendant-role', role: 'gridcell' },
    },
    {
      id: 'aria-expanded-present',
      description: 'Parent rows carry aria-expanded for tree behavior',
      weight: 8,
      required: false, // aria-expanded is on individual rows, not on the treegrid container
      check: { kind: 'attr-present', attr: 'aria-expanded' },
    },
    {
      id: 'in-tab-order',
      description: 'Treegrid has a single tab stop',
      weight: 6,
      required: true,
      check: { kind: 'in-tab-order' },
    },
    {
      id: 'arrow-down-moves-focus',
      description: 'ArrowDown moves focus to next row',
      weight: 9,
      required: true,
      check: { kind: 'responds-to-key', key: 'ArrowDown', expect: 'focus-move' },
    },
    {
      id: 'arrow-right-moves-focus',
      description: 'ArrowRight moves focus to next cell or expands row',
      weight: 9,
      required: true,
      check: { kind: 'responds-to-key', key: 'ArrowRight', expect: 'focus-move' },
    },
    {
      id: 'roving-tabindex',
      description: 'Uses roving tabindex — only the active cell is in the tab sequence',
      weight: 7,
      required: false,
      check: { kind: 'roving-tabindex' },
    },
  ],
};
