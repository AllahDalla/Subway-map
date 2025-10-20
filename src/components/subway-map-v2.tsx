"use client"

import { useCallback, useEffect } from "react"
import {
  ReactFlow,
  type Node,
  type Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionLineType,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import dagre from "dagre"
import { ServiceNode } from "./service-node"
import { EngineNode } from "./engine-node"
import { RouterNode } from "./router-node"
import { Button } from "./ui/button"
import { ClusterBackground } from "./cluster-background"

export type ServiceStatus = "healthy" | "warning" | "critical"

export interface ServiceNodeData {
  label: string
  status: ServiceStatus
  [key: string]: unknown
}

const nodeTypes = {
  service: ServiceNode,
  engine: EngineNode,
  Router: RouterNode,
}

// Color definitions matching the subway map
const COLORS = {
  GLOBAL: "#4A90E2",      // Blue
  WORKSTATION: "#C97C84", // Pink/Brown
  COB: "#F5A623",         // Orange  
  FXL: "#FFD700",         // Yellow
  EISL_API: "#7ED321",    // Green
  CARMA: "#50C8E8",       // Cyan
  EISL_MSG: "#BD10E0",    // Purple
  EISL_FILES: "#5A9FD4",  // Blue
  IMPACT: "#89CFF0",      // Light Blue
}

// Positioning based on the subway map image layout with increased spacing
const initialNodes: Node[] = [
  // UBS Engine (far left, vertically centered)
  { id: "ubs", type: "engine", position: { x: 50, y: 550 }, data: { label: "UBS" } },
  
  // Global line (blue - horizontal across top-middle)
  { id: "G", type: "Router", position: { x: 400, y: 550 }, data: { label: "G", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "7", type: "service", position: { x: 550, y: 450 }, data: { label: "7", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "S-global", type: "service", position: { x: 720, y: 450 }, data: { label: "S", color: COLORS.GLOBAL, status: "healthy" } },
  
  // Workstation cluster (pink box - circular arrangement, upper area)
  { id: "S3-work", type: "service", position: { x: 400, y: 200 }, data: { label: "S3", color: COLORS.WORKSTATION, status: "healthy" } },
  { id: "N-work", type: "service", position: { x: 500, y: 200 }, data: { label: "N", color: COLORS.WORKSTATION, status: "healthy" } },
  { id: "PX", type: "service", position: { x: 600, y: 220 }, data: { label: "PX", color: COLORS.WORKSTATION, status: "healthy" } },
  { id: "A-work", type: "service", position: { x: 380, y: 290 }, data: { label: "A", color: COLORS.WORKSTATION, status: "healthy" } },
  { id: "C-work", type: "service", position: { x: 510, y: 300 }, data: { label: "C", color: COLORS.WORKSTATION, status: "healthy" } },
  { id: "S-work", type: "service", position: { x: 480, y: 360 }, data: { label: "S", color: COLORS.WORKSTATION, status: "healthy" } },
  { id: "D-work", type: "service", position: { x: 600, y: 360 }, data: { label: "D", color: COLORS.WORKSTATION, status: "healthy" } },
  
  // COB (orange - left of workstation)
  { id: "U-cob", type: "service", position: { x: 250, y: 300 }, data: { label: "U", color: COLORS.COB, status: "healthy" } },
  
  // FXL cluster (yellow - circular, middle left area)
  { id: "S-fxl", type: "service", position: { x: 480, y: 600 }, data: { label: "S", color: COLORS.FXL, status: "healthy" } },
  { id: "A-fxl", type: "service", position: { x: 350, y: 680 }, data: { label: "A", color: COLORS.FXL, status: "healthy" } },
  { id: "W-fxl", type: "service", position: { x: 440, y: 700 }, data: { label: "W", color: COLORS.FXL, status: "healthy" } },
  { id: "F-fxl", type: "service", position: { x: 580, y: 680 }, data: { label: "F", color: COLORS.FXL, status: "healthy" } },
  { id: "I-fxl", type: "service", position: { x: 650, y: 600 }, data: { label: "I", color: COLORS.FXL, status: "healthy" } },
  { id: "D-fxl", type: "service", position: { x: 620, y: 730 }, data: { label: "D", color: COLORS.FXL, status: "healthy" } },
  
  // EISL APIs (green box - middle right)
  { id: "C-api", type: "service", position: { x: 850, y: 350 }, data: { label: "C", color: COLORS.EISL_API, status: "healthy" } },
  { id: "D-api", type: "service", position: { x: 970, y: 350 }, data: { label: "D", color: COLORS.EISL_API, status: "healthy" } },
  { id: "N-api", type: "service", position: { x: 850, y: 440 }, data: { label: "N", color: COLORS.EISL_API, status: "healthy" } },
  { id: "M-api", type: "service", position: { x: 970, y: 440 }, data: { label: "M", color: COLORS.EISL_API, status: "healthy" } },
  
  // CARMA cluster (cyan box - far right, circular arrangement)
  { id: "IM", type: "service", position: { x: 1150, y: 120 }, data: { label: "IM", color: COLORS.CARMA, status: "healthy" } },
  { id: "CX", type: "service", position: { x: 1240, y: 170 }, data: { label: "CX", color: COLORS.CARMA, status: "healthy" } },
  { id: "EQ", type: "service", position: { x: 1340, y: 200 }, data: { label: "EQ", color: COLORS.CARMA, status: "healthy" } },
  { id: "FL", type: "service", position: { x: 1440, y: 230 }, data: { label: "FL", color: COLORS.CARMA, status: "healthy" } },
  { id: "S3-carma", type: "service", position: { x: 1530, y: 280 }, data: { label: "S3", color: COLORS.CARMA, status: "healthy" } },
  { id: "G-carma", type: "service", position: { x: 1200, y: 290 }, data: { label: "G", color: COLORS.CARMA, status: "healthy" } },
  { id: "FQ", type: "service", position: { x: 1340, y: 320 }, data: { label: "FQ", color: COLORS.CARMA, status: "healthy" } },
  { id: "QY", type: "service", position: { x: 1300, y: 410 }, data: { label: "QY", color: COLORS.CARMA, status: "healthy" } },
  
  // EISL Messaging cluster (purple - circular, lower right)
  { id: "N-msg", type: "service", position: { x: 900, y: 600 }, data: { label: "N", color: COLORS.EISL_MSG, status: "healthy" } },
  { id: "X-msg", type: "service", position: { x: 1000, y: 630 }, data: { label: "X", color: COLORS.EISL_MSG, status: "healthy" } },
  { id: "Q-msg", type: "service", position: { x: 1100, y: 660 }, data: { label: "Q", color: COLORS.EISL_MSG, status: "healthy" } },
  { id: "A-msg", type: "service", position: { x: 1200, y: 690 }, data: { label: "A", color: COLORS.EISL_MSG, status: "healthy" } },
  { id: "S-msg", type: "service", position: { x: 1300, y: 720 }, data: { label: "S", color: COLORS.EISL_MSG, status: "healthy" } },
  { id: "K-msg", type: "service", position: { x: 1430, y: 690 }, data: { label: "K", color: COLORS.EISL_MSG, status: "healthy" } },
  { id: "C-msg", type: "service", position: { x: 1150, y: 780 }, data: { label: "C", color: COLORS.EISL_MSG, status: "healthy" } },
  { id: "D-msg", type: "service", position: { x: 1260, y: 810 }, data: { label: "D", color: COLORS.EISL_MSG, status: "healthy" } },
  { id: "ES", type: "service", position: { x: 1370, y: 840 }, data: { label: "ES", color: COLORS.EISL_MSG, status: "healthy" } },
  
  // EISL Files (blue - top area, circular)
  { id: "F-files", type: "service", position: { x: 550, y: 50 }, data: { label: "F", color: COLORS.EISL_FILES, status: "healthy" } },
  { id: "NS", type: "service", position: { x: 650, y: 60 }, data: { label: "NS", color: COLORS.EISL_FILES, status: "healthy" } },
  { id: "D-files", type: "service", position: { x: 680, y: 130 }, data: { label: "D", color: COLORS.EISL_FILES, status: "healthy" } },
  { id: "I-files", type: "service", position: { x: 580, y: 140 }, data: { label: "I", color: COLORS.EISL_FILES, status: "healthy" } },
  { id: "J-files", type: "service", position: { x: 690, y: 180 }, data: { label: "J", color: COLORS.EISL_FILES, status: "healthy" } },
  
  // IMPACT cluster (light blue - bottom left)
  { id: "Q-impact", type: "service", position: { x: 250, y: 850 }, data: { label: "Q", color: COLORS.IMPACT, status: "healthy" } },
  { id: "SP-impact", type: "service", position: { x: 330, y: 880 }, data: { label: "SP", color: COLORS.IMPACT, status: "healthy" } },
  { id: "TP-impact", type: "service", position: { x: 420, y: 890 }, data: { label: "TP", color: COLORS.IMPACT, status: "healthy" } },
  { id: "UI-impact", type: "service", position: { x: 310, y: 960 }, data: { label: "UI", color: COLORS.IMPACT, status: "healthy" } },
  { id: "D-impact", type: "service", position: { x: 420, y: 970 }, data: { label: "D", color: COLORS.IMPACT, status: "healthy" } },
  
  // GLOSS cluster (light blue - bottom middle)
  { id: "Q-gloss", type: "service", position: { x: 580, y: 850 }, data: { label: "Q", color: COLORS.IMPACT, status: "healthy" } },
  { id: "SP-gloss", type: "service", position: { x: 660, y: 880 }, data: { label: "SP", color: COLORS.IMPACT, status: "healthy" } },
  { id: "TP-gloss", type: "service", position: { x: 750, y: 890 }, data: { label: "TP", color: COLORS.IMPACT, status: "healthy" } },
  { id: "UI-gloss", type: "service", position: { x: 640, y: 960 }, data: { label: "UI", color: COLORS.IMPACT, status: "healthy" } },
  { id: "D-gloss", type: "service", position: { x: 750, y: 970 }, data: { label: "D", color: COLORS.IMPACT, status: "healthy" } },
  
  // Revport cluster (light blue - bottom right, circular arrangement)
  { id: "A0", type: "service", position: { x: 920, y: 1000 }, data: { label: "A0", color: COLORS.IMPACT, status: "healthy" } },
  { id: "W-report", type: "service", position: { x: 1010, y: 1030 }, data: { label: "W", color: COLORS.IMPACT, status: "healthy" } },
  { id: "A1", type: "service", position: { x: 1110, y: 1020 }, data: { label: "A1", color: COLORS.IMPACT, status: "healthy" } },
  { id: "RJ", type: "service", position: { x: 1210, y: 1050 }, data: { label: "RJ", color: COLORS.IMPACT, status: "healthy" } },
  { id: "D-report", type: "service", position: { x: 1310, y: 1070 }, data: { label: "D", color: COLORS.IMPACT, status: "healthy" } },
  { id: "S3-report", type: "service", position: { x: 1420, y: 1040 }, data: { label: "S3", color: COLORS.IMPACT, status: "healthy" } },
  { id: "A2", type: "service", position: { x: 1080, y: 1120 }, data: { label: "A2", color: COLORS.IMPACT, status: "healthy" } },
  { id: "JR", type: "service", position: { x: 1200, y: 1140 }, data: { label: "JR", color: COLORS.IMPACT, status: "healthy" } },
]

// Dagre layout configuration  
const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  dagreGraph.setGraph({ rankdir: "LR", ranksep: 800, nodesep: 400 })

  nodes.forEach((node) => {
    if (node.id === "ubs") {
      dagreGraph.setNode(node.id, { width: 250, height: 200 })
    } else if (node.type === "Router") {
      dagreGraph.setNode(node.id, { width: 200, height: 100 })
    } else {
      dagreGraph.setNode(node.id, { width: 180, height: 80 })
    }
  })

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  dagre.layout(dagreGraph)

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    const offsetX = node.id === "ubs" ? 125 : node.type === "" ? 100 : 90
    const offsetY = node.id === "ubs" ? 100 : node.type === "" ? 50 : 40
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - offsetX,
        y: nodeWithPosition.y - offsetY,
      },
    }
  })

  return { nodes: layoutedNodes, edges }
}

