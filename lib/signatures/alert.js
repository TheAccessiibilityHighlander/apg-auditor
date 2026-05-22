/**
 * APG Pattern: Alert
 * https://www.w3.org/WAI/ARIA/apg/patterns/alert/
 *
 * Design notes:
 * - Alert is a live region that announces time-sensitive information automatically.
 *   It is NOT interactive — the user does not navigate to it.
 * - role="alert" carries implicit aria-live="assertive" and aria-atomic="true".
 *   Developers sometimes use role="status" for less urgent messages; that is a
 *   related but distinct pattern. This signature targets role="alert" specifically.
 * - There are no keyboard interaction requirements because alerts are not
 *   focusable widgets. The only "interaction" is that the alert content is
 *   automatically announced by AT when inserted into the DOM.
 * - in-tab-order is required:false (and should score negatively if present,
 *   but the current signal set has no negative-weight signals — scorer handles this
 *   by the absence of interactive signals keeping the score clean).
 * - aria-live and aria-atomic signals are included as supporting evidence but
 *   role="alert" implies them; their explicit presence is a bonus.
 */
export default {
  patternName: 'Alert',
  patternUrl: 'https://www.w3.org/WAI/ARIA/apg/patterns/alert/',

  keyboardInteractions: [
    '(None — alerts are not interactive. Content is announced automatically by screen readers.)',
  ],

  requiredRoles: ['alert (on the container element)'],
  requiredAttributes: [],
  requiredStates: [
    'Content injected dynamically into the alert element triggers the live region announcement.',
  ],

  commonFailures: [
    'Alert content is present in the DOM on page load — screen readers only announce live region changes, not initial content.',
    'role="alert" is placed on a visually hidden element that is never shown — announcement never fires.',
    'Multiple simultaneous alerts fire at once — assertive live regions interrupt each other, losing messages.',
  ],

  signals: [
    {
      id: 'role-alert',
      description: 'Element has role="alert"',
      weight: 10,
      required: true,
      check: { kind: 'role-equals', role: 'alert' },
    },
    {
      id: 'aria-live-assertive',
      description: 'aria-live="assertive" is explicitly set (implied by role="alert")',
      weight: 4,
      required: false,
      check: { kind: 'attr-present', attr: 'aria-live' },
    },
    {
      id: 'aria-atomic-present',
      description: 'aria-atomic attribute is present',
      weight: 3,
      required: false,
      check: { kind: 'attr-present', attr: 'aria-atomic' },
    },
  ],
};
