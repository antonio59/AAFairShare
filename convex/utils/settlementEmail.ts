import { escapeHtml } from "./html";
import { formatPounds } from "./money";
import { computeMonthTotals, type MonthTotals } from "./settlement";
import { headlineFor, settlementHasDrift } from "./settlementPlan";

export const SETTLEMENT_PAGE_URL = "https://aafairshare.online/settlement";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export interface EmailPerson {
  id: string;
  name: string;
}

export interface EmailExpense {
  date: string;
  description: string;
  category: string;
  paidById: string;
  paidByName: string;
  amount: number;
  split: string;
}

export interface EmailRecurringBill {
  description: string;
  amount: number;
  paidByName: string;
  date: string;
}

export interface EmailSavingsContribution {
  goalName: string;
  amount: number;
  contributorName: string;
  date: string;
}

export interface SettlementEmailInput {
  month: string;
  user1: EmailPerson;
  user2: EmailPerson;
  expenses: EmailExpense[];
  recurringBills: EmailRecurringBill[];
  savingsContributions: EmailSavingsContribution[];
  recipientName: string;
  recordedByName: string;
  recorded?: { amount: number; fromUserId: string; fromName: string; toName: string };
}

export interface SettlementEmail {
  subject: string;
  html: string;
  text: string;
  totals: MonthTotals;
  headline: string;
}

export function formatMonthKey(month: string): string {
  const [year, monthNum] = month.split("-");
  const name = MONTHS[Number(monthNum) - 1] ?? month;
  return `${name} ${year}`;
}

export function formatIsoDate(date: string): string {
  const [year, monthNum, day] = date.split("-");
  const name = MONTHS_SHORT[Number(monthNum) - 1] ?? monthNum;
  return `${Number(day)} ${name} ${year}`;
}

export function splitLabel(split: string): string {
  if (split === "50/50") return "50/50";
  if (split === "custom" || split === "100%") return "Paid for them";
  return split;
}

function categoryBreakdown(expenses: EmailExpense[]): { category: string; amount: number }[] {
  const penceByCategory = new Map<string, number>();
  for (const expense of expenses) {
    const category = expense.category.trim() || "Uncategorised";
    penceByCategory.set(
      category,
      (penceByCategory.get(category) ?? 0) + Math.round(expense.amount * 100),
    );
  }
  return [...penceByCategory.entries()]
    .map(([category, pence]) => ({ category, amount: pence / 100 }))
    .sort((a, b) => b.amount - a.amount || a.category.localeCompare(b.category));
}

function row(label: string, value: string): string {
  return (
    `<tr>` +
    `<td style="padding:8px 0;color:#64748b;font-size:15px;">${escapeHtml(label)}</td>` +
    `<td style="padding:8px 0;text-align:right;font-weight:600;color:#0f172a;font-size:15px;white-space:nowrap;">${escapeHtml(value)}</td>` +
    `</tr>`
  );
}

function sectionTitle(title: string): string {
  return `<h2 style="margin:28px 0 8px;font-size:16px;line-height:1.3;color:#1e3a8a;">${escapeHtml(title)}</h2>`;
}

function moneyTable(rowsHtml: string): string {
  return (
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">` +
    rowsHtml +
    `</table>`
  );
}

export function buildSettlementEmail(input: SettlementEmailInput): SettlementEmail {
  const totals = computeMonthTotals(
    input.expenses.map((expense) => ({
      amount: expense.amount,
      paidBy: expense.paidById,
      split: expense.split,
    })),
    input.user1.id,
    input.user2.id,
  );
  const headline = headlineFor(
    totals.settlement,
    totals.settlementDirection,
    input.user1.name,
    input.user2.name,
  );
  const monthLabel = formatMonthKey(input.month);
  const subject = `${monthLabel} · ${headline}`;
  const categories = categoryBreakdown(input.expenses);
  const expenses = [...input.expenses].sort((a, b) => a.date.localeCompare(b.date) || a.description.localeCompare(b.description));
  const drifted = input.recorded
    ? settlementHasDrift(totals, input.recorded, input.user1.id, input.user2.id)
    : false;

  const recordedLine = drifted && input.recorded
    ? `When this month was marked settled, ${input.recorded.fromName} was recorded as paying ${input.recorded.toName} ${formatPounds(input.recorded.amount)}. The expenses now on file settle as ${headline}.`
    : "";

  const text = buildText({
    input,
    monthLabel,
    headline,
    totals,
    categories,
    expenses,
    recordedLine,
  });
  const html = buildHtml({
    input,
    monthLabel,
    headline,
    totals,
    categories,
    expenses,
    recordedLine,
  });

  return { subject, html, text, totals, headline };
}

