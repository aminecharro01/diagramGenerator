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

export const DiagramDataSchema = z.object({
  title: z.string().default("Untitled Diagram"),
  type: z.string(), // flowchart, architecture, erd, sequence, bpmn
  nodes: z.array(NodeSchema),
  edges: z.array(EdgeSchema),
});
