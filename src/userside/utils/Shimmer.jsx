import { useNavigation } from "react-router-dom";

// Shared loading placeholders. Every page shows these (not spinners or blank
// space) while its data loads. The sweep animation is the `.shimmer` class in
// index.css. Pick the piece closest to the real layout so nothing jumps when
// the data arrives.

const range = (n) => Array.from({ length: n }, (_, i) => i);

// Base block: give it size and shape, e.g. <Shimmer className="h-4 w-1/2 rounded" />
export const Shimmer = ({ className = "", style }) => (
  <div className={`shimmer ${className}`} style={style} aria-hidden="true" />
);

// Paragraph lines; the last one is shorter.
export const ShimmerText = ({ lines = 3, className = "" }) => (
  <div className={`flex flex-col gap-2 ${className}`} aria-hidden="true">
    {range(lines).map((i) => (
      <Shimmer key={i} className={`h-3 rounded ${i === lines - 1 && lines > 1 ? "w-2/3" : "w-full"}`} />
    ))}
  </div>
);

// Card with optional image on top: package, portfolio, blog, team cards.
export const ShimmerCard = ({ image = true, imageClass = "h-40", lines = 3, className = "" }) => (
  <div className={`rounded-2xl border border-gray-200 bg-white p-4 ${className}`} aria-hidden="true">
    {image && <Shimmer className={`w-full rounded-xl mb-4 ${imageClass}`} />}
    <Shimmer className="h-4 w-3/4 rounded mb-3" />
    <ShimmerText lines={lines} />
  </div>
);

// Responsive grid of cards. `cols` is a Tailwind grid-cols class string.
export const ShimmerGrid = ({ count = 6, cols = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3", gap = "gap-6", card = {}, className = "" }) => (
  <div className={`grid ${cols} ${gap} ${className}`} role="status" aria-label="Loading">
    {range(count).map((i) => <ShimmerCard key={i} {...card} />)}
  </div>
);

// Rows with an avatar/icon and two lines: inboxes, chats, comments, notifications.
export const ShimmerList = ({ rows = 5, avatar = true, className = "" }) => (
  <div className={`flex flex-col divide-y divide-gray-100 ${className}`} role="status" aria-label="Loading">
    {range(rows).map((i) => (
      <div key={i} className="flex items-center gap-3 py-3">
        {avatar && <Shimmer className="h-10 w-10 rounded-full shrink-0" />}
        <div className="flex-1 min-w-0">
          <Shimmer className="h-3 w-1/3 rounded mb-2" />
          <Shimmer className="h-3 w-5/6 rounded" />
        </div>
      </div>
    ))}
  </div>
);

// Table body placeholder. Use inside <tbody> with `asRows`, or standalone.
export const ShimmerTable = ({ rows = 6, cols = 5, asRows = false, className = "" }) => {
  const body = range(rows).map((r) => (
    <tr key={r} aria-hidden="true">
      {range(cols).map((c) => (
        <td key={c} className="px-4 py-3">
          <Shimmer className={`h-3 rounded ${c === 0 ? "w-3/4" : "w-1/2"}`} />
        </td>
      ))}
    </tr>
  ));
  if (asRows) return <>{body}</>;
  return (
    <div className={`overflow-x-auto rounded-xl border border-gray-200 bg-white ${className}`} role="status" aria-label="Loading">
      <table className="w-full">
        <thead>
          <tr>
            {range(cols).map((c) => (
              <th key={c} className="px-4 py-3 text-left"><Shimmer className="h-3 w-16 rounded" /></th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">{body}</tbody>
      </table>
    </div>
  );
};

// Row of stat tiles: dashboards, counters.
export const ShimmerStats = ({ count = 4, cols = "grid-cols-2 lg:grid-cols-4", className = "" }) => (
  <div className={`grid ${cols} gap-4 ${className}`} role="status" aria-label="Loading">
    {range(count).map((i) => (
      <div key={i} className="rounded-2xl border border-gray-200 bg-white p-5">
        <Shimmer className="h-10 w-10 rounded-xl mb-4" />
        <Shimmer className="h-7 w-1/2 rounded mb-2" />
        <Shimmer className="h-3 w-2/3 rounded" />
      </div>
    ))}
  </div>
);

// Profile header: avatar, name, a few details, then content cards.
export const ShimmerProfile = ({ className = "" }) => (
  <div className={`flex flex-col gap-6 ${className}`} role="status" aria-label="Loading">
    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 rounded-2xl border border-gray-200 bg-white p-6">
      <Shimmer className="h-24 w-24 rounded-full shrink-0" />
      <div className="flex-1 w-full flex flex-col items-center sm:items-start gap-3">
        <Shimmer className="h-5 w-48 max-w-full rounded" />
        <Shimmer className="h-3 w-32 rounded" />
        <Shimmer className="h-3 w-56 max-w-full rounded" />
      </div>
    </div>
    <ShimmerGrid count={3} card={{ image: false }} />
  </div>
);

// Detail page: hero image, title, body, optional sidebar card.
export const ShimmerDetail = ({ sidebar = true, className = "" }) => (
  <div className={`flex flex-col gap-6 ${className}`} role="status" aria-label="Loading">
    <Shimmer className="h-48 sm:h-64 w-full rounded-2xl" />
    <div className={`grid gap-6 ${sidebar ? "lg:grid-cols-3" : ""}`}>
      <div className={`flex flex-col gap-4 ${sidebar ? "lg:col-span-2" : ""}`}>
        <Shimmer className="h-7 w-2/3 rounded" />
        <ShimmerText lines={4} />
        <ShimmerText lines={5} />
      </div>
      {sidebar && <ShimmerCard image={false} lines={5} />}
    </div>
  </div>
);

// Form placeholder: labels + inputs.
export const ShimmerForm = ({ fields = 5, className = "" }) => (
  <div className={`flex flex-col gap-5 ${className}`} role="status" aria-label="Loading">
    {range(fields).map((i) => (
      <div key={i}>
        <Shimmer className="h-3 w-24 rounded mb-2" />
        <Shimmer className="h-10 w-full rounded-lg" />
      </div>
    ))}
    <Shimmer className="h-10 w-32 rounded-lg" />
  </div>
);

// Whole-page fallback (first load, before the router has data).
export const PageShimmer = () => (
  <div className="min-h-screen bg-white px-4 py-8 sm:px-8" role="status" aria-label="Loading">
    <div className="mx-auto max-w-6xl flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <Shimmer className="h-8 w-32 rounded" />
        <Shimmer className="h-8 w-8 rounded-lg sm:w-64" />
      </div>
      <ShimmerDetail sidebar={false} />
      <ShimmerGrid count={3} />
    </div>
  </div>
);

// Thin bar at the top while the router loads the next page's data, so a click
// never looks frozen.
export const RouteLoadingBar = () => {
  const { state } = useNavigation();
  if (state === "idle") return null;
  return (
    <div className="fixed inset-x-0 top-0 z-[9999] h-[3px] overflow-hidden bg-blue-100" role="progressbar" aria-label="Loading page">
      <div className="route-loading-bar h-full w-1/3 bg-blue-500" />
    </div>
  );
};
