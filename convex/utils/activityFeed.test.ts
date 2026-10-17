import { describe, expect, it } from "bun:test";
import {
  buildFeed,
  feedBubbleLabel,
  feedDayLabel,
  formatActivitySentence,
  formatGbp,
  formatLondonDateTime,
  formatLondonTime,
  groupFeedByDay,
  londonWallTimeToUtc,
  type FeedItem,
} from "./activityFeed";

const names = {
  antonio: "Antonio",
  jamie: "Jamie",
};

function item(overrides: Partial<FeedItem> & Pick<FeedItem, "action" | "occurredAt">): FeedItem {
  return {
    id: overrides.id ?? "item",
    action: overrides.action,
    actorId: overrides.actorId ?? "antonio",
    actorName: overrides.actorName === undefined ? "Antonio" : overrides.actorName,
    amount: overrides.amount ?? 42.5,
    description: overrides.description ?? "Tesco shop",
    occurredAt: overrides.occurredAt,
    automatic: overrides.automatic ?? false,
    derived: overrides.derived ?? false,
  };
}

describe("activity feed formatting", () => {
  const tescoAt = londonWallTimeToUtc(2026, 10, 12, 18, 4);

  it("formats London time and GBP the way the feed reads", () => {
    expect(formatLondonDateTime(tescoAt)).toBe("12 Oct 2026, 18:04");
    expect(formatLondonTime(tescoAt)).toBe("18:04");
    expect(formatGbp(42.5)).toBe("£42.50");
  });

  it("writes an added expense as a plain sentence", () => {
    expect(
      formatActivitySentence(
        item({
          action: "expense.added",
          actorName: "Antonio",
          amount: 42.5,
          description: "Tesco shop",
          occurredAt: tescoAt,
        }),
      ),
    ).toBe("Antonio added £42.50 expense 'Tesco shop' on 12 Oct 2026, 18:04");
  });

  it("writes edits, deletes, and settlements", () => {
    expect(
      formatActivitySentence(
        item({ action: "expense.edited", actorName: "Jamie", occurredAt: tescoAt }),
      ),
    ).toBe("Jamie edited £42.50 expense 'Tesco shop' on 12 Oct 2026, 18:04");

    expect(
      formatActivitySentence(
        item({ action: "expense.deleted", occurredAt: tescoAt }),
      ),
    ).toBe("Antonio deleted £42.50 expense 'Tesco shop' on 12 Oct 2026, 18:04");

    expect(
      formatActivitySentence(
        item({
          action: "settlement.recorded",
          description: "Antonio paid Jamie for Sep 2026",
          amount: 75.5,
          occurredAt: tescoAt,
        }),
      ),
    ).toBe(
      "Antonio settled up £75.50 (Antonio paid Jamie for Sep 2026) on 12 Oct 2026, 18:04",
    );
  });

  it("labels bubbles for you, your partner, and automatic adds", () => {
    const added = item({ action: "expense.added", actorName: "Jamie", occurredAt: tescoAt });
    expect(feedBubbleLabel(added, true)).toBe("You added");
    expect(feedBubbleLabel(added, false)).toBe("Jamie added");
    expect(
      feedBubbleLabel(
        item({
          action: "expense.added",
          actorId: null,
          actorName: null,
          occurredAt: tescoAt,
        }),
        false,
      ),
    ).toBe("Added");
    expect(
      feedBubbleLabel(
        item({ action: "expense.added", automatic: true, occurredAt: tescoAt }),
        false,
      ),
    ).toBe("Added automatically");
    expect(
      feedBubbleLabel(item({ action: "expense.deleted", occurredAt: tescoAt }), true),
    ).toBe("You deleted");
    expect(
      feedBubbleLabel(
        item({ action: "settlement.recorded", occurredAt: tescoAt }),
        true,
      ),
    ).toBe("You settled up");
    expect(
      feedBubbleLabel(
        item({ action: "settlement.removed", actorName: "Jamie", occurredAt: tescoAt }),
        false,
      ),
    ).toBe("Jamie removed a settlement");
  });

  it("groups days as Today, Yesterday, or a short London date", () => {
    const now = londonWallTimeToUtc(2026, 10, 17, 15, 0);
    expect(feedDayLabel(londonWallTimeToUtc(2026, 10, 17, 18, 4), now)).toBe("Today");
    expect(feedDayLabel(londonWallTimeToUtc(2026, 10, 16, 23, 30), now)).toBe(
      "Yesterday",
    );
    expect(feedDayLabel(londonWallTimeToUtc(2026, 9, 18, 10, 0), now)).toBe("18 Sep");
    expect(feedDayLabel(londonWallTimeToUtc(2025, 12, 18, 16, 40), now)).toBe(
      "18 Dec 2025",
    );
    expect(feedDayLabel(londonWallTimeToUtc(2025, 12, 31, 22, 0), londonWallTimeToUtc(2026, 1, 1, 9, 0))).toBe(
      "Yesterday",
    );
  });

  it("orders a day group newest first", () => {
    const now = londonWallTimeToUtc(2026, 10, 17, 15, 0);
    const groups = groupFeedByDay(
      [
        item({
          id: "older",
          action: "expense.added",
          occurredAt: londonWallTimeToUtc(2026, 10, 17, 9, 0),
        }),
        item({
          id: "newer",
          action: "expense.edited",
          occurredAt: londonWallTimeToUtc(2026, 10, 17, 18, 4),
        }),
        item({
          id: "yesterday",
          action: "expense.deleted",
          occurredAt: londonWallTimeToUtc(2026, 10, 16, 12, 0),
        }),
      ],
      now,
    );
    expect(groups.map((group) => group.label)).toEqual(["Today", "Yesterday"]);
    expect(groups[0].items.map((entry) => entry.id)).toEqual(["newer", "older"]);
  });
});

