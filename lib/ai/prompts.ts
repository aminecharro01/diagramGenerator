// Base rules common to all diagram generations
const BASE_SYSTEM_PROMPT = `You are an expert software architect and diagram designer. 
Your task is to generate diagrams in structured JSON format based on user descriptions.

IMPORTANT RULES:
1. Return ONLY a valid JSON object. Do NOT wrap the JSON in markdown code blocks like \`\`\`json ... \`\`\` or output any other text or explanation. Just return raw JSON.
2. The JSON output must match this schema:
{
  "title": "A short descriptive title for the diagram",
  "type": "flowchart" | "architecture" | "erd" | "sequence" | "bpmn",
  "nodes": [
    {
      "id": "unique-node-id",
      "label": "Short Display Name",
      "type": "node-type",
      "description": "Optional short description of the node function",
      "position": { "x": 0, "y": 0 },
      "metadata": {} // custom fields based on diagram type
    }
  ],
  "edges": [
    {
      "id": "unique-edge-id",
      "source": "source-node-id",
      "target": "target-node-id",
      "label": "Optional label showing interaction (e.g., 'HTTPS', 'pub/sub')",
      "type": "default"
    }
  ]
}

3. Layout coordinates (x, y) can be left at 0, as they will be re-calculated by our auto-layout engine.
4. Avoid duplicate node IDs or edge IDs.
5. Create clear, comprehensive, logical connections. Make the diagram highly detailed and realistic. Do not skip essential parts.`;

const TYPE_SPECIFIC_RULES: Record<string, string> = {
  "architecture diagram": `
DIAGRAM TYPE RULES (ARCHITECTURE DIAGRAM):
- Node Types: 'user', 'frontend', 'api', 'backend', 'database', 'cache', 'queue', 'external'.
- Model standard system interactions (e.g. User -> Client -> API Gateway -> Microservices -> Database/Cache).`,

  "flowchart": `
DIAGRAM TYPE RULES (FLOWCHART):
- Node Types: 'start', 'process', 'decision', 'end'.
- Connect decision nodes to processes with clear conditional labels (e.g. 'Yes'/'No', 'Success'/'Error').`,

  "class diagram": `
DIAGRAM TYPE RULES (CLASS DIAGRAM):
- Node Types: 'class'.
- Use the "metadata" property to provide "attributes" (array of strings) and "methods" (array of strings).
- Model inheritance (extends), associations, and aggregation connections.`,

  "use case diagram": `
DIAGRAM TYPE RULES (USE CASE DIAGRAM):
- Node Types: 'actor', 'usecase'.
- Model actors interacting with various use cases inside a system boundary.`,

  "sequence diagram": `
DIAGRAM TYPE RULES (SEQUENCE DIAGRAM):
- Node Types: 'actor', 'service'.
- Edges indicate communication flow in sequential order. Edge labels describe chronological actions (e.g. '1. Login Request', '2. Verify Creds').`,

  "activity diagram": `
DIAGRAM TYPE RULES (ACTIVITY DIAGRAM):
- Node Types: 'start', 'action', 'decision', 'fork', 'join', 'end'.
- Model workflows, parallel paths split by 'fork' and synchronized by 'join'.`,

  "entity relationship diagram (erd)": `
DIAGRAM TYPE RULES (ERD):
- Node Types: 'entity'.
- Inside "metadata", provide an "attributes" array. Each attribute object must have:
  - "name": "field_name"
  - "type": "VARCHAR" | "INTEGER" | "UUID" | "TIMESTAMP" etc.
  - "isPk": true/false (primary key)
  - "isFk": true/false (foreign key)
- Connections show cardinality (e.g., "1:N", "N:M", "1:1").`,

  "component diagram": `
DIAGRAM TYPE RULES (COMPONENT DIAGRAM):
- Node Types: 'component', 'interface', 'database'.
- Model software components and interfaces they expose or consume.`,

  "deployment diagram": `
DIAGRAM TYPE RULES (DEPLOYMENT DIAGRAM):
- Node Types: 'node', 'device', 'artifact'.
- Model physical or virtual nodes (e.g. 'Web Server VM', 'Database Server', 'AWS RDS') hosting software artifacts.`,

  "package diagram": `
DIAGRAM TYPE RULES (PACKAGE DIAGRAM):
- Node Types: 'package'.
- Model organization and dependencies between packages, modules, or namespaces.`,

  "state machine diagram": `
DIAGRAM TYPE RULES (STATE MACHINE DIAGRAM):
- Node Types: 'start', 'state', 'choice', 'end'.
- Model transitions between states triggered by events (label transitions).`,

  "data flow diagram (dfd)": `
DIAGRAM TYPE RULES (DATA FLOW DIAGRAM - DFD):
- Node Types: 'external', 'process', 'datastore'.
- Model input/output data flows between external entities, processing tasks, and data stores.`,

  "system context diagram": `
DIAGRAM TYPE RULES (SYSTEM CONTEXT DIAGRAM):
- Node Types: 'user', 'system', 'external'.
- Model the entire system as a single central node surrounded by users and external dependent systems.`,

  "mind map": `
DIAGRAM TYPE RULES (MIND MAP):
- Node Types: 'topic', 'subtopic'.
- Model hierarchical relationships branching radially from a central central topic node.`,

  "network diagram": `
DIAGRAM TYPE RULES (NETWORK DIAGRAM):
- Node Types: 'router', 'switch', 'firewall', 'server', 'device'.
- Model local area networks, subnets, routers, firewalls, and client machines connections.`,

  "infrastructure diagram": `
DIAGRAM TYPE RULES (INFRASTRUCTURE DIAGRAM):
- Node Types: 'user', 'compute', 'database', 'network', 'storage', 'external'.
- Model cloud resources (e.g. AWS EC2, S3, RDS, VPC) and how they communicate.`,

  "database schema": `
DIAGRAM TYPE RULES (DATABASE SCHEMA):
- Node Types: 'entity'.
- Similar to ERD; model database tables with column names, primary keys, and data types in the metadata attributes.`,

  "bpmn-style process diagram": `
DIAGRAM TYPE RULES (BPMN Workflow):
- Node Types: 'event', 'task', 'gateway'.
- Model business processes using start events, end events, service/user tasks, and parallel/exclusive gateways.`,

  "timeline": `
DIAGRAM TYPE RULES (TIMELINE):
- Node Types: 'milestone', 'event'.
- Model chronological sequences of events or project phase milestones.`,

  "organization chart": `
DIAGRAM TYPE RULES (ORGANIZATION CHART):
- Node Types: 'manager', 'employee', 'department'.
- Model hierarchical reporting relationships in an organization.`,
};

