/**
 * Every word the user reads lives in this file.
 *
 * This is not a tidiness rule. The wording *is* the mechanism this app works
 * by — a score label that says "Zero is data, not a verdict" is doing the
 * actual job, and a well-meaning rewrite to "Let's try again tomorrow!" would
 * quietly break the product while every test still passed. Keeping it in one
 * place means tone changes are a single deliberate edit to a single file,
 * instead of a hunt through the component tree.
 *
 * So: no user-facing string is written inline in a component. Not one.
 *
 * `as const` below tells TypeScript to treat these as exact fixed values
 * rather than "some string", which is what makes them readonly.
 */

/* ------------------------------------------------------------------ *
 * The five daily marks (spec 5.1)
 * ------------------------------------------------------------------ */

/**
 * The five things tracked each day. These strings are also the column names
 * in the `days` table, so the order here matches the order there.
 */
export type MarkKey = "shower" | "meal" | "work" | "wait" | "human";

export type Mark = {
  readonly key: MarkKey;
  readonly label: string;
  readonly helper: string;
};

export const MARKS: readonly Mark[] = [
  {
    key: "shower",
    label: "Shower was silent",
    helper: "No audio from tap on to towel off.",
  },
  {
    key: "meal",
    label: "One meal with no screen",
    helper: "Just one. Not all of them.",
  },
  {
    key: "work",
    label: "Nothing playing while I worked",
    helper: "Studying, writing, reading, coding — ears empty.",
  },
  {
    key: "wait",
    label: "Waited 90s before any play",
    helper: "Counts even if I pressed play afterwards.",
  },
  {
    key: "human",
    label: "Talked to a real person",
    helper: "Call, voice note, in person. Two minutes counts.",
  },
] as const;

/* ------------------------------------------------------------------ *
 * Score labels (spec 5.2)
 * ------------------------------------------------------------------ */

/** A day's score is the count of marks ticked, so it can only be 0 to 5. */
export type Score = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * The label shown beside the score. The number itself is rendered separately,
 * which is why no label starts with "0 —".
 *
 * Every one of these is a flat statement of fact. None congratulates, none
 * scolds, and a zero is described as information rather than a failure.
 */
export const SCORE_LABELS: Readonly<Record<Score, string>> = {
  0: "Zero is data, not a verdict. Log it and move on.",
  1: "One is not nothing. Tomorrow starts at zero either way.",
  2: "Two. The average is what moves, not this.",
  3: "Three. Solid, ordinary day.",
  4: "Four. Good day.",
  5: "Five. Note what made it easy — that's the useful part.",
} as const;

/* ------------------------------------------------------------------ *
 * The reframe banner (spec 5.3)
 * ------------------------------------------------------------------ */

/**
 * One piece of the banner sentence. `emphasis` marks the two words that are
 * bold and highlighted.
 */
export type BannerSegment = {
  readonly text: string;
  readonly emphasis: boolean;
};

/**
 * Split into segments rather than stored as HTML so that the component can
 * render it without `dangerouslySetInnerHTML`, and so the copy stays plain
 * text. Joining every `text` back together reproduces the sentence exactly —
 * there is a test for that, because the spacing is easy to break.
 */
export const REFRAME_BANNER: readonly BannerSegment[] = [
  { text: "A slip before noon does ", emphasis: false },
  { text: "not", emphasis: true },
  { text: " end the day. Yesterday does ", emphasis: false },
  { text: "not", emphasis: true },
  {
    text: " create a debt. The only number that matters here is the 7-day average — one zero barely moves it.",
    emphasis: false,
  },
] as const;

/* ------------------------------------------------------------------ *
 * The five-rule protocol (spec 5.4)
 * ------------------------------------------------------------------ */

export type ProtocolRule = {
  readonly title: string;
  readonly body: string;
};

/**
 * Read at the moment a day is about to be written off, which is why it sits on
 * the same page as the log rather than behind a tab or a modal.
 */
export const PROTOCOL: readonly ProtocolRule[] = [
  {
    title: "Never finish an episode.",
    body: "The compulsion isn't to start, it's to complete. So make stopping mid-sentence the normal thing. Pause at a random point and don't return. If you'd feel a pull to finish it, that's the exact thing to practise breaking.",
  },
  {
    title: "90 seconds before play.",
    body: "You don't have to say no. You have to wait. Sit in the silence for 90 seconds, then decide. Most of the time the hand-reaching-for-play was never a decision at all, and 90 seconds is long enough for the wave to pass.",
  },
  {
    title: "Nothing in your ears while words are coming out of your head.",
    body: "Writing while listening to speech is two verbal streams fighting for one buffer. That isn't multitasking, it's interference. This rule is not negotiable, and it's the cheapest one to keep.",
  },
  {
    title: "The shower stays silent.",
    body: "Unstructured, low-stimulus time is where loose thoughts connect. It's the only slot in your day that does that job. Filling it costs you something you can't get back later.",
  },
  {
    title: "One real human contact per day.",
    body: "A voice in the room is a legitimate need, not a weakness. If you don't feed it deliberately, a stranger's podcast will. One call, one voice note, one conversation. It counts even if it's two minutes.",
  },
] as const;

/* ------------------------------------------------------------------ *
 * Also today — tracked alongside the day, outside the score
 * ------------------------------------------------------------------ */

