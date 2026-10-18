export function whoOwesWhom(
  settlement: number,
  direction: "owes" | "owed" | "even",
  user1Name: string,
  user2Name: string,
): string {
  if (direction === "even" || Math.round(settlement * 100) === 0) return "All square";
  if (direction === "owes") return `${user1Name} owes ${user2Name}`;
  return `${user2Name} owes ${user1Name}`;
}
