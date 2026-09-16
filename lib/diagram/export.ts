import { DiagramData } from "@/types/diagram";
import { toPng, toSvg } from "html-to-image";
import { exportToPlantUml } from "./plantuml-parser";

export function downloadJson(diagram: DiagramData, filename: string = "diagram.json") {
  const jsonStr = JSON.stringify(diagram, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".json") ? filename : `${filename}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadPlantUmlFile(diagram: DiagramData, filename: string = "diagram.puml") {
  const pumlStr = exportToPlantUml(diagram);
  const blob = new Blob([pumlStr], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".puml") ? filename : `${filename}.puml`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Clean UI element filters for exports
const exportFilter = (node: HTMLElement) => {
  const className = typeof node.className === "string" 
    ? node.className 
    : (node.className && typeof node.className === "object" && "baseVal" in node.className)
      ? (node.className as any).baseVal as string
      : "";

  if (className) {
    const classes = className.split(/\s+/);
    return !classes.includes("react-flow__controls") && 
           !classes.includes("react-flow__minimap") &&
           !classes.includes("react-flow__panel") &&
           !classes.includes("react-flow__background") &&
           !classes.includes("react-flow__handle");
  }
  return true;
};

// Calculate exact bounding box of all nodes to ensure 100% of the diagram is captured without clipping
function getDiagramBounds(viewportEl: HTMLElement) {
  const nodeElements = viewportEl.querySelectorAll(".react-flow__node") as NodeListOf<HTMLElement>;
  if (nodeElements.length === 0) {
    return { minX: 0, minY: 0, maxX: 1200, maxY: 800, width: 1200, height: 800 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  nodeElements.forEach((el) => {
    // Parse transform translate(Xpx, Ypx)
    const transform = el.style.transform || "";
    const match = transform.match(/translate(?:3d)?\(\s*(-?\d+(?:\.\d+)?)(?:px)?,\s*(-?\d+(?:\.\d+)?)(?:px)?/);
    
    let x = 0;
    let y = 0;
    if (match) {
      x = parseFloat(match[1]);
      y = parseFloat(match[2]);
    } else {
      x = el.offsetLeft;
      y = el.offsetTop;
    }

    const width = el.offsetWidth || 260;
    const height = el.offsetHeight || 100;

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + width);
    maxY = Math.max(maxY, y + height);
  });

  const padding = 60; // 60px breathing room around all edges
  const width = Math.max(maxX - minX + padding * 2, 400);
  const height = Math.max(maxY - minY + padding * 2, 300);

  return { minX: minX - padding, minY: minY - padding, maxX: maxX + padding, maxY: maxY + padding, width, height };
}

export interface ExportSettings {
  scale?: number;
  bgMode?: "transparent" | "white" | "dark" | "blueprint";
}

export async function downloadPng(
  filename: string = "diagram.png", 
  options: number | ExportSettings = 2
) {
  const scale = typeof options === "number" ? options : (options.scale || 2);
  const bgMode = typeof options === "object" ? options.bgMode || "white" : "white";

  const viewportEl = document.querySelector(".react-flow__viewport") as HTMLElement;
  const rootEl = document.querySelector(".react-flow") as HTMLElement;
  if (!viewportEl || !rootEl) {
    console.error("React Flow viewport element not found for PNG export.");
    return;
  }

  const bounds = getDiagramBounds(viewportEl);

  let bgColor: string | undefined = "#ffffff";
  if (bgMode === "transparent") bgColor = undefined;
  else if (bgMode === "dark") bgColor = "#090d16";
  else if (bgMode === "blueprint") bgColor = "#0b192f";

  try {
    const dataUrl = await toPng(viewportEl, {
      backgroundColor: bgColor,
      pixelRatio: scale,
      width: bounds.width,
      height: bounds.height,
      filter: exportFilter,
      style: {
        width: `${bounds.width}px`,
        height: `${bounds.height}px`,
        transform: `translate(${-bounds.minX}px, ${-bounds.minY}px) scale(1)`,
        transformOrigin: "top left",
        background: bgColor || "transparent",
      }
    });

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename.endsWith(".png") ? filename : `${filename}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error("Failed to export PNG:", err);
  }
}

export async function downloadSvg(
  filename: string = "diagram.svg",
  options: ExportSettings = {}
) {
  const bgMode = options.bgMode || "transparent";
  const viewportEl = document.querySelector(".react-flow__viewport") as HTMLElement;
  if (!viewportEl) {
    console.error("React Flow viewport element not found for SVG export.");
    return;
  }

  const bounds = getDiagramBounds(viewportEl);

  let bgColor: string | undefined = undefined;
  if (bgMode === "white") bgColor = "#ffffff";
  else if (bgMode === "dark") bgColor = "#090d16";
  else if (bgMode === "blueprint") bgColor = "#0b192f";

  try {
    const dataUrl = await toSvg(viewportEl, {
      backgroundColor: bgColor,
      width: bounds.width,
      height: bounds.height,
      filter: exportFilter,
      style: {
        width: `${bounds.width}px`,
        height: `${bounds.height}px`,
        transform: `translate(${-bounds.minX}px, ${-bounds.minY}px) scale(1)`,
        transformOrigin: "top left",
        background: bgColor || "transparent",
      }
    });

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename.endsWith(".svg") ? filename : `${filename}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error("Failed to export SVG:", err);
  }
}

export async function downloadPdf(
  filename: string = "diagram.pdf",
  options: ExportSettings = {}
) {
  // Generate high-resolution image first, then create a clean print layout PDF
  const viewportEl = document.querySelector(".react-flow__viewport") as HTMLElement;
  if (!viewportEl) return;

  const bounds = getDiagramBounds(viewportEl);
  const dataUrl = await toPng(viewportEl, {
    backgroundColor: "#ffffff",
    pixelRatio: 3,
    width: bounds.width,
    height: bounds.height,
    filter: exportFilter,
    style: {
      width: `${bounds.width}px`,
      height: `${bounds.height}px`,
      transform: `translate(${-bounds.minX}px, ${-bounds.minY}px) scale(1)`,
      transformOrigin: "top left",
      background: "#ffffff",
    }
  });

  // Open printable window for PDF download
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${filename}</title>
          <style>
            @page { size: landscape; margin: 0; }
            body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #ffffff; }
            img { max-width: 96vw; max-height: 96vh; object-fit: contain; }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" onload="window.print();window.close();" />
        </body>
      </html>
    `);
    printWindow.document.close();
  }
}
