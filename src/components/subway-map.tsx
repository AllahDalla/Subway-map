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
import { ClusterBackground } from "./cluster-background"
// import servicesData from "../assets/subway-map-services.json";

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

// Initial service topology - Manual positioning with circular cluster arrangements
const initialNodes: Node[] = [
  // Main Engine (far left)
  { id: "eng", type: "engine", position: { x: 50, y: 600 }, data: { label: "Engine" } },

  // MQs - message queues (vertical line next to engine)
  { id: "mq1", type: "mq", position: { x: 700, y: 250 }, data: { label: "mq1", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "mq2", type: "mq", position: { x: 700, y: 400 }, data: { label: "mq2", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "mq3", type: "mq", position: { x: 700, y: 550 }, data: { label: "mq3", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "mq4", type: "mq", position: { x: 700, y: 700 }, data: { label: "mq4", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "mq5", type: "mq", position: { x: 700, y: 850 }, data: { label: "mq5", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "mq6", type: "mq", position: { x: 700, y: 1000 }, data: { label: "mq6", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "mq7", type: "mq", position: { x: 700, y: 1150 }, data: { label: "mq7", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "mq8", type: "mq", position: { x: 700, y: 1300 }, data: { label: "mq8", color: COLORS.GLOBAL, status: "healthy" } },

  // Director Servers (next to MQs) two for inbound and outbound data flows
  { id: "route-in", type: "Router", position: { x: 1300, y: 400 }, data: { label: "Director Inbound" } },
  { id: "route-out", type: "Router", position: { x: 1300, y: 1100 }, data: { label: "Director Outbound" } },


  // Kafka/confluent (between director servers)
  { id: "kc1", type: "service", position: { x: 1900, y: -150 }, data: { label: "K/C1", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "kc2", type: "service", position: { x: 1900, y: -50 }, data: { label: "K/C2", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "kc3", type: "service", position: { x: 1900, y: 50 }, data: { label: "K/C3", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "kc4", type: "service", position: { x: 1900, y: 150 }, data: { label: "K/C4", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "kc5", type: "service", position: { x: 1900, y: 250 }, data: { label: "K/C5", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "kc6", type: "service", position: { x: 1900, y: 350 }, data: { label: "K/C6", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "kc7", type: "service", position: { x: 1900, y: 450 }, data: { label: "K/C7", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "kc8", type: "service", position: { x: 1900, y: 550 }, data: { label: "K/C8", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "kc9", type: "service", position: { x: 1900, y: 650 }, data: { label: "K/C9", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "kc10", type: "service", position: { x: 1900, y: 750 }, data: { label: "K/C10", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "kc11", type: "service", position: { x: 1900, y: 850 }, data: { label: "K/C11", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "kc12", type: "service", position: { x: 1900, y: 950 }, data: { label: "K/C12", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "kc13", type: "service", position: { x: 1900, y: 1050 }, data: { label: "K/C13", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "kc14", type: "service", position: { x: 1900, y: 1150 }, data: { label: "K/C14", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "kc15", type: "service", position: { x: 1900, y: 1250 }, data: { label: "K/C15", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "kc16", type: "service", position: { x: 1900, y: 1350 }, data: { label: "K/C16", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "kc17", type: "service", position: { x: 1900, y: 1450 }, data: { label: "K/C17", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "kc18", type: "service", position: { x: 1900, y: 1550 }, data: { label: "K/C18", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "kc19", type: "service", position: { x: 1900, y: 1650 }, data: { label: "K/C19", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "kc20", type: "service", position: { x: 1900, y: 1750 }, data: { label: "K/C20", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "kc21", type: "service", position: { x: 1900, y: 1850 }, data: { label: "K/C21", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "kc22", type: "service", position: { x: 1900, y: 1950 }, data: { label: "K/C22", color: COLORS.GLOBAL, status: "healthy" } },


  //Standard APIs (inbound data flow)
  { id: "api1", type: "service", position: { x: 4800, y: -500 }, data: { label: "api1", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "api2", type: "service", position: { x: 4800, y: -400 }, data: { label: "api2", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "api3", type: "service", position: { x: 4800, y: -300 }, data: { label: "api3", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "api4", type: "service", position: { x: 4800, y: -200 }, data: { label: "api4", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "api5", type: "service", position: { x: 4800, y: -100 }, data: { label: "api5", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "api6", type: "service", position: { x: 4800, y: 0 }, data: { label: "api6", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "api7", type: "service", position: { x: 4800, y: 100 }, data: { label: "api7", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "api8", type: "service", position: { x: 4800, y: 200 }, data: { label: "api8", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "api9", type: "service", position: { x: 4800, y: 300 }, data: { label: "api9", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "api10", type: "service", position: { x: 4800, y: 400 }, data: { label: "api10", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "api11", type: "service", position: { x: 4800, y: 500 }, data: { label: "api11", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "api12", type: "service", position: { x: 4800, y: 600 }, data: { label: "api12", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "api13", type: "service", position: { x: 4800, y: 700 }, data: { label: "api13", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "api14", type: "service", position: { x: 4800, y: 800 }, data: { label: "api14", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "api15", type: "service", position: { x: 4800, y: 900 }, data: { label: "api15", color: COLORS.GLOBAL, status: "healthy" } },


  //Data Loader

  { id: "dl1", type: "service", position: { x: 2800, y: 800 }, data: { label: "dl1", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "dl2", type: "service", position: { x: 2800, y: 900 }, data: { label: "dl2", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "dl3", type: "service", position: { x: 2800, y: 1000 }, data: { label: "dl3", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "dl4", type: "service", position: { x: 2800, y: 1100 }, data: { label: "dl4", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "dl5", type: "service", position: { x: 2800, y: 1200 }, data: { label: "dl5", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "dl6", type: "service", position: { x: 2800, y: 1300 }, data: { label: "dl6", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "dl7", type: "service", position: { x: 2800, y: 1400 }, data: { label: "dl7", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "dl8", type: "service", position: { x: 2800, y: 1500 }, data: { label: "dl8", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "dl9", type: "service", position: { x: 2800, y: 1600 }, data: { label: "dl9", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "dl10", type: "service", position: { x: 2800, y: 1700 }, data: { label: "dl10", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "dl11", type: "service", position: { x: 2800, y: 1800 }, data: { label: "dl11", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "dl12", type: "service", position: { x: 2800, y: 1900 }, data: { label: "dl12", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "dl13", type: "service", position: { x: 2800, y: 2000 }, data: { label: "dl13", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "dl14", type: "service", position: { x: 2800, y: 2100 }, data: { label: "dl14", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "dl15", type: "service", position: { x: 2800, y: 2200 }, data: { label: "dl15", color: COLORS.GLOBAL, status: "healthy" } },


  // Databases (Postgres)
  { id: "db1", type: "engine", position: { x: 3500, y: 800 }, data: { label: "db1", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "db2", type: "engine", position: { x: 3500, y: 1100 }, data: { label: "db2", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "db3", type: "engine", position: { x: 3500, y: 1400 }, data: { label: "db3", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "db4", type: "engine", position: { x: 3500, y: 1700 }, data: { label: "db4", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "db5", type: "engine", position: { x: 3500, y: 2000 }, data: { label: "db5", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "db6", type: "engine", position: { x: 3500, y: 2300 }, data: { label: "db6", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "db7", type: "engine", position: { x: 3500, y: 2600 }, data: { label: "db7", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "db8", type: "engine", position: { x: 3500, y: 2900 }, data: { label: "db8", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "db9", type: "engine", position: { x: 3500, y: 3200 }, data: { label: "db9", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "db10", type: "engine", position: { x: 3500, y: 3500 }, data: { label: "db10", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "db11", type: "engine", position: { x: 3500, y: 3800 }, data: { label: "db11", color: COLORS.GLOBAL, status: "healthy" } },
  { id: "db12", type: "engine", position: { x: 3500, y: 4100 }, data: { label: "db12", color: COLORS.GLOBAL, status: "healthy" } },


  
  // Global Services (top - horizontal line)
  // { id: "G", type: "Router", position: { x: 520, y: 700 }, data: { label: "G", color: COLORS.GLOBAL, status: "healthy" } },
  // { id: "7", type: "service", position: { x: 700, y: 570 }, data: { label: "7", color: COLORS.GLOBAL, status: "healthy" } },
  // { id: "S-global", type: "service", position: { x: 960, y: 655 }, data: { label: "S", color: COLORS.GLOBAL, status: "healthy" } },
  
  // // Workstation Group (circular arrangement - upper middle area)
  // { id: "53-work", type: "service", position: { x: 700, y: -150 }, data: { label: "53", color: COLORS.WORKSTATION, status: "healthy" } },
  // { id: "N-work", type: "service", position: { x: 850, y: -150 }, data: { label: "N", color: COLORS.WORKSTATION, status: "healthy" } },
  // { id: "PX", type: "service", position: { x: 1000, y: -150 }, data: { label: "PX", color: COLORS.WORKSTATION, status: "healthy" } },
  // { id: "A-work", type: "service", position: { x: 1000, y: 0 }, data: { label: "A", color: COLORS.WORKSTATION, status: "healthy" } },
  // { id: "S-work", type: "service", position: { x: 1000, y: 150 }, data: { label: "S", color: COLORS.WORKSTATION, status: "healthy" } },
  // { id: "C-work", type: "service", position: { x: 1150, y: 50 }, data: { label: "C", color: COLORS.WORKSTATION, status: "healthy" } },
  // { id: "D-work", type: "service", position: { x: 1150, y: 250 }, data: { label: "D", color: COLORS.WORKSTATION, status: "healthy" } },
  
  // // COB (orange - single node)
  // { id: "U-cob", type: "service", position: { x: 660, y: 450 }, data: { label: "U", color: COLORS.COB, status: "healthy" } },
  
  // // // FXL Group (circular - middle area)
  // { id: "A-fxl", type: "service", position: { x: 750, y: 900 }, data: { label: "A", color: COLORS.FXL, status: "healthy" } },
  // { id: "W-fxl", type: "service", position: { x: 900, y: 900 }, data: { label: "W", color: COLORS.FXL, status: "healthy" } },
  // { id: "S-fxl", type: "service", position: { x: 1050, y: 800 }, data: { label: "S", color: COLORS.FXL, status: "healthy" } },
  // { id: "F-fxl", type: "service", position: { x: 1200, y: 900 }, data: { label: "F", color: COLORS.FXL, status: "healthy" } },
  // { id: "I-fxl", type: "service", position: { x: 1350, y: 800 }, data: { label: "I", color: COLORS.FXL, status: "healthy" } },
  // { id: "D-fxl", type: "service", position: { x: 1350, y: 1000 }, data: { label: "D", color: COLORS.FXL, status: "healthy" } },
  
  // // // IMPACT (circular - bottom left)
  // { id: "Q-impact", type: "service", position: { x: 750, y: 1200 }, data: { label: "Q", color: COLORS.IMPACT, status: "healthy" } },
  // { id: "SP-impact", type: "service", position: { x: 900, y: 1350 }, data: { label: "SP", color: COLORS.IMPACT, status: "healthy" } },
  // { id: "TP-impact", type: "service", position: { x: 1050, y: 1200 }, data: { label: "TP", color: COLORS.IMPACT, status: "healthy" } },
  // { id: "UI-impact", type: "service", position: { x: 750, y: 1500 }, data: { label: "UI", color: COLORS.IMPACT, status: "healthy" } },
  // { id: "D-impact", type: "service", position: { x: 1050, y: 1500 }, data: { label: "D", color: COLORS.IMPACT, status: "healthy" } },
  
  // // // GLOSS (circular - bottom middle)
  // { id: "Q-gloss", type: "service", position: { x: 750, y: 1800 }, data: { label: "Q", color: COLORS.IMPACT, status: "healthy" } },
  // { id: "SP-gloss", type: "service", position: { x: 900, y: 1950 }, data: { label: "SP", color: COLORS.IMPACT, status: "healthy" } },
  // { id: "TP-gloss", type: "service", position: { x: 1050, y: 1800 }, data: { label: "TP", color: COLORS.IMPACT, status: "healthy" } },
  // { id: "UI-gloss", type: "service", position: { x: 750, y: 2100 }, data: { label: "UI", color: COLORS.IMPACT, status: "healthy" } },
  // { id: "D-gloss", type: "service", position: { x: 1050, y: 2100 }, data: { label: "D", color: COLORS.IMPACT, status: "healthy" } },
 
  // // // Revport (circular - bottom right)
  // { id: "A0", type: "service", position: { x: 750, y: 2400 }, data: { label: "A0", color: COLORS.IMPACT, status: "healthy" } },
  // { id: "W-report", type: "service", position: { x: 900, y: 2400 }, data: { label: "W", color: COLORS.IMPACT, status: "healthy" } },
  // { id: "A1", type: "service", position: { x: 1050, y: 2300 }, data: { label: "A1", color: COLORS.IMPACT, status: "healthy" } },
  // { id: "A2", type: "service", position: { x: 1050, y: 2550 }, data: { label: "A2", color: COLORS.IMPACT, status: "healthy" } },
  // { id: "RJ", type: "service", position: { x: 1200, y: 2300 }, data: { label: "RJ", color: COLORS.IMPACT, status: "healthy" } },
  // { id: "JR", type: "service", position: { x: 1200, y: 2550 }, data: { label: "JR", color: COLORS.IMPACT, status: "healthy" } },
  // { id: "D-report", type: "service", position: { x: 1350, y: 2400 }, data: { label: "D", color: COLORS.IMPACT, status: "healthy" } },
  // { id: "S3-report", type: "service", position: { x: 1500, y: 2400 }, data: { label: "S3", color: COLORS.IMPACT, status: "healthy" } },
  
  // // // EISL Files (circular - top right)
  // { id: "F-files", type: "service", position: { x: 1350, y: -750 }, data: { label: "F", color: COLORS.EISL_FILES, status: "healthy" } },
  // { id: "NS", type: "service", position: { x: 1500, y: -750 }, data: { label: "NS", color: COLORS.EISL_FILES, status: "healthy" } },
  // { id: "D-files", type: "service", position: { x: 1500, y: -600 }, data: { label: "D", color: COLORS.EISL_FILES, status: "healthy" } },
  // { id: "I-files", type: "service", position: { x: 1350, y: -450 }, data: { label: "I", color: COLORS.EISL_FILES, status: "healthy" } },
  // { id: "J-files", type: "service", position: { x: 1650, y: -450 }, data: { label: "J", color: COLORS.EISL_FILES, status: "healthy" } },
  
  // // // EISL APIs (circular - right side)
  // { id: "N-api", type: "service", position: { x: 2000, y: 550 }, data: { label: "N", color: COLORS.EISL_API, status: "healthy" } },
  // { id: "M-api", type: "service", position: { x: 2150, y: 600 }, data: { label: "M", color: COLORS.EISL_API, status: "healthy" } },
  // { id: "C-api", type: "service", position: { x: 2150, y: 450 }, data: { label: "C", color: COLORS.EISL_API, status: "healthy" } },
  // { id: "D-api", type: "service", position: { x: 2300, y: 450 }, data: { label: "D", color: COLORS.EISL_API, status: "healthy" } },
  
  // // // EISL Messaging (circular - lower right)
  // { id: "Q-msg", type: "service", position: { x: 2000, y: 1200 }, data: { label: "Q", color: COLORS.EISL_MSG, status: "healthy" } },
  // { id: "N-msg", type: "service", position: { x: 2150, y: 1050 }, data: { label: "N", color: COLORS.EISL_MSG, status: "healthy" } },
  // { id: "X-msg", type: "service", position: { x: 2300, y: 1050 }, data: { label: "X", color: COLORS.EISL_MSG, status: "healthy" } },
  // { id: "A-msg", type: "service", position: { x: 2150, y: 1200 }, data: { label: "A", color: COLORS.EISL_MSG, status: "healthy" } },
  // { id: "S-msg", type: "service", position: { x: 2300, y: 1200 }, data: { label: "S", color: COLORS.EISL_MSG, status: "healthy" } },
  // { id: "C-msg", type: "service", position: { x: 2150, y: 1350 }, data: { label: "C", color: COLORS.EISL_MSG, status: "healthy" } },
  // { id: "D-msg", type: "service", position: { x: 2300, y: 1350 }, data: { label: "D", color: COLORS.EISL_MSG, status: "healthy" } },
  // { id: "ES", type: "service", position: { x: 2450, y: 1350 }, data: { label: "ES", color: COLORS.EISL_MSG, status: "healthy" } },
  // { id: "K-msg", type: "service", position: { x: 2700, y: 1200 }, data: { label: "K", color: COLORS.EISL_MSG, status: "healthy" } },
  
  // // // CARMA (circular - far right)
  // { id: "IM", type: "service", position: { x: 2900, y: -100 }, data: { label: "IM", color: COLORS.CARMA, status: "healthy" } },
  // { id: "CX", type: "service", position: { x: 3050, y: 0 }, data: { label: "CX", color: COLORS.CARMA, status: "healthy" } },
  // { id: "EQ", type: "service", position: { x: 3200, y: 0 }, data: { label: "EQ", color: COLORS.CARMA, status: "healthy" } },
  // { id: "FL", type: "service", position: { x: 3350, y: 0 }, data: { label: "FL", color: COLORS.CARMA, status: "healthy" } },
  // { id: "S3-carma", type: "service", position: { x: 3350, y: 150 }, data: { label: "S3", color: COLORS.CARMA, status: "healthy" } },
  // { id: "G-carma", type: "service", position: { x: 2900, y: 250 }, data: { label: "G", color: COLORS.CARMA, status: "healthy" } },
  // { id: "FQ", type: "service", position: { x: 3200, y: 250 }, data: { label: "FQ", color: COLORS.CARMA, status: "healthy" } },
  // { id: "QY", type: "service", position: { x: 3050, y: 400 }, data: { label: "QY", color: COLORS.CARMA, status: "healthy" } },
  
]

const INBOUND = "#10b981"  // Green
const OUTBOUND = "#ef4444" // Red

// Connections - Inbound (green) and Outbound (red)
const initialEdges: Edge[] = [
  // INBOUND FLOW (Green) - Left to Right
  // MQ → Engine
  { id: "e-mq1-eng", source: "mq1", target: "eng", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: INBOUND, strokeWidth: 3 } },
  { id: "e-mq2-eng", source: "mq2", target: "eng", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: INBOUND, strokeWidth: 3 } },
  { id: "e-mq3-eng", source: "mq3", target: "eng", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: INBOUND, strokeWidth: 3 } },
  { id: "e-mq4-eng", source: "mq4", target: "eng", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: INBOUND, strokeWidth: 3 } },
  { id: "e-mq5-eng", source: "mq5", target: "eng", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: INBOUND, strokeWidth: 3 } },
  { id: "e-mq6-eng", source: "mq6", target: "eng", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: INBOUND, strokeWidth: 3 } },
  { id: "e-mq7-eng", source: "mq7", target: "eng", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: INBOUND, strokeWidth: 3 } },
  { id: "e-mq8-eng", source: "mq8", target: "eng", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: INBOUND, strokeWidth: 3 } },
  
  // Director Inbound → MQ
  { id: "e-din-mq1", source: "route-in", target: "mq1", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: INBOUND, strokeWidth: 3 } },
  { id: "e-din-mq2", source: "route-in", target: "mq2", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: INBOUND, strokeWidth: 3 } },
  { id: "e-din-mq3", source: "route-in", target: "mq3", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: INBOUND, strokeWidth: 3 } },
  { id: "e-din-mq4", source: "route-in", target: "mq4", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: INBOUND, strokeWidth: 3 } },
  { id: "e-din-mq5", source: "route-in", target: "mq5", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: INBOUND, strokeWidth: 3 } },
  { id: "e-din-mq6", source: "route-in", target: "mq6", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: INBOUND, strokeWidth: 3 } },
  { id: "e-din-mq7", source: "route-in", target: "mq7", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: INBOUND, strokeWidth: 3 } },
  { id: "e-din-mq8", source: "route-in", target: "mq8", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: INBOUND, strokeWidth: 3 } },
  
  // Kafka/Confluent → Director Inbound
  { id: "e-kc1-din", source: "kc1", target: "route-in", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: INBOUND, strokeWidth: 3 } },
  { id: "e-kc2-din", source: "kc2", target: "route-in", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: INBOUND, strokeWidth: 3 } },
  { id: "e-kc3-din", source: "kc3", target: "route-in", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: INBOUND, strokeWidth: 3 } },
  { id: "e-kc4-din", source: "kc4", target: "route-in", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: INBOUND, strokeWidth: 3 } },
  { id: "e-kc5-din", source: "kc5", target: "route-in", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: INBOUND, strokeWidth: 3 } },
  { id: "e-kc6-din", source: "kc6", target: "route-in", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: INBOUND, strokeWidth: 3 } },
  { id: "e-kc7-din", source: "kc7", target: "route-in", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: INBOUND, strokeWidth: 3 } },
  { id: "e-kc8-din", source: "kc8", target: "route-in", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: INBOUND, strokeWidth: 3 } },
  { id: "e-kc9-din", source: "kc9", target: "route-in", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: INBOUND, strokeWidth: 3 } },
  { id: "e-kc10-din", source: "kc10", target: "route-in", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: INBOUND, strokeWidth: 3 } },
  { id: "e-kc11-din", source: "kc11", target: "route-in", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: INBOUND, strokeWidth: 3 } },
  { id: "e-kc12-din", source: "kc12", target: "route-in", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: INBOUND, strokeWidth: 3 } },
  { id: "e-kc13-din", source: "kc13", target: "route-in", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: INBOUND, strokeWidth: 3 } },
  { id: "e-kc14-din", source: "kc14", target: "route-in", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: INBOUND, strokeWidth: 3 } },
  { id: "e-kc15-din", source: "kc15", target: "route-in", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: INBOUND, strokeWidth: 3 } },
  
  // APIs → Kafka/Confluent (matching indices)
  { id: "e-api1-kc1", source: "api1", target: "kc1", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: INBOUND, strokeWidth: 3 } },
  { id: "e-api2-kc2", source: "api2", target: "kc2", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: INBOUND, strokeWidth: 3 } },
  { id: "e-api3-kc3", source: "api3", target: "kc3", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: INBOUND, strokeWidth: 3 } },
  { id: "e-api4-kc4", source: "api4", target: "kc4", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: INBOUND, strokeWidth: 3 } },
  { id: "e-api5-kc5", source: "api5", target: "kc5", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: INBOUND, strokeWidth: 3 } },
  { id: "e-api6-kc6", source: "api6", target: "kc6", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: INBOUND, strokeWidth: 3 } },
  { id: "e-api7-kc7", source: "api7", target: "kc7", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: INBOUND, strokeWidth: 3 } },
  { id: "e-api8-kc8", source: "api8", target: "kc8", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: INBOUND, strokeWidth: 3 } },
  { id: "e-api9-kc9", source: "api9", target: "kc9", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: INBOUND, strokeWidth: 3 } },
  { id: "e-api10-kc10", source: "api10", target: "kc10", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: INBOUND, strokeWidth: 3 } },
  { id: "e-api11-kc11", source: "api11", target: "kc11", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: INBOUND, strokeWidth: 3 } },
  { id: "e-api12-kc12", source: "api12", target: "kc12", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: INBOUND, strokeWidth: 3 } },
  { id: "e-api13-kc13", source: "api13", target: "kc13", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: INBOUND, strokeWidth: 3 } },
  { id: "e-api14-kc14", source: "api14", target: "kc14", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: INBOUND, strokeWidth: 3 } },
  { id: "e-api15-kc15", source: "api15", target: "kc15", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: INBOUND, strokeWidth: 3 } },
  
  // OUTBOUND FLOW (Red) - Right to Left (reverse path)
  // Engine → MQ
  { id: "e-eng-mq1-out", source: "eng", target: "mq1", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-eng-mq2-out", source: "eng", target: "mq2", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-eng-mq3-out", source: "eng", target: "mq3", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-eng-mq4-out", source: "eng", target: "mq4", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-eng-mq5-out", source: "eng", target: "mq5", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-eng-mq6-out", source: "eng", target: "mq6", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-eng-mq7-out", source: "eng", target: "mq7", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-eng-mq8-out", source: "eng", target: "mq8", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  
  // MQ → Director Outbound
  { id: "e-mq1-dout", source: "mq1", target: "route-out", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-mq2-dout", source: "mq2", target: "route-out", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-mq3-dout", source: "mq3", target: "route-out", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-mq4-dout", source: "mq4", target: "route-out", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-mq5-dout", source: "mq5", target: "route-out", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-mq6-dout", source: "mq6", target: "route-out", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-mq7-dout", source: "mq7", target: "route-out", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-mq8-dout", source: "mq8", target: "route-out", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  
  // Director Outbound → Kafka/Confluent
  { id: "e-dout-kc1", source: "route-out", target: "kc1", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-dout-kc2", source: "route-out", target: "kc2", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-dout-kc3", source: "route-out", target: "kc3", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-dout-kc4", source: "route-out", target: "kc4", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-dout-kc5", source: "route-out", target: "kc5", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-dout-kc6", source: "route-out", target: "kc6", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-dout-kc7", source: "route-out", target: "kc7", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-dout-kc8", source: "route-out", target: "kc8", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-dout-kc9", source: "route-out", target: "kc9", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-dout-kc10", source: "route-out", target: "kc10", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-dout-kc11", source: "route-out", target: "kc11", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-dout-kc12", source: "route-out", target: "kc12", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-dout-kc13", source: "route-out", target: "kc13", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-dout-kc14", source: "route-out", target: "kc14", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-dout-kc15", source: "route-out", target: "kc15", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  
  // Kafka/Confluent → DataLoaders
  { id: "e-kc1-dl1", source: "kc1", target: "dl1", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-kc2-dl2", source: "kc2", target: "dl2", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-kc3-dl3", source: "kc3", target: "dl3", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-kc4-dl4", source: "kc4", target: "dl4", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-kc5-dl5", source: "kc5", target: "dl5", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-kc6-dl6", source: "kc6", target: "dl6", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-kc7-dl7", source: "kc7", target: "dl7", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-kc8-dl8", source: "kc8", target: "dl8", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-kc9-dl9", source: "kc9", target: "dl9", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-kc10-dl10", source: "kc10", target: "dl10", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-kc11-dl11", source: "kc11", target: "dl11", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-kc12-dl12", source: "kc12", target: "dl12", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-kc13-dl13", source: "kc13", target: "dl13", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-kc14-dl14", source: "kc14", target: "dl14", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-kc15-dl15", source: "kc15", target: "dl15", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  
  // DataLoaders → Databases (distribute across 12 DBs)
  { id: "e-dl1-db1", source: "dl1", target: "db1", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-dl2-db2", source: "dl2", target: "db2", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-dl3-db3", source: "dl3", target: "db3", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-dl4-db4", source: "dl4", target: "db4", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-dl5-db5", source: "dl5", target: "db5", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-dl6-db6", source: "dl6", target: "db6", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-dl7-db7", source: "dl7", target: "db7", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-dl8-db8", source: "dl8", target: "db8", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-dl9-db9", source: "dl9", target: "db9", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-dl10-db10", source: "dl10", target: "db10", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-dl11-db11", source: "dl11", target: "db11", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-dl12-db12", source: "dl12", target: "db12", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  
  // Databases → APIs (return path)
  { id: "e-db1-api1", source: "db1", target: "api1", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-db2-api2", source: "db2", target: "api2", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-db3-api3", source: "db3", target: "api3", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-db4-api4", source: "db4", target: "api4", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-db5-api5", source: "db5", target: "api5", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-db6-api6", source: "db6", target: "api6", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-db7-api7", source: "db7", target: "api7", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-db8-api8", source: "db8", target: "api8", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-db9-api9", source: "db9", target: "api9", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-db10-api10", source: "db10", target: "api10", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-db11-api11", source: "db11", target: "api11", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },
  { id: "e-db12-api12", source: "db12", target: "api12", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: OUTBOUND, strokeWidth: 3 } },

  
  // // Global line (blue)
  // { id: "e-g-7", source: "G", target: "7", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.GLOBAL, strokeWidth: 3 } },
  // { id: "e-7-s", source: "7", target: "S-global", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.GLOBAL, strokeWidth: 3 } },
  
  // // Workstation connections (pink/brown)
  // { id: "e-g-53", source: "G", target: "53-work", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.WORKSTATION, strokeWidth: 3 } },
  // { id: "e-s3-n", source: "53-work", target: "N-work", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.WORKSTATION, strokeWidth: 3 } },
  // { id: "e-n-px1", source: "N-work", target: "PX", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.WORKSTATION, strokeWidth: 3 } },
  // { id: "e-n-px2", source: "PX", target: "A-work", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.WORKSTATION, strokeWidth: 3 } },
  // { id: "e-n-px3", source: "PX", target: "S-global", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.WORKSTATION, strokeWidth: 3 } },
  // { id: "e-s3-a", source: "S3-work", target: "A-work", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.WORKSTATION, strokeWidth: 3 } },
  // { id: "e-a-c", source: "A-work", target: "C-work", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.WORKSTATION, strokeWidth: 3 } },
  // { id: "e-c-s", source: "C-work", target: "S-work", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.WORKSTATION, strokeWidth: 3 } },
  // { id: "e-s-d", source: "S-work", target: "D-work", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.WORKSTATION, strokeWidth: 3 } },
  // { id: "e-7-s-work", source: "7", target: "S-work", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.WORKSTATION, strokeWidth: 3 } },
  
  // // FXL line (yellow)
  // { id: "e-s-a-fxl", source: "S-fxl", target: "A-fxl", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.FXL, strokeWidth: 3 } },
  // { id: "e-a-w-fxl", source: "A-fxl", target: "W-fxl", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.FXL, strokeWidth: 3 } },
  // { id: "e-s-f-fxl", source: "S-fxl", target: "F-fxl", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.FXL, strokeWidth: 3 } },
  // { id: "e-f-i-fxl", source: "F-fxl", target: "I-fxl", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.FXL, strokeWidth: 3 } },
  // { id: "e-i-d-fxl", source: "I-fxl", target: "D-fxl", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.FXL, strokeWidth: 3 } },
  // { id: "e-i-q-EISL-MESS", source: "I-fxl", target: "Q-msg", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.FXL, strokeWidth: 3 } },
  // { id: "e-i-n-API", source: "I-fxl", target: "N-api", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.FXL, strokeWidth: 3 } },
  // { id: "e-i-m-API", source: "I-fxl", target: "M-api", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.FXL, strokeWidth: 3 } },


  
  // // EISL APIs (green)
  // { id: "e-c-d-api", source: "C-api", target: "D-api", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.EISL_API, strokeWidth: 3 } },
  // { id: "e-N-C-api", source: "M-api", target: "C-api", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.EISL_API, strokeWidth: 3 } },
  // { id: "e-n-m-api", source: "N-api", target: "M-api", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.EISL_API, strokeWidth: 3 } },
  // { id: "e-M-QY-api", source: "M-api", target: "QY", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.EISL_API, strokeWidth: 3 } },
  // { id: "e-M-CX-api", source: "M-api", target: "CX", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.EISL_API, strokeWidth: 3 } },
  // { id: "e-n-S-api", source: "S-global", target: "N-api", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.EISL_API, strokeWidth: 3 } },

  
  // // CARMA (cyan)
  // { id: "e-im-cx", source: "IM", target: "CX", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.CARMA, strokeWidth: 3 } },
  // { id: "e-cx-eq", source: "CX", target: "EQ", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.CARMA, strokeWidth: 3 } },
  // { id: "e-eq-fl", source: "EQ", target: "FL", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.CARMA, strokeWidth: 3 } },
  // { id: "e-fl-s3", source: "FL", target: "S3-carma", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.CARMA, strokeWidth: 3 } },
  // { id: "e-cx-g-carma", source: "CX", target: "G-carma", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.CARMA, strokeWidth: 3 } },
  // { id: "e-g-fq", source: "G-carma", target: "FQ", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.CARMA, strokeWidth: 3 } },
  // { id: "e-fq-qy", source: "FQ", target: "QY", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.CARMA, strokeWidth: 3 } },
  
  // // EISL Messaging (purple)
  // { id: "e-n-x-msg", source: "N-msg", target: "X-msg", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.EISL_MSG, strokeWidth: 3 } },
  // { id: "e-x-q-msg", source: "X-msg", target: "Q-msg", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.EISL_MSG, strokeWidth: 3 } },
  // { id: "e-q-a-msg", source: "Q-msg", target: "A-msg", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.EISL_MSG, strokeWidth: 3 } },
  // { id: "e-a-s-msg", source: "A-msg", target: "S-msg", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.EISL_MSG, strokeWidth: 3 } },
  // { id: "e-s-k-msg", source: "S-msg", target: "K-msg", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.EISL_MSG, strokeWidth: 3 } },
  // { id: "e-k-u-msg", source: "K-msg", target: "ubs", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.EISL_MSG, strokeWidth: 3 } },
  // { id: "e-a-c-msg", source: "A-msg", target: "C-msg", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.EISL_MSG, strokeWidth: 3 } },
  // { id: "e-c-d-msg", source: "C-msg", target: "D-msg", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.EISL_MSG, strokeWidth: 3 } },
  // { id: "e-d-es-msg", source: "D-msg", target: "ES", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.EISL_MSG, strokeWidth: 3 } },
  
  // // EISL Files (blue)
  // { id: "e-f-ns-files", source: "F-files", target: "NS", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.EISL_FILES, strokeWidth: 3 } },
  // { id: "e-ns-d-files", source: "NS", target: "D-files", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.EISL_FILES, strokeWidth: 3 } },
  // { id: "e-d-i-files", source: "D-files", target: "I-files", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.EISL_FILES, strokeWidth: 3 } },
  // { id: "e-d-j-files", source: "D-files", target: "J-files", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.EISL_FILES, strokeWidth: 3 } },
  
  // // IMPACT (light blue)
  // { id: "e-q-sp-impact", source: "Q-impact", target: "SP-impact", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.IMPACT, strokeWidth: 3 } },
  // { id: "e-sp-tp-impact", source: "SP-impact", target: "TP-impact", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.IMPACT, strokeWidth: 3 } },
  // { id: "e-sp-ui-impact", source: "SP-impact", target: "UI-impact", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.IMPACT, strokeWidth: 3 } },
  // { id: "e-ui-d-impact", source: "UI-impact", target: "D-impact", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.IMPACT, strokeWidth: 3 } },
  
  // // GLOSS (light blue)
  // { id: "e-q-sp-gloss", source: "Q-gloss", target: "SP-gloss", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.IMPACT, strokeWidth: 3 } },
  // { id: "e-sp-tp-gloss", source: "SP-gloss", target: "TP-gloss", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.IMPACT, strokeWidth: 3 } },
  // { id: "e-sp-ui-gloss", source: "SP-gloss", target: "UI-gloss", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.IMPACT, strokeWidth: 3 } },
  // { id: "e-ui-d-gloss", source: "UI-gloss", target: "D-gloss", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.IMPACT, strokeWidth: 3 } },
  
  // // Revport (light blue)
  // { id: "e-a0-w-report", source: "A0", target: "W-report", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.IMPACT, strokeWidth: 3 } },
  // { id: "e-w-a1-report", source: "W-report", target: "A1", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.IMPACT, strokeWidth: 3 } },
  // { id: "e-a1-rj-report", source: "A1", target: "RJ", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.IMPACT, strokeWidth: 3 } },
  // { id: "e-rj-d-report", source: "RJ", target: "D-report", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.IMPACT, strokeWidth: 3 } },
  // { id: "e-d-s3-report", source: "D-report", target: "S3-report", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.IMPACT, strokeWidth: 3 } },
  // { id: "e-w-a2-report", source: "W-report", target: "A2", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.IMPACT, strokeWidth: 3 } },
  // { id: "e-a2-jr-report", source: "A2", target: "JR", type: ConnectionLineType.SmoothStep, animated: true, style: { stroke: COLORS.IMPACT, strokeWidth: 3 } },
]

// Dagre disabled - using manual positioning
const layoutedNodes = initialNodes
const layoutedEdges = initialEdges

// Calculate cluster bounding boxes
const calculateClusterBox = (nodeIds: string[], padding: number = 60) => {
  const clusterNodes = layoutedNodes.filter(n => nodeIds.includes(n.id))
  if (clusterNodes.length === 0) return { x: 0, y: 0, width: 0, height: 0 }
  
  const getNodeDimensions = (node: Node) => {
    if (node.id === "ubs") return { width: 250, height: 200 }
    if (node.type === "Router") return { width: 200, height: 100 }
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

// Cluster definitions for background boxes
const clusters = [
  { name: "MQ Queues", color: "#9333ea", ...calculateClusterBox(["mq1", "mq2", "mq3", "mq4", "mq5", "mq6", "mq7", "mq8"], 60), description: "Message Queues" },
  { name: "Kafka/Confluent", color: "#ea580c", ...calculateClusterBox(["kc1", "kc2", "kc3", "kc4", "kc5", "kc6", "kc7", "kc8", "kc9", "kc10", "kc11", "kc12", "kc13", "kc14", "kc15", "kc16", "kc17", "kc18", "kc19", "kc20", "kc21", "kc22"], 60), description: "Confluent/Kafka Topics" },
  { name: "APIs", color: "#3b82f6", ...calculateClusterBox(["api1", "api2", "api3", "api4", "api5", "api6", "api7", "api8", "api9", "api10", "api11", "api12", "api13", "api14", "api15"], 60), description: "Standard APIs" },
  { name: "DataLoaders", color: "#eab308", ...calculateClusterBox(["dl1", "dl2", "dl3", "dl4", "dl5", "dl6", "dl7", "dl8", "dl9", "dl10", "dl11", "dl12", "dl13", "dl14", "dl15"], 60), description: "Data Loaders" },
  { name: "Databases", color: "#000000", ...calculateClusterBox(["db1", "db2", "db3", "db4", "db5", "db6", "db7", "db8", "db9", "db10", "db11", "db12"], 60), description: "PostgreSQL Databases" },
]



export function SubwayMap() {
  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes)
  const [edges, , onEdgesChange] = useEdgesState(layoutedEdges)

  // Randomly change node statuses
  const randomizeStatuses = useCallback(() => {
    setNodes((nds) =>
      nds.map((node) => {
        // Don't change status for engine or router nodes
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
          // Don't change status for engine or router nodes
          if (node.type === "engine" || node.type === "Router") return node
          
          // 20% chance to change status
          if (Math.random() < 0.2) {
            const weights = [0.7, 0.2, 0.1] // Mostly healthy
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
      <div className="absolute left-6 top-6 z-10 flex flex-col gap-3">
        <div className="rounded-lg border border-border bg-card/95 p-4 shadow-lg backdrop-blur-sm">
          <h1 className="text-balance text-xl font-semibold text-foreground">Integrated Platform — Subway Map</h1>
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
          <h3 className="text-sm font-semibold text-foreground mb-2">Data Flow</h3>
          <div className="flex flex-col gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5" style={{ backgroundColor: INBOUND }} />
              <span className="text-muted-foreground">Inbound (Green)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5" style={{ backgroundColor: OUTBOUND }} />
              <span className="text-muted-foreground">Outbound (Red)</span>
            </div>
          </div>
        </div>
        
        <div className="rounded-lg border border-border bg-card/95 p-3 shadow-lg backdrop-blur-sm">
          <h3 className="text-sm font-semibold text-foreground mb-3">Account Domain Services</h3>
          <div className="flex flex-col gap-2 text-xs">
            <div>
              <span className="font-semibold text-foreground">Core Nodes:</span>
              <div className="ml-3 flex flex-col gap-0.5 mt-1">
                <span className="text-muted-foreground">• Engine - Central processing hub</span>
                <span className="text-muted-foreground">• Director Inbound - Orchestrates inbound data</span>
                <span className="text-muted-foreground">• Director Outbound - Orchestrates outbound data</span>
              </div>
            </div>
            <div>
              <span className="font-semibold text-foreground">Service Groups:</span>
              <div className="ml-3 flex flex-col gap-0.5 mt-1">
                <span className="text-muted-foreground">• 15 APIs (api1-api15)</span>
                <span className="text-muted-foreground">• 22 Kafka/Confluent topics (kc1-kc22)</span>
                <span className="text-muted-foreground">• 8 MQ queues (mq1-mq8)</span>
                <span className="text-muted-foreground">• 15 DataLoaders (dl1-dl15)</span>
                <span className="text-muted-foreground">• 12 Databases (db1-db12)</span>
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
