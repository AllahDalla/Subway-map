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
import { Button } from "./ui/button"
import servicesData from "../assets/subway-map-services.json"

export type ServiceStatus = "healthy" | "warning" | "critical"

export interface ServiceNodeData {
  label: string
  status: ServiceStatus
  [key: string]: unknown
}

const nodeTypes = {
  service: ServiceNode,
  engine: EngineNode,
}

const COLORS = {
  INBOUND: "#10b981",   // Green
  OUTBOUND: "#ef4444",  // Red
}

// Two horizontal lanes: Top = Inbound (green), Bottom = Outbound (red)
const generateNodesAndEdges = () => {
  const nodes: Node[] = []
  const edges: Edge[] = []
  let edgeId = 0

  const domainColor = "#4A90E2"
  const yInbound = 150
  const yOutbound = 900
  const xSpacing = 450
  const yNodeSpacing = 130

  const domainName = "account"
  const domain = (servicesData.domains as any)[domainName]

  // INBOUND LANE (Top Row) - Left to Right
  // 1. API Gateway
  nodes.push({ id: "api-gateway", type: "engine", position: { x: 50, y: (yInbound + yOutbound) / 2 }, data: { label: "API Gateway" } })
  
  // 2. APIs
  const apiCount = Math.min(5, domain.api?.length || 0)
  for (let i = 0; i < apiCount; i++) {
    nodes.push({
      id: `api-${i}`,
      type: "service",
      position: { x: 50 + xSpacing, y: yInbound - 200 + i * yNodeSpacing },
      data: { label: `API${i + 1}`, color: domainColor, status: "healthy" }
    })
    edges.push({
      id: `e-${edgeId++}`,
      source: "api-gateway",
      target: `api-${i}`,
      type: ConnectionLineType.SmoothStep,
      animated: true,
      style: { stroke: COLORS.INBOUND, strokeWidth: 2 }
    })
  }

  // 3. Confluent
  const confCount = Math.min(5, domain.confluent?.length || 0)
  for (let i = 0; i < confCount; i++) {
    nodes.push({
      id: `conf-${i}`,
      type: "service",
      position: { x: 50 + xSpacing * 2, y: yInbound - 200 + i * yNodeSpacing },
      data: { label: `K${i + 1}`, color: domainColor, status: "healthy" }
    })
    if (i < apiCount) {
      edges.push({
        id: `e-${edgeId++}`,
        source: `api-${i}`,
        target: `conf-${i}`,
        type: ConnectionLineType.SmoothStep,
        animated: true,
        style: { stroke: COLORS.INBOUND, strokeWidth: 2 }
      })
    }
  }

  // 4. Director (Inbound)
  nodes.push({ id: "director-inbound", type: "engine", position: { x: 50 + xSpacing * 3, y: yInbound }, data: { label: "Director\nInbound" } })
  for (let i = 0; i < confCount; i++) {
    edges.push({
      id: `e-${edgeId++}`,
      source: `conf-${i}`,
      target: "director-inbound",
      type: ConnectionLineType.SmoothStep,
      animated: true,
      style: { stroke: COLORS.INBOUND, strokeWidth: 2 }
    })
  }

  // 5. MQ
  const mqCount = Math.min(3, domain.mq?.length || 0)
  for (let i = 0; i < mqCount; i++) {
    nodes.push({
      id: `mq-${i}`,
      type: "service",
      position: { x: 50 + xSpacing * 4, y: yInbound - 130 + i * yNodeSpacing },
      data: { label: `MQ${i + 1}`, color: domainColor, status: "healthy" }
    })
    edges.push({
      id: `e-${edgeId++}`,
      source: "director-inbound",
      target: `mq-${i}`,
      type: ConnectionLineType.SmoothStep,
      animated: true,
      style: { stroke: COLORS.INBOUND, strokeWidth: 2 }
    })
  }

  // 6. Engine
  nodes.push({ id: "engine", type: "engine", position: { x: 50 + xSpacing * 5, y: (yInbound + yOutbound) / 2 }, data: { label: "Engine" } })
  for (let i = 0; i < mqCount; i++) {
    edges.push({
      id: `e-${edgeId++}`,
      source: `mq-${i}`,
      target: "engine",
      type: ConnectionLineType.SmoothStep,
      animated: true,
      style: { stroke: COLORS.INBOUND, strokeWidth: 2 }
    })
  }

  // OUTBOUND LANE (Bottom Row) - Right to Left visually (but left to right in reverse)
  // 1. Engine → MQ
  for (let i = 0; i < mqCount; i++) {
    edges.push({
      id: `e-${edgeId++}`,
      source: "engine",
      target: `mq-${i}`,
      type: ConnectionLineType.SmoothStep,
      animated: true,
      style: { stroke: COLORS.OUTBOUND, strokeWidth: 2 }
    })
  }
  
  // 2. MQ → Director (Outbound)
  nodes.push({ id: "director-outbound", type: "engine", position: { x: 50 + xSpacing * 4, y: yOutbound }, data: { label: "Director\nOutbound" } })
  for (let i = 0; i < mqCount; i++) {
    edges.push({
      id: `e-${edgeId++}`,
      source: `mq-${i}`,
      target: "director-outbound",
      type: ConnectionLineType.SmoothStep,
      animated: true,
      style: { stroke: COLORS.OUTBOUND, strokeWidth: 2 }
    })
  }
  
  // 3. Director → Confluent
  for (let i = 0; i < confCount; i++) {
    edges.push({
      id: `e-${edgeId++}`,
      source: "director-outbound",
      target: `conf-${i}`,
      type: ConnectionLineType.SmoothStep,
      animated: true,
      style: { stroke: COLORS.OUTBOUND, strokeWidth: 2 }
    })
  }
  
  // 4. Confluent → DataLoaders
  const loaderCount = Math.min(4, domain.dataloader?.length || 0)
  for (let i = 0; i < loaderCount; i++) {
    nodes.push({
      id: `loader-${i}`,
      type: "service",
      position: { x: 50 + xSpacing * 3, y: yOutbound - 180 + i * yNodeSpacing },
      data: { label: `DL${i + 1}`, color: domainColor, status: "healthy" }
    })
    if (i < confCount) {
      edges.push({
        id: `e-${edgeId++}`,
        source: `conf-${i}`,
        target: `loader-${i}`,
        type: ConnectionLineType.SmoothStep,
        animated: true,
        style: { stroke: COLORS.OUTBOUND, strokeWidth: 2 }
      })
    }
  }
  
  // 5. DataLoaders → Databases
  const accountDbs = ["bfs", "communify", "scotiabank", "scotiacap"]
  accountDbs.forEach((db, i) => {
    nodes.push({
      id: `db-${db}`,
      type: "engine",
      position: { x: 50 + xSpacing * 2, y: yOutbound - 300 + i * 200 },
      data: { label: `${db.toUpperCase()}\nDB` }
    })
    if (i < loaderCount) {
      edges.push({
        id: `e-${edgeId++}`,
        source: `loader-${i}`,
        target: `db-${db}`,
        type: ConnectionLineType.SmoothStep,
        animated: true,
        style: { stroke: COLORS.OUTBOUND, strokeWidth: 2 }
      })
    }
  })
  
  // 6. Databases → APIs
  for (let i = 0; i < Math.min(apiCount, accountDbs.length); i++) {
    edges.push({
      id: `e-${edgeId++}`,
      source: `db-${accountDbs[i]}`,
      target: `api-${i}`,
      type: ConnectionLineType.SmoothStep,
      animated: true,
      style: { stroke: COLORS.OUTBOUND, strokeWidth: 2 }
    })
  }
  
  // 7. APIs → API Gateway
  for (let i = 0; i < apiCount; i++) {
    edges.push({
      id: `e-${edgeId++}`,
      source: `api-${i}`,
      target: "api-gateway",
      type: ConnectionLineType.SmoothStep,
      animated: true,
      style: { stroke: COLORS.OUTBOUND, strokeWidth: 2 }
    })
  }

  return { nodes, edges }
}

