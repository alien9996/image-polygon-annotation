/*
  React Polygon Annotation
  Author: Alien - https://gitlab.com/ptvung
  License: Alien
*/
import React, { Ref, forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { Line, Circle, Group } from 'react-konva'
import { dragBoundFunc, getRelativePointerPosition } from '../utils'
import { AreaZoneConfig, AreaZoneType } from '../constants/area'
import { PolygonAnnotationType } from '../constants/types'

type PolygonAnnotationProps = {
  id: string
  areaType: AreaZoneType
  isEdit: boolean
  data?: PolygonAnnotationType
  onClick?: (e: any) => void
}

export const PolygonAnnotation = forwardRef((props: PolygonAnnotationProps, ref: Ref<any>) => {
  const { id, data, areaType, isEdit = false, onClick } = props

  const _vertexRadius = 6

  const [stage, setStage] = useState<any>()

  const [points, setPoints] = useState<Array<number[]>>([])
  const [flattenedPoints, setFlattenedPoints] = useState<number[]>()
  const [position, setPosition] = useState<number[]>([0, 0])
  const [isMouseOverPoint, setMouseOverPoint] = useState<boolean>(false)
  const [isPolyComplete, setPolyComplete] = useState<boolean>(false)

  useEffect(() => {
    if (!data) return
    if (data?.points) setPoints(data?.points)
    if (data?.position) setPosition(data?.position)
    if (data?.flattenedPoints) setFlattenedPoints(data?.flattenedPoints)
    if (data?.isMouseOverPoint) setMouseOverPoint(data?.isMouseOverPoint)
    if (data?.isPolyComplete) setPolyComplete(data?.isPolyComplete)
  }, [data])

  const _getMousePos = (stage: any) => {
    const point = getRelativePointerPosition(stage)
    return [point.x, point.y]
  }

  //drawing begins when mousedown event fires.
  const _handleMouseDown = (e: any) => {
    let polyComplete = isPolyComplete
    if (isPolyComplete) return polyComplete
    const stage = e.target.getStage()
    const mousePos = _getMousePos(stage)
    if (isMouseOverPoint && points.length >= 3) {
      polyComplete = true
      setPolyComplete(true)
    } else {
      isEdit && setPoints([...points, mousePos])
    }
    return polyComplete
  }

  const _handleMouseMove = (e: any) => {
    const stage = e.target.getStage()
    const mousePos = _getMousePos(stage)
    isEdit && setPosition(mousePos)
  }

  const _handleMouseOverStartPoint = (e: any) => {
    if (isPolyComplete || points.length < 3) return
    e.target.scale({ x: 3, y: 3 })
    setMouseOverPoint(true)
  }

  const _handleMouseOutStartPoint = (e: any) => {
    e.target.scale({ x: 1, y: 1 })
    setMouseOverPoint(false)
  }
  const _handlePointDragMove = (e: any) => {
    const stage = e.target.getStage()
    const index = e.target.index - 1
    const pos = [e.target._lastPos.x, e.target._lastPos.y]
    if (pos[0] < 0) pos[0] = 0
    if (pos[1] < 0) pos[1] = 0
    if (pos[0] > stage.width()) pos[0] = stage.width()
    if (pos[1] > stage.height()) pos[1] = stage.height()
    const newData = [...points.slice(0, index), pos, ...points.slice(index + 1)]
    isEdit && setPoints(newData)
  }

  const _handleGroupDragEnd = (e: any) => {
    if (e.target.name() === 'polygon') {
      let result: any[] = []
      let copyPoints = [...points]
      copyPoints.map((point) => result.push([point[0] + e.target.x(), point[1] + e.target.y()]))
      e.target.position({ x: 0, y: 0 })
      isEdit && setPoints(result)
    }
  }

  useEffect(() => {
    setFlattenedPoints(points.concat(isPolyComplete ? [] : position).reduce((a: any, b: any) => a.concat(b), []))
  }, [points, isPolyComplete, position])

  const _handleGroupMouseOver = (e: any) => {
    if (!isPolyComplete) return
    e.target.getStage().container().style.cursor = 'move'
    setStage(e.target.getStage())
  }

  const _handleGroupMouseOut = (e: any) => {
    e.target.getStage().container().style.cursor = 'default'
  }

  // const [minMaxX, setMinMaxX] = useState([0, 0]) //min and max in x axis
  // const [minMaxY, setMinMaxY] = useState([0, 0]) //min and max in y axis

  // const _handleGroupDragStart = () => {
  //   let arrX = points.map((p: any) => p[0])
  //   let arrY = points.map((p: any) => p[1])

  //   setMinMaxX(minMax(arrX))
  //   setMinMaxY(minMax(arrY))
  // }

  // const _groupDragBound = (pos: any) => {
  //   let { x, y } = pos
  //   console.log('🔥🔥🔥 - PolygonAnnotation - pos:', pos)
  //   const sw = stage.width()
  //   const sh = stage.height()
  //   if (minMaxY[0] + y < 0) y = -1 * minMaxY[0]
  //   if (minMaxX[0] + x < 0) x = -1 * minMaxX[0]
  //   if (minMaxY[1] + y > sh) y = sh - minMaxY[1]
  //   if (minMaxX[1] + x > sw) x = sw - minMaxX[1]
  //   return { x, y }
  // }

  const _undo = () => {
    setPoints(points.slice(0, -1))
    setPolyComplete(false)
    setPosition(points[points.length - 1])
  }
  const _reset = () => {
    setPoints([])
    setPolyComplete(false)
  }

  const _getAllCurrentPolygonData = (): PolygonAnnotationType => {
    return {
      points,
      position,
      flattenedPoints,
      isMouseOverPoint,
      isPolyComplete,
      id,
      areaType,
      isEdit,
    }
  }

  useImperativeHandle(ref, () => ({
    handleMouseDown(data: any): boolean | undefined {
      return _handleMouseDown(data)
    },
    handleMouseMove(data: any): void {
      _handleMouseMove(data)
    },
    getPoints(): Array<number[]> {
      return points
    },
    getAllCurrentPolygonData(): PolygonAnnotationType {
      return _getAllCurrentPolygonData()
    },
    undo(): void {
      _undo()
    },
    reset(): void {
      _reset()
    },
  }))

  return (
    <Group
      id={id}
      name="polygon"
      draggable={isPolyComplete}
      // onDragStart={_handleGroupDragStart}
      onDragEnd={_handleGroupDragEnd}
      // dragBoundFunc={_groupDragBound}
      // listening={isEdit}
      onMouseOver={_handleGroupMouseOver}
      onClick={onClick}
      onDragStart={onClick}
      onMouseOut={_handleGroupMouseOut}>
      <Line
        points={flattenedPoints}
        // listening={false}
        stroke={AreaZoneConfig[areaType].strokeColor}
        strokeWidth={3}
        closed={isPolyComplete}
        fill={AreaZoneConfig[areaType].fillColor}
      />
      {points.map((point: number[], index: number) => {
        const x = point[0] - _vertexRadius / 2
        const y = point[1] - _vertexRadius / 2
        const startPointAttr =
          index === 0
            ? {
                hitStrokeWidth: 12,
                onMouseOver: _handleMouseOverStartPoint,
                onMouseOut: _handleMouseOutStartPoint,
              }
            : null
        return (
          <Circle
            key={index}
            x={x}
            y={y}
            radius={_vertexRadius}
            listening={isEdit}
            fill="#FFF"
            stroke={AreaZoneConfig[areaType].strokeColor}
            strokeWidth={2}
            draggable
            onDragMove={_handlePointDragMove}
            dragBoundFunc={(pos) => dragBoundFunc(stage.width(), stage.height(), _vertexRadius, pos)}
            {...startPointAttr}
          />
        )
      })}
    </Group>
  )
})
