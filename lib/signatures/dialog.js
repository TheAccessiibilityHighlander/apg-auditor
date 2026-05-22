/**
 * APG Pattern: Dialog (Modal)
 * https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
 *
 * Design notes:
 * - Dialog is the base modal pattern. Alert Dialog extends it with role="alertdialog"
 *   and a required aria-describedby. This signature targets role="dialog".
 * - aria-labelledby is required — the dialog title must be programmatically
 *   associated so AT announces it when the dialog opens.
 * - Focus must move into the dialog on open (to the first focusable element or a
 *   specified element). Focus trap prevents escape. Return to trigger on close.
 * - Escape MUST close a dialog per APG. This is required:true here.
 * - aria-modal="true" signals to AT that background content is inert. Without it,
 *   some AT (especially mobile) may navigate outside the dialog.
 * - The dialog is distinguished from Alert Dialog by role="dialog" vs "alertdialog".
 *   The scorer must prefer Alert Dialog over Dialog when role="alertdialog" is present.
 */
export default {
  patternName: 'Dialog (Modal)',
  patternUrl: 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/',

  keyboardInteractions: [
    'Tab: Cycles focus through all focusable elements within the dialog.',
    'Shift+Tab: Cycles focus backward through focusable elements.',
    'Escape: Closes the dialog and returns focus to the triggering element.',
  ],

  requiredRoles: ['dialog (on the modal container)'],
  requiredAttributes: [
    'aria-labelledby (references the dialog\'s heading)',
    'aria-modal="true" (informs AT that background content is inert)',
  ],
  requiredStates: [
    'Focus moves into the dialog when it opens.',
    'Focus is trapped within the dialog while open.',
    'Focus returns to the trigger when the dialog closes.',
  ],

  commonFailures: [
    'aria-labelledby is absent — AT cannot announce the dialog\'s purpose when focus moves in.',
    'Escape does not close the dialog — keyboard users are trapped.',
    'aria-modal is absent — some AT navigates into background content behind the overlay.',
    'Focus is not returned to the trigger on close — keyboard users lose their position.',
  ],

  signals: [
    {
      id: 'role-dialog',
      description: 'Element has role="dialog"',
      weight: 10,
      required: true,
      check: { kind: 'role-equals', role: 'dialog' },
    },
    {
      id: 'aria-labelledby-present',
      description: 'aria-labelledby associates a visible title with the dialog',
      weight: 9,
      required: true,
      check: { kind: 'attr-present', attr: 'aria-labelledby' },
    },
    {
      id: 'aria-modal-present',
      description: 'aria-modal="true" signals background inertness to AT',
      weight: 7,
      required: false,
      check: { kind: 'attr-present', attr: 'aria-modal' },
    },
    {
      id: 'aria-describedby-present',
      description: 'aria-describedby provides supplementary description',
      weight: 5,
      required: false,
      check: { kind: 'attr-present', attr: 'aria-describedby' },
    },
    {
      id: 'in-tab-order',
      description: 'At least one focusable element exists within the dialog',
      weight: 6,
      required: true,
      check: { kind: 'in-tab-order' },
    },
    {
      id: 'escape-closes',
      description: 'Escape key closes the dialog',
      weight: 9,
      required: true,
      check: { kind: 'responds-to-key', key: 'Escape', expect: 'close' },
    },
  ],
};