const { nodes: layoutedNodes, edges: layoutedEdges } = generateNodesAndEdges()

export function SubwayMapReal() {
  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes)
  const [edges, , onEdgesChange] = useEdgesState(layoutedEdges)

  const randomizeStatuses = useCallback(() => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.type === "engine") return node
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
          if (node.type === "engine") return node
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
      <div className="absolute left-6 top-6 z-10 flex flex-col gap-3 max-h-[calc(100vh-3rem)] overflow-y-auto pr-2">
        <div className="rounded-lg border border-border bg-card/95 p-4 shadow-lg backdrop-blur-sm">
          <h1 className="text-balance text-xl font-semibold text-foreground">Service Data Flow</h1>
          <p className="mt-1 text-sm text-muted-foreground">Account Domain Demo</p>
        </div>
        <Button onClick={randomizeStatuses} variant="outline" className="w-full bg-transparent">
          Randomize Status
        </Button>
        
        <div className="rounded-lg border border-border bg-card/95 p-3 shadow-lg backdrop-blur-sm">
          <h3 className="text-sm font-semibold text-foreground mb-2">Status</h3>
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
        
        <div className="rounded-lg border border-border bg-card/95 p-3 shadow-lg backdrop-blur-sm">
          <h3 className="text-sm font-semibold text-foreground mb-3">Data Flow Lanes</h3>
          <div className="flex flex-col gap-3 text-xs">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-0.5 bg-emerald-600" />
                <span className="font-semibold text-foreground">Inbound (Top Lane)</span>
              </div>
              <div className="ml-4 flex flex-col gap-0.5">
                <span className="text-muted-foreground">1. API Gateway</span>
                <span className="text-muted-foreground">2. Domain APIs (5 shown)</span>
                <span className="text-muted-foreground">3. Confluent/Kafka (5 topics)</span>
                <span className="text-muted-foreground">4. Director Server (Inbound)</span>
                <span className="text-muted-foreground">5. MQ Queues (3 shown)</span>
                <span className="text-muted-foreground">6. Engine</span>
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-0.5 bg-red-600" />
                <span className="font-semibold text-foreground">Outbound (Bottom Lane)</span>
              </div>
              <div className="ml-4 flex flex-col gap-0.5">
                <span className="text-muted-foreground">1. Engine</span>
                <span className="text-muted-foreground">2. MQ Queues (shared)</span>
                <span className="text-muted-foreground">3. Director Server (Outbound)</span>
                <span className="text-muted-foreground">4. Confluent/Kafka (shared)</span>
                <span className="text-muted-foreground">5. DataLoaders (4 shown)</span>
                <span className="text-muted-foreground">6. Databases (4 shown)</span>
                <span className="text-muted-foreground">7. APIs (shared)</span>
                <span className="text-muted-foreground">8. API Gateway</span>
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
        minZoom={0.1}
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
            const color = (node.data as any).color
            return color || "#10b981"
          }}
        />
      </ReactFlow>
    </div>
  )
}
