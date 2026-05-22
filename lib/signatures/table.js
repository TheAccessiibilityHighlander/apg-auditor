/**
 * APG Pattern: Table
 * https://www.w3.org/WAI/ARIA/apg/patterns/table/
 *
 * Design notes:
 * - Table presents tabular data. It is NOT interactive in the APG sense — users
 *   Tab through any interactive elements within cells, but there is no arrow-key
 *   navigation between cells. This is the primary distinguisher from Grid.
 * - role="table" (or native <table>) on the container.
 *   role="row", role="cell"/"columnheader"/"rowheader" on children.
 * - The absence of arrow-key navigation and roving-tabindex is a negative signal
 *   for Grid and a positive signal for Table. The scorer uses this inverse logic.
 * - Native <table> with proper <th> and <td> semantics is the preferred implementation.
 *   ARIA table roles are used when semantic HTML tables are not possible (e.g., CSS grid layout).
 * - aria-sort on column headers indicates sortable columns.
 * - If the table has a caption, <caption> or aria-labelledby should associate it.
 */
export default {
  patternName: 'Table',
  patternUrl: 'https://www.w3.org/WAI/ARIA/apg/patterns/table/',

  keyboardInteractions: [
    'Tab: Moves focus through any interactive elements within table cells.',
    '(No arrow key navigation between cells — that is the Grid pattern.)',
  ],

  requiredRoles: [
    'table (on the container)',
    'row (on each row)',
    'cell / columnheader / rowheader (on each cell)',
  ],
  requiredAttributes: [
    'aria-label or aria-labelledby (provides an accessible name for the table)',
    'aria-sort (on sortable column headers — "ascending", "descending", "none")',
    'aria-rowcount / aria-colcount (when not all rows/columns are rendered)',
  ],
  requiredStates: [
    'aria-sort reflects the current sort direction on the active sort column.',
  ],

  commonFailures: [
    'Table lacks an accessible name — AT announces it as a generic table with no context.',
    'Column headers are styled <div>s or <td>s without <th> or role="columnheader".',
    'role="grid" is used on a non-interactive table, creating false AT expectations.',
  ],

  signals: [
    {
      id: 'role-table',
      description: 'Container has role="table"',
      weight: 9,
      required: false,
      check: { kind: 'role-equals', role: 'table' },
    },
    {
      id: 'native-table-tag',
      description: 'Implemented as a native <table> element',
      weight: 7,
      required: false,
      check: { kind: 'tag-in', tags: ['table'] },
    },
    {
      id: 'has-row-role',
      description: 'Contains descendant elements with role="row"',
      weight: 7,
      required: true,
      check: { kind: 'has-descendant-role', role: 'row' },
    },
    {
      id: 'has-columnheader-role',
      description: 'Contains role="columnheader" or <th> elements',
      weight: 6,
      required: false,
      check: { kind: 'has-descendant-role', role: 'columnheader' },
    },
    {
      id: 'has-cell-role',
      description: 'Contains role="cell" or <td> elements',
      weight: 6,
      required: false,
      check: { kind: 'has-descendant-role', role: 'cell' },
    },
    {
      id: 'aria-label-present',
      description: 'Table has an accessible name',
      weight: 6,
      required: false,
      check: { kind: 'attr-present', attr: 'aria-label' },
    },
  ],
};
