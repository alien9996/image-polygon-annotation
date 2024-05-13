import { ReactNode } from 'react'
import { AreaZoneType } from './area'

export type LayerAreaType = {
  id: string
  name: string
  isEdit: boolean
  areaZoneType: AreaZoneType
  component: ReactNode
}

export type PointsType = {
  layerId: string
  points: any
}

export type FlattenedPointsType = {
  layerId: string
  flattenedPoints: any
}

export type PositionType = {
  layerId: string
  position: any
}

export type IsMouseOverPointType = {
  layerId: string
  isMouseOverPoint: boolean
}

export type IsPolyCompleteType = {
  layerId: string
  isPolyComplete: boolean
}

export type PolygonAnnotationType = {
  points: Array<number[]>
  flattenedPoints?: number[]
  position: number[]
  isMouseOverPoint: boolean
  isPolyComplete: boolean
  id: string
  areaType: AreaZoneType
  isEdit: boolean
}

export type Size = {
  width: number
  height: number
}

export type AreaSettingModel = {
  id?: number
  name?: string
  description?: string
  imageUrl: string
  imageWith: number
  imageHeight: number
  annotationData: PolygonAnnotationType[]
}
