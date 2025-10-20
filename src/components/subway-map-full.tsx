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
import { ServiceNode } from "./service-node"
import { EngineNode } from "./engine-node"
import { RouterNode } from "./router-node"
import { Button } from "./ui/button"

export type ServiceStatus = "healthy" | "warning" | "critical"

export interface ServiceNodeData {
  label: string
  status: ServiceStatus
  color?: string
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

// Initial service topology based on WMAP Mag 7 Subway Map
const initialNodes: Node[] = [
  // Main Engine (left side)
  { id: "ubs", type: "engine", position: { x: 50, y: 400 }, data: { label: "UBS" } },
  
  // Global Services (top, blue line)
  { id: "G", type: "Router", position: { x: 250, y: 50 }, data: { label: "G", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "7-global", type: "service", position: { x: 400, y: 200 }, data: { label: "7", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "S-global", type: "service", position: { x: 550, y: 280 }, data: { label: "S", color: COLORS.GLOBAL, status: "healthy" } },
  
  // Workstation (pink box)
  { id: "S3-work", type: "service", position: { x: 300, y: 150 }, data: { label: "S3", color: COLORS.WORKSTATION, status: "healthy" } },
  { id: "N-work", type: "service", position: { x: 350, y: 150 }, data: { label: "N", color: COLORS.WORKSTATION, status: "healthy" } },
  { id: "PX", type: "service", position: { x: 400, y: 150 }, data: { label: "PX", color: COLORS.WORKSTATION, status: "healthy" } },
  { id: "A-work", type: "service", position: { x: 320, y: 220 }, data: { label: "A", color: COLORS.WORKSTATION, status: "healthy" } },
  { id: "C-work", type: "service", position: { x: 380, y: 220 }, data: { label: "C", color: COLORS.WORKSTATION, status: "healthy" } },
  { id: "D-work", type: "service", position: { x: 440, y: 250 }, data: { label: "D", color: COLORS.WORKSTATION, status: "healthy" } },
  { id: "S-work", type: "service", position: { x: 380, y: 270 }, data: { label: "S", color: COLORS.WORKSTATION, status: "healthy" } },
  
  // COB (orange)
  { id: "U-cob", type: "service", position: { x: 280, y: 230 }, data: { label: "U", color: COLORS.COB, status: "healthy" } },
  
  // FXL (yellow line)
  { id: "S-fxl", type: "service", position: { x: 400, y: 350 }, data: { label: "S", color: COLORS.FXL, status: "healthy" } },
  { id: "A-fxl", type: "service", position: { x: 330, y: 380 }, data: { label: "A", color: COLORS.FXL, status: "healthy" } },
  { id: "W-fxl", type: "service", position: { x: 380, y: 400 }, data: { label: "W", color: COLORS.FXL, status: "healthy" } },
  { id: "F-fxl", type: "service", position: { x: 450, y: 380 }, data: { label: "F", color: COLORS.FXL, status: "healthy" } },
  { id: "I-fxl", type: "service", position: { x: 520, y: 360 }, data: { label: "I", color: COLORS.FXL, status: "healthy" } },
  { id: "D-fxl", type: "service", position: { x: 490, y: 410 }, data: { label: "D", color: COLORS.FXL, status: "healthy" } },
  
  // EISL APIs (green)
  { id: "C-api", type: "service", position: { x: 600, y: 270 }, data: { label: "C", color: COLORS.EISL_API, status: "healthy" } },
  { id: "D-api", type: "service", position: { x: 650, y: 270 }, data: { label: "D", color: COLORS.EISL_API, status: "healthy" } },
  { id: "N-api", type: "service", position: { x: 600, y: 320 }, data: { label: "N", color: COLORS.EISL_API, status: "healthy" } },
  { id: "M-api", type: "service", position: { x: 650, y: 320 }, data: { label: "M", color: COLORS.EISL_API, status: "healthy" } },
  
  // CARMA (cyan box)
  { id: "IM", type: "service", position: { x: 750, y: 120 }, data: { label: "IM", color: COLORS.CARMA, status: "healthy" } },
  { id: "CX", type: "service", position: { x: 800, y: 150 }, data: { label: "CX", color: COLORS.CARMA, status: "healthy" } },
  { id: "EQ", type: "service", position: { x: 850, y: 160 }, data: { label: "EQ", color: COLORS.CARMA, status: "healthy" } },
  { id: "FL", type: "service", position: { x: 900, y: 170 }, data: { label: "FL", color: COLORS.CARMA, status: "healthy" } },
  { id: "S3-carma", type: "service", position: { x: 950, y: 180 }, data: { label: "S3", color: COLORS.CARMA, status: "healthy" } },
  { id: "G-carma", type: "service", position: { x: 820, y: 210 }, data: { label: "G", color: COLORS.CARMA, status: "healthy" } },
  { id: "FQ", type: "service", position: { x: 870, y: 220 }, data: { label: "FQ", color: COLORS.CARMA, status: "healthy" } },
  { id: "QY", type: "service", position: { x: 870, y: 270 }, data: { label: "QY", color: COLORS.CARMA, status: "healthy" } },
  
  // EISL Messaging (purple)
  { id: "N-msg", type: "service", position: { x: 650, y: 380 }, data: { label: "N", color: COLORS.EISL_MSG, status: "healthy" } },
  { id: "X-msg", type: "service", position: { x: 700, y: 400 }, data: { label: "X", color: COLORS.EISL_MSG, status: "healthy" } },
  { id: "Q-msg", type: "service", position: { x: 750, y: 420 }, data: { label: "Q", color: COLORS.EISL_MSG, status: "healthy" } },
  { id: "A-msg", type: "service", position: { x: 800, y: 430 }, data: { label: "A", color: COLORS.EISL_MSG, status: "healthy" } },
  { id: "S-msg", type: "service", position: { x: 850, y: 440 }, data: { label: "S", color: COLORS.EISL_MSG, status: "healthy" } },
  { id: "K-msg", type: "service", position: { x: 950, y: 430 }, data: { label: "K", color: COLORS.EISL_MSG, status: "healthy" } },
  { id: "C-msg", type: "service", position: { x: 800, y: 480 }, data: { label: "C", color: COLORS.EISL_MSG, status: "healthy" } },
  { id: "D-msg", type: "service", position: { x: 850, y: 490 }, data: { label: "D", color: COLORS.EISL_MSG, status: "healthy" } },
  { id: "ES", type: "service", position: { x: 900, y: 500 }, data: { label: "ES", color: COLORS.EISL_MSG, status: "healthy" } },
  
  // EISL Files (blue, top)
  { id: "F-files", type: "service", position: { x: 550, y: 50 }, data: { label: "F", color: COLORS.EISL_FILES, status: "healthy" } },
  { id: "NS", type: "service", position: { x: 600, y: 50 }, data: { label: "NS", color: COLORS.EISL_FILES, status: "healthy" } },
  { id: "D-files", type: "service", position: { x: 600, y: 100 }, data: { label: "D", color: COLORS.EISL_FILES, status: "healthy" } },
  { id: "I-files", type: "service", position: { x: 550, y: 120 }, data: { label: "I", color: COLORS.EISL_FILES, status: "healthy" } },
  { id: "J-files", type: "service", position: { x: 620, y: 130 }, data: { label: "J", color: COLORS.EISL_FILES, status: "healthy" } },
  
  // IMPACT (light blue)
  { id: "Q-impact", type: "service", position: { x: 330, y: 520 }, data: { label: "Q", color: COLORS.IMPACT, status: "healthy" } },
  { id: "SP-impact", type: "service", position: { x: 380, y: 540 }, data: { label: "SP", color: COLORS.IMPACT, status: "healthy" } },
  { id: "TP-impact", type: "service", position: { x: 430, y: 540 }, data: { label: "TP", color: COLORS.IMPACT, status: "healthy" } },
  { id: "UI-impact", type: "service", position: { x: 380, y: 580 }, data: { label: "UI", color: COLORS.IMPACT, status: "healthy" } },
  { id: "D-impact", type: "service", position: { x: 450, y: 580 }, data: { label: "D", color: COLORS.IMPACT, status: "healthy" } },
  
  // GLOSS (light blue)
  { id: "Q-gloss", type: "service", position: { x: 330, y: 640 }, data: { label: "Q", color: COLORS.IMPACT, status: "healthy" } },
  { id: "SP-gloss", type: "service", position: { x: 380, y: 660 }, data: { label: "SP", color: COLORS.IMPACT, status: "healthy" } },
  { id: "TP-gloss", type: "service", position: { x: 430, y: 660 }, data: { label: "TP", color: COLORS.IMPACT, status: "healthy" } },
  { id: "UI-gloss", type: "service", position: { x: 380, y: 700 }, data: { label: "UI", color: COLORS.IMPACT, status: "healthy" } },
  { id: "D-gloss", type: "service", position: { x: 450, y: 700 }, data: { label: "D", color: COLORS.IMPACT, status: "healthy" } },
  
  // Revport (light blue)
  { id: "A0", type: "service", position: { x: 330, y: 760 }, data: { label: "A0", color: COLORS.IMPACT, status: "healthy" } },
  { id: "W-report", type: "service", position: { x: 390, y: 780 }, data: { label: "W", color: COLORS.IMPACT, status: "healthy" } },
  { id: "A1", type: "service", position: { x: 440, y: 770 }, data: { label: "A1", color: COLORS.IMPACT, status: "healthy" } },
  { id: "RJ", type: "service", position: { x: 490, y: 780 }, data: { label: "RJ", color: COLORS.IMPACT, status: "healthy" } },
  { id: "D-report", type: "service", position: { x: 530, y: 800 }, data: { label: "D", color: COLORS.IMPACT, status: "healthy" } },
  { id: "S3-report", type: "service", position: { x: 580, y: 790 }, data: { label: "S3", color: COLORS.IMPACT, status: "healthy" } },
  { id: "A2", type: "service", position: { x: 440, y: 820 }, data: { label: "A2", color: COLORS.IMPACT, status: "healthy" } },
  { id: "JR", type: "service", position: { x: 490, y: 830 }, data: { label: "JR", color: COLORS.IMPACT, status: "healthy" } },
]

// Edges based on the subway map connections
const initialEdges: Edge[] = [
  // UBS connections to main sections
  { id: "e-ubs-g", source: "ubs", target: "G", type: ConnectionLineType.SmoothStep, animated: true },
  { id: "e-ubs-7", source: "ubs", target: "7-global", type: ConnectionLineType.SmoothStep, animated: true },
  { id: "e-ubs-s", source: "ubs", target: "S-global", type: ConnectionLineType.SmoothStep, animated: true },
  { id: "e-ubs-u", source: "ubs", target: "U-cob", type: ConnectionLineType.SmoothStep, animated: true },
  { id: "e-ubs-a-fxl", source: "ubs", target: "A-fxl", type: ConnectionLineType.SmoothStep, animated: true },
  { id: "e-ubs-q-impact", source: "ubs", target: "Q-impact", type: ConnectionLineType.SmoothStep, animated: true },
  { id: "e-ubs-q-gloss", source: "ubs", target: "Q-gloss", type: ConnectionLineType.SmoothStep, animated: true },
  { id: "e-ubs-a0", source: "ubs", target: "A0", type: ConnectionLineType.SmoothStep, animated: true },
  
  // Workstation connections
  { id: "e-g-s3", source: "G", target: "S3-work", type: ConnectionLineType.SmoothStep, animated: true },
  { id: "e-s3-n", source: "S3-work", target: "N-work", type: ConnectionLineType.SmoothStep, animated: true },
  { id: "e-n-px", source: "N-work", target: "PX", type: ConnectionLineType.SmoothStep, animated: true },
  { id: "e-s3-a", source: "S3-work", target: "A-work", type: ConnectionLineType.SmoothStep, animated: true },
  { id: "e-a-c", source: "A-work", target: "C-work", type: ConnectionLineType.SmoothStep, animated: true },
  { id: "e-c-s", source: "C-work", target: "S-work", type: ConnectionLineType.SmoothStep, animated: true },
  { id: "e-s-d", source: "S-work", target: "D-work", type: ConnectionLineType.SmoothStep, animated: true },
  
  // FXL connections
  { id: "e-s-fxl-a", source: "S-fxl", target: "A-fxl", type: ConnectionLineType.SmoothStep, animated: true },
  { id: "e-a-w", source: "A-fxl", target: "W-fxl", type: ConnectionLineType.SmoothStep, animated: true },
  { id: "e-s-fxl-f", source: "S-fxl", target: "F-fxl", type: ConnectionLineType.SmoothStep, animated: true },
  { id: "e-f-i", source: "F-fxl", target: "I-fxl", type: ConnectionLineType.SmoothStep, animated: true },
  { id: "e-i-d", source: "I-fxl", target: "D-fxl", type: ConnectionLineType.SmoothStep, animated: true },
  
  // EISL API connections
  { id: "e-c-api-d", source: "C-api", target: "D-api", type: ConnectionLineType.SmoothStep, animated: true },
  { id: "e-n-api-m", source: "N-api", target: "M-api", type: ConnectionLineType.SmoothStep, animated: true },
  
  // CARMA connections
  { id: "e-im-cx", source: "IM", target: "CX", type: ConnectionLineType.SmoothStep, animated: true },
  { id: "e-cx-eq", source: "CX", target: "EQ", type: ConnectionLineType.SmoothStep, animated: true },
  { id: "e-eq-fl", source: "EQ", target: "FL", type: ConnectionLineType.SmoothStep, animated: true },
  { id: "e-fl-s3", source: "FL", target: "S3-carma", type: ConnectionLineType.SmoothStep, animated: true },
  { id: "e-cx-g", source: "CX", target: "G-carma", type: ConnectionLineType.SmoothStep, animated: true },
  { id: "e-g-fq", source: "G-carma", target: "FQ", type: ConnectionLineType.SmoothStep, animated: true },
  { id: "e-fq-qy", source: "FQ", target: "QY", type: ConnectionLineType.SmoothStep, animated: true },
  
  // EISL Messaging
  { id: "e-n-x", source: "N-msg", target: "X-msg", type: ConnectionLineType.SmoothStep, animated: true },
  { id: "e-x-q", source: "X-msg", target: "Q-msg", type: ConnectionLineType.SmoothStep, animated: true },
  { id: "e-q-a-msg", source: "Q-msg", target: "A-msg", type: ConnectionLineType.SmoothStep, animated: true },
  { id: "e-a-s-msg", source: "A-msg", target: "S-msg", type: ConnectionLineType.SmoothStep, animated: true },
  { id: "e-s-k", source: "S-msg", target: "K-msg", type: ConnectionLineType.SmoothStep, animated: true },
  { id: "e-a-c-msg", source: "A-msg", target: "C-msg", type: ConnectionLineType.SmoothStep, animated: true },
  { id: "e-c-d-msg", source: "C-msg", target: "D-msg", type: ConnectionLineType.SmoothStep, animated: true },
  { id: "e-d-es", source: "D-msg", target: "ES", type: ConnectionLineType.SmoothStep, animated: true },
  
  // EISL Files
  { id: "e-f-ns", source: "F-files", target: "NS", type: ConnectionLineType.SmoothStep, animated: true },
  { id: "e-ns-d", source: "NS", target: "D-files", type: ConnectionLineType.SmoothStep, animated: true },
  { id: "e-d-i-files", source: "D-files", target: "I-files", type: ConnectionLineType.SmoothStep, animated: true },
  { id: "e-d-j", source: "D-files", target: "J-files", type: ConnectionLineType.SmoothStep, animated: true },
  
  // IMPACT
  { id: "e-q-sp-i", source: "Q-impact", target: "SP-impact", type: ConnectionLineType.SmoothStep, animated: true },
  { id: "e-sp-tp-i", source: "SP-impact", target: "TP-impact", type: ConnectionLineType.SmoothStep, animated: true },
  { id: "e-sp-ui-i", source: "SP-impact", target: "UI-impact", type: ConnectionLineType.SmoothStep, animated: true },
  { id: "e-ui-d-i", source: "UI-impact", target: "D-impact", type: ConnectionLineType.SmoothStep, animated: true },
  
  // GLOSS
  { id: "e-q-sp-g", source: "Q-gloss", target: "SP-gloss", type: ConnectionLineType.SmoothStep, animated: true },
  { id: "e-sp-tp-g", source: "SP-gloss", target: "TP-gloss", type: ConnectionLineType.SmoothStep, animated: true },
  { id: "e-sp-ui-g", source: "SP-gloss", target: "UI-gloss", type: ConnectionLineType.SmoothStep, animated: true },
  { id: "e-ui-d-g", source: "UI-gloss", target: "D-gloss", type: ConnectionLineType.SmoothStep, animated: true },
  
  // Revport
  { id: "e-a0-w", source: "A0", target: "W-report", type: ConnectionLineType.SmoothStep, animated: true },
  { id: "e-w-a1", source: "W-report", target: "A1", type: ConnectionLineType.SmoothStep, animated: true },
  { id: "e-a1-rj", source: "A1", target: "RJ", type: ConnectionLineType.SmoothStep, animated: true },
  { id: "e-rj-d", source: "RJ", target: "D-report", type: ConnectionLineType.SmoothStep, animated: true },
  { id: "e-d-s3-r", source: "D-report", target: "S3-report", type: ConnectionLineType.SmoothStep, animated: true },
  { id: "e-w-a2", source: "W-report", target: "A2", type: ConnectionLineType.SmoothStep, animated: true },
  { id: "e-a2-jr", source: "A2", target: "JR", type: ConnectionLineType.SmoothStep, animated: true },
]

export function SubwayMapFull() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)

  // Randomly change node statuses
  const randomizeStatuses = useCallback(() => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.type === "engine" || node.type === "Router") return node
        
        const statuses: ServiceStatus[] = ["healthy", "warning", "critical"]
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]
        return {
          ...node,
          data: {
            ...node.data,
            status: randomStatus,
          },
        }
      }),
    )
  }, [setNodes])

  // Simulate periodic status updates
  useEffect(() => {
    const interval = setInterval(() => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.type === "engine" || node.type === "Router") return node
          
          if (Math.random() < 0.2) {
            const weights = [0.7, 0.2, 0.1]
            const random = Math.random()
            let status: ServiceStatus = "healthy"

            if (random < weights[2]) {
              status = "critical"
            } else if (random < weights[1] + weights[2]) {
              status = "warning"
            }

            return {
              ...node,
              data: {
                ...node.data,
                status,
              },
            }
          }
          return node
        }),
      )
    }, 3000)

    return () => clearInterval(interval)
  }, [setNodes])

  return (
    <div className="relative h-full w-full">
      <div className="absolute left-6 top-6 z-10 flex flex-col gap-3 max-h-[calc(100vh-3rem)] overflow-y-auto">
        <div className="rounded-lg border border-border bg-card/95 p-4 shadow-lg backdrop-blur-sm">
          <h1 className="text-balance text-xl font-semibold text-foreground">WMAP Mag 7 — Subway Map</h1>
          <p className="mt-1 text-sm text-muted-foreground">Service topology monitoring</p>
        </div>
        <Button onClick={randomizeStatuses} variant="outline" className="w-full bg-transparent">
          Randomize Status
        </Button>
        
        <div className="rounded-lg border border-border bg-card/95 p-3 shadow-lg backdrop-blur-sm">
          <h3 className="text-sm font-semibold text-foreground mb-2">Service Status</h3>
          <div className="flex flex-col gap-2 text-sm">
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
        
        <div className="rounded-lg border border-border bg-card/95 p-3 shadow-lg backdrop-blur-sm">
          <h3 className="text-sm font-semibold text-foreground mb-2">Service Groups</h3>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS.GLOBAL }} />
              <span className="text-muted-foreground">Global</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS.WORKSTATION }} />
              <span className="text-muted-foreground">Workstation</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS.COB }} />
              <span className="text-muted-foreground">COB</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS.FXL }} />
              <span className="text-muted-foreground">FXL</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS.EISL_API }} />
              <span className="text-muted-foreground">EISL APIs</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS.CARMA }} />
              <span className="text-muted-foreground">CARMA</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS.EISL_MSG }} />
              <span className="text-muted-foreground">EISL Messaging</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS.EISL_FILES }} />
              <span className="text-muted-foreground">EISL Files</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS.IMPACT }} />
              <span className="text-muted-foreground">IMPACT/GLOSS/Revport</span>
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
        minZoom={0.2}
        maxZoom={1.5}
        defaultEdgeOptions={{
          type: ConnectionLineType.SmoothStep,
          animated: true,
        }}
      >
        <Background className="bg-background" />
        <Controls className="rounded-lg border border-border bg-card shadow-lg" />
        <MiniMap
          className="rounded-lg border border-border bg-card shadow-lg"
          nodeColor={(node) => {
            if (node.type === "engine") return "#000000"
            if (node.type === "Router") return "#000000"
            const color = (node.data as ServiceNodeData).color
            return color || "#10b981"
          }}
        />
      </ReactFlow>
    </div>
  )
}
