"use client"

import { memo } from "react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import { Cpu, ChartBarIncreasing } from "lucide-react"

export interface EngineNodeData {
  label: string
  [key: string]: unknown
}

export const EngineNode = memo(({ data }: NodeProps) => {
  const nodeData = data as EngineNodeData

  console.log("Rendering EngineNode:", nodeData)

  return (
    <div
      className="rounded-xl border-4 bg-card px-8 py-6 shadow-2xl transition-all duration-300"
      style={{
        borderColor: "#000000",
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        minWidth: "200px",
        minHeight: nodeData.label.includes("db") ? "150px":"250px",
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-black !w-4 !h-4"
        style={{ left: "-8px" }}
      />
      <div className="flex flex-col items-center justify-center gap-3">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: "#000000", color: "white" }}
        >
          {nodeData.label.includes("db") ? <ChartBarIncreasing className="h-8 w-8" />:<Cpu className="h-8 w-8" />}
        </div>
        <div className="flex flex-col items-center">
          <div className="text-2xl font-bold text-foreground items-center">{nodeData.label}</div>
          <div className="text-sm text-muted-foreground justify-center items-center">{nodeData.label.includes("db") ? "Database":"Engine"}</div>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-black !w-4 !h-4"
        style={{ right: "-8px" }}
      />
    </div>
  )
})

EngineNode.displayName = "EngineNode"
