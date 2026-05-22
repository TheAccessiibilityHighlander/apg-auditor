/**
 * APG Pattern: Feed
 * https://www.w3.org/WAI/ARIA/apg/patterns/feed/
 *
 * Design notes:
 * - A feed is a scrollable list of articles that may load more content as the user
 *   scrolls (infinite scroll). role="feed" is the container; role="article" is each item.
 * - The key AT behavior: Page Down / Page Up move focus between articles within the
 *   feed. This is the primary keyboard interaction that distinguishes Feed from a
 *   plain list of articles.
 * - Each article should have aria-labelledby (its heading) and aria-describedby
 *   (its first paragraph or summary). The article's position is communicated via
 *   aria-posinset and aria-setsize; these are optional but strongly recommended.
 * - If the feed loads more articles dynamically, aria-busy="true" should be set
 *   during loading.
 * - Tab moves through interactive elements within the focused article; Page Down/Up
 *   jump between articles.
 */
export default {
  patternName: 'Feed',
  patternUrl: 'https://www.w3.org/WAI/ARIA/apg/patterns/feed/',

  keyboardInteractions: [
    'Page Down: Moves focus to next article in the feed.',
    'Page Up: Moves focus to previous article in the feed.',
    'Tab: Moves focus to next interactive element within the current article.',
    'Shift+Tab: Moves focus to previous interactive element within the current article.',
    'Ctrl+End: Moves focus to the element after the feed.',
    'Ctrl+Home: Moves focus to the element before the feed.',
  ],

  requiredRoles: [
    'feed (on the scrollable container)',
    'article (on each feed item)',
  ],
  requiredAttributes: [
    'aria-labelledby (on each article — references its heading)',
    'aria-posinset (on each article — 1-based position in the feed)',
    'aria-setsize (on each article — total article count, or -1 if unknown)',
    'aria-busy="true" (on the feed while new articles are loading)',
  ],
  requiredStates: [
    'aria-busy="true" on the feed container while loading additional articles.',
  ],

  commonFailures: [
    'role="article" is absent on feed items — AT cannot announce position in the feed.',
    'aria-posinset and aria-setsize are absent — AT cannot announce article position.',
    'Page Down/Up navigation between articles is not implemented.',
  ],

  signals: [
    {
      id: 'role-feed',
      description: 'Container has role="feed"',
      weight: 10,
      required: true,
      check: { kind: 'role-equals', role: 'feed' },
    },
    {
      id: 'has-article-role',
      description: 'Contains descendant elements with role="article"',
      weight: 9,
      required: true,
      check: { kind: 'has-descendant-role', role: 'article' },
    },
    {
      id: 'aria-labelledby-present',
      description: 'Feed or its articles carry aria-labelledby',
      weight: 6,
      required: false,
      check: { kind: 'attr-present', attr: 'aria-labelledby' },
    },
    {
      id: 'aria-posinset-present',
      description: 'Articles carry aria-posinset for position announcement',
      weight: 7,
      required: false,
      check: { kind: 'attr-present', attr: 'aria-posinset' },
    },
    {
      id: 'aria-setsize-present',
      description: 'Articles carry aria-setsize for total count announcement',
      weight: 7,
      required: false,
      check: { kind: 'attr-present', attr: 'aria-setsize' },
    },
    {
      id: 'pagedown-moves-focus',
      description: 'Page Down moves focus to the next article',
      weight: 9,
      required: false,
      check: { kind: 'responds-to-key', key: 'PageDown', expect: 'focus-move' },
    },
    {
      id: 'pageup-moves-focus',
      description: 'Page Up moves focus to the previous article',
      weight: 8,
      required: false,
      check: { kind: 'responds-to-key', key: 'PageUp', expect: 'focus-move' },
    },
  ],
};
