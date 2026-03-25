import { useState, useMemo, useEffect } from "react";
import {
  extractBodyContent,
  extractHeadContent,
  type DiffType,
} from "../../../utils/diff-utils";
import type { Snapshot } from "@axeVision/shared";
import { CodeComparison } from "../../../utils/code-comparison";
import { diffLines } from "diff";

interface SnapshotDiffProps {
  snapshots: Snapshot[];
}

export default function SnapshotDiff({ snapshots }: SnapshotDiffProps) {
  const [snapshotA, setSnapshotA] = useState<string>("");
  const [snapshotB, setSnapshotB] = useState<string>("");
  const [diffType, setDiffType] = useState<DiffType>("lines");
  const [diffView, setDiffView] = useState<"body" | "head" | "full">("body");
  const [onlyChanges, setOnlyChanges] = useState<boolean>(true);

  // Set initial selections when snapshots load
  useEffect(() => {
    if (snapshots && snapshots.length > 0) {
      if (!snapshotA) setSnapshotA(snapshots[0].id);
      if (snapshots.length > 1 && !snapshotB) setSnapshotB(snapshots[1].id);
    }
  }, [snapshots, snapshotA, snapshotB]);

  const selectedSnapshotA = snapshots?.find((s) => s.id === snapshotA);
  const selectedSnapshotB = snapshots?.find((s) => s.id === snapshotB);

  const { beforeCode, afterCode } = useMemo(() => {
    if (!selectedSnapshotA?.content || !selectedSnapshotB?.content) {
      return { beforeCode: "", afterCode: "" };
    }
    // pick the content to diff based on view
    const oldContent =
      diffView === "body"
        ? extractBodyContent(selectedSnapshotB.content)
        : diffView === "head"
        ? extractHeadContent(selectedSnapshotB.content)
        : selectedSnapshotB.content;
    const newContent =
      diffView === "body"
        ? extractBodyContent(selectedSnapshotA.content)
        : diffView === "head"
        ? extractHeadContent(selectedSnapshotA.content)
        : selectedSnapshotA.content;

    //use raw line diff to preserve newlines/formatting
    const parts = diffLines(oldContent, newContent);
    // Build Shiki's diff transformer color +/-
    const before = parts
      .map((p) => {
        if (p.added) return "";
        if (p.removed) {
          return p.value
            .split("\n")
            .map((line) => (line.length ? `- ${line}` : ""))
            .join("\n");
        }
        return p.value;
      })
      .join("");

    const after = parts
      .map((p) => {
        if (p.removed) return "";
        if (p.added) {
          return p.value
            .split("\n")
            .map((line) => (line.length ? `+ ${line}` : ""))
            .join("\n");
        }
        return p.value;
      })
      .join("");
    return { beforeCode: before, afterCode: after };
  }, [selectedSnapshotA, selectedSnapshotB, diffView]);

  const filteredBefore = useMemo(() => {
    if (!onlyChanges) return beforeCode;
    return beforeCode
      .split("\n")
      .filter((line) => line.trimStart().startsWith("- "))
      .join("\n");
  }, [beforeCode, onlyChanges]);

  const filteredAfter = useMemo(() => {
    if (!onlyChanges) return afterCode;
    return afterCode
      .split("\n")
      .filter((line) => line.trimStart().startsWith("+ "))
      .join("\n");
  }, [afterCode, onlyChanges]);

  if (snapshots.length <= 1) {
    return null;
  }

  return (
    <div>
      <h2 className="text-xl mb-4">HTML Diff Comparison</h2>
      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">
              Compare From:
            </label>
            <select
              value={snapshotA}
              onChange={(e) => setSnapshotA(e.target.value)}
              className="border rounded p-2 w-full"
            >
              {snapshots.map((snapshot, index) => (
                <option key={snapshot.id} value={snapshot.id}>
                  Snapshot {index + 1} (
                  {new Date(snapshot.capturedAt).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">
              Compare To:
            </label>
            <select
              value={snapshotB}
              onChange={(e) => setSnapshotB(e.target.value)}
              className="border rounded p-2 w-full"
            >
              {snapshots.map((snapshot, index) => (
                <option key={snapshot.id} value={snapshot.id}>
                  Snapshot {index + 1} (
                  {new Date(snapshot.capturedAt).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">
              Diff Type:
            </label>
            <select
              value={diffType}
              onChange={(e) => setDiffType(e.target.value as DiffType)}
              className="border rounded p-2 w-full"
            >
              <option value="lines">Line by Line</option>
              <option value="words">Word by Word</option>
              <option value="chars">Character by Character</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">View:</label>
            <select
              value={diffView}
              onChange={(e) =>
                setDiffView(e.target.value as "body" | "head" | "full")
              }
              className="border rounded p-2 w-full"
            >
              <option value="body">Body Only</option>
              <option value="head">Head Only</option>
              <option value="full">Full HTML</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => setOnlyChanges((v) => !v)}
              className="w-full border rounded p-2 bg-white hover:bg-gray-100 transition-colors text-sm"
              title={onlyChanges ? "Showing only +/- lines. Click to show full diff." : "Showing full diff. Click to show only +/- lines."}
            >
              {onlyChanges ? "Show full diff" : "Show only changes"}
            </button>
          </div>
        </div>
      </div>

      {selectedSnapshotA &&
      selectedSnapshotB &&
      selectedSnapshotA.id !== selectedSnapshotB.id ? (
        <div>
          <CodeComparison
            beforeCode={filteredBefore}
            afterCode={filteredAfter}
            language="diff"
            filename={`Snapshot ${snapshots.findIndex(s => s.id === selectedSnapshotB.id) + 1} -> Snapshot ${snapshots.findIndex(s => s.id === selectedSnapshotA.id) + 1}`}
            lightTheme="github-light"
            darkTheme="github-dark"
          />
        </div>
      ) : (
        <p className="text-gray-500 text-center p-8">
          Select two different snapshots to compare
        </p>
      )}
    </div>
  );
}
