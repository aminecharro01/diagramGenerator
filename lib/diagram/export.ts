import { DiagramData } from "@/types/diagram";
import { toPng, toSvg } from "html-to-image";

export function downloadJson(diagram: DiagramData, filename: string = "diagram.json") {
  const jsonStr = JSON.stringify(diagram, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Clean UI element filters for exports
const exportFilter = (node: HTMLElement) => {
  // Safe className string extraction (handles both HTML elements and SVGAnimatedString)
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
           !classes.includes("react-flow__background"); // Filter out background grid container completely for transparent exports
  }
  return true;
};

export async function downloadSvg(filename: string = "diagram.svg") {
  const el = document.querySelector(".react-flow") as HTMLElement;
  if (!el) {
    console.error("React Flow root element not found for SVG export.");
    return;
  }

  const isDark = document.documentElement.classList.contains("dark");
  const paths = el.querySelectorAll(".react-flow__edge-path") as NodeListOf<SVGPathElement>;
  const markers = el.querySelectorAll("marker path") as NodeListOf<SVGPathElement>;
  const originalStrokes: string[] = [];
  const originalMarkerFills: string[] = [];

  if (isDark) {
    el.classList.add("dark");
    // Temporarily apply a dark high-contrast color to relation lines and arrowheads
    // so they are clearly visible when the transparent diagram is placed on light document pages (e.g. Word)
    paths.forEach((path, idx) => {
      originalStrokes[idx] = path.style.stroke;
      path.style.stroke = "#475569"; // Slate-600
    });
    markers.forEach((marker, idx) => {
      originalMarkerFills[idx] = marker.style.fill || marker.getAttribute("fill") || "";
      marker.style.fill = "#475569";
      marker.setAttribute("fill", "#475569");
    });
  }

  try {
    const dataUrl = await toSvg(el, {
      backgroundColor: undefined, // Transparent background
      filter: exportFilter,
      style: {
        background: "transparent",
        backgroundColor: "transparent",
      }
    });

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error("Failed to export SVG:", err);
  } finally {
    if (isDark) {
      el.classList.remove("dark");
      paths.forEach((path, idx) => {
        path.style.stroke = originalStrokes[idx] || "";
      });
      markers.forEach((marker, idx) => {
        if (originalMarkerFills[idx]) {
          marker.style.fill = originalMarkerFills[idx];
          marker.setAttribute("fill", originalMarkerFills[idx]);
        } else {
          marker.style.removeProperty("fill");
          marker.removeAttribute("fill");
        }
      });
    }
  }
}

export async function downloadPng(filename: string = "diagram.png", scale: number = 2) {
  const el = document.querySelector(".react-flow") as HTMLElement;
  if (!el) {
    console.error("React Flow root element not found for PNG export.");
    return;
  }

  const isDark = document.documentElement.classList.contains("dark");
  const paths = el.querySelectorAll(".react-flow__edge-path") as NodeListOf<SVGPathElement>;
  const markers = el.querySelectorAll("marker path") as NodeListOf<SVGPathElement>;
  const originalStrokes: string[] = [];
  const originalMarkerFills: string[] = [];

  if (isDark) {
    el.classList.add("dark");
    // Temporarily apply a dark high-contrast color to relation lines and arrowheads
    // so they are clearly visible when the transparent diagram is placed on light document pages (e.g. Word)
    paths.forEach((path, idx) => {
      originalStrokes[idx] = path.style.stroke;
      path.style.stroke = "#475569"; // Slate-600
    });
    markers.forEach((marker, idx) => {
      originalMarkerFills[idx] = marker.style.fill || marker.getAttribute("fill") || "";
      marker.style.fill = "#475569";
      marker.setAttribute("fill", "#475569");
    });
  }

  try {
    const dataUrl = await toPng(el, {
      backgroundColor: undefined, // Transparent background
      pixelRatio: scale,
      filter: exportFilter,
      style: {
        background: "transparent",
        backgroundColor: "transparent",
      }
    });

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error("Failed to export PNG:", err);
  } finally {
    if (isDark) {
      el.classList.remove("dark");
      paths.forEach((path, idx) => {
        path.style.stroke = originalStrokes[idx] || "";
      });
      markers.forEach((marker, idx) => {
        if (originalMarkerFills[idx]) {
          marker.style.fill = originalMarkerFills[idx];
          marker.setAttribute("fill", originalMarkerFills[idx]);
        } else {
          marker.style.removeProperty("fill");
          marker.removeAttribute("fill");
        }
      });
    }
  }
}
