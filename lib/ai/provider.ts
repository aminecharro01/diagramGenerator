import { SYSTEM_PROMPT } from "./prompts";
import { DiagramData } from "@/types/diagram";
import { DiagramDataSchema } from "./schemas";

interface GenerateParams {
  prompt: string;
  type: string;
}

interface RefineParams {
  existingDiagram: DiagramData;
  instruction: string;
}

import fs from "fs";
import path from "path";

function getEnvConfig() {
  const env: Record<string, string> = {};
  try {
    const envPath = path.resolve(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          const idx = trimmed.indexOf("=");
          if (idx !== -1) {
            env[trimmed.substring(0, idx).trim()] = trimmed.substring(idx + 1).trim();
          }
        }
      }
    }
  } catch (e) {
    // ignore
  }

  const apiKey = process.env.AI_API_KEY || env.AI_API_KEY;
  const baseUrl = process.env.AI_BASE_URL || env.AI_BASE_URL || "https://api.openai.com/v1";
  const model = process.env.AI_MODEL || env.AI_MODEL || "gpt-4o-mini";

  return { apiKey, baseUrl, model };
}

export async function callAI(
  systemPrompt: string,
  userPrompt: string
): Promise<DiagramData> {
  const { apiKey, baseUrl, model } = getEnvConfig();

  if (!apiKey || apiKey.includes("mock-ai-key-placeholder") || apiKey.trim() === "") {
    throw new Error(
      "AI API Key is not configured. Please add your AI_API_KEY in .env.local and verify your API credentials."
    );
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`AI API call failed [${response.status}]:`, errorText);
    throw new Error(`AI API returned error (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  const rawContent = result.choices?.[0]?.message?.content;
  if (!rawContent) {
    throw new Error("Empty response returned by the AI provider.");
  }

  // Extract JSON payload cleanly, stripping code fences or extra conversational text
  let cleanJson = rawContent.trim();
  const codeBlockMatch = cleanJson.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    cleanJson = codeBlockMatch[1].trim();
  } else {
    const firstBrace = cleanJson.indexOf("{");
    const lastBrace = cleanJson.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) {
      cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
    }
  }

  try {
    const parsedData = JSON.parse(cleanJson);
    return DiagramDataSchema.parse(parsedData);
  } catch (parseError: any) {
    console.error("Failed to parse AI response into schema:", parseError, "Raw output:", rawContent);
    throw new Error(`AI response could not be parsed into diagram schema: ${parseError.message}`);
  }
}

// INTELLIGENT OFFLINE GENERATION FALLBACK
function generateOfflineFallback(prompt: string, systemPrompt: string): DiagramData {
  const lowerPrompt = prompt.toLowerCase();
  const isRefine = systemPrompt.includes("refine");

  // Helper for generating node layout spacing
  const assignPositions = (nodes: any[]) => {
    return nodes.map((node, i) => ({
      ...node,
      position: { x: (i % 3) * 250, y: Math.floor(i / 3) * 150 },
    }));
  };

  // If refinement, we adjust the diagram data based on instructions
  if (isRefine) {
    try {
      // Find JSON block inside systemPrompt
      const jsonStart = systemPrompt.indexOf("{");
      const jsonEnd = systemPrompt.lastIndexOf("}") + 1;
      const originalData = JSON.parse(systemPrompt.substring(jsonStart, jsonEnd));
      
      const refinedNodes = [...originalData.nodes];
      const refinedEdges = [...originalData.edges];

      if (lowerPrompt.includes("redis") || lowerPrompt.includes("cache")) {
        const id = "redis_cache";
        if (!refinedNodes.some(n => n.id === id)) {
          refinedNodes.push({
            id,
            label: "Redis Cache",
            type: "cache",
            description: "High-speed in-memory data store",
            position: { x: 400, y: 200 }
          });
          // Connect to backend
          const backendNode = refinedNodes.find(n => n.id.includes("backend") || n.id.includes("api"));
          if (backendNode) {
            refinedEdges.push({
              id: `edge-backend-${id}`,
              source: backendNode.id,
              target: id,
              label: "cache lookup",
              type: "default"
            });
          }
        }
      } else if (lowerPrompt.includes("auth") || lowerPrompt.includes("jwt")) {
        const id = "auth_service";
        if (!refinedNodes.some(n => n.id === id)) {
          refinedNodes.push({
            id,
            label: "Auth Service",
            type: "external",
            description: "JSON Web Token Validation Provider",
            position: { x: 300, y: 100 }
          });
          const apiNode = refinedNodes.find(n => n.id.includes("api") || n.id.includes("gateway") || n.id.includes("frontend"));
          if (apiNode) {
            refinedEdges.push({
              id: `edge-${apiNode.id}-${id}`,
              source: apiNode.id,
              target: id,
              label: "authorize",
              type: "default"
            });
          }
        }
      } else {
        // generic node append based on user prompt
        const id = `node_${Date.now().toString().slice(-4)}`;
        const cleanedLabel = prompt.replace(/add/i, "").trim();
        refinedNodes.push({
          id,
          label: cleanedLabel || "New Service Component",
          type: "service",
          description: "Dynamically added component",
          position: { x: 200, y: 200 }
        });
        if (refinedNodes.length > 1) {
          refinedEdges.push({
            id: `edge-${refinedNodes[refinedNodes.length - 2].id}-${id}`,
            source: refinedNodes[refinedNodes.length - 2].id,
            target: id,
            label: "interacts",
            type: "default"
          });
        }
      }

      return {
        title: originalData.title,
        type: originalData.type,
        nodes: refinedNodes,
        edges: refinedEdges
      };
    } catch (e) {
      // ignore parsing error and generate fresh flowchart
    }
  }

  // --- ERD DIAGRAM TEMPLATE ---
  if (lowerPrompt.includes("erd") || lowerPrompt.includes("database") || lowerPrompt.includes("schema") || lowerPrompt.includes("inventory")) {
    return {
      title: "E-Commerce Database Model",
      type: "erd",
      nodes: assignPositions([
        {
          id: "users",
          label: "users",
          type: "entity",
          description: "Registered platform users and authentication credentials",
          metadata: {
            tech: "PostgreSQL 16",
            layer: "IDENTITY",
            badge: "Core Table",
            status: "active",
            category: "database",
            attributes: [
              { name: "id", type: "UUID", isPk: true, isFk: false },
              { name: "email", type: "VARCHAR(255)", isPk: false, isFk: false },
              { name: "password_hash", type: "VARCHAR(255)", isPk: false, isFk: false },
              { name: "role", type: "VARCHAR(50)", isPk: false, isFk: false },
              { name: "created_at", type: "TIMESTAMP", isPk: false, isFk: false }
            ]
          }
        },
        {
          id: "orders",
          label: "orders",
          type: "entity",
          description: "Customer checkout orders and fulfillment state",
          metadata: {
            tech: "PostgreSQL 16",
            layer: "COMMERCE",
            badge: "Partitioned",
            status: "active",
            category: "database",
            attributes: [
              { name: "id", type: "UUID", isPk: true, isFk: false },
              { name: "user_id", type: "UUID", isPk: false, isFk: true },
              { name: "total_amount", type: "DECIMAL(10,2)", isPk: false, isFk: false },
              { name: "status", type: "VARCHAR(50)", isPk: false, isFk: false },
              { name: "created_at", type: "TIMESTAMP", isPk: false, isFk: false }
            ]
          }
        },
        {
          id: "order_items",
          label: "order_items",
          type: "entity",
          description: "Junction line items linking orders with warehouse products",
          metadata: {
            tech: "PostgreSQL 16",
            layer: "COMMERCE",
            badge: "Junction",
            status: "active",
            category: "database",
            attributes: [
              { name: "id", type: "UUID", isPk: true, isFk: false },
              { name: "order_id", type: "UUID", isPk: false, isFk: true },
              { name: "product_id", type: "UUID", isPk: false, isFk: true },
              { name: "quantity", type: "INTEGER", isPk: false, isFk: false },
              { name: "unit_price", type: "DECIMAL(10,2)", isPk: false, isFk: false }
            ]
          }
        },
        {
          id: "products",
          label: "products",
          type: "entity",
          description: "Product catalog inventory and pricing",
          metadata: {
            tech: "PostgreSQL 16",
            layer: "CATALOG",
            badge: "Indexed",
            status: "active",
            category: "database",
            attributes: [
              { name: "id", type: "UUID", isPk: true, isFk: false },
              { name: "sku", type: "VARCHAR(100)", isPk: false, isFk: false },
              { name: "name", type: "VARCHAR(255)", isPk: false, isFk: false },
              { name: "price", type: "DECIMAL(10,2)", isPk: false, isFk: false },
              { name: "stock_quantity", type: "INTEGER", isPk: false, isFk: false }
            ]
          }
        }
      ]),
      edges: [
        { id: "e1", source: "users", target: "orders", label: "1:N (places)", type: "default" },
        { id: "e2", source: "orders", target: "order_items", label: "1:N (contains)", type: "default" },
        { id: "e3", source: "products", target: "order_items", label: "1:N (referenced by)", type: "default" }
      ]
    };
  }

  // --- SEQUENCE DIAGRAM TEMPLATE ---
  if (lowerPrompt.includes("sequence") || lowerPrompt.includes("jwt") || lowerPrompt.includes("auth flow")) {
    return {
      title: "OAuth2 & JWT Authentication Flow",
      type: "sequence",
      nodes: assignPositions([
        { 
          id: "client", 
          label: "Web Browser Client", 
          type: "actor", 
          description: "Next.js SPA frontend client",
          metadata: { tech: "React / Next.js", layer: "CLIENT", status: "active" }
        },
        { 
          id: "gateway", 
          label: "API Gateway", 
          type: "api", 
          description: "Reverse proxy, rate limiting, and SSL termination",
          metadata: { tech: "Kong / Envoy", layer: "GATEWAY", status: "active" }
        },
        { 
          id: "auth_srv", 
          label: "Authentication Service", 
          type: "service", 
          description: "Validates credentials and mints JWTs",
          metadata: { tech: "Go / Gin", layer: "MICROSERVICE", badge: "Auth0 / OIDC", status: "active" }
        },
        { 
          id: "user_db", 
          label: "User Database", 
          type: "database", 
          description: "Encrypted credentials and user profile store",
          metadata: { tech: "PostgreSQL 16", layer: "PERSISTENCE", badge: "Primary", status: "active" }
        }
      ]),
      edges: [
        { id: "s1", source: "client", target: "gateway", label: "1. POST /api/auth/login", type: "default" },
        { id: "s2", source: "gateway", target: "auth_srv", label: "2. Forward creds (gRPC)", type: "default" },
        { id: "s3", source: "auth_srv", target: "user_db", label: "3. QueryUserByEmail(email)", type: "default" },
        { id: "s4", source: "user_db", target: "auth_srv", label: "4. Return Argon2 hash", type: "default" },
        { id: "s5", source: "auth_srv", target: "gateway", label: "5. Sign & Return JWT (RS256)", type: "default" },
        { id: "s6", source: "gateway", target: "client", label: "6. Set HTTP-only Cookie & 200 OK", type: "default" }
      ]
    };
  }

  // --- ARCHITECTURE DIAGRAM TEMPLATE ---
  if (lowerPrompt.includes("architecture") || lowerPrompt.includes("saas") || lowerPrompt.includes("microservice") || lowerPrompt.includes("aws")) {
    return {
      title: "Cloud-Native SaaS Microservices Architecture",
      type: "architecture",
      nodes: assignPositions([
        { 
          id: "user", 
          label: "End Users", 
          type: "user", 
          description: "Global web and mobile application consumers",
          metadata: { tech: "Web & Mobile", layer: "CLIENT", status: "active", category: "frontend" }
        },
        { 
          id: "frontend", 
          label: "Edge Frontend WebApp", 
          type: "frontend", 
          description: "Server-side rendered application deployed on Vercel Edge",
          metadata: { tech: "Next.js 15 / TypeScript", layer: "PRESENTATION", badge: "Edge SSR", status: "active", category: "frontend" }
        },
        { 
          id: "api_gw", 
          label: "Kong API Gateway", 
          type: "api", 
          description: "Central entrypoint with WAF, rate limits, and JWT verification",
          metadata: { tech: "Kong Enterprise", layer: "INGRESS", badge: "WAF & Routing", status: "active", category: "external" }
        },
        { 
          id: "core_api", 
          label: "Core Services API", 
          type: "backend", 
          description: "Containerized business logic and orchestration services",
          metadata: { tech: "FastAPI / Python", layer: "MICROSERVICE", badge: "Kubernetes", status: "active", category: "backend" }
        },
        { 
          id: "event_bus", 
          label: "Kafka Event Broker", 
          type: "queue", 
          description: "Distributed pub/sub event streaming pipeline",
          metadata: { tech: "Apache Kafka", layer: "EVENT BUS", badge: "Partitioned", status: "active", category: "queue" }
        },
        { 
          id: "cache", 
          label: "Redis Cache Cluster", 
          type: "cache", 
          description: "Sub-millisecond latency distributed memory store",
          metadata: { tech: "Redis 7 Cluster", layer: "CACHING", badge: "In-Memory", status: "active", category: "cache" }
        },
        { 
          id: "database", 
          label: "PostgreSQL Aurora DB", 
          type: "database", 
          description: "Multi-AZ ACID compliant transactional database",
          metadata: { tech: "AWS Aurora PostgreSQL", layer: "DATA STORE", badge: "Multi-AZ Primary", status: "active", category: "database" }
        },
        { 
          id: "stripe", 
          label: "Stripe Billing Platform", 
          type: "external", 
          description: "PCI-DSS compliant subscription billing and webhooks",
          metadata: { tech: "Stripe API v2024", layer: "EXTERNAL", badge: "PCI-DSS", status: "active", category: "external" }
        }
      ]),
      edges: [
        { id: "a1", source: "user", target: "frontend", label: "HTTPS / TLS 1.3", type: "default" },
        { id: "a2", source: "frontend", target: "api_gw", label: "REST / JSON", type: "default" },
        { id: "a3", source: "api_gw", target: "core_api", label: "gRPC (mTLS)", type: "default" },
        { id: "a4", source: "core_api", target: "cache", label: "Cache Lookup", type: "default" },
        { id: "a5", source: "core_api", target: "database", label: "SQL Queries (Pool)", type: "default" },
        { id: "a6", source: "core_api", target: "event_bus", label: "pub/sub (Events)", type: "default", animated: true },
        { id: "a7", source: "core_api", target: "stripe", label: "HTTPS Webhooks", type: "default", style: { strokeDasharray: "5,5" } }
      ]
    };
  }

  // --- BPMN DIAGRAM TEMPLATE ---
  if (lowerPrompt.includes("bpmn") || lowerPrompt.includes("business") || lowerPrompt.includes("process")) {
    return {
      title: "Order Fulfillment & Billing Workflow",
      type: "bpmn",
      nodes: assignPositions([
        { 
          id: "start_evt", 
          label: "Order Placed", 
          type: "event", 
          description: "Customer checkout event triggered",
          metadata: { layer: "EVENT", status: "active" }
        },
        { 
          id: "chk_stock", 
          label: "Verify Warehouse Stock", 
          type: "task", 
          description: "Query real-time inventory management database",
          metadata: { tech: "Inventory API", layer: "SERVICE TASK", status: "active" }
        },
        { 
          id: "gw_stock", 
          label: "Items in Stock?", 
          type: "gateway", 
          description: "Exclusive XOR branch decision",
          metadata: { layer: "DECISION GATEWAY" }
        },
        { 
          id: "charge_card", 
          label: "Process Card Payment", 
          type: "task", 
          description: "Authorize and capture charge via Stripe",
          metadata: { tech: "Stripe API", layer: "SERVICE TASK", status: "active" }
        },
        { 
          id: "notify_fail", 
          label: "Send Out-of-Stock Email", 
          type: "task", 
          description: "Notify customer of delayed backorder",
          metadata: { tech: "Resend / SES", layer: "SERVICE TASK", status: "active" }
        },
        { 
          id: "ship_pkg", 
          label: "Dispatch Shipment", 
          type: "task", 
          description: "Generate shipping label and notify carrier",
          metadata: { tech: "FedEx / DHL API", layer: "SERVICE TASK", status: "active" }
        },
        { 
          id: "end_success", 
          label: "Fulfillment Completed", 
          type: "event", 
          description: "Order marked delivered and closed",
          metadata: { layer: "END EVENT" }
        },
        { 
          id: "end_fail", 
          label: "Order Cancelled", 
          type: "event", 
          description: "Inventory rollback and order termination",
          metadata: { layer: "END EVENT" }
        }
      ]),
      edges: [
        { id: "b1", source: "start_evt", target: "chk_stock", label: "", type: "default" },
        { id: "b2", source: "chk_stock", target: "gw_stock", label: "", type: "default" },
        { id: "b3", source: "gw_stock", target: "charge_card", label: "Yes", type: "default" },
        { id: "b4", source: "gw_stock", target: "notify_fail", label: "No", type: "default" },
        { id: "b5", source: "notify_fail", target: "end_fail", label: "", type: "default" },
        { id: "b6", source: "charge_card", target: "ship_pkg", label: "Success", type: "default" },
        { id: "b7", source: "ship_pkg", target: "end_success", label: "", type: "default" }
      ]
    };
  }

  // --- GENERAL FLOWCHART TEMPLATE (DEFAULT) ---
  return {
    title: "Secure Authentication Verification Flowchart",
    type: "flowchart",
    nodes: assignPositions([
      { id: "start", label: "Start Request", type: "start", description: "Inbound HTTP request received", metadata: { layer: "START" } },
      { id: "step1", label: "Extract Bearer Token", type: "process", description: "Read Authorization header", metadata: { tech: "Middleware", layer: "PROCESS" } },
      { id: "chk_cond", label: "Valid Signature?", type: "decision", description: "Verify RSA public key & expiry", metadata: { layer: "DECISION" } },
      { id: "fail_step", label: "Return 401 Unauthorized", type: "process", description: "Reject request with error payload", metadata: { layer: "PROCESS" } },
      { id: "success_step", label: "Attach User Context", type: "process", description: "Forward to upstream route handler", metadata: { layer: "PROCESS" } },
      { id: "end", label: "Complete Request", type: "end", description: "Response dispatched to client", metadata: { layer: "END" } }
    ]),
    edges: [
      { id: "f1", source: "start", target: "step1", label: "", type: "default" },
      { id: "f2", source: "step1", target: "chk_cond", label: "", type: "default" },
      { id: "f3", source: "chk_cond", target: "success_step", label: "Yes", type: "default" },
      { id: "f4", source: "chk_cond", target: "fail_step", label: "No", type: "default" },
      { id: "f5", source: "fail_step", target: "end", label: "", type: "default" },
      { id: "f6", source: "success_step", target: "end", label: "", type: "default" }
    ]
  };
}