// Main dynamic builder (Saves up to 70% input tokens per generation)
export function getSystemPromptForType(type: string): string {
  const normType = (type || "").toLowerCase().trim();
  
  // Find matching type rule
  let specificRules = TYPE_SPECIFIC_RULES[normType] || "";
  if (!specificRules) {
    // Attempt fallback matches
    const key = Object.keys(TYPE_SPECIFIC_RULES).find(k => normType.includes(k) || k.includes(normType));
    if (key) {
      specificRules = TYPE_SPECIFIC_RULES[key];
    } else {
      specificRules = `DIAGRAM TYPE RULES (${type.toUpperCase()}): Model components and relationships logically.`;
    }
  }

  return `${BASE_SYSTEM_PROMPT}\n${specificRules}`;
}

// Fallback legacy constant for backwards compatibility
export const SYSTEM_PROMPT = `${BASE_SYSTEM_PROMPT}\n\nDIAGRAM TYPE SPECIFICS:\n1. FLOWCHART:${TYPE_SPECIFIC_RULES.flowchart}\n2. ARCHITECTURE:${TYPE_SPECIFIC_RULES["architecture diagram"]}\n3. ERD:${TYPE_SPECIFIC_RULES["entity relationship diagram (erd)"]}\n4. SEQUENCE:${TYPE_SPECIFIC_RULES["sequence diagram"]}\n5. BPMN:${TYPE_SPECIFIC_RULES["bpmn-style process diagram"]}`;

export function getPromptForType(
  type: string,
  prompt: string,
  settings?: Record<string, any>
): string {
  let finalPrompt = `Generate a diagram of type "${type}" based on this prompt: "${prompt}".`;
  
  if (settings) {
    finalPrompt += `\nApply the following design context to the structural content generated:`;
    if (settings.visualStyle) finalPrompt += `\n- Visual Style: ${settings.visualStyle}`;
    if (settings.nodeDesign) finalPrompt += `\n- Node Design Option: ${settings.nodeDesign} (affect labels and descriptions appropriately)`;
    
    // Density & Detail control
    const density = settings.diagramDensity || "Medium";
    const detail = settings.nodeDetail || "Standard";
    finalPrompt += `\n- Detail Level: ${detail} (e.g. if 'Minimal', include only name labels. If 'Detailed', include technologies/methods. If 'Very Detailed', provide exhaustive descriptions and metadata attributes)`;
    finalPrompt += `\n- Diagram Density: ${density} (if 'Low' or 'Minimal', generate fewer nodes (only key components). If 'High' or 'Very High', include secondary components, helper services, and all detailed connections)`;

    if (settings.useIcons !== undefined) finalPrompt += `\n- Use Icons: ${settings.useIcons ? 'Yes' : 'No'}`;
    if (settings.iconSource) finalPrompt += `\n- Icon categories: ${settings.iconSource}`;
    
    if (settings.colorPalette) {
      finalPrompt += `\n- Color Palette Theme: ${settings.colorPalette}`;
      if (settings.colorPalette === "Auto Color") {
        finalPrompt += `\n- Auto Color: Group nodes by category and assign distinct, semantic string values to node types (e.g. set metadata.category = 'frontend' or 'database' or 'api' to helper nodes so they can color-match dynamically)`;
      }
    }
    
    if (settings.readability) {
      finalPrompt += `\n- Readability Requirement: ${settings.readability} (if 'Highly Readable', simplify text, avoid wordy labels, keep links concise)`;
    }
  }

  finalPrompt += `\nEnsure you adhere strictly to the system instruction and output only clean JSON schema structure.`;
  return finalPrompt;
}

// Optimized refinement system instructions (Saves up to 20% on edit prompts)
export function getRefinePrompt(existingDiagramJson: string): string {
  return `You are an expert diagram designer. 
Modify the following existing JSON diagram based on the user's instructions:
${existingDiagramJson}

Rules:
1. Return ONLY the updated JSON object. No markdown wrappers or explanation text.
2. Only modify, add, or delete elements as explicitly requested in the instruction. Keep all other nodes and edges intact.
3. Retain node schema structure and standard React Flow parameters. If settings configuration is present in the input JSON settings, preserve it unchanged unless explicitly asked to modify settings.`;
}
