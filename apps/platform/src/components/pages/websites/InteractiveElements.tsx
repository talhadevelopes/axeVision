import type { Snapshot } from "@axeVision/shared";
import { MousePointer2, AlignLeft, Link2, FormInput } from "lucide-react";

interface InteractiveElementsProps {
  snapshot: Snapshot;
}

export default function InteractiveElements({ snapshot }: InteractiveElementsProps) {
  if (!snapshot.interactiveElements) {
    return <p className="text-gray-500">No interactive elements data available</p>;
  }

  const { buttons, links, inputs, forms } = snapshot.interactiveElements;

  const Stat = ({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) => (
    <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-green-100/50 p-4 flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white">
        {icon}
      </div>
      <div>
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-lg font-heading font-bold text-slate-800">{value}</div>
      </div>
    </div>
  );

  return (
    <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-green-100/50 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-slate-800">Interactive Elements</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Buttons" value={buttons?.length || 0} icon={<MousePointer2 className="w-4 h-4" />} />
          <Stat label="Forms" value={forms?.length || 0} icon={<FormInput className="w-4 h-4" />} />
          <Stat label="Inputs" value={inputs?.length || 0} icon={<AlignLeft className="w-4 h-4" />} />
          <Stat label="Links" value={links?.length || 0} icon={<Link2 className="w-4 h-4" />} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200/60 bg-white/60 p-3">
          <h4 className="font-medium text-slate-700 mb-2">Buttons ({buttons?.length || 0})</h4>
          <div className="max-h-40 overflow-auto pr-1">
            {buttons && buttons.length > 0 ? (
              <ul className="space-y-1">
                {buttons.slice(0, 10).map((button: any, i: number) => (
                  <li key={i} className="text-sm text-slate-700 truncate">
                    {button.text || button.value || "No text"}
                  </li>
                ))}
                {buttons.length > 10 && (
                  <li className="text-sm text-slate-500">... and {buttons.length - 10} more</li>
                )}
              </ul>
            ) : (
              <p className="text-slate-500 text-sm">No buttons found</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/60 bg-white/60 p-3">
          <h4 className="font-medium text-slate-700 mb-2">Forms ({forms?.length || 0})</h4>
          <div className="max-h-40 overflow-auto pr-1">
            {forms && forms.length > 0 ? (
              <ul className="space-y-1">
                {forms.slice(0, 5).map((form: any, i: number) => (
                  <li key={i} className="text-sm text-slate-700 truncate">
                    Action: {form.action || "None"} | Method: {form.method || "GET"}
                  </li>
                ))}
                {forms.length > 5 && (
                  <li className="text-sm text-slate-500">... and {forms.length - 5} more</li>
                )}
              </ul>
            ) : (
              <p className="text-slate-500 text-sm">No forms found</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/60 bg-white/60 p-3">
          <h4 className="font-medium text-slate-700 mb-2">Inputs ({inputs?.length || 0})</h4>
          <div className="max-h-40 overflow-auto pr-1">
            {inputs && inputs.length > 0 ? (
              <ul className="space-y-1">
                {inputs.slice(0, 10).map((input: any, i: number) => (
                  <li key={i} className="text-sm text-slate-700 truncate">
                    {input.type || "unknown"}: {input.name || input.placeholder || "No name"}
                  </li>
                ))}
                {inputs.length > 10 && (
                  <li className="text-sm text-slate-500">... and {inputs.length - 10} more</li>
                )}
              </ul>
            ) : (
              <p className="text-slate-500 text-sm">No inputs found</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/60 bg-white/60 p-3">
          <h4 className="font-medium text-slate-700 mb-2">Links ({links?.length || 0})</h4>
          <div className="max-h-40 overflow-auto pr-1">
            {links && links.length > 0 ? (
              <ul className="space-y-1">
                {links.slice(0, 5).map((link: any, i: number) => (
                  <li key={i} className="text-sm text-slate-700 truncate">
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-700 hover:text-green-800 underline-offset-2 hover:underline"
                    >
                      {link.text || link.href}
                    </a>
                  </li>
                ))}
                {links.length > 5 && (
                  <li className="text-sm text-slate-500">... and {links.length - 5} more</li>
                )}
              </ul>
            ) : (
              <p className="text-slate-500 text-sm">No links found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
