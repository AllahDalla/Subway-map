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
  BIDIRECTIONAL: "#f59e0b", // Yellow
}

// Generate nodes and edges from JSON data
const generateNodesAndEdges = () => {
  const nodes: Node[] = []
  const edges: Edge[] = []
  let edgeId = 0

  // Special nodes
  nodes.push({ id: "api-gateway", type: "engine", position: { x: 0, y: 0 }, data: { label: "API Gateway" } })
  nodes.push({ id: "director-inbound", type: "engine", position: { x: 0, y: 0 }, data: { label: "Director Server\n(Inbound)" } })
  nodes.push({ id: "director-outbound", type: "engine", position: { x: 0, y: 0 }, data: { label: "Director Server\n(Outbound)" } })
  nodes.push({ id: "engine", type: "engine", position: { x: 0, y: 0 }, data: { label: "Engine" } })

  // Database nodes (from postgres array)
  servicesData.postgres.forEach((db: string) => {
    nodes.push({
      id: `db-${db}`,
      type: "engine",
      position: { x: 0, y: 0 },
      data: { label: `${db.toUpperCase()}\nDB` }
    })
  })

  // Process each domain
  Object.entries(servicesData.domains).forEach(([domainName, domain]: [string, any]) => {
    const domainColor = `hsl(${Math.random() * 360}, 70%, 60%)`

    // API nodes
    domain.api?.forEach((_api: string, idx: number) => {
      const apiId = `api-${domainName}-${idx}`
      nodes.push({
        id: apiId,
        type: "service",
        position: { x: 0, y: 0 },
        data: { label: `API\n${idx + 1}`, color: domainColor, status: "healthy", domain: domainName }
      })

      // INBOUND: API Gateway → Domain APIs
      edges.push({
        id: `e-${edgeId++}`,
        source: "api-gateway",
        target: apiId,
        type: ConnectionLineType.SmoothStep,
        animated: true,
        style: { stroke: COLORS.INBOUND, strokeWidth: 2 }
      })
    })

    // Confluent/Kafka nodes
    domain.confluent?.forEach((_conf: string, idx: number) => {
      const confId = `conf-${domainName}-${idx}`
      nodes.push({
        id: confId,
        type: "service",
        position: { x: 0, y: 0 },
        data: { label: `K${idx + 1}`, color: domainColor, status: "healthy", domain: domainName }
      })

      // INBOUND: Domain APIs → Confluent
      if (domain.api && idx < domain.api.length) {
        edges.push({
          id: `e-${edgeId++}`,
          source: `api-${domainName}-${idx}`,
          target: confId,
          type: ConnectionLineType.SmoothStep,
          animated: true,
          style: { stroke: COLORS.INBOUND, strokeWidth: 2 }
        })
      }

      // INBOUND: Confluent → Director Server (Inbound)
      edges.push({
        id: `e-${edgeId++}`,
        source: confId,
        target: "director-inbound",
        type: ConnectionLineType.SmoothStep,
        animated: true,
        style: { stroke: COLORS.INBOUND, strokeWidth: 2 }
      })
    })

    // MSK nodes (same level as Confluent/MQ)
    domain.msk?.forEach((_msk: string, idx: number) => {
      const mskId = `msk-${domainName}-${idx}`
      nodes.push({
        id: mskId,
        type: "service",
        position: { x: 0, y: 0 },
        data: { label: `MSK${idx + 1}`, color: domainColor, status: "healthy", domain: domainName }
      })
    })

    // MQ nodes
    domain.mq?.forEach((_mq: string, idx: number) => {
      const mqId = `mq-${domainName}-${idx}`
      nodes.push({
        id: mqId,
        type: "service",
        position: { x: 0, y: 0 },
        data: { label: `MQ${idx + 1}`, color: domainColor, status: "healthy", domain: domainName }
      })

      // INBOUND: Director Server → MQ → Engine
      if (idx === 0) {
        edges.push({
          id: `e-${edgeId++}`,
          source: "director-inbound",
          target: mqId,
          type: ConnectionLineType.SmoothStep,
          animated: true,
          style: { stroke: COLORS.INBOUND, strokeWidth: 2 }
        })
        edges.push({
          id: `e-${edgeId++}`,
          source: mqId,
          target: "engine",
          type: ConnectionLineType.SmoothStep,
          animated: true,
          style: { stroke: COLORS.INBOUND, strokeWidth: 2 }
        })

        // OUTBOUND: Engine → MQ → Director Server (Outbound)
        edges.push({
          id: `e-${edgeId++}`,
          source: "engine",
          target: mqId,
          type: ConnectionLineType.SmoothStep,
          animated: true,
          style: { stroke: COLORS.OUTBOUND, strokeWidth: 2 }
        })
        edges.push({
          id: `e-${edgeId++}`,
          source: mqId,
          target: "director-outbound",
          type: ConnectionLineType.SmoothStep,
          animated: true,
          style: { stroke: COLORS.OUTBOUND, strokeWidth: 2 }
        })
      }
    })

    // Data Loader nodes
    domain.dataloader?.forEach((loader: string, idx: number) => {
      const loaderId = `loader-${domainName}-${idx}`
      nodes.push({
        id: loaderId,
        type: "service",
        position: { x: 0, y: 0 },
        data: { label: `DL${idx + 1}`, color: domainColor, status: "healthy", domain: domainName }
      })

      // OUTBOUND: Director Server → Confluent → DataLoader
      if (domain.confluent && idx < domain.confluent.length) {
        edges.push({
          id: `e-${edgeId++}`,
          source: "director-outbound",
          target: `conf-${domainName}-${idx}`,
          type: ConnectionLineType.SmoothStep,
          animated: true,
          style: { stroke: COLORS.OUTBOUND, strokeWidth: 2 }
        })
        edges.push({
          id: `e-${edgeId++}`,
          source: `conf-${domainName}-${idx}`,
          target: loaderId,
          type: ConnectionLineType.SmoothStep,
          animated: true,
          style: { stroke: COLORS.OUTBOUND, strokeWidth: 2 }
        })
      }

      // OUTBOUND: DataLoader → Database
      const dbMatch = servicesData.postgres.find((db: string) => loader.includes(db))
      if (dbMatch) {
        edges.push({
          id: `e-${edgeId++}`,
          source: loaderId,
          target: `db-${dbMatch}`,
          type: ConnectionLineType.SmoothStep,
          animated: true,
          style: { stroke: COLORS.OUTBOUND, strokeWidth: 2 }
        })

        // OUTBOUND: Database → APIs → API Gateway
        if (domain.api && idx < domain.api.length) {
          edges.push({
            id: `e-${edgeId++}`,
            source: `db-${dbMatch}`,
            target: `api-${domainName}-${idx}`,
            type: ConnectionLineType.SmoothStep,
            animated: true,
            style: { stroke: COLORS.OUTBOUND, strokeWidth: 2 }
          })
          edges.push({
            id: `e-${edgeId++}`,
            source: `api-${domainName}-${idx}`,
            target: "api-gateway",
            type: ConnectionLineType.SmoothStep,
            animated: true,
            style: { stroke: COLORS.OUTBOUND, strokeWidth: 2 }
          })
        }
      }
    })
  })

  return { nodes, edges }
}

