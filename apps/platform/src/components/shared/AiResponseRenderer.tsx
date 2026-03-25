import React from "react";

interface Props {
  text?: string | null;
}

export default function AiResponseRenderer({ text }: Props) {
  if (!text) return null;

  const lines = text.split(/\r?\n/);
  const nodes: React.ReactNode[] = [];

  let i = 0;
  let inCode = false;
  let codeBuffer: string[] = [];
  let listMode: "ul" | "ol" | null = null;
  let listItems: string[] = [];

  const flushParagraph = (paragraphLines: string[]) => {
    if (paragraphLines.length === 0) return;
    const joined = paragraphLines.join(" ");
    const inlineParts: React.ReactNode[] = [];
    const boldRegex = /\*\*(.+?)\*\*/g;
    let lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = boldRegex.exec(joined)) !== null) {
      if (m.index > lastIndex) {
        inlineParts.push(joined.slice(lastIndex, m.index));
      }
      inlineParts.push(<strong key={`b-${nodes.length}-${inlineParts.length}`} className="font-semibold">{m[1]}</strong>);
      lastIndex = m.index + m[0].length;
    }
    if (lastIndex < joined.length) inlineParts.push(joined.slice(lastIndex));

    nodes.push(
      <p key={`p-${i}-${nodes.length}`} className="text-sm text-slate-700 leading-relaxed mb-3">
        {inlineParts}
      </p>
    );
  };

  const flushList = () => {
    if (!listMode || listItems.length === 0) return;
    if (listMode === "ul") {
      nodes.push(
        <ul key={`ul-${nodes.length}`} className="list-disc pl-6 mb-3 text-sm text-slate-700">
          {listItems.map((it, idx) => (
            <li key={idx} className="mb-1">{it}</li>
          ))}
        </ul>
      );
    } else {
      nodes.push(
        <ol key={`ol-${nodes.length}`} className="list-decimal pl-6 mb-3 text-sm text-slate-700">
          {listItems.map((it, idx) => (
            <li key={idx} className="mb-1">{it}</li>
          ))}
        </ol>
      );
    }
    listMode = null;
    listItems = [];
  };

  const flushCode = () => {
    if (!inCode && codeBuffer.length === 0) return;
    nodes.push(
      <pre key={`code-${nodes.length}`} className="bg-slate-900 text-slate-100 rounded-md p-3 overflow-x-auto text-xs mb-3 font-mono">
        {codeBuffer.join("\n")}
      </pre>
    );
    codeBuffer = [];
    inCode = false;
  };

  let paragraphAcc: string[] = [];

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.replace(/\t/g, "    ");

    if (line.trim().startsWith("```") ) {
      if (inCode) {
        // closing
        flushCode();
      } else {
        // opening
        flushParagraph(paragraphAcc);
        paragraphAcc = [];
        flushList();
        inCode = true;
        codeBuffer = [];
      }
      i++;
      continue;
    }

    if (inCode) {
      codeBuffer.push(line);
      i++;
      continue;
    }

    // horizontal rule
    if (/^\s*-{3,}\s*$/.test(line)) {
      flushParagraph(paragraphAcc);
      paragraphAcc = [];
      flushList();
      nodes.push(<hr key={`hr-${i}`} className="border-slate-200 my-4" />);
      i++;
      continue;
    }

    // heading
    const headingMatch = line.match(/^#{1,6}\s+(.*)/);
    if (headingMatch) {
      flushParagraph(paragraphAcc);
      paragraphAcc = [];
      flushList();
      const textContent = headingMatch[1];
      nodes.push(
        <h4 key={`h-${i}`} className="text-lg font-semibold text-slate-800 mb-2">
          {textContent}
        </h4>
      );
      i++;
      continue;
    }

    const boldHeadingMatch = line.match(/^\s*\*\*(.+?)\*\*\s*$/);
    if (boldHeadingMatch) {
      flushParagraph(paragraphAcc);
      paragraphAcc = [];
      flushList();
      nodes.push(
        <h3 key={`bh-${i}`} className="text-xl font-bold text-slate-900 mb-2">
          {boldHeadingMatch[1].trim()}
        </h3>
      );
      i++;
      continue;
    }

    // ordered list
    const olMatch = line.match(/^\s*\d+\.\s+(.*)/);
    if (olMatch) {
      paragraphAcc.length && (flushParagraph(paragraphAcc), (paragraphAcc = []));
      if (listMode !== "ol") {
        flushList();
        listMode = "ol";
        listItems = [];
      }
      listItems.push(olMatch[1]);
      i++;
      continue;
    }

    // unordered list
    const ulMatch = line.match(/^\s*[-*]\s+(.*)/);
    if (ulMatch) {
      paragraphAcc.length && (flushParagraph(paragraphAcc), (paragraphAcc = []));
      if (listMode !== "ul") {
        flushList();
        listMode = "ul";
        listItems = [];
      }
      listItems.push(ulMatch[1]);
      i++;
      continue;
    }

    if (line.trim() === "") {
      flushParagraph(paragraphAcc);
      paragraphAcc = [];
      flushList();
      i++;
      continue;
    }

    // normal text line -> accumulate
    paragraphAcc.push(line.trim());
    i++;
  }

  // flush remaining
  if (inCode) flushCode();
  flushParagraph(paragraphAcc);
  flushList();

  return (
    <div className="prose max-w-none text-slate-700 overflow-visible whitespace-pre-wrap">{nodes}</div>
  );
}
