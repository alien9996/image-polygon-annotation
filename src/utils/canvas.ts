export const getAvaragePoint = (points: any) => {
  let totalX = 0
  let totalY = 0
  for (let i = 0; i < points.length; i += 2) {
    totalX += points[i]
    totalY += points[i + 1]
  }
  return {
    x: totalX / (points.length / 2),
    y: totalY / (points.length / 2),
  }
}

export const getDistance = (node1: any, node2: any) => {
  let diffX = Math.abs(node1[0] - node2[0])
  let diffY = Math.abs(node1[1] - node2[1])
  const distaneInPixel: any = Math.sqrt(diffX * diffX + diffY * diffY)
  return Number.parseFloat(distaneInPixel).toFixed(2)
}

export const dragBoundFunc = (stageWidth: any, stageHeight: any, vertexRadius: any, pos: any) => {
  let x = pos.x
  let y = pos.y
  if (pos.x + vertexRadius > stageWidth) x = stageWidth
  if (pos.x - vertexRadius < 0) x = 0
  if (pos.y + vertexRadius > stageHeight) y = stageHeight
  if (pos.y - vertexRadius < 0) y = 0
  return { x, y }
}

export const minMax = (points: any) => {
  return points.reduce((acc: any, val: any) => {
    acc[0] = acc[0] === undefined || val < acc[0] ? val : acc[0]
    acc[1] = acc[1] === undefined || val > acc[1] ? val : acc[1]
    return acc
  }, [])
}

export function limitAttributes(stage: any, newAttrs: any) {
  const box = stage.findOne('Image').getClientRect()
  const minX = -box.width + stage.width() / 2
  const maxX = stage.width() / 2

  const x = Math.max(minX, Math.min(newAttrs.x, maxX))

  const minY = -box.height + stage.height() / 2
  const maxY = stage.height() / 2

  const y = Math.max(minY, Math.min(newAttrs.y, maxY))

  const scale = Math.max(0.05, newAttrs.scale)

  return { x, y, scale }
}

export function zoomStage(stage: any, scaleBy: any) {
  if (scaleBy === 1) {
    stage.to({
      x: 0,
      y: 0,
      scaleX: scaleBy,
      scaleY: scaleBy,
      duration: 0.1,
    })
    return scaleBy
  }
  const oldScale = stage.scaleX()

  const pos = {
    x: stage.width() / 2,
    y: stage.height() / 2,
  }
  const mousePointTo = {
    x: pos.x / oldScale - stage.x() / oldScale,
    y: pos.y / oldScale - stage.y() / oldScale,
  }

  const newScale = Math.max(0.05, oldScale * scaleBy)

  const newPos = {
    x: -(mousePointTo.x - pos.x / newScale) * newScale,
    y: -(mousePointTo.y - pos.y / newScale) * newScale,
  }

  const newAttrs = limitAttributes(stage, { ...newPos, scale: newScale })

  stage.to({
    x: newAttrs.x,
    y: newAttrs.y,
    scaleX: newAttrs.scale,
    scaleY: newAttrs.scale,
    duration: 0.1,
  })
  return newScale
}

export function getRelativePointerPosition(node: any) {
  // the function will return pointer position relative to the passed node
  const transform = node.getAbsoluteTransform().copy()
  // to detect relative position we need to invert transform
  transform.invert()

  // get pointer (say mouse or touch) position
  const pos = node.getStage().getPointerPosition()

  // now we find relative point
  return transform.point(pos)
}
