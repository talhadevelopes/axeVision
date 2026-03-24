import { useState, useEffect } from "react";
import type { Snapshot } from "@axeVision/shared";

interface UseSnapshotDisplayProps {
  snapshots: Snapshot[];
}

export const useSnapshotDisplay = ({ snapshots }: UseSnapshotDisplayProps) => {
  const [selectedSnapshotForPreview, setSelectedSnapshotForPreview] = useState<string>("");

  // Set initial selection when snapshots load
  useEffect(() => {
    if (snapshots && snapshots.length > 0 && !selectedSnapshotForPreview) {
      setSelectedSnapshotForPreview(snapshots[0].id);
    }
  }, [snapshots, selectedSnapshotForPreview]);

  const previewSnapshot = snapshots?.find(
    (s) => s.id === selectedSnapshotForPreview
  );

  const handleSnapshotSelect = (snapshotId: string) => {
    setSelectedSnapshotForPreview(snapshotId);
  };

  return {
    selectedSnapshotForPreview,
    previewSnapshot,
    handleSnapshotSelect,
  };
};
