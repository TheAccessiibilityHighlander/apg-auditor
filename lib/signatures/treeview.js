/**
 * APG Pattern: Tree View
 * https://www.w3.org/WAI/ARIA/apg/patterns/treeview/
 *
 * Design notes:
 * - A Tree View presents a hierarchical list of items. Parent items can be
 *   expanded/collapsed to reveal/hide child items.
 * - role="tree" on the root container; role="treeitem" on each item.
 *   Nested groups of treeitems use role="group".
 * - Right arrow expands a collapsed item (or moves to first child if already expanded).
 *   Left arrow collapses an expanded item (or moves to parent if already collapsed).
 *   This expand/collapse behavior is the key differentiator from Listbox.
 * - aria-expanded on items that have children (true=expanded, false=collapsed).
 *   Leaf nodes (no children) do NOT have aria-expanded.
 * - aria-selected on treeitem indicates selection. Selection and focus are independent
 *   in tree views that support selection.
 * - The tree uses roving tabindex or aria-activedescendant for focus management.
 * - Tree View vs Treegrid: Treegrid adds role="treegrid" and grid-cell navigation;
 *   Tree View uses only tree/treeitem roles.
 */
export default {
  patternName: 'Tree View',
  patternUrl: 'https://www.w3.org/WAI/ARIA/apg/patterns/treeview/',

  keyboardInteractions: [
    'ArrowDown: Moves focus to next visible treeitem.',
    'ArrowUp: Moves focus to previous visible treeitem.',
    'ArrowRight: Expands a collapsed item; or moves to first child if expanded.',
    'ArrowLeft: Collapses an expanded item; or moves to parent if collapsed.',
    'Home: Moves focus to first treeitem.',
    'End: Moves focus to last visible treeitem.',
    'Enter: Activates the focused treeitem.',
    'Space: Toggles selection of the focused treeitem (when selection is supported).',
  ],

  requiredRoles: [
    'tree (on the root container)',
    'treeitem (on each item)',
    'group (on nested subtrees)',
  ],
  requiredAttributes: [
    'aria-expanded="true"/"false" (on treeitems that have children)',
    'aria-selected (on treeitems when selection is supported)',
    'aria-level (on each treeitem — depth in the hierarchy)',
    'aria-setsize / aria-posinset (on each treeitem — position within its parent group)',
  ],
  requiredStates: [
    'aria-expanded reflects the expanded/collapsed state of each parent treeitem.',
  ],

  commonFailures: [
    'role="treeitem" is absent — AT cannot navigate the tree structure.',
    'aria-expanded is absent on parent items — AT cannot announce collapsed/expanded state.',
    'Arrow key expand/collapse is not implemented — keyboard users cannot navigate the hierarchy.',
  ],

  signals: [
    {
      id: 'role-tree',
      description: 'Container has role="tree"',
      weight: 10,
      required: true,
      check: { kind: 'role-equals', role: 'tree' },
    },
    {
      id: 'has-treeitem-role',
      description: 'Contains descendant elements with role="treeitem"',
      weight: 9,
      required: true,
      check: { kind: 'has-descendant-role', role: 'treeitem' },
    },
    {
      id: 'in-tab-order',
      description: 'Tree has a single tab stop',
      weight: 6,
      required: true,
      check: { kind: 'in-tab-order' },
    },
    {
      id: 'aria-expanded-present',
      description: 'Parent treeitems carry aria-expanded',
      weight: 8,
      required: false,
      check: { kind: 'attr-present', attr: 'aria-expanded' },
    },
    {
      id: 'arrow-down-moves-focus',
      description: 'ArrowDown moves focus to next visible treeitem',
      weight: 9,
      required: true,
      check: { kind: 'responds-to-key', key: 'ArrowDown', expect: 'focus-move' },
    },
    {
      id: 'arrow-up-moves-focus',
      description: 'ArrowUp moves focus to previous visible treeitem',
      weight: 7,
      required: false,
      check: { kind: 'responds-to-key', key: 'ArrowUp', expect: 'focus-move' },
    },
    {
      id: 'arrow-right-expands',
      description: 'ArrowRight expands a collapsed item or moves to first child',
      weight: 8,
      required: false,
      check: { kind: 'responds-to-key', key: 'ArrowRight', expect: 'activation' },
    },
    {
      id: 'arrow-left-collapses',
      description: 'ArrowLeft collapses an expanded item or moves to parent',
      weight: 7,
      required: false,
      check: { kind: 'responds-to-key', key: 'ArrowLeft', expect: 'activation' },
    },
  ],
};
