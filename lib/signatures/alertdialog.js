/**
 * APG Pattern: Alert Dialog
 * https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/
 *
 * Design notes:
 * - Alert Dialog combines a modal dialog with an alert: it interrupts the workflow
 *   to convey urgent information and requires user acknowledgment before proceeding.
 * - The decisive distinguisher from Dialog is role="alertdialog". A regular dialog
 *   with role="dialog" should NOT score as an Alert Dialog.
 * - aria-describedby is required (not optional): the alert message MUST be
 *   programmatically associated with the dialog so AT announces it on focus.
 *   This is the semantic difference from a plain dialog — the description is the alert.
 * - Focus must move into the dialog on open. The first focusable element is typically
 *   the least destructive action (e.g. "Cancel" not "Delete").
 * - Focus trap is required while the dialog is open; Escape may or may not close
 *   an alert dialog (APG defers to the design context — a "confirm delete" dialog
 *   might not allow Escape dismissal). Escape is therefore optional here.
 */
export default {
  patternName: 'Alert Dialog',
  patternUrl: 'https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/',

  keyboardInteractions: [
    'Tab: Moves focus to next focusable element within the dialog (cycles at end).',
    'Shift+Tab: Moves focus to previous focusable element within the dialog.',
    'Escape (optional): Closes the dialog if the design permits dismissal without action.',
  ],

  requiredRoles: ['alertdialog (on the dialog container)'],
  requiredAttributes: [
    'aria-labelledby (references the dialog title)',
    'aria-describedby (references the alert message — critical distinguisher)',
    'aria-modal="true" (signals to AT that background content is inert)',
  ],
  requiredStates: [
    'Focus moves into the dialog when it opens.',
    'Focus is trapped within the dialog while it is open.',
    'Focus returns to the trigger element when the dialog closes.',
  ],

  commonFailures: [
    'aria-describedby is absent — AT does not announce the alert message when the dialog receives focus.',
    'Focus is not trapped — keyboard users can navigate behind the modal overlay.',
    'Focus is not returned to the trigger on close — keyboard users lose their place in the page.',
  ],

  signals: [
    {
      id: 'role-alertdialog',
      description: 'Element has role="alertdialog"',
      weight: 10,
      required: true,
      check: { kind: 'role-equals', role: 'alertdialog' },
    },
    {
      id: 'aria-labelledby-present',
      description: 'aria-labelledby associates a visible title with the dialog',
      weight: 8,
      required: true,
      check: { kind: 'attr-present', attr: 'aria-labelledby' },
    },
    {
      id: 'aria-describedby-present',
      description: 'aria-describedby associates the alert message with the dialog',
      weight: 9,
      required: true,
      check: { kind: 'attr-present', attr: 'aria-describedby' },
    },
    {
      id: 'aria-modal-present',
      description: 'aria-modal="true" signals background inertness to AT',
      weight: 6,
      required: false,
      check: { kind: 'attr-present', attr: 'aria-modal' },
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
      description: 'Escape key dismisses the dialog (if design permits)',
      weight: 5,
      required: false,
      check: { kind: 'responds-to-key', key: 'Escape', expect: 'close' },
    },
  ],
};