function buildText(args: {
  input: SettlementEmailInput;
  monthLabel: string;
  headline: string;
  totals: MonthTotals;
  categories: { category: string; amount: number }[];
  expenses: EmailExpense[];
  recordedLine: string;
}): string {
  const { input, monthLabel, headline, totals, categories, expenses, recordedLine } = args;
  const lines: string[] = [
    `AAFairShare · ${monthLabel}`,
    "",
    `Hi ${input.recipientName},`,
    "",
    `${input.recordedByName} marked ${monthLabel} as settled.`,
    "",
    headline,
    "",
    "Totals paid",
    `${input.user1.name}: ${formatPounds(totals.user1Paid)}`,
    `${input.user2.name}: ${formatPounds(totals.user2Paid)}`,
    `Shared 50/50: ${formatPounds(totals.sharedExpensesTotal)}`,
    `Each person's share of shared expenses: ${formatPounds(totals.eachPersonsShare)}`,
  ];

  if (totals.user1PersonalExpenses > 0) {
    lines.push(`${input.user1.name} paid for ${input.user2.name}: ${formatPounds(totals.user1PersonalExpenses)}`);
  }
  if (totals.user2PersonalExpenses > 0) {
    lines.push(`${input.user2.name} paid for ${input.user1.name}: ${formatPounds(totals.user2PersonalExpenses)}`);
  }
  if (recordedLine) {
    lines.push("", recordedLine);
  }

  if (categories.length > 0) {
    lines.push("", "Category breakdown");
    for (const category of categories) {
      lines.push(`${category.category}: ${formatPounds(category.amount)}`);
    }
  }

  if (expenses.length > 0) {
    lines.push("", "Expenses");
    for (const expense of expenses) {
      const description = expense.description.trim() || "Expense";
      lines.push(
        `${formatIsoDate(expense.date)} · ${description} · ${expense.paidByName} paid ${formatPounds(expense.amount)} · ${splitLabel(expense.split)}`,
      );
    }
  }

  if (input.recurringBills.length > 0) {
    lines.push("", "Recurring bills included");
    for (const bill of input.recurringBills) {
      const description = bill.description.trim() || "Recurring bill";
      lines.push(
        `${formatIsoDate(bill.date)} · ${description} · ${bill.paidByName} · ${formatPounds(bill.amount)}`,
      );
    }
  }

  if (input.savingsContributions.length > 0) {
    lines.push(
      "",
      "Savings contributions",
      "These are tracked separately and are not part of the settlement above.",
    );
    for (const contribution of input.savingsContributions) {
      lines.push(
        `${formatIsoDate(contribution.date)} · ${contribution.goalName} · ${contribution.contributorName} · ${formatPounds(contribution.amount)}`,
      );
    }
  }

  lines.push(
    "",
    `View the settlement: ${SETTLEMENT_PAGE_URL}`,
    "",
    "AAFairShare",
  );
  return lines.join("\n");
}

