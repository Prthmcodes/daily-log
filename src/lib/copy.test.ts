import { describe, expect, it } from "vitest";

import {
  DAY_LINE,
  MARKS,
  MORNING_LIST,
  PROTOCOL,
  REFRAME_BANNER,
  SCORE_LABELS,
  UI,
} from "./copy";

/**
 * These tests do something slightly unusual: they assert that text has not
 * changed. That is the point. This copy is the product's mechanism, and the
 * likeliest way it breaks is a well-meaning tidy-up during an unrelated
 * refactor. Pinning it here turns a silent tone change into a failing test.
 */

describe("the five daily marks", () => {
  it("has exactly five, in the order the database stores them", () => {
    expect(MARKS.map((mark) => mark.key)).toEqual([
      "shower",
      "meal",
      "work",
      "wait",
      "human",
    ]);
  });

  it("reads exactly as specified", () => {
    expect(MARKS).toEqual([
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
    ]);
  });
});

describe("score labels", () => {
  it("reads exactly as specified", () => {
    expect(SCORE_LABELS).toEqual({
      0: "Zero is data, not a verdict. Log it and move on.",
      1: "One is not nothing. Tomorrow starts at zero either way.",
      2: "Two. The average is what moves, not this.",
      3: "Three. Solid, ordinary day.",
      4: "Four. Good day.",
      5: "Five. Note what made it easy — that's the useful part.",
    });
  });

  it("carries no leading number, because the score is rendered separately", () => {
    for (const label of Object.values(SCORE_LABELS)) {
      expect(label).not.toMatch(/^\d/);
    }
  });

  it("never scolds", () => {
    // Not exhaustive, but it catches the obvious drift towards grading.
    const banned = /\b(fail|failed|failure|bad|poor|missed|only|just \d)\b/i;
    for (const label of Object.values(SCORE_LABELS)) {
      expect(label).not.toMatch(banned);
    }
  });
});

describe("the reframe banner", () => {
  it("joins back into the exact sentence", () => {
    const sentence = REFRAME_BANNER.map((segment) => segment.text).join("");

    expect(sentence).toBe(
      "A slip before noon does not end the day. Yesterday does not create a debt. The only number that matters here is the 7-day average — one zero barely moves it.",
    );
  });

  it("emphasises both instances of the word not, and nothing else", () => {
    const emphasised = REFRAME_BANNER.filter((segment) => segment.emphasis);

    expect(emphasised.map((segment) => segment.text)).toEqual(["not", "not"]);
  });
});

describe("the protocol", () => {
  it("has five rules with the specified titles", () => {
    expect(PROTOCOL.map((rule) => rule.title)).toEqual([
      "Never finish an episode.",
      "90 seconds before play.",
      "Nothing in your ears while words are coming out of your head.",
      "The shower stays silent.",
      "One real human contact per day.",
    ]);
  });

  it("gives every rule a body that is a real explanation", () => {
    for (const rule of PROTOCOL) {
      expect(rule.body.length).toBeGreaterThan(80);
      expect(rule.body).toMatch(/\.$/);
    }
  });

  it("starts rule three with the sentence that names the interference", () => {
    expect(PROTOCOL[2].body).toContain(
      "two verbal streams fighting for one buffer",
    );
  });
});

describe("the day line", () => {
  it("reads exactly as specified", () => {
    expect(DAY_LINE.placeholder).toBe(
      "One or two lines. What actually happened. No verdict on yourself — just the fact.",
    );
  });

  it("invites two lines rather than an essay", () => {
    // "One or two lines", not "One line" — the prototype had the shorter
    // wording and the spec overrides it.
    expect(DAY_LINE.placeholder).toContain("One or two lines");
  });
});

describe("the morning list", () => {
  it("reads exactly as specified", () => {
    expect(MORNING_LIST.composePlaceholder).toBe(
      "One thing per line. What you actually intend to do today.",
    );
    expect(MORNING_LIST.makeListButton).toBe("Make list");
    expect(MORNING_LIST.standingLine).toBe(
      "Unticked isn't failed. Some days the list was wrong, not you.",
    );
    expect(MORNING_LIST.emptyState).toBe(
      "Nothing written yet. Write it when you're ready — an empty list isn't a failure.",
    );
  });

  /**
   * Design rule 10, enforced at the only place it can be enforced cheaply. A
   * fraction is a grade, and a grade is what this app exists to avoid — so no
   * string on the list screen may contain a number or a percent sign, because
   * that is what "3 of 8" and "40%" are made of.
   */
  it("contains no number, fraction or percentage anywhere", () => {
    for (const [name, text] of Object.entries(MORNING_LIST)) {
      expect(text, `MORNING_LIST.${name}`).not.toMatch(/\d|%/);
      expect(text, `MORNING_LIST.${name}`).not.toMatch(/\bout of\b/);
    }
  });
});

describe("screen furniture", () => {
  it("keeps the placeholder for an average that cannot be calculated yet", () => {
    expect(UI.noValue).toBe("–");
  });

  it("names the three metrics and nothing streak-shaped", () => {
    expect(UI.sevenDayAverage).toBe("7-day average");
    expect(UI.thirtyDayAverage).toBe("30-day average");
    expect(UI.daysLogged).toBe("days logged");

    // Design rules 1 and 2. "No streaks" in the subtitle is the one allowed
    // mention, because it promises their absence rather than counting one.
    const banned = /\b(streak|chain|record|best week|days since|in a row)\b/i;
    for (const [name, text] of Object.entries(UI)) {
      if (name === "subtitle") continue;
      expect(text, `UI.${name}`).not.toMatch(banned);
    }
  });
});
