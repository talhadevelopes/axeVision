import { useEffect, useRef, useState } from "react";
import Tree from "react-d3-tree";

interface Props {
  data: any;
  onClose: () => void;
}

const TreeVisualization = ({ data, onClose }: Props) => {
  const [orientation, setOrientation] = useState<"vertical" | "horizontal">("vertical");
  const [pathFunc, setPathFunc] = useState<"diagonal" | "elbow" | "straight" | "step">("diagonal");
  const [translate, setTranslate] = useState<{ x: number; y: number }>({ x: 300, y: 50 });
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const { clientWidth: w, clientHeight: h } = el;
    if (orientation === "vertical") {
      setTranslate({ x: Math.max(100, w / 2), y: 80 });
    } else {
      setTranslate({ x: 120, y: Math.max(80, h / 2) });
    }
  }, [orientation, data]);

  return (
    <div className="fixed inset-0 z-50 bg-white">
      <div className="h-14 px-4 border-b flex items-center justify-between bg-gray-50">
        <div className="flex  mt-36 items-center gap-3">
          <span className="font-semibold">DOM Tree - Full Screen</span>
          <label className="text-sm text-gray-600">Orientation:</label>
          <select
            className="border rounded px-2 py-1 text-sm"
            value={orientation}
            onChange={(e) => setOrientation(e.target.value as any)}
          >
            <option value="vertical">Vertical</option>
            <option value="horizontal">Horizontal</option>
          </select>
          <label className="text-sm text-gray-600 ml-2">Path:</label>
          <select
            className="border rounded px-2 py-1 text-sm"
            value={pathFunc}
            onChange={(e) => setPathFunc(e.target.value as any)}
          >
            <option value="diagonal">Diagonal</option>
            <option value="elbow">Elbow</option>
            <option value="straight">Straight</option>
            <option value="step">Step</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1 text-sm bg-gray-800 text-white rounded hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
      <div ref={containerRef} className="w-full" style={{ height: "calc(100vh - 56px)", overflow: "hidden" }}>
        <Tree
          data={data}
          orientation={orientation}
          collapsible
          translate={translate}
          separation={{ siblings: 1, nonSiblings: 1.2 }}
          zoomable
          pathFunc={pathFunc}
        />
      </div>
    </div>
  );
}

export { TreeVisualization };