"use client"

import { memo } from "react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import { Network } from "lucide-react"

export interface RouterNodeData {
  label: string
  [key: string]: unknown
}

export const RouterNode = memo(({ data }: NodeProps) => {
  const nodeData = data as RouterNodeData

  return (
    <div
      className="rounded-full border-2 bg-card px-6 py-4 shadow-lg transition-all duration-300"
      style={{
        borderColor: "#000000",
        backgroundColor: "rgba(0, 0, 0, 0.05)",
      }}
    >
      <Handle type="target" position={Position.Left} className="!bg-black" />
      <div className="flex items-center gap-2">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: "#000000", color: "white" }}
        >
          <Network className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <div className="text-base font-bold text-foreground">{nodeData.label}</div>
          <div className="text-xs text-muted-foreground">Router</div>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-black" />
    </div>
  )
})

RouterNode.displayName = "RouterNode"
