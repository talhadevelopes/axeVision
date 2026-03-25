import { memo } from "react";

interface Props {
  counts: Record<string, number>;
}

function ElementStatisticsComponent({ counts }: Props) {
  const totalElements = Object.values(counts).reduce((sum, count) => sum + count, 0);
  const uniqueElements = Object.keys(counts).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <div className="text-3xl font-bold">{totalElements}</div>
          <div className="text-sm text-gray-500">Total Elements</div>
        </div>
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <div className="text-3xl font-bold">{uniqueElements}</div>
          <div className="text-sm text-gray-500">Unique Elements</div>
        </div>
      </div>

      <div className="space-y-2">
        {Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .map(([element, count]) => (
            <div key={element} className="flex items-center justify-between p-2 border rounded bg-gray-50">
              <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">{element}</span>
              <div className="flex items-center gap-2">
                <span>{count}</span>
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${totalElements ? (count / totalElements) * 100 : 0}%` }} />
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

export const ElementStatistics = memo(ElementStatisticsComponent);