const initialEdges: Edge[] = [
  // UBS connections (black)
  { id: "e-ubs-g", source: "ubs", target: "G", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: "#000", strokeWidth: 3 } },
  { id: "e-ubs-7", source: "ubs", target: "7", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: "#000", strokeWidth: 3 } },
  { id: "e-ubs-s", source: "ubs", target: "S-global", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: "#000", strokeWidth: 3 } },
  { id: "e-ubs-u", source: "ubs", target: "U-cob", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: "#000", strokeWidth: 3 } },
  { id: "e-ubs-a-fxl", source: "ubs", target: "A-fxl", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: "#000", strokeWidth: 3 } },
  { id: "e-ubs-impact", source: "ubs", target: "Q-impact", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: "#000", strokeWidth: 3 } },
  { id: "e-ubs-gloss", source: "ubs", target: "Q-gloss", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: "#000", strokeWidth: 3 } },
  { id: "e-ubs-report", source: "ubs", target: "A0", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: "#000", strokeWidth: 3 } },
  
  // Global (blue)
  { id: "e-g-7", source: "G", target: "7", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.GLOBAL, strokeWidth: 3 } },
  { id: "e-7-s", source: "7", target: "S-global", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.GLOBAL, strokeWidth: 3 } },
  
  // Workstation (pink)
  { id: "e-g-s3", source: "G", target: "S3-work", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.WORKSTATION, strokeWidth: 3 } },
  { id: "e-s3-n", source: "S3-work", target: "N-work", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.WORKSTATION, strokeWidth: 3 } },
  { id: "e-n-px", source: "N-work", target: "PX", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.WORKSTATION, strokeWidth: 3 } },
  { id: "e-s3-a", source: "S3-work", target: "A-work", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.WORKSTATION, strokeWidth: 3 } },
  { id: "e-a-c", source: "A-work", target: "C-work", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.WORKSTATION, strokeWidth: 3 } },
  { id: "e-c-s", source: "C-work", target: "S-work", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.WORKSTATION, strokeWidth: 3 } },
  { id: "e-s-d", source: "S-work", target: "D-work", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.WORKSTATION, strokeWidth: 3 } },
  { id: "e-7-s-work", source: "7", target: "S-work", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.WORKSTATION, strokeWidth: 3 } },
  
  // FXL (yellow)
  { id: "e-s-a-fxl", source: "S-fxl", target: "A-fxl", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.FXL, strokeWidth: 3 } },
  { id: "e-a-w-fxl", source: "A-fxl", target: "W-fxl", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.FXL, strokeWidth: 3 } },
  { id: "e-s-f-fxl", source: "S-fxl", target: "F-fxl", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.FXL, strokeWidth: 3 } },
  { id: "e-f-i-fxl", source: "F-fxl", target: "I-fxl", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.FXL, strokeWidth: 3 } },
  { id: "e-i-d-fxl", source: "I-fxl", target: "D-fxl", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.FXL, strokeWidth: 3 } },
  
  // EISL APIs (green)
  { id: "e-c-d-api", source: "C-api", target: "D-api", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.EISL_API, strokeWidth: 3 } },
  { id: "e-n-m-api", source: "N-api", target: "M-api", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.EISL_API, strokeWidth: 3 } },
  
  // CARMA (cyan)
  { id: "e-im-cx", source: "IM", target: "CX", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.CARMA, strokeWidth: 3 } },
  { id: "e-cx-eq", source: "CX", target: "EQ", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.CARMA, strokeWidth: 3 } },
  { id: "e-eq-fl", source: "EQ", target: "FL", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.CARMA, strokeWidth: 3 } },
  { id: "e-fl-s3", source: "FL", target: "S3-carma", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.CARMA, strokeWidth: 3 } },
  { id: "e-cx-g-carma", source: "CX", target: "G-carma", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.CARMA, strokeWidth: 3 } },
  { id: "e-g-fq", source: "G-carma", target: "FQ", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.CARMA, strokeWidth: 3 } },
  { id: "e-fq-qy", source: "FQ", target: "QY", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.CARMA, strokeWidth: 3 } },
  
  // EISL Messaging (purple)
  { id: "e-n-x-msg", source: "N-msg", target: "X-msg", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.EISL_MSG, strokeWidth: 3 } },
  { id: "e-x-q-msg", source: "X-msg", target: "Q-msg", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.EISL_MSG, strokeWidth: 3 } },
  { id: "e-q-a-msg", source: "Q-msg", target: "A-msg", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.EISL_MSG, strokeWidth: 3 } },
  { id: "e-a-s-msg", source: "A-msg", target: "S-msg", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.EISL_MSG, strokeWidth: 3 } },
  { id: "e-s-k-msg", source: "S-msg", target: "K-msg", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.EISL_MSG, strokeWidth: 3 } },
  { id: "e-a-c-msg", source: "A-msg", target: "C-msg", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.EISL_MSG, strokeWidth: 3 } },
  { id: "e-c-d-msg", source: "C-msg", target: "D-msg", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.EISL_MSG, strokeWidth: 3 } },
  { id: "e-d-es-msg", source: "D-msg", target: "ES", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.EISL_MSG, strokeWidth: 3 } },
  
  // EISL Files (blue)
  { id: "e-f-ns-files", source: "F-files", target: "NS", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.EISL_FILES, strokeWidth: 3 } },
  { id: "e-ns-d-files", source: "NS", target: "D-files", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.EISL_FILES, strokeWidth: 3 } },
  { id: "e-d-i-files", source: "D-files", target: "I-files", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.EISL_FILES, strokeWidth: 3 } },
  { id: "e-d-j-files", source: "D-files", target: "J-files", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.EISL_FILES, strokeWidth: 3 } },
  
  // IMPACT (light blue)
  { id: "e-q-sp-impact", source: "Q-impact", target: "SP-impact", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.IMPACT, strokeWidth: 3 } },
  { id: "e-sp-tp-impact", source: "SP-impact", target: "TP-impact", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.IMPACT, strokeWidth: 3 } },
  { id: "e-sp-ui-impact", source: "SP-impact", target: "UI-impact", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.IMPACT, strokeWidth: 3 } },
  { id: "e-ui-d-impact", source: "UI-impact", target: "D-impact", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.IMPACT, strokeWidth: 3 } },
  
  // GLOSS (light blue)
  { id: "e-q-sp-gloss", source: "Q-gloss", target: "SP-gloss", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.IMPACT, strokeWidth: 3 } },
  { id: "e-sp-tp-gloss", source: "SP-gloss", target: "TP-gloss", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.IMPACT, strokeWidth: 3 } },
  { id: "e-sp-ui-gloss", source: "SP-gloss", target: "UI-gloss", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.IMPACT, strokeWidth: 3 } },
  { id: "e-ui-d-gloss", source: "UI-gloss", target: "D-gloss", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.IMPACT, strokeWidth: 3 } },
  
  // Revport (light blue)
  { id: "e-a0-w-report", source: "A0", target: "W-report", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.IMPACT, strokeWidth: 3 } },
  { id: "e-w-a1-report", source: "W-report", target: "A1", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.IMPACT, strokeWidth: 3 } },
  { id: "e-a1-rj-report", source: "A1", target: "RJ", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.IMPACT, strokeWidth: 3 } },
  { id: "e-rj-d-report", source: "RJ", target: "D-report", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.IMPACT, strokeWidth: 3 } },
  { id: "e-d-s3-report", source: "D-report", target: "S3-report", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.IMPACT, strokeWidth: 3 } },
  { id: "e-w-a2-report", source: "W-report", target: "A2", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.IMPACT, strokeWidth: 3 } },
  { id: "e-a2-jr-report", source: "A2", target: "JR", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.IMPACT, strokeWidth: 3 } },
]

