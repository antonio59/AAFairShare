import { describe, expect, it } from "bun:test";
import {
  buildFeed,
  buildSearchText,
  feedBubbleLabel,
  feedDayLabel,
  feedItemMatches,
  filterFeedItems,
  formatActivitySentence,
  formatGbp,
  formatLondonDateTime,
  formatLondonTime,
  groupFeedByDay,
  isAutoContributionNote,
  londonWallTimeToUtc,
  needsOriginalSettlementSnapshot,
  searchIndexQuery,
  showsAmount,
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
    amount: overrides.amount === undefined ? 42.5 : overrides.amount,
    description: overrides.description ?? "Tesco shop",
    occurredAt: overrides.occurredAt,
    automatic: overrides.automatic ?? false,
    derived: overrides.derived ?? false,
    category: overrides.category,
    location: overrides.location,
    searchText: overrides.searchText,
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

  it("derives documents, goals, and automatic contributions", () => {
    const at = londonWallTimeToUtc(2026, 10, 12, 18, 4);
    const feed = buildFeed({
      activities: [],
      expenses: [],
      settlements: [],
      documents: [
        {
          _id: "doc-1",
          _creationTime: at,
          title: "Tesco receipt",
          type: "receipt",
          uploadedBy: "jamie",
          category: "Groceries",
          location: "Tesco",
        },
      ],
      goals: [
        {
          _id: "goal-1",
          _creationTime: at - 1000,
          name: "Holiday fund",
          targetAmount: 2000,
        },
      ],
      contributions: [
        {
          _id: "con-auto",
          _creationTime: at + 1000,
          amount: 100,
          contributorId: "antonio",
          goalName: "Holiday fund",
          note: "Auto-recurring monthly",
        },
        {
          _id: "con-manual",
          _creationTime: at + 500,
          amount: 25,
          contributorId: "jamie",
          goalName: "Holiday fund",
          note: "Birthday money",
        },
      ],
      names,
    });

    const auto = feed.find((entry) => entry.id === "derived-contribution-con-auto");
    const manual = feed.find((entry) => entry.id === "derived-contribution-con-manual");
    const uploaded = feed.find((entry) => entry.id === "derived-document-doc-1");
    const goal = feed.find((entry) => entry.id === "derived-goal-goal-1");

    expect(auto).toMatchObject({
      action: "goal.contribution",
      actorId: null,
      actorName: null,
      automatic: true,
      amount: 100,
      description: "Holiday fund",
    });
    expect(feedBubbleLabel(auto!, false)).toBe("Contributed automatically");
    expect(formatActivitySentence(auto!)).toBe(
      "An automatic contribution added £100.00 to 'Holiday fund' on 12 Oct 2026, 18:04",
    );
    expect(manual).toMatchObject({
      actorId: "jamie",
      actorName: "Jamie",
      automatic: false,
      description: "Holiday fund · Birthday money",
    });
    expect(uploaded).toMatchObject({
      action: "document.added",
      actorName: "Jamie",
      amount: null,
      description: "Tesco receipt",
      category: "Groceries",
      location: "Tesco",
    });
    expect(showsAmount(uploaded!)).toBe(false);
    expect(goal).toMatchObject({
      action: "goal.added",
      actorId: null,
      amount: 2000,
      description: "Holiday fund",
    });
    expect(isAutoContributionNote("Auto-recurring weekly")).toBe(true);
    expect(isAutoContributionNote("Birthday money")).toBe(false);
  });

  it("keeps a snapshotted settlement ahead of the undo that removed it", () => {
    const recordedAt = londonWallTimeToUtc(2026, 8, 2, 10, 0);
    const removedAt = londonWallTimeToUtc(2026, 10, 12, 18, 4);
    expect(needsOriginalSettlementSnapshot(false)).toBe(true);
    expect(needsOriginalSettlementSnapshot(true)).toBe(false);

    const feed = buildFeed({
      activities: [
        {
          _id: "undo",
          action: "settlement.removed",
          actorId: "jamie",
          occurredAt: removedAt,
          amount: 40,
          settlementId: "set-old",
          month: "2026-07",
          fromUserId: "antonio",
          toUserId: "jamie",
        },
        {
          _id: "snap",
          action: "settlement.recorded",
          actorId: "antonio",
          occurredAt: recordedAt,
          amount: 40,
          settlementId: "set-old",
          month: "2026-07",
          fromUserId: "antonio",
          toUserId: "jamie",
        },
      ],
      expenses: [],
      settlements: [],
      names,
    });

    expect(feed.map((entry) => entry.action)).toEqual([
      "settlement.removed",
      "settlement.recorded",
    ]);
    expect(feed[1].occurredAt).toBe(recordedAt);
    expect(feedBubbleLabel(feed[1], false)).toBe("Antonio settled up");
  });
});

