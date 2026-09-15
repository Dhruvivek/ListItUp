import type {
  CompletionOverTimePoint,
  ItemCounts,
  SectionBreakdownEntry,
  StateBreakdownEntry,
} from "@/lib/report/list-dashboard";

const STATE_BAR_COLOR: Record<StateBreakdownEntry["state"], string> = {
  TO_DO: "bg-neutral-500",
  IN_PROGRESS: "bg-sky-500",
  BLOCKED: "bg-amber-500",
  COMPLETE: "bg-emerald-500",
  ARCHIVED: "bg-neutral-700",
};

function CountTile({ label, value, valueClassName }: { label: string; value: number; valueClassName?: string }) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-[#0d0d0d] p-4">
      <div className="font-mono text-[11px] uppercase tracking-wider text-neutral-500">{label}</div>
      <div className={`mt-2 text-3xl font-semibold tracking-tight ${valueClassName ?? "text-white"}`}>{value}</div>
    </div>
  );
}

function BreakdownWidget({
  title,
  entries,
  total,
}: {
  title: string;
  entries: { label: string; count: number; barColor: string }[];
  total: number;
}) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-[#0d0d0d] p-5">
      <div className="mb-4 font-mono text-[11px] uppercase tracking-wider text-neutral-500">{title}</div>
      {entries.length === 0 ? (
        <p className="text-sm text-neutral-600">No Items yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((entry) => (
            <div key={entry.label}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-neutral-400">{entry.label}</span>
                <span className="text-neutral-600">{entry.count}</span>
              </div>
              <div className="h-1.5 rounded-full bg-[#141414]">
                <div
                  className={`h-1.5 rounded-full ${entry.barColor}`}
                  style={{ width: total > 0 ? `${(entry.count / total) * 100}%` : "0%" }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CompletionOverTimeWidget({ points }: { points: CompletionOverTimePoint[] }) {
  const maxCompleted = Math.max(1, ...points.map((point) => point.cumulativeCompleted));
  const width = 480;
  const height = 130;
  const stepX = points.length > 1 ? width / (points.length - 1) : 0;
  const coordinates = points.map((point, index) => {
    const x = index * stepX;
    const y = height - (point.cumulativeCompleted / maxCompleted) * (height - 10) - 5;
    return `${x},${y}`;
  });

  return (
    <div className="rounded-lg border border-neutral-800 bg-[#0d0d0d] p-5">
      <div className="mb-1 font-mono text-[11px] uppercase tracking-wider text-neutral-500">
        Completion Over Time
      </div>
      <div className="mb-4 text-xs text-neutral-600">Is completion on track?</div>
      {points.length === 0 ? (
        <p className="text-sm text-neutral-600">No Items yet.</p>
      ) : (
        <>
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ maxHeight: height }}>
            <polyline points={coordinates.join(" ")} fill="none" stroke="#ff6b4a" strokeWidth="2.5" />
          </svg>
          <div className="mt-1 flex justify-between text-[10.5px] text-neutral-600">
            <span>{points[0].date}</span>
            <span>{points[points.length - 1].date}</span>
          </div>
        </>
      )}
    </div>
  );
}

export function DashboardTab({
  counts,
  bySection,
  byState,
  completionOverTime,
}: {
  counts: ItemCounts;
  bySection: SectionBreakdownEntry[];
  byState: StateBreakdownEntry[];
  completionOverTime: CompletionOverTimePoint[];
}) {
  return (
    <div className="mt-6 flex flex-col gap-5">
      <div className="grid grid-cols-4 gap-4">
        <CountTile label="Total Items" value={counts.total} />
        <CountTile label="Completed" value={counts.completed} valueClassName="text-emerald-500" />
        <CountTile label="Incomplete" value={counts.incomplete} />
        <CountTile label="Overdue" value={counts.overdue} valueClassName="text-[#ff6b4a]" />
      </div>

      <div className="grid grid-cols-2 gap-5">
        <BreakdownWidget
          title="Breakdown by Section"
          total={counts.total}
          entries={bySection.map((entry) => ({ label: entry.sectionName, count: entry.count, barColor: "bg-[#ff6b4a]" }))}
        />
        <BreakdownWidget
          title="Breakdown by State"
          total={counts.total}
          entries={byState.map((entry) => ({
            label: entry.label,
            count: entry.count,
            barColor: STATE_BAR_COLOR[entry.state],
          }))}
        />
      </div>

      <CompletionOverTimeWidget points={completionOverTime} />
    </div>
  );
}