const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(initialNodes, initialEdges)

// Calculate cluster bounding boxes based on actual node positions
const calculateClusterBox = (nodeIds: string[], padding: number = 120) => {
  const clusterNodes = layoutedNodes.filter(n => nodeIds.includes(n.id))
  if (clusterNodes.length === 0) return { x: 0, y: 0, width: 0, height: 0 }
  
  // Account for different node sizes - actual rendered sizes
  const getNodeDimensions = (node: Node) => {
    if (node.id === "ubs") return { width: 250, height: 200 }
    if (node.type === "Router") return { width: 200, height: 100 }
    // Service nodes are circular, approximate with square (generous estimate)
    return { width: 150, height: 80 }
  }
  
  const minX = Math.min(...clusterNodes.map(n => n.position.x))
  const minY = Math.min(...clusterNodes.map(n => n.position.y))
  const maxX = Math.max(...clusterNodes.map(n => {
    const dims = getNodeDimensions(n)
    return n.position.x + dims.width
  }))
  const maxY = Math.max(...clusterNodes.map(n => {
    const dims = getNodeDimensions(n)
    return n.position.y + dims.height
  }))
  
  return {
    x: minX - padding,
    y: minY - padding,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2,
  }
}

// Cluster definitions for background boxes with generous padding to prevent overlap
const clusters = [
  { name: "Workstation", color: COLORS.WORKSTATION, ...calculateClusterBox(["S3-work", "N-work", "PX", "A-work", "C-work", "S-work", "D-work"], 120), description: "Workstation services cluster" },
  { name: "FXL", color: COLORS.FXL, ...calculateClusterBox(["S-fxl", "A-fxl", "W-fxl", "F-fxl", "I-fxl", "D-fxl"], 120), description: "FXL services cluster" },
  { name: "EISL APIs", color: COLORS.EISL_API, ...calculateClusterBox(["C-api", "D-api", "N-api", "M-api"], 120), description: "EISL API services" },
  { name: "CARMA", color: COLORS.CARMA, ...calculateClusterBox(["IM", "CX", "EQ", "FL", "S3-carma", "G-carma", "FQ", "QY"], 120), description: "CARMA services cluster" },
  { name: "EISL Messaging", color: COLORS.EISL_MSG, ...calculateClusterBox(["N-msg", "X-msg", "Q-msg", "A-msg", "S-msg", "K-msg", "C-msg", "D-msg", "ES"], 120), description: "EISL Messaging services" },
  { name: "EISL Files", color: COLORS.EISL_FILES, ...calculateClusterBox(["F-files", "NS", "D-files", "I-files", "J-files"], 120), description: "EISL File services" },
  { name: "IMPACT", color: COLORS.IMPACT, ...calculateClusterBox(["Q-impact", "SP-impact", "TP-impact", "UI-impact", "D-impact"], 120), description: "IMPACT services" },
  { name: "GLOSS", color: COLORS.IMPACT, ...calculateClusterBox(["Q-gloss", "SP-gloss", "TP-gloss", "UI-gloss", "D-gloss"], 120), description: "GLOSS services" },
  { name: "Revport", color: COLORS.IMPACT, ...calculateClusterBox(["A0", "W-report", "A1", "RJ", "D-report", "S3-report", "A2", "JR"], 120), description: "Revport services" },
]

