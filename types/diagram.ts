export interface DiagramNode {
  id: string;
  label: string;
  type: string; // service, database, user, external, cache, queue, decision, process, entity, etc.
  description?: string;
  position: { x: number; y: number };
  metadata?: Record<string, any>;
}

export interface DiagramEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: string;
}

export interface DiagramData {
  title: string;
  type: string; // flowchart, architecture, erd, sequence, bpmn
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

export interface DiagramRecord {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  diagram_type: string;
  prompt: string | null;
  diagram_data: DiagramData;
  thumbnail_url: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface VersionRecord {
  id: string;
  diagram_id: string;
  user_id: string;
  version_number: number;
  diagram_data: DiagramData;
  prompt: string | null;
  created_at: string;
}

export interface UsageRecord {
  id: string;
  user_id: string;
  generation_count: number;
  last_generation_at: string;
  created_at: string;
  updated_at: string;
}
