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
  
  // Both background and border = status color
  const bgColor = config.borderColor
  const borderColor = config.borderColor

  return (
    <div
      className="rounded-full flex items-center justify-center shadow-lg transition-all duration-300 border-4"
      style={{
        backgroundColor: bgColor,
        borderColor: borderColor,
        width: "60px",
        height: "60px",
      }}
    >
      <Handle type="target" position={Position.Left} className="!bg-gray-400" />
      <div className="text-xl font-bold text-white">
        {nodeData.label}
      </div>
      <Handle type="source" position={Position.Right} className="!bg-gray-400" />
    </div>
  )
})

ServiceNode.displayName = "ServiceNode"
