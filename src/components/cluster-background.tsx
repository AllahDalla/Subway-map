"use client"

import { useState } from "react"
import { useViewport } from "@xyflow/react"

interface ClusterDef {
  name: string
  color: string
  x: number
  y: number
  width: number
  height: number
  description: string
}

interface ClusterBackgroundProps {
  clusters: ClusterDef[]
}

export function ClusterBackground({ clusters }: ClusterBackgroundProps) {
  const { x, y, zoom } = useViewport()
  const [hoveredCluster, setHoveredCluster] = useState<string | null>(null)

  return (
    <svg
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        overflow: "visible",
      }}
    >
      <g transform={`translate(${x}, ${y}) scale(${zoom})`}>
        {clusters.map((cluster) => (
          <g key={cluster.name}>
            <rect
              x={cluster.x}
              y={cluster.y}
              width={cluster.width}
              height={cluster.height}
              fill={`${cluster.color}08`}
              stroke={cluster.color}
              strokeWidth={2 / zoom}
              strokeDasharray={`${8 / zoom},${4 / zoom}`}
              rx={8}
              style={{ pointerEvents: "all", cursor: "pointer" }}
              onMouseEnter={() => setHoveredCluster(cluster.name)}
              onMouseLeave={() => setHoveredCluster(null)}
            />
            <text
              x={cluster.x + 10}
              y={cluster.y + 20}
              fontSize={14 / zoom}
              fontWeight="600"
              fill={cluster.color}
              style={{ pointerEvents: "none" }}
            >
              {cluster.name}
            </text>
            
            {hoveredCluster === cluster.name && (
              <g>
                <rect
                  x={cluster.x + cluster.width / 2 - 100}
                  y={cluster.y + cluster.height / 2 - 15}
                  width={200}
                  height={30}
                  fill={cluster.color}
                  rx={4}
                  style={{ pointerEvents: "none" }}
                />
                <text
                  x={cluster.x + cluster.width / 2}
                  y={cluster.y + cluster.height / 2 + 5}
                  fontSize={12 / zoom}
                  fontWeight="500"
                  fill="#ffffff"
                  textAnchor="middle"
                  style={{ pointerEvents: "none" }}
                >
                  {cluster.description}
                </text>
              </g>
            )}
          </g>
        ))}
      </g>
    </svg>
  )
}
