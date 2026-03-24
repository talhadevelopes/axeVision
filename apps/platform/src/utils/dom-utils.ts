import type { RawNodeDatum } from "react-d3-tree";

export interface DOMNode {
  type: string;
  attributes: Record<string, string>;
  children: DOMNode[];
  outerHTML: string;
  innerHTML: string;
  key: string;
  id?: string;
  className?: string;
  content?: string;
}

export interface ParseHTMLResult {
  domTree: DOMNode;
  elementCounts: Record<string, number>;
}

//Parse HTML content and return both the DOM tree and element counts
export const parseHTMLContent = (htmlContent: string): ParseHTMLResult => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, "text/html");

  if (!doc.documentElement) {
    throw new Error("Failed to parse HTML: Invalid document");
  }

  const domTree = convertDOMToTree(doc.documentElement);
  const elementCounts: Record<string, number> = {};
  countElements(domTree, elementCounts);

  return { domTree, elementCounts };
};


// Count all elements in the DOM tree by type
export const countElements = (node: DOMNode, counts: Record<string, number>): void => {
  if (node.type !== "#text") {
    counts[node.type] = (counts[node.type] || 0) + 1;
  }
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      countElements(child, counts);
    }
  }
};

// Convert a DOM Element into a structured tree object
export const convertDOMToTree = (node: Element, index = 0): DOMNode => {
  const nodeData: DOMNode = {
    type: node.nodeName.toLowerCase(),
    attributes: {},
    children: [],
    outerHTML: (node as HTMLElement).outerHTML,
    innerHTML: (node as HTMLElement).innerHTML,
    key: `${node.nodeName.toLowerCase()}-${index}`,
  };

  if ((node as HTMLElement).attributes) {
    for (let i = 0; i < (node as HTMLElement).attributes.length; i++) {
      const attr = (node as HTMLElement).attributes[i];
      if (attr) {
        nodeData.attributes[attr.name] = attr.value;
      }
    }
  }

  if ((node as HTMLElement).id) {
    nodeData.id = (node as HTMLElement).id;
  }
  if ((node as HTMLElement).className) {
    nodeData.className = (node as HTMLElement).className;
  }

  if (node.childNodes) {
    for (let i = 0; i < node.childNodes.length; i++) {
      const childNode = node.childNodes[i];
      if (childNode?.nodeType === Node.TEXT_NODE) {
        const text = childNode.textContent?.trim();
        if (text) {
          nodeData.children.push({
            type: "#text",
            content: text,
            outerHTML: text,
            innerHTML: text,
            key: `text-${index}-${i}`,
            attributes: {},
            children: [],
          });
        }
      } else if (childNode?.nodeType === Node.ELEMENT_NODE) {
        nodeData.children.push(convertDOMToTree(childNode as Element, i));
      }
    }
  }

  return nodeData;
};

// Convert DOM node to D3 tree format
export const toD3Node = (node: DOMNode): RawNodeDatum => {
  const idPart = node.id ? `#${node.id}` : "";
  const classPart = node.className
    ? `.${String(node.className).split(" ").join(".")}`
    : "";
  const name =
    node.type === "#text"
      ? `#text: ${String(node.content).slice(0, 40)}`
      : `${node.type}${idPart}${classPart}`;

  const attributes: Record<string, string | number | boolean> = {};
  if (node.attributes) {
    for (const [k, v] of Object.entries(node.attributes)) {
      if (typeof v === "string" && v.length > 100) continue;
      attributes[k] = v;
    }
  }
  if (node.type !== "#text") {
    attributes.childrenCount = Array.isArray(node.children)
      ? node.children.length
      : 0;
  }

  const children: RawNodeDatum[] = Array.isArray(node.children)
    ? node.children.map((c) => toD3Node(c))
    : [];

  return {
    name,
    attributes: Object.keys(attributes).length ? attributes : undefined,
    children: children.length ? children : undefined,
  };
};