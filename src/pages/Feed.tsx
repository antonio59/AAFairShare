import { useState } from "react";
import { useAuth } from "@/providers/AuthContext";
import { useActivityFeed } from "@/hooks/useConvexData";
import { cn } from "@/lib/utils";
import {
  feedBubbleLabel,
  formatActivitySentence,
  formatGbp,
  formatLondonTime,
  groupFeedByDay,
  isStrikeThroughAction,
  type FeedItem,
} from "../../convex/utils/activityFeed";

const Feed = () => {
  const { user } = useAuth();
  const feed = useActivityFeed();
  const currentUserId = user?._id ?? null;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col px-4 py-4 md:px-0 md:py-2">
      <header className="mb-5">
        <h1 className="text-2xl font-bold">Feed</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Newest activity first, in UK time.
        </p>
      </header>

      {feed === undefined ? (
        <p className="text-sm text-muted-foreground" role="status">
          Loading activity…
        </p>
      ) : feed.length === 0 ? (
        <p className="rounded-2xl border border-border bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground">
          No activity yet. Expenses and settlements will show up here.
        </p>
      ) : (
        <ActivityThread items={feed} currentUserId={currentUserId} />
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
                      <p
                        className={cn(
                          "mt-0.5 text-xl font-bold tabular-nums tracking-tight",
                          struck && "text-muted-foreground line-through",
                        )}
                      >
                        {formatGbp(item.amount)}
                      </p>
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