describe("feed search", () => {
  const now = londonWallTimeToUtc(2026, 10, 17, 15, 0);
  const rows: FeedItem[] = [
    item({
      id: "shop",
      action: "expense.added",
      description: "Tesco shop",
      actorName: "Antonio",
      amount: 42.5,
      category: "Groceries",
      location: "Tesco",
      occurredAt: londonWallTimeToUtc(2026, 10, 17, 18, 4),
    }),
    item({
      id: "receipt",
      action: "document.added",
      actorId: "jamie",
      actorName: "Jamie",
      description: "Tesco receipt",
      amount: null,
      category: "Groceries",
      location: "Tesco",
      occurredAt: londonWallTimeToUtc(2026, 10, 17, 17, 41),
    }),
    item({
      id: "petrol",
      action: "expense.added",
      actorId: "jamie",
      actorName: "Jamie",
      description: "Tesco petrol",
      amount: 38.2,
      category: "Transport",
      location: "Tesco",
      occurredAt: londonWallTimeToUtc(2026, 10, 16, 19, 12),
    }),
    item({
      id: "settle",
      action: "settlement.recorded",
      description: "Antonio paid Jamie for Sep 2026",
      amount: 12,
      occurredAt: londonWallTimeToUtc(2026, 10, 16, 9, 5),
    }),
    item({
      id: "goal",
      action: "goal.contribution",
      actorId: null,
      actorName: null,
      description: "Holiday fund",
      amount: 100,
      automatic: true,
      occurredAt: londonWallTimeToUtc(2026, 10, 17, 8, 0),
    }),
  ];

  it("matches description, person, category, location, and amount text", () => {
    expect(filterFeedItems(rows, "groceries", null).map((entry) => entry.id)).toEqual([
      "shop",
      "receipt",
    ]);
    expect(filterFeedItems(rows, "jamie", null).map((entry) => entry.id)).toEqual([
      "receipt",
      "petrol",
      "settle",
    ]);
    expect(filterFeedItems(rows, "transport", null).map((entry) => entry.id)).toEqual([
      "petrol",
    ]);
    expect(filterFeedItems(rows, "tesco", null).map((entry) => entry.id)).toEqual([
      "shop",
      "receipt",
      "petrol",
    ]);
    expect(feedItemMatches(rows[0], "£42.50")).toBe(true);
    expect(feedItemMatches(rows[0], "42.50")).toBe(true);
    expect(filterFeedItems(rows, "£42.50", null).map((entry) => entry.id)).toEqual(["shop"]);
  });

  it("filters by activity type and keeps date headers", () => {
    const documents = filterFeedItems(rows, "tesco", "document");
    expect(documents.map((entry) => entry.id)).toEqual(["receipt"]);

    const goals = filterFeedItems(rows, "", "goal");
    expect(goals.map((entry) => entry.id)).toEqual(["goal"]);
    expect(feedBubbleLabel(goals[0], false)).toBe("Contributed automatically");

    const tesco = filterFeedItems(rows, "tesco", null);
    expect(groupFeedByDay(tesco, now).map((group) => group.label)).toEqual([
      "Today",
      "Yesterday",
    ]);
    expect(filterFeedItems(rows, "no-such-thing", null)).toEqual([]);
  });

  it("builds a search blob and skips queries that are too short for the index", () => {
    expect(
      buildSearchText({
        description: "Tesco shop",
        actorName: "Antonio",
        category: "Groceries",
        location: "Tesco",
        amount: 42.5,
      }),
    ).toContain("£42.50");
    expect(searchIndexQuery("a")).toBeNull();
    expect(searchIndexQuery("  Tesco  ")).toBe("Tesco");
    expect(searchIndexQuery("£42.50")).toBe("£42.50");
  });

  it("writes document and goal lines", () => {
    const at = londonWallTimeToUtc(2026, 10, 12, 18, 4);
    expect(
      formatActivitySentence(
        item({
          action: "document.linked",
          actorName: "Jamie",
          amount: null,
          description: "Tesco receipt · Tesco shop",
          occurredAt: at,
        }),
      ),
    ).toBe("Jamie linked document 'Tesco receipt · Tesco shop' on 12 Oct 2026, 18:04");
    expect(
      feedBubbleLabel(
        item({ action: "document.added", actorName: "Jamie", occurredAt: at }),
        false,
      ),
    ).toBe("Jamie uploaded");
    expect(
      feedBubbleLabel(
        item({ action: "goal.deleted", occurredAt: at }),
        true,
      ),
    ).toBe("You deleted a goal");
    expect(
      formatActivitySentence(
        item({
          action: "goal.added",
          amount: 2000,
          description: "Holiday fund",
          occurredAt: at,
        }),
      ),
    ).toBe("Antonio created £2,000.00 savings goal 'Holiday fund' on 12 Oct 2026, 18:04");
  });
});
