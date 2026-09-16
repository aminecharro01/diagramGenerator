import { DiagramData, DiagramNode, DiagramEdge } from "@/types/diagram";

// Helper to fix corrupted French accents in legacy PlantUML files
export function fixFrenchAccents(str: string): string {
  if (!str) return "";
  return str
    .replace(/A%tudiant/g, "Étudiant")
    .replace(/A%valuation/g, "Évaluation")
    .replace(/A%tat/g, "État")
    .replace(/A%/g, "É")
    .replace(/pAcdagogique/g, "pédagogique")
    .replace(/pAcdagogie/g, "pédagogie")
    .replace(/rAcsultats/g, "résultats")
    .replace(/rAcponse/g, "réponse")
    .replace(/rAcussit/g, "réussit")
    .replace(/rAcussi/g, "réussi")
    .replace(/GAcrer/g, "Gérer")
    .replace(/gAcrAc/g, "géré")
    .replace(/gAcrAcs/g, "gérés")
    .replace(/GAcnAcrer/g, "Générer")
    .replace(/GAcnAcration/g, "Génération")
    .replace(/gAcnAcration/g, "génération")
    .replace(/gAcnAcrer/g, "générer")
    .replace(/gAcnAcrique/g, "générique")
    .replace(/gAcnAcre/g, "génère")
    .replace(/DAcposer/g, "Déposer")
    .replace(/dAcdiAc/g, "dédié")
    .replace(/dAcdiAcs/g, "dédiés")
    .replace(/dAcdiAce/g, "dédiée")
    .replace(/dAcdiAces/g, "dédiées")
    .replace(/DAcploiement/g, "Déploiement")
    .replace(/dAcploiement/g, "déploiement")
    .replace(/dAcbit/g, "débit")
    .replace(/VAcrifier/g, "Vérifier")
    .replace(/vAcrifier/g, "vérifier")
    .replace(/vAcrifiAc/g, "vérifié")
    .replace(/VAcrification/g, "Vérification")
    .replace(/vAcrification/g, "vérification")
    .replace(/CrAcer/g, "Créer")
    .replace(/crAcer/g, "créer")
    .replace(/crAcAc/g, "créé")
    .replace(/Acditer/g, "éditer")
    .replace(/Acdition/g, "édition")
    .replace(/RAcinitialiser/g, "Réinitialiser")
    .replace(/rAcinitialiser/g, "réinitialiser")
    .replace(/rAcconciliation/g, "réconciliation")
    .replace(/Actat/g, "état")
    .replace(/Acligible/g, "éligible")
    .replace(/complActAces/g, "complétées")
    .replace(/complActAc/g, "complété")
    .replace(/immAcdiat/g, "immédiat")
    .replace(/immAcdiate/g, "immédiate")
    .replace(/authentifiAc/g, "authentifié")
    .replace(/authentifiAcs/g, "authentifiés")
    .replace(/autorisAc/g, "autorisé")
    .replace(/autorisAcs/g, "autorisés")
    .replace(/sAcquentielle/g, "séquentielle")
    .replace(/sAcparAces/g, "séparées")
    .replace(/sAcparAc/g, "séparé")
    .replace(/SAcquence/g, "Séquence")
    .replace(/sAcquence/g, "séquence")
    .replace(/ContrA'le/g, "Contrôle")
    .replace(/contrA'le/g, "contrôle")
    .replace(/ContrA'leur/g, "Contrôleur")
    .replace(/contrA'leur/g, "contrôleur")
    .replace(/modA"le/g, "modèle")
    .replace(/annAce/g, "année")
    .replace(/UnitAc/g, "Unité")
    .replace(/unitAc/g, "unité")
    .replace(/confidentialitAc/g, "confidentialité")
    .replace(/granularitAc/g, "granularité")
    .replace(/validitAc/g, "validité")
    .replace(/prioritAc/g, "priorité")
    .replace(/nAcs/g, "nés")
    .replace(/fenAtre/g, "fenêtre")
    .replace(/premiA"re/g, "première")
    .replace(/derniA"re/g, "dernière")
    .replace(/requAte/g, "requête")
    .replace(/requAtes/g, "requêtes")
    .replace(/parallA"le/g, "parallèle")
    .replace(/accA"s/g, "accès")
    .replace(/succA"s/g, "succès")
    .replace(/clAc/g, "clé")
    .replace(/clAcs/g, "clés")
    .replace(/leA\s?on/g, "leçon")
    .replace(/leA\s?ons/g, "leçons")
    .replace(/A/g, "à")
    .replace(/\?"/g, "—");
}

export function parsePlantUml(pumlCode: string): DiagramData {
  const cleanCode = fixFrenchAccents(pumlCode);
  const lines = cleanCode.split(/\r?\n/);

  let title = "Imported Diagram";
  let diagramType = "architecture diagram";

  const nodesMap = new Map<string, DiagramNode>();
  const edges: DiagramEdge[] = [];
  let currentPackage = "";
  let currentClass: { id: string; name: string; isAbstract?: boolean; attributes: any[]; methods: string[]; category?: string } | null = null;
  let currentNote: { targetId?: string; text: string } | null = null;
  let sequenceStepCounter = 1;

  // Detect Diagram Type from headers or keywords
  const lowerCode = cleanCode.toLowerCase();
  if (lowerCode.includes("diagramme_sequence") || lowerCode.includes("séquence") || (lowerCode.includes("participant") && lowerCode.includes("->"))) {
    diagramType = "sequence diagram";
  } else if (lowerCode.includes("diagramme de classes") || lowerCode.includes("diagramme_classes") || lowerCode.includes("class ") || lowerCode.includes("abstract class")) {
    diagramType = "class diagram";
  } else if (lowerCode.includes("diagramme de cas d'utilisation") || lowerCode.includes("diagramme_cas_utilisation") || lowerCode.includes("usecase")) {
    diagramType = "use case diagram";
  } else if (lowerCode.includes("diagramme_deploiement") || lowerCode.includes("deployment")) {
    diagramType = "deployment diagram";
  } else if (lowerCode.includes("diagramme_architecture") || lowerCode.includes("architecture")) {
    diagramType = "architecture diagram";
  }

  // Alias lookup for bracket nodes e.g. "[AuthController]" -> "AuthController"
  const getCleanNodeId = (raw: string): string => {
    let clean = raw.trim();
    if (clean.startsWith("[") && clean.endsWith("]")) {
      clean = clean.substring(1, clean.length - 1).trim();
    }
    // Remove quotes
    if (clean.startsWith('"') && clean.endsWith('"')) {
      clean = clean.substring(1, clean.length - 1).trim();
    }
    clean = clean.replace(/\\n/g, " ");
    return clean.replace(/[^A-Za-z0-9_À-ÿ]/g, "_");
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine || rawLine.startsWith("'") || rawLine.startsWith("@startuml") || rawLine.startsWith("@enduml") || rawLine.startsWith("!theme") || rawLine.startsWith("skinparam") || rawLine.startsWith("hide ") || rawLine.startsWith("left to right")) {
      if (rawLine.startsWith("title ")) {
        title = rawLine.substring(6).trim();
      }
      continue;
    }

    // 1. Inside Multi-line Class definition
    if (currentClass) {
      if (rawLine === "}") {
        nodesMap.set(currentClass.id, {
          id: currentClass.id,
          label: currentClass.name,
          type: "class",
          description: currentClass.isAbstract ? "Abstract Class" : "Class Entity",
          position: { x: 0, y: 0 },
          metadata: {
            category: currentClass.category || "backend",
            layer: currentClass.isAbstract ? "ABSTRACT" : "ENTITY",
            attributes: currentClass.attributes,
            methods: currentClass.methods,
            isAbstract: currentClass.isAbstract,
          }
        });
        currentClass = null;
        continue;
      }

      if (rawLine.includes("(") && rawLine.includes(")")) {
        currentClass.methods.push(rawLine);
      } else {
        const match = rawLine.match(/^([+\-#~]?)\s*([A-Za-z0-9_<>]+)\s+([A-Za-z0-9_]+)/);
        if (match) {
          const visibility = match[1] || "+";
          const type = match[2];
          const name = match[3];
          currentClass.attributes.push({
            name,
            type,
            visibility,
            isPk: name.toLowerCase() === "id" || name.toLowerCase().endsWith("_id"),
          });
        } else {
          currentClass.attributes.push({
            name: rawLine.replace(/^[+\-#~]\s*/, ""),
            type: "field",
            visibility: "+",
          });
        }
      }
      continue;
    }

    // 2. Multi-line Note handling
    if (currentNote) {
      if (rawLine.startsWith("end note")) {
        const noteId = `note_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        nodesMap.set(noteId, {
          id: noteId,
          label: "Note",
          type: "note",
          description: currentNote.text.trim(),
          position: { x: 0, y: 0 },
          metadata: {
            category: "note",
            noteTarget: currentNote.targetId,
          }
        });

        if (currentNote.targetId && nodesMap.has(currentNote.targetId)) {
          edges.push({
            id: `edge_${noteId}_${currentNote.targetId}`,
            source: noteId,
            target: currentNote.targetId,
            label: "explains",
            type: "default",
            style: { strokeDasharray: "4,4", stroke: "#f59e0b" },
          });
        }
        currentNote = null;
        continue;
      }
      currentNote.text += (currentNote.text ? "\n" : "") + rawLine;
      continue;
    }

    if (rawLine.startsWith("note ")) {
      const match = rawLine.match(/note\s+(?:bottom|top|left|right|over)\s+(?:of\s+)?([A-Za-z0-9_\[\]]+)/i);
      currentNote = {
        targetId: match ? getCleanNodeId(match[1]) : undefined,
        text: "",
      };
      continue;
    }

    // 3. Package & Rectangle Groupings
    if (rawLine.startsWith("package ") || rawLine.startsWith("rectangle ") || (rawLine.startsWith("node ") && rawLine.endsWith("{")) || (rawLine.startsWith("cloud ") && rawLine.endsWith("{"))) {
      const pkgMatch = rawLine.match(/(?:package|rectangle|node|cloud)\s+"?([^"{]+)"?\s*(?:as\s+([A-Za-z0-9_]+))?\s*\{/);
      if (pkgMatch) {
        currentPackage = pkgMatch[1];
      }
      continue;
    }
    if (rawLine === "}") {
      currentPackage = "";
      continue;
    }

    // 4. Class definition start
    const classMatch = rawLine.match(/^(abstract\s+class|class|interface)\s+([A-Za-z0-9_]+)\s*(?:as\s+([A-Za-z0-9_]+))?\s*\{?/);
    if (classMatch) {
      const isAbstract = classMatch[1].includes("abstract");
      const className = classMatch[2];
      const classId = classMatch[3] || className;
      
      if (rawLine.endsWith("{")) {
        currentClass = {
          id: classId,
          name: className,
          isAbstract,
          attributes: [],
          methods: [],
          category: "backend",
        };
      } else {
        nodesMap.set(classId, {
          id: classId,
          label: className,
          type: "class",
          description: isAbstract ? "Abstract Class" : "Class Entity",
          position: { x: 0, y: 0 },
          metadata: {
            category: "backend",
            layer: isAbstract ? "ABSTRACT" : "ENTITY",
            isAbstract,
            attributes: [],
            methods: [],
          }
        });
      }
      continue;
    }

    // 5. Actor definition
    const actorMatch = rawLine.match(/^actor\s+(?:"([^"]+)"|([A-Za-z0-9_]+))\s*(?:as\s+([A-Za-z0-9_]+))?/);
    if (actorMatch) {
      const label = (actorMatch[1] || actorMatch[2] || "").replace(/\\n/g, " ");
      const id = actorMatch[3] || actorMatch[2] || getCleanNodeId(actorMatch[1]);
      nodesMap.set(id, {
        id,
        label,
        type: "actor",
        description: "User Persona / Role",
        position: { x: 0, y: 0 },
        metadata: {
          category: "frontend",
          layer: "ACTOR",
          badge: currentPackage || "User",
        }
      });
      continue;
    }

    // 6. Use case definition
    const ucMatch = rawLine.match(/^usecase\s+(?:"([^"]+)"|([A-Za-z0-9_]+))\s*(?:as\s+([A-Za-z0-9_]+))?/);
    if (ucMatch) {
      const label = ucMatch[1] || ucMatch[2] || "";
      const id = ucMatch[3] || ucMatch[2] || getCleanNodeId(label);
      nodesMap.set(id, {
        id,
        label,
        type: "usecase",
        description: currentPackage ? `Domain: ${currentPackage}` : "System Use Case",
        position: { x: 0, y: 0 },
        metadata: {
          category: "backend",
          layer: "USE CASE",
          badge: currentPackage,
        }
      });
      continue;
    }

    // 7. Component Bracket Syntax: [AuthController] or [Gemini API] as Gemini
    const compBracketMatch = rawLine.match(/^\[([^\]]+)\](?:\s*as\s+([A-Za-z0-9_]+))?/);
    if (compBracketMatch && !rawLine.includes("-->") && !rawLine.includes("->")) {
      const label = compBracketMatch[1].replace(/\\n/g, " ");
      const id = compBracketMatch[2] || getCleanNodeId(compBracketMatch[1]);
      nodesMap.set(id, {
        id,
        label,
        type: "service",
        description: currentPackage || "Component",
        position: { x: 0, y: 0 },
        metadata: {
          category: "backend",
          layer: currentPackage || "SERVICE",
          badge: currentPackage,
        }
      });
      continue;
    }

    // 8. Participants / Database / Queue / Cloud / Storage / Node
    const partMatch = rawLine.match(/^(participant|database|queue|cloud|storage|component|artifact|node)\s+(?:"([^"]+)"|([A-Za-z0-9_]+))\s*(?:as\s+([A-Za-z0-9_]+))?/);
    if (partMatch) {
      const pType = partMatch[1];
      const label = (partMatch[2] || partMatch[3] || "").replace(/\\n/g, " ");
      const id = partMatch[4] || partMatch[3] || getCleanNodeId(partMatch[2]);
      
      let nodeType = "service";
      if (pType === "database" || pType === "storage") nodeType = "database";
      else if (pType === "queue") nodeType = "queue";
      else if (pType === "cloud") nodeType = "external";
      else if (pType === "component" || pType === "artifact") nodeType = "component";
      else if (pType === "node") nodeType = "compute";

      nodesMap.set(id, {
        id,
        label,
        type: nodeType,
        description: currentPackage || `${pType.toUpperCase()} Component`,
        position: { x: 0, y: 0 },
        metadata: {
          category: nodeType === "database" ? "database" : nodeType === "external" ? "external" : "backend",
          layer: pType.toUpperCase(),
          badge: currentPackage,
        }
      });
      continue;
    }

    // 9. Sequence Divider & Fragments
    if (rawLine.startsWith("==") || rawLine.startsWith("loop ") || rawLine.startsWith("alt ") || rawLine.startsWith("else ") || rawLine.startsWith("opt ") || rawLine.startsWith("par ") || rawLine.startsWith("activate ") || rawLine.startsWith("deactivate ")) {
      continue;
    }

    // 10. Relationships & Edges Parsing
    // Handles identifiers, bracketed identifiers [Comp], quotes, and multiplicity
    const relMatch = rawLine.match(/^([A-Za-z0-9_\[\]\sÀ-ÿ]+?)\s*(?:"([^"]*)")?\s*([<|*o.\-=>]{2,8})\s*(?:"([^"]*)")?\s*([A-Za-z0-9_\[\]\sÀ-ÿ]+?)(?:\s*:\s*(.+))?$/);
    if (relMatch) {
      let rawSource = relMatch[1].trim();
      const sourceMult = relMatch[2] || "";
      const arrow = relMatch[3];
      const targetMult = relMatch[4] || "";
      let rawTarget = relMatch[5].trim();
      let label = relMatch[6] ? relMatch[6].replace(/\\n/g, " ") : "";

      const source = getCleanNodeId(rawSource);
      const target = getCleanNodeId(rawTarget);

      if (!nodesMap.has(source)) {
        nodesMap.set(source, {
          id: source,
          label: rawSource.replace(/^\[/, "").replace(/\]$/, ""),
          type: "service",
          position: { x: 0, y: 0 },
          metadata: { category: "backend" },
        });
      }
      if (!nodesMap.has(target)) {
        nodesMap.set(target, {
          id: target,
          label: rawTarget.replace(/^\[/, "").replace(/\]$/, ""),
          type: "service",
          position: { x: 0, y: 0 },
          metadata: { category: "backend" },
        });
      }

      let edgeType = "smoothstep";
      let animated = false;
      let strokeDasharray: string | undefined = undefined;

      let finalSource = source;
      let finalTarget = target;

      if (arrow.includes("<|--") || arrow.includes("<|..")) {
        finalSource = target;
        finalTarget = source;
        label = label || "extends / implements";
      } else if (arrow.includes("--|>") || arrow.includes("..|>")) {
        label = label || "extends / inherits";
      }

      if (arrow.includes("*--")) {
        label = label ? `1:N (Composition) - ${label}` : "Composition (*--)";
      } else if (arrow.includes("o--")) {
        label = label ? `1:N (Aggregation) - ${label}` : "Aggregation (o--)";
      }

      if (sourceMult || targetMult) {
        const multText = `${sourceMult ? sourceMult + " " : ""}${targetMult ? "to " + targetMult : ""}`.trim();
        label = label ? `${label} (${multText})` : multText;
      }

      if (arrow.includes("..") || arrow.includes(".>") || arrow.includes("-->")) {
        strokeDasharray = "5,5";
      }

      if (arrow.includes("->>")) {
        animated = true;
        strokeDasharray = "4,4";
      }

      if (diagramType === "sequence diagram" && label) {
        if (!label.match(/^\d+\./)) {
          label = `${sequenceStepCounter++}. ${label}`;
        }
      }

      edges.push({
        id: `edge_${finalSource}_${finalTarget}_${edges.length}`,
        source: finalSource,
        target: finalTarget,
        label: label.trim(),
        type: edgeType,
        animated,
        style: strokeDasharray ? { strokeDasharray } : undefined,
      });
    }
  }

  const nodes = Array.from(nodesMap.values());

  return {
    title: title.replace(/^Diagramme\s+(?:de\s+)?/i, "").trim() || "Imported Diagram",
    type: diagramType,
    nodes,
    edges,
  };
}

export function exportToPlantUml(diagram: DiagramData): string {
  const lines: string[] = [];
  lines.push(`@startuml ${diagram.title.toLowerCase().replace(/[^a-z0-9_]/g, "_")}`);
  lines.push(`!theme plain`);
  lines.push(`skinparam dpi 300`);
  lines.push(`skinparam defaultFontName "Inter", sans-serif`);
  lines.push(`title ${diagram.title}`);
  lines.push(``);

  diagram.nodes.forEach((node) => {
    const nodeType = (node.type || "").toLowerCase();
    const label = (node.label || "").replace(/"/g, "'");

    if (nodeType === "actor" || nodeType === "user") {
      lines.push(`actor "${label}" as ${node.id}`);
    } else if (nodeType === "usecase") {
      lines.push(`usecase "${label}" as ${node.id}`);
    } else if (nodeType === "database" || nodeType === "datastore") {
      lines.push(`database "${label}" as ${node.id}`);
    } else if (nodeType === "queue") {
      lines.push(`queue "${label}" as ${node.id}`);
    } else if (nodeType === "class") {
      const isAbstract = node.metadata?.isAbstract;
      lines.push(`${isAbstract ? "abstract " : ""}class ${node.id} {`);
      (node.metadata?.attributes || []).forEach((attr: any) => {
        const vis = attr.visibility || "+";
        const type = attr.type || "String";
        lines.push(`  ${vis}${type} ${attr.name}`);
      });
      (node.metadata?.methods || []).forEach((m: string) => {
        lines.push(`  ${m}`);
      });
      lines.push(`}`);
    } else if (nodeType === "note") {
      lines.push(`note as ${node.id}`);
      lines.push(`  ${node.description || node.label}`);
      lines.push(`end note`);
    } else {
      lines.push(`participant "${label}" as ${node.id}`);
    }
  });

  lines.push(``);

  diagram.edges.forEach((edge) => {
    const label = edge.label ? ` : ${edge.label}` : "";
    const isDashed = edge.style?.strokeDasharray || edge.animated;
    const arrow = isDashed ? "-->" : "->";
    lines.push(`${edge.source} ${arrow} ${edge.target}${label}`);
  });

  lines.push(``);
  lines.push(`@enduml`);
  return lines.join("\n");
}
