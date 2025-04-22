// 节点类型
export type EntityType = 'Person' | 'Company' | 'BankAccount'

// 关系类型
export type RelationType = 'Controls' | 'Owns' | 'TransfersTo' | 'Facilitates'

// 图节点结构
export interface GraphNode {
  id: string
  label: string
  type: EntityType
  data?: Record<string, any>
}

// 图边结构
export interface GraphEdge {
  id: string
  source: string
  target: string
  label: string
  type: RelationType
  data?: Record<string, any>
}