function buildHtml(args: {
  input: SettlementEmailInput;
  monthLabel: string;
  headline: string;
  totals: MonthTotals;
  categories: { category: string; amount: number }[];
  expenses: EmailExpense[];
  recordedLine: string;
}): string {
  const { input, monthLabel, headline, totals, categories, expenses, recordedLine } = args;
  const allSquare = headline === "All square";

  const paidRows = [
    row(`Total paid by ${input.user1.name}`, formatPounds(totals.user1Paid)),
    row(`Total paid by ${input.user2.name}`, formatPounds(totals.user2Paid)),
    row("Shared expenses (50/50)", formatPounds(totals.sharedExpensesTotal)),
    row("Each person's share", formatPounds(totals.eachPersonsShare)),
  ];
  if (totals.user1PersonalExpenses > 0) {
    paidRows.push(row(`${input.user1.name} paid for ${input.user2.name}`, formatPounds(totals.user1PersonalExpenses)));
  }
  if (totals.user2PersonalExpenses > 0) {
    paidRows.push(row(`${input.user2.name} paid for ${input.user1.name}`, formatPounds(totals.user2PersonalExpenses)));
  }

  const categorySection = categories.length
    ? sectionTitle("Category breakdown") +
      moneyTable(categories.map((category) => row(category.category, formatPounds(category.amount))).join(""))
    : "";

  const expenseSection = expenses.length
    ? sectionTitle("Expenses") +
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">` +
      expenses
        .map((expense) => {
          const description = expense.description.trim() || "Expense";
          return (
            `<tr>` +
            `<td style="padding:10px 0;border-bottom:1px solid #e2e8f0;vertical-align:top;">` +
            `<div style="font-size:15px;font-weight:600;color:#0f172a;">${escapeHtml(description)}</div>` +
            `<div style="font-size:13px;color:#64748b;margin-top:2px;">${escapeHtml(formatIsoDate(expense.date))} · ${escapeHtml(expense.category)} · ${escapeHtml(expense.paidByName)} paid · ${escapeHtml(splitLabel(expense.split))}</div>` +
            `</td>` +
            `<td style="padding:10px 0 10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;color:#0f172a;white-space:nowrap;vertical-align:top;">${escapeHtml(formatPounds(expense.amount))}</td>` +
            `</tr>`
          );
        })
        .join("") +
      `</table>`
    : "";

  const recurringSection = input.recurringBills.length
    ? sectionTitle("Recurring bills included") +
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">` +
      input.recurringBills
        .map((bill) => {
          const description = bill.description.trim() || "Recurring bill";
          return (
            `<tr>` +
            `<td style="padding:10px 0;border-bottom:1px solid #e2e8f0;">` +
            `<div style="font-size:15px;font-weight:600;color:#0f172a;">${escapeHtml(description)}</div>` +
            `<div style="font-size:13px;color:#64748b;margin-top:2px;">${escapeHtml(formatIsoDate(bill.date))} · ${escapeHtml(bill.paidByName)}</div>` +
            `</td>` +
            `<td style="padding:10px 0 10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;white-space:nowrap;">${escapeHtml(formatPounds(bill.amount))}</td>` +
            `</tr>`
          );
        })
        .join("") +
      `</table>`
    : "";

  const savingsSection = input.savingsContributions.length
    ? sectionTitle("Savings contributions") +
      `<p style="margin:0 0 8px;font-size:13px;color:#64748b;">Tracked separately. Not included in the settlement above.</p>` +
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">` +
      input.savingsContributions
        .map((contribution) => (
          `<tr>` +
          `<td style="padding:10px 0;border-bottom:1px solid #e2e8f0;">` +
          `<div style="font-size:15px;font-weight:600;color:#0f172a;">${escapeHtml(contribution.goalName)}</div>` +
          `<div style="font-size:13px;color:#64748b;margin-top:2px;">${escapeHtml(formatIsoDate(contribution.date))} · ${escapeHtml(contribution.contributorName)}</div>` +
          `</td>` +
          `<td style="padding:10px 0 10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;white-space:nowrap;">${escapeHtml(formatPounds(contribution.amount))}</td>` +
          `</tr>`
        ))
        .join("") +
      `</table>`
    : "";

  const driftSection = recordedLine
    ? `<div style="margin-top:16px;background:#fffbeb;border:1px solid #fcd34d;border-radius:12px;padding:14px 16px;font-size:14px;line-height:1.5;color:#92400e;">${escapeHtml(recordedLine)}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(subjectSafe(monthLabel, headline))}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
          <tr>
            <td style="background:#1e3a8a;padding:28px 24px;font-family:Georgia,'Iowan Old Style',Palatino,'Times New Roman',serif;">
              <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#bfdbfe;">AAFairShare</div>
              <div style="margin-top:8px;font-size:28px;line-height:1.2;color:#ffffff;">${escapeHtml(monthLabel)}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#0f172a;">
              <p style="margin:0 0 16px;font-size:16px;line-height:1.5;">Hi ${escapeHtml(input.recipientName)},</p>
              <p style="margin:0 0 20px;font-size:16px;line-height:1.5;color:#334155;">${escapeHtml(input.recordedByName)} marked ${escapeHtml(monthLabel)} as settled.</p>
              <div style="background:${allSquare ? "#ecfdf5" : "#eff6ff"};border-radius:14px;padding:22px 18px;text-align:center;">
                <div style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;">This month</div>
                <div style="margin-top:8px;font-size:26px;line-height:1.25;font-weight:700;color:${allSquare ? "#047857" : "#1e3a8a"};">${escapeHtml(headline)}</div>
              </div>
              ${driftSection}
              ${sectionTitle("Totals paid")}
              ${moneyTable(paidRows.join(""))}
              ${categorySection}
              ${expenseSection}
              ${recurringSection}
              ${savingsSection}
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:32px auto 8px;">
                <tr>
                  <td style="background:#3b82f6;border-radius:10px;">
                    <a href="${SETTLEMENT_PAGE_URL}" style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">View settlement</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px 22px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;line-height:1.5;color:#94a3b8;text-align:center;">
              Sent by AAFairShare. The figures above use the same penny totals as the app.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function subjectSafe(monthLabel: string, headline: string): string {
  return `${monthLabel} · ${headline}`;
}
