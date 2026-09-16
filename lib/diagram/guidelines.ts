/**
 * System Architectural Knowledge Base
 * Defines conventions, tiers, protocols, and standard guidelines used across
 * the AI diagramming prompts and the layout engine.
 */

export const ARCHITECTURAL_TIERS = {
  CLIENT: {
    level: 0,
    types: ["user", "actor", "frontend", "client"],
    defaultPalette: "indigo",
    label: "CLIENT / PRESENTATION",
  },
  GATEWAY: {
    level: 1,
    types: ["api", "gateway", "router", "firewall"],
    defaultPalette: "rose",
    label: "GATEWAY / INGRESS",
  },
  SERVICE: {
    level: 2,
    types: ["backend", "service", "task", "process", "action"],
    defaultPalette: "emerald",
    label: "MICROSERVICE / COMPUTE",
  },
  MESSAGING: {
    level: 3,
    types: ["queue", "event", "pubsub", "stream"],
    defaultPalette: "indigo",
    label: "EVENT BUS / MESSAGE BROKER",
  },
  STORAGE: {
    level: 4,
    types: ["database", "cache", "datastore", "entity", "storage"],
    defaultPalette: "amber",
    label: "PERSISTENCE / STORAGE",
  },
  EXTERNAL: {
    level: 5,
    types: ["external", "thirdparty"],
    defaultPalette: "rose",
    label: "EXTERNAL INTEGRATION",
  },
} as const;

export const PROTOCOL_BADGES: Record<string, { label: string; bg: string; text: string }> = {
  HTTPS: { label: "HTTPS", bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400" },
  REST: { label: "REST", bg: "bg-sky-500/10", text: "text-sky-600 dark:text-sky-400" },
  GRPC: { label: "gRPC", bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400" },
  SQL: { label: "SQL", bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400" },
  WSS: { label: "WSS", bg: "bg-purple-500/10", text: "text-purple-600 dark:text-purple-400" },
  KAFKA: { label: "Kafka", bg: "bg-orange-500/10", text: "text-orange-600 dark:text-orange-400" },
  PUBSUB: { label: "Pub/Sub", bg: "bg-indigo-500/10", text: "text-indigo-600 dark:text-indigo-400" },
  AMQP: { label: "AMQP", bg: "bg-pink-500/10", text: "text-pink-600 dark:text-pink-400" },
  OAUTH: { label: "OAuth2", bg: "bg-teal-500/10", text: "text-teal-600 dark:text-teal-400" },
};
