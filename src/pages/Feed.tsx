import { useEffect, useState } from "react";
import { useAuth } from "@/providers/AuthContext";
import { useActivityFeed } from "@/hooks/useConvexData";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  feedBubbleLabel,
  formatActivitySentence,
  formatGbp,
  formatLondonTime,
  groupFeedByDay,
  isStrikeThroughAction,
  showsAmount,
  type FeedItem,
  type FeedKind,
} from "../../convex/utils/activityFeed";

const FILTERS: { id: FeedKind | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "expense", label: "Expenses" },
  { id: "settlement", label: "Settlements" },
  { id: "document", label: "Documents" },
  { id: "goal", label: "Goals" },
];

const Feed = () => {
  const { user } = useAuth();
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [kind, setKind] = useState<FeedKind | null>(null);
  const feed = useActivityFeed(debouncedSearch, kind);
  const [cached, setCached] = useState<FeedItem[] | undefined>(feed);
  if (feed !== undefined && feed !== cached) {
    setCached(feed);
  }
  const currentUserId = user?._id ?? null;
  const filtering = debouncedSearch.length > 0 || kind !== null;
  const items = feed ?? cached;
  const refreshing = feed === undefined && cached !== undefined;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col px-4 py-4 md:px-0 md:py-2">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">Feed</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Newest activity first, in UK time.
        </p>
      </header>

      <div className="mb-4 flex flex-col gap-3">
        <div role="search">
          <label htmlFor="feed-search" className="sr-only">
            Search activity
          </label>
          <Input
            id="feed-search"
            type="search"
            value={searchInput}
            placeholder="Search description, person, category, place, or amount"
            onChange={(event) => setSearchInput(event.target.value)}
            autoComplete="off"
          />
        </div>
        <div role="toolbar" aria-label="Activity type" className="flex flex-wrap gap-2">
          {FILTERS.map((filter) => {
            const selected = filter.id === "all" ? kind === null : kind === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                aria-pressed={selected}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  selected
                    ? "border-primary bg-primary/15 text-foreground"
                    : "border-border bg-background text-muted-foreground hover:text-foreground",
                )}
                onClick={() => setKind(filter.id === "all" ? null : filter.id)}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {items === undefined ? (
        <p className="text-sm text-muted-foreground" role="status">
          Loading activity…
        </p>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border border-border bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground">
          {filtering
            ? "No activity matches this search."
            : "No activity yet. Expenses, documents, and savings goals will show up here."}
        </p>
      ) : (
        <div className={cn(refreshing && "opacity-70")}>
          <p className="sr-only" role="status">
            {items.length} {items.length === 1 ? "activity" : "activities"}
          </p>
          <ActivityThread items={items} currentUserId={currentUserId} />
        </div>
      )}
    </div>
  );
};

function ActivityThread({
  items,
  currentUserId,
}: {
  items: FeedItem[];
  currentUserId: string | null;
}) {
  const [now] = useState(() => Date.now());
  const groups = groupFeedByDay(items, now);

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        <section key={group.key} aria-labelledby={`feed-day-${group.key}`}>
          <h2
            id={`feed-day-${group.key}`}
            className="mb-3 flex items-center gap-3 text-xs font-medium text-muted-foreground"
          >
            <span className="h-px flex-1 bg-border" aria-hidden="true" />
            <span>{group.label}</span>
            <span className="h-px flex-1 bg-border" aria-hidden="true" />
          </h2>
          <ol className="flex flex-col gap-2">
            {group.items.map((item) => {
              const mine =
                item.actorId !== null &&
                item.actorId === currentUserId &&
                !item.automatic;
              const sentence = formatActivitySentence(item);
              const struck = isStrikeThroughAction(item.action);
              return (
                <li
                  key={item.id}
                  className={cn("flex", mine ? "justify-end" : "justify-start")}
                >
                  <article
                    aria-label={sentence}
                    className={cn(
                      "w-fit max-w-[85%] min-w-[10.5rem] rounded-2xl px-3.5 py-2.5",
                      mine
                        ? "rounded-br-md bg-primary/15 dark:bg-primary/25"
                        : "rounded-bl-md bg-secondary",
                    )}
                  >
                    <div aria-hidden="true">
                      <p className="text-xs font-medium text-muted-foreground">
                        {feedBubbleLabel(item, mine)}
                      </p>
                      {showsAmount(item) ? (
                        <p
                          className={cn(
                            "mt-0.5 text-xl font-bold tabular-nums tracking-tight",
                            struck && "text-muted-foreground line-through",
                          )}
                        >
                          {formatGbp(item.amount)}
                        </p>
                      ) : null}
                      {item.description ? (
                        <p
                          className="truncate text-sm text-foreground/90"
                          title={item.description}
                        >
                          {item.description}
                        </p>
                      ) : null}
                      <p className="mt-1 text-right text-[11px] tabular-nums text-muted-foreground">
                        <time dateTime={new Date(item.occurredAt).toISOString()}>
                          {formatLondonTime(item.occurredAt)}
                        </time>
                      </p>
                    </div>
                  </article>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}

export default Feed;