const { nodes: initialNodes, edges: initialEdges } = generateNodesAndEdges()

// Dagre layout
const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  dagreGraph.setGraph({ rankdir: "LR", ranksep: 120, nodesep: 120 })

  nodes.forEach((node) => {
    if (node.type === "engine") {
      dagreGraph.setNode(node.id, { width: 250, height: 200 })
    } else {
      dagreGraph.setNode(node.id, { width: 80, height: 60 })
    }
  })

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  dagre.layout(dagreGraph)

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    const offsetX = node.type === "engine" ? 125 : 40
    const offsetY = node.type === "engine" ? 100 : 30
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

const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(initialNodes, initialEdges)

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
      <div className="absolute left-6 top-6 z-10 flex flex-col gap-3">
        <div className="rounded-lg border border-border bg-card/95 p-4 shadow-lg backdrop-blur-sm">
          <h1 className="text-balance text-xl font-semibold text-foreground">Service Data Flow</h1>
          <p className="mt-1 text-sm text-muted-foreground">Real-time service monitoring</p>
        </div>
        <Button onClick={randomizeStatuses} variant="outline" className="w-full bg-transparent">
          Randomize Status
        </Button>
        <div className="rounded-lg border border-border bg-card/95 p-3 shadow-lg backdrop-blur-sm">
          <h3 className="text-sm font-semibold text-foreground mb-2">Data Flow</h3>
          <div className="flex flex-col gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5" style={{ backgroundColor: COLORS.INBOUND }} />
              <span className="text-muted-foreground">Inbound</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5" style={{ backgroundColor: COLORS.OUTBOUND }} />
              <span className="text-muted-foreground">Outbound</span>
            </div>
          </div>
        </div>
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
        
        <div className="rounded-lg border border-border bg-card/95 p-3 shadow-lg backdrop-blur-sm max-h-[500px] overflow-y-auto">
          <h3 className="text-sm font-semibold text-foreground mb-3">Domains & Services</h3>
          <div className="flex flex-col gap-3 text-xs">
            
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="h-3 w-3 rounded-sm bg-black" />
                <span className="font-semibold text-foreground">Core Infrastructure</span>
              </div>
              <div className="ml-5 flex flex-col gap-0.5">
                <span className="text-muted-foreground">• API Gateway - Entry/Exit point</span>
                <span className="text-muted-foreground">• Director Server (Inbound) - Orchestrates incoming data</span>
                <span className="text-muted-foreground">• Director Server (Outbound) - Orchestrates outgoing data</span>
                <span className="text-muted-foreground">• Engine - Central processing hub</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="h-3 w-3 rounded-sm bg-black" />
                <span className="font-semibold text-foreground">Databases</span>
              </div>
              <div className="ml-5 flex flex-col gap-0.5">
                {servicesData.postgres.map((db: string) => (
                  <span key={db} className="text-muted-foreground">• {db.toUpperCase()} - PostgreSQL Database</span>
                ))}
              </div>
            </div>

            {Object.keys(servicesData.domains).map((domainName) => {
              const domain = (servicesData.domains as any)[domainName]
              return (
                <div key={domainName}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="h-3 w-3 rounded-full bg-blue-500" />
                    <span className="font-semibold text-foreground capitalize">{domainName}</span>
                  </div>
                  <div className="ml-5 flex flex-col gap-0.5">
                    {domain.api && <span className="text-muted-foreground">• APIs: {domain.api.length} services</span>}
                    {domain.confluent && <span className="text-muted-foreground">• Confluent/Kafka: {domain.confluent.length} topics</span>}
                    {domain.mq && <span className="text-muted-foreground">• MQ: {domain.mq.length} queues</span>}
                    {domain.msk && <span className="text-muted-foreground">• MSK: {domain.msk.length} topics</span>}
                    {domain.dataloader && <span className="text-muted-foreground">• DataLoaders: {domain.dataloader.length} services</span>}
                    {domain["inbound-ds"] && <span className="text-muted-foreground">• Inbound DS: {domain["inbound-ds"].length} services</span>}
                    {domain["outbound-ds"] && <span className="text-muted-foreground">• Outbound DS: {domain["outbound-ds"].length} services</span>}
                  </div>
                </div>
              )
            })}
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
