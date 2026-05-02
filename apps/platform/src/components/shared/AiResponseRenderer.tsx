import React from "react";

interface Props {
  text?: string | null;
}

/** Parses inline markdown: **bold**, `code`, [link](url) */
function parseInline(text: string, keyPrefix: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // matches **bold**, `code`, [label](url) — in that precedence
  const inlineRegex = /(\*\*(.+?)\*\*|`([^`]+)`|\[([^\]]+)\]\((https?:\/\/[^)]+)\))/g;
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = inlineRegex.exec(text)) !== null) {
    if (m.index > last) {
      parts.push(text.slice(last, m.index));
    }

    if (m[2] !== undefined) {
      // **bold**
      parts.push(
        <strong key={`${keyPrefix}-b-${m.index}`} className="font-semibold">
          {m[2]}
        </strong>
      );
    } else if (m[3] !== undefined) {
      // `inline code`
      parts.push(
        <code
          key={`${keyPrefix}-c-${m.index}`}
          className="bg-slate-100 text-rose-600 px-1 py-0.5 rounded text-xs font-mono"
        >
          {m[3]}
        </code>
      );
    } else if (m[4] !== undefined && m[5] !== undefined) {
      // [label](url)
      parts.push(
        <a
          key={`${keyPrefix}-l-${m.index}`}
          href={m[5]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline hover:text-blue-800 transition-colors"
        >
          {m[4]}
        </a>
      );
    }

    last = m.index + m[0].length;
  }

  if (last < text.length) {
    parts.push(text.slice(last));
  }

  return parts;
}

export default function AiResponseRenderer({ text }: Props) {
  if (!text) return null;

  const lines = text.split(/\r?\n/);
  const nodes: React.ReactNode[] = [];

  let i = 0;
  let inCode = false;
  let codeBuffer: string[] = [];
  let listMode: "ul" | "ol" | null = null;
  let listItems: React.ReactNode[] = [];
  let paragraphAcc: string[] = [];

  const flushParagraph = (acc: string[]) => {
    if (acc.length === 0) return;
    const joined = acc.join(" ");
    nodes.push(
      <p key={`p-${nodes.length}`} className="text-sm text-slate-700 leading-relaxed mb-3">
        {parseInline(joined, `p-${nodes.length}`)}
      </p>
    );
  };

  const flushList = () => {
    if (!listMode || listItems.length === 0) return;
    const key = `list-${nodes.length}`;
    if (listMode === "ul") {
      nodes.push(
        <ul key={key} className="list-disc pl-6 mb-3 text-sm text-slate-700 space-y-1">
          {listItems.map((it, idx) => (
            <li key={idx}>{it}</li>
          ))}
        </ul>
      );
    } else {
      nodes.push(
        <ol key={key} className="list-decimal pl-6 mb-3 text-sm text-slate-700 space-y-1">
          {listItems.map((it, idx) => (
            <li key={idx}>{it}</li>
          ))}
        </ol>
      );
    }
    listMode = null;
    listItems = [];
  };

  const flushCode = () => {
    if (codeBuffer.length === 0) return;
    nodes.push(
      <pre
        key={`code-${nodes.length}`}
        className="bg-slate-900 text-slate-100 rounded-md p-3 overflow-x-auto text-xs mb-3 font-mono"
      >
        {codeBuffer.join("\n")}
      </pre>
    );
    codeBuffer = [];
    inCode = false;
  };

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.replace(/\t/g, "    ");

    // --- fenced code block ---
    if (line.trim().startsWith("```")) {
      if (inCode) {
        flushCode();
      } else {
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

    // --- horizontal rule ---
    if (/^\s*-{3,}\s*$/.test(line)) {
      flushParagraph(paragraphAcc);
      paragraphAcc = [];
      flushList();
      nodes.push(<hr key={`hr-${i}`} className="border-slate-200 my-4" />);
      i++;
      continue;
    }

    // --- headings (# / ## / ###) ---
    const headingMatch = line.match(/^(#{1,6})\s+(.*)/);
    if (headingMatch) {
      flushParagraph(paragraphAcc);
      paragraphAcc = [];
      flushList();
      const level = headingMatch[1].length;
      const content = headingMatch[2];
      const key = `h-${i}`;
      if (level === 1) {
        nodes.push(
          <h2 key={key} className="text-xl font-bold text-slate-900 mb-3 mt-5 first:mt-0">
            {parseInline(content, key)}
          </h2>
        );
      } else if (level === 2) {
        nodes.push(
          <h3 key={key} className="text-lg font-semibold text-slate-800 mb-2 mt-4 first:mt-0">
            {parseInline(content, key)}
          </h3>
        );
      } else {
        nodes.push(
          <h4 key={key} className="text-base font-medium text-slate-700 mb-1 mt-3 first:mt-0">
            {parseInline(content, key)}
          </h4>
        );
      }
      i++;
      continue;
    }

    // --- standalone **bold line** treated as a sub-heading ---
    const boldHeadingMatch = line.match(/^\s*\*\*(.+?)\*\*\s*$/);
    if (boldHeadingMatch) {
      flushParagraph(paragraphAcc);
      paragraphAcc = [];
      flushList();
      nodes.push(
        <h3 key={`bh-${i}`} className="text-lg font-bold text-slate-900 mb-2 mt-4 first:mt-0">
          {boldHeadingMatch[1].trim()}
        </h3>
      );
      i++;
      continue;
    }

    // --- ordered list ---
    const olMatch = line.match(/^\s*\d+\.\s+(.*)/);
    if (olMatch) {
      if (paragraphAcc.length) { flushParagraph(paragraphAcc); paragraphAcc = []; }
      if (listMode !== "ol") { flushList(); listMode = "ol"; listItems = []; }
      listItems.push(<>{parseInline(olMatch[1], `oli-${i}`)}</>);
      i++;
      continue;
    }

    // --- unordered list ---
    const ulMatch = line.match(/^\s*[-*]\s+(.*)/);
    if (ulMatch) {
      if (paragraphAcc.length) { flushParagraph(paragraphAcc); paragraphAcc = []; }
      if (listMode !== "ul") { flushList(); listMode = "ul"; listItems = []; }
      listItems.push(<>{parseInline(ulMatch[1], `uli-${i}`)}</>);
      i++;
      continue;
    }

    // --- blank line ---
    if (line.trim() === "") {
      flushParagraph(paragraphAcc);
      paragraphAcc = [];
      flushList();
      i++;
      continue;
    }

    // --- normal text ---
    paragraphAcc.push(line.trim());
    i++;
  }

  // flush any remaining buffers
  if (inCode) flushCode();
  flushParagraph(paragraphAcc);
  flushList();

  return (
    <div className="prose max-w-none text-slate-700 overflow-visible">{nodes}</div>
  );
}
