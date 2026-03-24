
import React, { JSX } from "react";
import { create } from "zustand";
import { diffLines } from "diff";

interface DemoState {
  showSnapshot: boolean;
  toggleSnapshot: () => void;
}

const useDemoStore = create<DemoState>((set) => ({
  showSnapshot: false,
  toggleSnapshot: () => set((state) => ({ showSnapshot: !state.showSnapshot })),
}));

interface Website {
  id: string;
  url: string;
  name?: string;
  createdAt: string;
  latestSnapshot: string | null;
}

interface Snapshot {
  id: string;
  capturedAt: string;
  contentPreview: string;
}

interface AccessibilityResult {
  issues: { type: string; message: string; source?: string }[];
  analyzedAt: string;
}

export function DemoSection() {
  const { showSnapshot, toggleSnapshot } = useDemoStore();
  const [websites, setWebsites] = React.useState<Website[]>([]);
  const [snapshots, setSnapshots] = React.useState<Snapshot[]>([]);
  const [accessibility, setAccessibility] = React.useState<AccessibilityResult | null>(null);
  const [selectedWebsite, setSelectedWebsite] = React.useState<string>("");
  const [diffForm, setDiffForm] = React.useState({
    snapshot1: "",
    snapshot2: "",
  });
  const [diffResult, setDiffResult] = React.useState<JSX.Element[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/websites`)
      .then((res) => res.json())
      .then((data) => setWebsites(data))
      .catch((err) => setError("Failed to fetch websites"));
  }, []);

  const fetchSnapshots = (websiteId: string) => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/websites/${websiteId}/snapshots`)
      .then((res) => res.json())
      .then((data) => setSnapshots(data))
      .catch((err) => setError("Failed to fetch snapshots"));

    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/websites/${websiteId}/accessibility`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setAccessibility(data))
      .catch((err) => setAccessibility(null));
  };

  const handleWebsiteSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const websiteId = e.target.value;
    setSelectedWebsite(websiteId);
    if (websiteId) {
      fetchSnapshots(websiteId);
    } else {
      setSnapshots([]);
      setAccessibility(null);
    }
  };

  const handleDiffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDiffResult(null);
    if (!diffForm.snapshot1 || !diffForm.snapshot2) {
      setDiffResult([
        <p key="error" className="text-red-600">
          Please select two snapshots
        </p>,
      ]);
      return;
    }
    const snapshot1 = snapshots.find((s) => s.id === diffForm.snapshot1);
    const snapshot2 = snapshots.find((s) => s.id === diffForm.snapshot2);
    if (!snapshot1 || !snapshot2) {
      setDiffResult([
        <p key="error" className="text-red-600">
          Invalid snapshots selected
        </p>,
      ]);
      return;
    }
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/websites/${selectedWebsite}/diff`)
      .then((res) => res.json())
      .then((data) => {
        const result = data.changes.map((part: any, index: number) => (
          <span
            key={index}
            className={
              part.added
                ? "bg-green-200"
                : part.removed
                  ? "bg-red-200"
                  : "bg-gray-100"
            }
          >
            {part.value}
          </span>
        ));
        setDiffResult(result);
      })
      .catch((err) => setDiffResult([<p key="error" className="text-red-600">Failed to compute diff</p>]));
  };

  return (
    <section className="py-16 bg-gray-100">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-gray-800 text-center mb-8">
          Explore axeVision Features
        </h2>
        {error && <p className="text-red-600 text-center mb-4">{error}</p>}
        <div className="mb-8">
          <label className="block text-gray-600 mb-2">Select Website</label>
          <select
            value={selectedWebsite}
            onChange={handleWebsiteSelect}
            className="w-full p-2 border rounded"
          >
            <option value="">Select a website</option>
            {websites.map((website) => (
              <option key={website.id} value={website.id}>
                {website.url} {website.name ? `(${website.name})` : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="grid md:grid-cols-4 gap-8">
          <div className="p-6 bg-white rounded shadow">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Snapshot Tracking
            </h3>
            <p className="text-gray-600 mb-4">
              Capture and store website snapshots over time.
            </p>
            <button
              onClick={toggleSnapshot}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {showSnapshot ? "Hide Snapshot" : "Show Snapshot"}
            </button>
            {showSnapshot && snapshots[0] && (
              <p className="mt-4 text-gray-600">
                Latest Snapshot: {snapshots[0].contentPreview} (
                {snapshots[0].capturedAt})
              </p>
            )}
          </div>
          <div className="p-6 bg-white rounded shadow">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Diff Viewer
            </h3>
            <p className="text-gray-600 mb-4">
              Compare website changes with a visual diff tool.
            </p>
            <form onSubmit={handleDiffSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-600 mb-1">Snapshot 1</label>
                <select
                  value={diffForm.snapshot1}
                  onChange={(e) =>
                    setDiffForm({ ...diffForm, snapshot1: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select a snapshot</option>
                  {snapshots.map((snapshot) => (
                    <option key={snapshot.id} value={snapshot.id}>
                      {snapshot.capturedAt}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-600 mb-1">Snapshot 2</label>
                <select
                  value={diffForm.snapshot2}
                  onChange={(e) =>
                    setDiffForm({ ...diffForm, snapshot2: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select a snapshot</option>
                  {snapshots.map((snapshot) => (
                    <option key={snapshot.id} value={snapshot.id}>
                      {snapshot.capturedAt}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Compare Snapshots
              </button>
            </form>
            {diffResult && (
              <div className="mt-4 p-4 bg-gray-50 rounded">
                <h4 className="text-lg font-semibold text-gray-800 mb-2">
                  Diff Result
                </h4>
                <p>{diffResult}</p>
              </div>
            )}
          </div>
          <div className="p-6 bg-white rounded shadow">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Accessibility Analysis
            </h3>
            <p className="text-gray-600 mb-4">
              Analyze websites for accessibility with AI insights.
            </p>
            {accessibility && (
              <div className="mt-4">
                <p className="text-gray-600">
                  Analyzed: {new Date(accessibility.analyzedAt).toLocaleString()}
                </p>
                {accessibility.issues.length ? (
                  accessibility.issues.map((issue, index) => (
                    <div
                      key={index}
                      className={`border-l-4 p-2 mb-2 ${
                        issue.type === "Critical"
                          ? "border-red-500"
                          : issue.type === "High"
                            ? "border-orange-500"
                            : "border-yellow-500"
                      }`}
                    >
                      <strong>
                        {issue.type} ({issue.source || "AI"}):
                      </strong>{" "}
                      {issue.message}
                    </div>
                  ))
                ) : (
                  <p className="text-green-600">No accessibility issues found</p>
                )}
              </div>
            )}
          </div>
          <div className="p-6 bg-white rounded shadow">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Website & Snapshot Data
            </h3>
            <p className="text-gray-600 mb-4">Fetched from backend:</p>
            <ul className="text-gray-600 mb-4">
              {websites.map((site) => (
                <li key={site.id}>
                  {site.url} {site.name ? `(${site.name})` : ""} (Last:{" "}
                  {site.latestSnapshot || "None"})
                </li>
              ))}
            </ul>
            <p className="text-gray-600 mb-4">Snapshots:</p>
            <ul className="text-gray-600 mb-4">
              {snapshots.map((snapshot) => (
                <li
                  key={snapshot.id}
                  className="flex items-center justify-between mb-2"
                >
                  <span>{snapshot.capturedAt}: {snapshot.contentPreview}</span>
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch(
                          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/websites/${selectedWebsite}/snapshots/${snapshot.id}`,
                          {
                            method: "DELETE",
                          }
                        );
                        if (!response.ok) {
                          throw new Error((await response.json()).error);
                        }
                        setSnapshots(snapshots.filter((s) => s.id !== snapshot.id));
                      } catch (err: any) {
                        setError(err.message);
                      }
                    }}
                    className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}