export function SubwayMapV2() {
  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes)
  const [edges, , onEdgesChange] = useEdgesState(layoutedEdges)

  const randomizeStatuses = useCallback(() => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.type === "engine" || node.type === "Router") return node
        const statuses: ServiceStatus[] = ["healthy", "warning", "critical"]
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]
        return { ...node, data: { ...node.data, status: randomStatus } }
      }),
    )
  }, [setNodes])

  useEffect(() => {
    const interval = setInterval(() => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.type === "engine" || node.type === "Router") return node
          if (Math.random() < 0.2) {
            const weights = [0.7, 0.2, 0.1]
            const random = Math.random()
            let status: ServiceStatus = "healthy"
            if (random < weights[2]) status = "critical"
            else if (random < weights[1] + weights[2]) status = "warning"
            return { ...node, data: { ...node.data, status } }
          }
          return node
        }),
      )
    }, 3000)
    return () => clearInterval(interval)
  }, [setNodes])

  return (
    <div className="relative h-full w-full">
      <div className="absolute left-6 top-6 z-10 flex flex-col gap-3 max-h-[90vh] overflow-y-auto">
        <div className="rounded-lg border border-border bg-card/95 p-4 shadow-lg backdrop-blur-sm">
          <h1 className="text-balance text-xl font-semibold text-foreground">WMAP Mag 7 — Subway Map</h1>
          <p className="mt-1 text-sm text-muted-foreground">Service topology monitoring</p>
        </div>
        <Button onClick={randomizeStatuses} variant="outline" className="w-full bg-transparent">
          Randomize Status
        </Button>
        
        <div className="rounded-lg border border-border bg-card/95 p-3 shadow-lg backdrop-blur-sm">
          <h3 className="text-sm font-semibold text-foreground mb-2">Service Status</h3>
          <div className="flex flex-col gap-1.5 text-xs">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[#10b981]" />
              <span className="text-muted-foreground">Healthy</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[#f59e0b]" />
              <span className="text-muted-foreground">Warning</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[#ef4444]" />
              <span className="text-muted-foreground">Critical</span>
            </div>
          </div>
        </div>
        
        <div className="rounded-lg border border-border bg-card/95 p-3 shadow-lg backdrop-blur-sm max-h-[600px] overflow-y-auto">
          <h3 className="text-sm font-semibold text-foreground mb-3">Service Groups & Nodes</h3>
          <div className="flex flex-col gap-3 text-xs">
            
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS.GLOBAL }} />
                <span className="font-semibold text-foreground">Global</span>
              </div>
              <div className="ml-5 flex flex-col gap-0.5">
                <span className="text-muted-foreground">• G - Global Site Selector</span>
                <span className="text-muted-foreground">• 7 - CA Layer 7 Gateway</span>
                <span className="text-muted-foreground">• S - Siteminder Auth</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS.WORKSTATION }} />
                <span className="font-semibold text-foreground">Workstation</span>
              </div>
              <div className="ml-5 flex flex-col gap-0.5">
                <span className="text-muted-foreground">• S3 - Route53 DNS for Failover</span>
                <span className="text-muted-foreground">• N - Network Load Balancer</span>
                <span className="text-muted-foreground">• PX - Reverse Proxy for Auth</span>
                <span className="text-muted-foreground">• A - Application Load Balancer</span>
                <span className="text-muted-foreground">• C - Memcached Nodes x2</span>
                <span className="text-muted-foreground">• S - ECS Services x14 (Cluster)</span>
                <span className="text-muted-foreground">• D - Sybase Database Instance</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS.COB }} />
                <span className="font-semibold text-foreground">COB</span>
              </div>
              <div className="ml-5 flex flex-col gap-0.5">
                <span className="text-muted-foreground">• U - COB UnqxrK App</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS.FXL }} />
                <span className="font-semibold text-foreground">FXL</span>
              </div>
              <div className="ml-5 flex flex-col gap-0.5">
                <span className="text-muted-foreground">• A - Application Load Balancer</span>
                <span className="text-muted-foreground">• W - Web Server on EC2</span>
                <span className="text-muted-foreground">• F - Workflow Service on EC2</span>
                <span className="text-muted-foreground">• S - Scheduler Service on EC2</span>
                <span className="text-muted-foreground">• I - Interfaces Service on EC2</span>
                <span className="text-muted-foreground">• D - MS SQL Server DB & RDS Standby</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS.EISL_API }} />
                <span className="font-semibold text-foreground">EISL APIs</span>
              </div>
              <div className="ml-5 flex flex-col gap-0.5">
                <span className="text-muted-foreground">• N - Network Load Balancer</span>
                <span className="text-muted-foreground">• M - Mulesoft Controller x3 & Workers x4</span>
                <span className="text-muted-foreground">• C - IRIS Cache Nodes x2</span>
                <span className="text-muted-foreground">• D - IRIS Data Nodes x2</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS.CARMA }} />
                <span className="font-semibold text-foreground">CARMA</span>
              </div>
              <div className="ml-5 flex flex-col gap-0.5">
                <span className="text-muted-foreground">• IM - Import ETL Services x7</span>
                <span className="text-muted-foreground">• CX - Command Services x11</span>
                <span className="text-muted-foreground">• QY - Query Services x10</span>
                <span className="text-muted-foreground">• EQ - Domain Event SQS Queue</span>
                <span className="text-muted-foreground">• FL - Event Forwarder Lambda</span>
                <span className="text-muted-foreground">• S3 - S3 Bucket</span>
                <span className="text-muted-foreground">• G - AWS API Gateway</span>
                <span className="text-muted-foreground">• FQ - FIFO SQS Event Queue</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS.EISL_MSG }} />
                <span className="font-semibold text-foreground">EISL Messaging</span>
              </div>
              <div className="ml-5 flex flex-col gap-0.5">
                <span className="text-muted-foreground">• Q - Inbound IBM MQ</span>
                <span className="text-muted-foreground">• N - Network Load Balancer</span>
                <span className="text-muted-foreground">• X - Amazon MQ Broker x2</span>
                <span className="text-muted-foreground">• A - Application Load Balancer</span>
                <span className="text-muted-foreground">• S - ECS Services x10 (Cluster)</span>
                <span className="text-muted-foreground">• C - Elasticache for Redis Cluster</span>
                <span className="text-muted-foreground">• D - RDS Aurora MySQL Cluster</span>
                <span className="text-muted-foreground">• K - Confluent Kafka Cluster</span>
                <span className="text-muted-foreground">• ES - Elasticsearch Cluster</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS.EISL_FILES }} />
                <span className="font-semibold text-foreground">EISL Files</span>
              </div>
              <div className="ml-5 flex flex-col gap-0.5">
                <span className="text-muted-foreground">• F - IBM Sterling File Gateway</span>
                <span className="text-muted-foreground">• NS - Network Attached Storage</span>
                <span className="text-muted-foreground">• D - PostgreSQL Database</span>
                <span className="text-muted-foreground">• I - Informatica</span>
                <span className="text-muted-foreground">• J - Java App on EC2</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS.IMPACT }} />
                <span className="font-semibold text-foreground">IMPACT</span>
              </div>
              <div className="ml-5 flex flex-col gap-0.5">
                <span className="text-muted-foreground">• Q - Inbound IBM MQ</span>
                <span className="text-muted-foreground">• UI - User Interface</span>
                <span className="text-muted-foreground">• SP - Stock Record Processing</span>
                <span className="text-muted-foreground">• TP - Trade & Settlement Processing</span>
                <span className="text-muted-foreground">• D - DB2 Database Instance</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS.IMPACT }} />
                <span className="font-semibold text-foreground">GLOSS</span>
              </div>
              <div className="ml-5 flex flex-col gap-0.5">
                <span className="text-muted-foreground">• Q - Inbound IBM MQ</span>
                <span className="text-muted-foreground">• UI - User Interface</span>
                <span className="text-muted-foreground">• SP - Stock Record Processing</span>
                <span className="text-muted-foreground">• TP - Trade & Settlement Processing</span>
                <span className="text-muted-foreground">• D - Sybase Database Instance</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS.IMPACT }} />
                <span className="font-semibold text-foreground">Revport</span>
              </div>
              <div className="ml-5 flex flex-col gap-0.5">
                <span className="text-muted-foreground">• A0 - Application Load Balancer (Web)</span>
                <span className="text-muted-foreground">• W - Web Server on EC2 x2</span>
                <span className="text-muted-foreground">• A1 - Application Load Balancer (Report)</span>
                <span className="text-muted-foreground">• A2 - Application Load Balancer (Jasper)</span>
                <span className="text-muted-foreground">• RJ - Revport Java App on EC2</span>
                <span className="text-muted-foreground">• JR - Jasper Report App on EC2</span>
                <span className="text-muted-foreground">• D - RDS Aurora MySQL Cluster</span>
                <span className="text-muted-foreground">• S3 - S3 Bucket for Client Files</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        minZoom={0.15}
        maxZoom={1.5}
        defaultEdgeOptions={{
          type: ConnectionLineType.SmoothStep,
          animated: true,
        }}
      >
        <Background className="bg-background" />
        <ClusterBackground clusters={clusters} />
        <Controls className="rounded-lg border border-border bg-card shadow-lg" />
        <MiniMap
          className="rounded-lg border border-border bg-card shadow-lg"
          nodeColor={(node) => {
            if (node.type === "engine") return "#000000"
            if (node.type === "Router") return "#000000"
            const color = (node.data as any).color
            return color || "#10b981"
          }}
        />
      </ReactFlow>
    </div>
  )
}
