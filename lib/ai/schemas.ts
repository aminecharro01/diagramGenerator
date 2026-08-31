import { z } from "zod";

export const NodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.string(), // service, database, user, external, cache, queue, decision, process, entity, etc.
  description: z.string().optional(),
  position: z.object({
    x: z.number().default(0),
    y: z.number().default(0),
  }).default({ x: 0, y: 0 }),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const EdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  label: z.string().optional(),
  type: z.string().optional().default("default"),
});

export const DiagramSettingsSchema = z.object({
  visualStyle: z.string().optional(),
  nodeDesign: z.string().optional(),
  nodeDetail: z.string().optional(),
  useIcons: z.boolean().optional(),
  iconSource: z.string().optional(),
  colorPalette: z.string().optional(),
  customColors: z.object({
    background: z.string().optional(),
    node: z.string().optional(),
    border: z.string().optional(),
    text: z.string().optional(),
    connector: z.string().optional(),
    accent: z.string().optional(),
  }).optional(),
  fontFamily: z.string().optional(),
  fontSize: z.string().optional(),
  fontWeight: z.string().optional(),
  layoutDirection: z.string().optional(),
  nodeSpacing: z.string().optional(),
  connectorSpacing: z.string().optional(),
  aspectRatio: z.string().optional(),
  aspectRatioCustom: z.object({
    width: z.number().optional(),
    height: z.number().optional(),
    dpi: z.number().optional(),
  }).optional(),
  readability: z.string().optional(),
  autoOptimizeReadability: z.boolean().optional(),
  diagramDensity: z.string().optional(),
  connectorStyle: z.string().optional(),
  arrowStyle: z.string().optional(),
  lineThickness: z.string().optional(),
  lineType: z.string().optional(),
  relationshipLabels: z.string().optional(),
  backgroundTemplate: z.string().optional(),
}).optional();

export const DiagramDataSchema = z.object({
  title: z.string().default("Untitled Diagram"),
  type: z.string(), // flowchart, architecture, erd, sequence, bpmn, etc.
  nodes: z.array(NodeSchema),
  edges: z.array(EdgeSchema),
  settings: DiagramSettingsSchema,
});