/**
 * Three things worth noticing that are deliberately not scored.
 *
 * The two ticks are phrased the same way as the five marks: as the presence of
 * something good rather than the count of a lapse. "No reels today" ticked is a
 * fact; "reels watched: 14" would be a number that climbs when the day goes
 * badly, sitting on a screen built so that never happens.
 *
 * The study count is the opposite case — it climbs with the thing you wanted —
 * so a plain number is safe. It is shown for today only: no average, no
 * history, nothing to beat.
 */
export const EXTRAS = {
  heading: "Also today",
  noReels: {
    label: "No reels or shorts",
    helper: "The whole day, not just the evening.",
  },
  readSomething: {
    label: "Read a few pages",
    helper: "Paper or screen. Two pages counts.",
  },
  studyLabel: "25-minute blocks",
  studyHelper: "Whole blocks only. A half-finished one isn't a block.",
  addBlock: "Add a block",
  removeBlock: "Remove a block",
} as const;

/* ------------------------------------------------------------------ *
 * The day line (spec 5.6)
 * ------------------------------------------------------------------ */

/**
 * One or two lines on how the day went. Not a journal — there is no prompt,
 * no word count and no history view, and the box is two rows tall because the
 * visual size is the instruction.
 */
export const DAY_LINE = {
  placeholder:
    "One or two lines. What actually happened. No verdict on yourself — just the fact.",
  savedIndicator: "saved",
  /**
   * For screen readers only. A placeholder disappears the moment you type, so
   * it cannot do the job of a label.
   */
  label: "How the day went",
} as const;

/* ------------------------------------------------------------------ *
 * The morning list (spec 5.7)
 * ------------------------------------------------------------------ */

/**
 * Deliberately contains no count, fraction or percentage, and no word that
 * could become one. "Unticked isn't failed" is the whole design in a sentence.
 */
export const MORNING_LIST = {
  heading: "Morning list",
  /** For screen readers. The placeholder vanishes as soon as you type. */
  composeLabel: "What you intend to do today",
  composePlaceholder: "One thing per line. What you actually intend to do today.",
  makeListButton: "Make list",
  addTaskPlaceholder: "Add something",
  addTaskButton: "Add",
  standingLine: "Unticked isn't failed. Some days the list was wrong, not you.",
  emptyState:
    "Nothing written yet. Write it when you're ready — an empty list isn't a failure.",
  deleteTaskLabel: "Delete task",
} as const;

/* ------------------------------------------------------------------ *
 * Everything else on screen
 *
 * Carried over from the working prototype. These are not in the brief's
 * verbatim list, but rule 5.5 says no inline strings anywhere, and headings
 * and button labels are strings the user reads.
 * ------------------------------------------------------------------ */

/**
 * Signing in. Kept in the same flat, unhurried register as everything else —
 * an app about not moralising at yourself should not start by nagging you.
 */
export const AUTH = {
  intro: "Sign in with your password, or have a link emailed to you.",
  emailLabel: "Email",
  passwordLabel: "Password",
  signInButton: "Sign in",
  signingInButton: "Signing in",
  wrongDetails: "That email and password didn't match.",
  useLinkInstead: "Email me a link instead",
  noPasswordYet: "No password yet? Use a link, then set one under Account.",
  sendButton: "Send me a link",
  sendingButton: "Sending",
  sent: "Check your email. The link signs you in on this device.",
  failed: "That didn't send. Try again in a moment.",
  /** A 429 from Supabase. "In a moment" would be a lie — it is an hour. */
  rateLimited:
    "Too many sign-in emails just now. The free plan allows a couple an hour, so give it a while before trying again.",
  /** A link that has already been used, or that has timed out. */
  linkExpired: "That link had already been used. Send yourself a fresh one.",
  signingIn: "Signing you in",
} as const;

export const UI = {
  appTitle: "Daily Log",
  subtitle: "No streaks. No pass/fail. Each day is scored on its own.",

  todayTag: "today",
  previousDay: "Previous day",
  nextDay: "Next day",

  logZeroButton: "Log this day as 0",

  loading: "Loading",
  /**
   * Shown if the numbers could not be refreshed after a write that did
   * succeed. Stale figures with no explanation would be worse than saying so.
   */
  metricsStale: "Numbers may be out of date.",
  /** Stated flatly. A failed write is a network fact, not a personal failing. */
  loadFailed: "Couldn't load this day. Refresh when you're back online.",
  saveFailed: "That didn't save. Tap it again.",

  metricsHeading: "The numbers",
  sevenDayAverage: "7-day average",
  thirtyDayAverage: "30-day average",
  daysLogged: "days logged",
  /** Shown in place of an average when there is nothing yet to average. */
  noValue: "–",

  gridHeading: "Last 30 days",
  gridHint: "click a day to edit it",
  notLogged: "not logged",

  protocolHeading:
    "The protocol — read this when you're about to write the day off",

  todayScreenLink: "Today",
  listScreenLink: "List",
  signOut: "Sign out",
  accountLink: "Account",
} as const;

/**
 * Setting a password.
 *
 * Not in the original brief, which specified magic links only. Added because
 * the free mailer allows about two emails an hour and a link only completes in
 * the browser that asked for it — which makes "open the app" an unreliable
 * first step, and an unreliable first step is how a daily habit stops being
 * daily.
 */
export const ACCOUNT = {
  heading: "Account",
  signedInAs: "Signed in as",
  passwordLabel: "New password",
  passwordHint:
    "At least eight characters. Once it is set you can sign in without waiting for an email.",
  saveButton: "Save password",
  saving: "Saving",
  saved: "Password saved. You can use it to sign in from now on.",
  tooShort: "A bit short — eight characters or more.",
  failed: "That didn't save. Try again in a moment.",
  backLink: "Back to today",
} as const;