describe("buildFeed", () => {
  it("derives historical adds without inventing who logged them", () => {
    const feed = buildFeed({
      activities: [],
      expenses: [
        {
          _id: "exp-1",
          _creationTime: londonWallTimeToUtc(2026, 10, 12, 18, 4),
          amount: 42.5,
          description: "Tesco shop",
        },
      ],
      settlements: [],
      names,
    });

    expect(feed).toHaveLength(1);
    expect(feed[0]).toMatchObject({
      id: "derived-expense-exp-1",
      action: "expense.added",
      actorId: null,
      actorName: null,
      amount: 42.5,
      description: "Tesco shop",
      derived: true,
    });
    expect(formatActivitySentence(feed[0])).toBe(
      "Someone added £42.50 expense 'Tesco shop' on 12 Oct 2026, 18:04",
    );
  });

  it("does not duplicate an expense that already has an added log row", () => {
    const feed = buildFeed({
      activities: [
        {
          _id: "act-1",
          action: "expense.added",
          actorId: "antonio",
          occurredAt: 200,
          amount: 10,
          description: "Coffee",
          expenseId: "exp-1",
        },
      ],
      expenses: [
        { _id: "exp-1", _creationTime: 100, amount: 10, description: "Coffee" },
      ],
      settlements: [],
      names,
    });
    expect(feed.map((entry) => entry.id)).toEqual(["act-1"]);
    expect(feed[0].actorName).toBe("Antonio");
    expect(feed[0].derived).toBe(false);
  });

  it("keeps edits and deletes, and derives settlements from recordedBy", () => {
    const feed = buildFeed({
      activities: [
        {
          _id: "act-del",
          action: "expense.deleted",
          actorId: "jamie",
          occurredAt: 300,
          amount: 15.99,
          description: "Netflix duplicate",
          expenseId: "exp-gone",
        },
        {
          _id: "act-edit",
          action: "expense.edited",
          actorId: "antonio",
          occurredAt: 250,
          amount: 28,
          description: "Movie night",
          expenseId: "exp-2",
        },
      ],
      expenses: [],
      settlements: [
        {
          _id: "set-1",
          _creationTime: 100,
          amount: 75.5,
          month: "2026-09",
          fromUserId: "antonio",
          toUserId: "jamie",
          recordedBy: "jamie",
        },
      ],
      names,
    });

    expect(feed.map((entry) => entry.action)).toEqual([
      "expense.deleted",
      "expense.edited",
      "settlement.recorded",
    ]);
    expect(feed[2]).toMatchObject({
      actorId: "jamie",
      actorName: "Jamie",
      description: "Antonio paid Jamie for Sep 2026",
      derived: true,
    });
  });

  it("skips a derived settlement when the log already recorded it", () => {
    const feed = buildFeed({
      activities: [
        {
          _id: "act-set",
          action: "settlement.recorded",
          actorId: "antonio",
          occurredAt: 400,
          amount: 20,
          settlementId: "set-1",
          month: "2026-08",
          fromUserId: "jamie",
          toUserId: "antonio",
        },
      ],
      expenses: [],
      settlements: [
        {
          _id: "set-1",
          _creationTime: 100,
          amount: 20,
          month: "2026-08",
          fromUserId: "jamie",
          toUserId: "antonio",
          recordedBy: "antonio",
        },
      ],
      names,
    });
    expect(feed).toHaveLength(1);
    expect(feed[0].id).toBe("act-set");
    expect(feed[0].description).toBe("Jamie paid Antonio for Aug 2026");
  });

  it("drops unknown actions and honours the limit", () => {
    const feed = buildFeed(
      {
        activities: [
          {
            _id: "act-unknown",
            action: "expense.shared",
            occurredAt: 999,
            amount: 1,
          },
          {
            _id: "act-new",
            action: "expense.added",
            actorId: "antonio",
            occurredAt: 50,
            amount: 5,
            description: "Newer",
          },
        ],
        expenses: [
          { _id: "exp-old", _creationTime: 10, amount: 1, description: "Old" },
        ],
        settlements: [],
        names,
      },
      1,
    );
    expect(feed.map((entry) => entry.id)).toEqual(["act-new"]);
  });
});
