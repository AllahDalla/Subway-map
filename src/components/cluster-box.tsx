"use client"

import { useState } from "react"

interface ClusterBoxProps {
  name: string
  color: string
  x: number
  y: number
  width: number
  height: number
  description?: string
}

export function ClusterBox({ name, color, x, y, width, height, description }: ClusterBoxProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div
      className="absolute pointer-events-auto transition-all duration-200"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: `${height}px`,
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        className="w-full h-full rounded-lg border-2 border-dashed"
        style={{ borderColor: color, backgroundColor: `${color}08` }}
      >
        <div
          className="px-2 py-1 text-xs font-semibold rounded-tl-lg rounded-br-lg inline-block"
          style={{ backgroundColor: color, color: "#fff" }}
        >
          {name}
        </div>
      </div>
      
      {showTooltip && description && (
        <div
          className="absolute z-50 px-3 py-2 text-xs font-medium text-white rounded-lg shadow-lg"
          style={{
            backgroundColor: color,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            minWidth: "200px",
          }}
        >
          {description}
        </div>
      )}
    </div>
  )
}
