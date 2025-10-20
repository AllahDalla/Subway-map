"use client"

import type React from "react"

import { memo } from "react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import type { ServiceNodeData, ServiceStatus } from "./subway-map"
import { Activity, AlertTriangle, XCircle } from "lucide-react"

const statusConfig: Record<
  ServiceStatus,
  { color: string; bgColor: string; borderColor: string; icon: React.ReactNode }
> = {
  healthy: {
    color: "#10b981",
    bgColor: "rgba(16, 185, 129, 0.1)",
    borderColor: "#10b981",
    icon: <Activity className="h-4 w-4" />,
  },
  warning: {
    color: "#f59e0b",
    bgColor: "rgba(245, 158, 11, 0.1)",
    borderColor: "#f59e0b",
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  critical: {
    color: "#ef4444",
    bgColor: "rgba(239, 68, 68, 0.1)",
    borderColor: "#ef4444",
    icon: <XCircle className="h-4 w-4" />,
  },
}

export const ServiceNode = memo(({ data }: NodeProps) => {
  const nodeData = data as ServiceNodeData
  const config = statusConfig[nodeData.status]
  
  // Use custom color if provided
  const customColor = (nodeData as any).color
  const borderColor = customColor || config.borderColor
  const bgColor = customColor ? `${customColor}15` : config.bgColor

  return (
    <div
      className="rounded-full border-2 bg-card px-4 py-3 shadow-lg transition-all duration-300"
      style={{
        borderColor: borderColor,
        backgroundColor: bgColor,
      }}
    >
      <Handle type="target" position={Position.Left} className="!bg-border" />
      <div className="flex items-center gap-2">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full"
          style={{ backgroundColor: config.color, color: "white" }}
        >
          {config.icon}
        </div>
        <div className="flex flex-col">
          <div className="text-sm font-semibold text-foreground">{nodeData.label}</div>
          <div className="text-xs font-medium capitalize" style={{ color: config.color }}>
            {nodeData.status}
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-border" />
    </div>
  )
})

ServiceNode.displayName = "ServiceNode"
