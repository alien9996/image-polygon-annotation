/*
  React Polygon Annotation
  Author: Alien - https://gitlab.com/ptvung
  License: Alien
*/
import React, { useCallback, useEffect, useMemo, useRef, useState, cloneElement } from 'react'
import { Stage, Layer, Image } from 'react-konva'
import { v4 as uuid } from 'uuid'
import { AreaZoneConfig, AreaZoneType } from '../constants/area'
import { AreaSettingModel, LayerAreaType, PolygonAnnotationType, Size } from '../constants/types'
import { PolygonAnnotation } from '../components/PolygonAnnotation'
import useImage from '../hooks/useImage'
import { zoomStage } from '../utils'
import { CanvasConfig } from '../constants/canvas'
import { KonvaEventObject } from 'konva/lib/Node'
import findIndex from 'lodash/findIndex'
import filter from 'lodash/filter'
import Button from '../components/Button'
import '../css/area_setting.css';

type MultipleCanvasProps = {
  data?: AreaSettingModel
  onCancel: () => void
  onSave: (savedData: AreaSettingModel) => void
}

const IMAGE_NAME_LAYER = 'image'

export const MultipleCanvas = ({ data, onCancel, onSave }: MultipleCanvasProps) => {
  const { readFile, createImage } = useImage()

  const [image, setImage] = useState<any>()
  const [file, setFile] = useState<any>()
  const [size, setSize] = useState<Size>({ width: 0, height: 0 })
  const [initialData, setInitialData] = useState<AreaSettingModel | undefined>()

  const [areaIdActive, setAreaIdActive] = useState<string>()
  const [listLayerArea, setListLayerArea] = useState<LayerAreaType[]>([])
  const [refresh, setRefresh] = useState<string>(uuid())
  const [accessibility, setAccessibility] = useState({
    draw: true,
    drag: false,
    zoomOffset: CanvasConfig.zoomOffset,
    zoomLevel: CanvasConfig.zoomLevel,
    undo: false,
  })

  const _listLayerRefs = useRef<any[]>([])
  const _imageRef = useRef<any>(null)
  const _layerRef = useRef<any>(null)
  const _layerAreaRef = useRef<any>(null)
  const _stageRef = useRef<any>(null)

  const _listIdAreaLayerLock = useMemo((): string[] => {
    const listAreaLayerLock = filter(listLayerArea, { isEdit: false })
    return listAreaLayerLock.map((item: LayerAreaType) => item.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh, listLayerArea])

  const _onSelectAreaLayer = useCallback((id: string) => {
    if (!id) return
    _setIndex(id)
    setAreaIdActive(id)
    setRefresh(uuid())
  }, [])

  const _getCurrentCameraAreaSetting = useCallback(async () => {
    if (!data) return

    const { annotationData, imageWith, imageHeight, imageUrl } = data

    setInitialData(data)
    setSize({ width: imageWith, height: imageHeight })

    const element = new window.Image()
    element.width = imageWith
    element.height = imageHeight
    element.src = imageUrl

    setImage(element)
    _imageRef.current = element

    // initial layer area setting
    if (annotationData?.length === 0) return

    const listAreaInitial: LayerAreaType[] = []
    let lastId: string = ''

    annotationData?.forEach((element: PolygonAnnotationType, index: number) => {
      const { id, areaType, isEdit } = element
      if (annotationData?.length - 1 === index) lastId = id
      listAreaInitial.push({
        id: id,
        name: AreaZoneConfig[areaType].labelKey,
        isEdit,
        areaZoneType: areaType,
        component: (
          <PolygonAnnotation
            key={id}
            id={id}
            isEdit={isEdit}
            areaType={areaType}
            data={element}
            // @ts-ignore
            ref={(el: any) => (_listLayerRefs.current[id] = el)}
            onClick={() => _onSelectAreaLayer(id)}
          />
        ),
      })
    })
    setListLayerArea(listAreaInitial)
    setAreaIdActive(lastId)
    setRefresh(lastId)
  }, [_onSelectAreaLayer, data])

  useEffect(() => {
    if (!data) return
    _getCurrentCameraAreaSetting()
  }, [data, _getCurrentCameraAreaSetting])

  const _handleRemoveActive = (e: KonvaEventObject<any>) => {
    // deselect when clicked on empty area
    if (e.target.attrs.image) {
      setAreaIdActive(undefined)
    }
  }

  const _handleMouseDown = (e: any) => {
    // @ts-ignore
    const polyComplete = _listLayerRefs?.current[areaIdActive]?.handleMouseDown(e)
    if (polyComplete) {
      _handleRemoveActive(e)
    }
  }

  const _handleMouseMove = (e: any) => {
    // @ts-ignore
    _listLayerRefs?.current[areaIdActive]?.handleMouseMove(e)
  }

  const _undoCurrentLayerArea = () => {
    // @ts-ignore
    _listLayerRefs?.current[areaIdActive]?.undo()
  }

  const _resetCurrentLayerArea = (id?: string) => {
    const _id = id || areaIdActive
    // @ts-ignore
    _listLayerRefs?.current[_id]?.reset()
    setListLayerArea(listLayerArea.filter((f) => f.id !== _id))
  }

  const _deleteAll = () => {
    setAreaIdActive(undefined)
    setSize({ width: 0, height: 0 })
    setListLayerArea([])
    setImage(undefined)
    setFile(undefined)
    if (initialData)
      setInitialData({
        ...initialData,
        imageUrl: '',
      })
    _clearAll()
  }

  const _clearAll = () => {
    // const layers = _stageRef.current.getLayers()
    // layers.forEach((f: any) => {
    //   if (f.attrs.name !== IMAGE_NAME_LAYER) {
    //     f.remove()
    //     f.removeChildren()
    //     f.destroy()
    //   }
    // })
    setListLayerArea([])
  }

  const _getListRawData = (): PolygonAnnotationType[] => {
    const listRawData: PolygonAnnotationType[] = []
    listLayerArea.forEach((item: LayerAreaType) => {
      const { id } = item
      // @ts-ignore
      listRawData.push(_listLayerRefs?.current[id].getAllCurrentPolygonData())
    })
    return listRawData
  }

  const _onSave = async (): Promise<AreaSettingModel | null> => {

    if (!file) {
      alert('Image not found')
      return null
    }

    const annotationData: PolygonAnnotationType[] = _getListRawData()

    const savedData = {
      id: 1,
      imageUrl: file,
      imageWith: size.width,
      imageHeight: size.height,
      name: ``,
      description: ``,
      annotationData: annotationData,
    }
    setInitialData(savedData)
    onSave(savedData)
    return savedData
  }

  const _setIndex = (id: string) => {
    _layerAreaRef.current.children.forEach((group: any) => {
      if (group.getId() === id) {
        group.moveToTop()
      }
    })
  }

  const _uploadImage = () => {
    if (!_imageRef.current) {
      return
    }
    if (!_imageRef.current.files) {
      return
    }
    const file = _imageRef.current.files[0]
    setFile(file)
    readFile(file, async (reader) => {
      const _image = await createImage(reader?.result as string)
      const ratio = _image.width / _image.height
      setSize({
        width: CanvasConfig.widthStage,
        height: CanvasConfig.widthStage / ratio,
      })
      setImage(_image)
    })
  }

  const _onCancel = () => {
    onCancel?.()
  }

  const _onLockAreaById = useCallback(
    (areaId: string) => {
      const areActiveIndex = findIndex(listLayerArea, { id: areaId })
      if (areActiveIndex === -1) return
      const { isEdit, component } = listLayerArea[areActiveIndex]
      listLayerArea[areActiveIndex].isEdit = !isEdit
      // @ts-ignore
      listLayerArea[areActiveIndex].component = cloneElement(component, { isEdit: !isEdit }, null)
      setListLayerArea(listLayerArea)
      setRefresh(uuid())
    },
    [listLayerArea]
  )

  const _addAreaLayer = useCallback(
    (areaType: AreaZoneType) => {
      if (!image || !accessibility.draw) return
      const id = uuid()

      listLayerArea.push({
        id: id,
        name: AreaZoneConfig[areaType].labelKey,
        isEdit: true,
        areaZoneType: areaType,
        component: (
          <PolygonAnnotation
            key={id}
            id={id}
            isEdit={true}
            areaType={areaType}
            // @ts-ignore
            ref={(el: any) => (_listLayerRefs.current[id] = el)}
            onClick={() => _onSelectAreaLayer(id)}
          />
        ),
      })
      setListLayerArea(listLayerArea)
      setAreaIdActive(id)
      setAccessibility({ ...accessibility, draw: true, drag: false })
      setRefresh(id)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [image, listLayerArea]
  )

  const renderListLayerArea = useMemo(() => {
    return listLayerArea.map((item: LayerAreaType) => {
      return item.component
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listLayerArea, refresh])

  const renderButtonLayerArea = useMemo(() => {
    if (listLayerArea?.length === 0)
      return (
        <div className="flex justify-center items-center flex-1 flex-col mt-32">
          {/* <Layers color="disabled" sx={{ fontSize: 80 }} /> */}
          <br />
          <span className="text-trueGray-400">{"No data"}</span>
        </div>
      )

    return (
      <div>
        {listLayerArea.map((item: LayerAreaType, index: number) => {
          const { id } = item
          return (
            <div
              className={`info-list`}
              style={{
                backgroundColor: areaIdActive === id ? AreaZoneConfig[item.areaZoneType].fillColor : 'transparent',
              }}
              key={id}>
              <Button onClick={() => _onSelectAreaLayer(id)}>
                <div className={`info-tag`} style={{ backgroundColor: AreaZoneConfig[item.areaZoneType].strokeColor }}>
                  {index + 1}
                </div>
                <p>{item.name}</p>
              </Button>
              {areaIdActive === id && (
                <div style={{flexDirection: "row"}}>
                  <Button
                    className="info-delete"
                    onClick={(e) => {
                      _onLockAreaById(id)
                      e.stopPropagation()
                    }}>
                    {_listIdAreaLayerLock.includes(id) ? "Unlock" : "Lock"}
                  </Button>
                  <Button
                    className="info-delete"
                    onClick={(e) => {
                      setAreaIdActive(undefined)
                      _resetCurrentLayerArea(id)
                      e.stopPropagation()
                    }}>
                    {"Delete"}
                  </Button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listLayerArea, refresh, areaIdActive])

  const _numberTagOfType = useCallback(
    (type: AreaZoneType) => {
      return listLayerArea.filter((f) => f.areaZoneType === type).length
    },
    [listLayerArea]
  )

  const Tags = () => {
    return (
      <div className="grid grid-cols-4 gap-4 w-full">
        {Object.entries(AreaZoneConfig).map(([key, value]) => {
          return (
            <Button
              key={key}
              className={`tag`}
              style={{
                backgroundColor: value.fillColor,
                borderLeft: `4px solid ${value.strokeColor}`,
                textAlign: 'left',
                justifyContent: 'flex-start',
              }}
              onClick={() => _addAreaLayer(key as AreaZoneType)}>
              {value.labelKey} <span className="num-tag">{_numberTagOfType(key as AreaZoneType)}</span>
            </Button>
          )
        })}
      </div>
    )
  }

  const Accessibility = () => {
    if (!image) return null
    return (
      <>
        <Button className="acc-button acc-button-delete" onClick={_deleteAll}>
          {/* <DeleteOutline /> */}
          {"Delete"}
        </Button>
        <div className="acc-wrap">
          <Button
            className={`acc-button ${accessibility.draw ? 'active' : ''}`}
            onClick={() => setAccessibility({ ...accessibility, drag: false, draw: true })}>
            {/* <DrawIcon /> */}
            {"Draw"}
          </Button>
          <Button
            className={`acc-button ${accessibility.drag ? 'active' : ''}`}
            onClick={() => setAccessibility({ ...accessibility, draw: false, drag: true })}>
            {/* <HandIcon /> */}
            {"Hand"}
          </Button>
        </div>
        <div className="acc-wrap">
          <Button
            className="acc-button"
            onClick={() => {
              const zoomLevel = zoomStage(_stageRef.current, 1 + CanvasConfig.zoomOffset)
              setAccessibility({ ...accessibility, zoomLevel })
            }}>
            {/* <ZoomIn /> */}
            {"Zoom In"}
          </Button>
          <Button
            className="acc-button"
            onClick={() => {
              const zoomLevel = zoomStage(_stageRef.current, 1 - CanvasConfig.zoomOffset)
              setAccessibility({ ...accessibility, zoomLevel })
            }}>
            {/* <ZoomOut /> */}
            {"Zoom Out"}
          </Button>
        </div>
        <div className="acc-wrap">
          <Button
            className={`acc-button ${accessibility.zoomLevel !== CanvasConfig.zoomLevel ? 'show' : 'hide'}`}
            onClick={() => {
              setAccessibility({ ...accessibility, zoomLevel: CanvasConfig.zoomLevel })
              zoomStage(_stageRef.current, 1)
            }}>
            {/* <CloseIcon /> */}
            {"Close"}
          </Button>
          <Button className={`acc-button`} onClick={() => _undoCurrentLayerArea()}>
            {/* <Undo /> */}
            {"Undo"}
          </Button>
        </div>
      </>
    )
  }

  const NoImageTemplate = () => {
    if (image) return null
    return (
      <div className="no-image-wrap">
        <div className="mb-6 font-semibold text-trueGray-400 uppercase">{"No image"}</div>
        <Button className="control-btn save-btn btn-upload">
          {"Upload"}
          <input
            ref={_imageRef}
            className="upload-file"
            accept="image/png, image/jpg, image/jpeg, image/webp"
            type="file"
            onChange={_uploadImage}
          />
        </Button>
        <div className="mt-4 font-semibold text-trueGray-400">{"File type: PNG, JPG"}</div>
      </div>
    )
  }

  return (
    <div>
      <div className="multiple-canvas">
        <div className="column-canvas">
          <div className="stage-wrap">
            <Stage
              ref={_stageRef}
              width={size.width || 800}
              height={size.height || 450}
              draggable={accessibility.drag}
              onMouseMove={_handleMouseMove}
              onMouseDown={_handleMouseDown}>
              <Layer ref={_layerRef} name={IMAGE_NAME_LAYER}>
                <Image image={image} x={0} y={0} width={size.width} height={size.height} />
              </Layer>
              <Layer ref={_layerAreaRef}>{renderListLayerArea}</Layer>
            </Stage>
            <Accessibility />
            <NoImageTemplate />
          </div>
          <div className="wrap-button">
            <Tags />
          </div>
        </div>
        <div className="info-wrap">
          <div className="info-header">
            <span>{"Information"}</span>
          </div>
          {renderButtonLayerArea}
        </div>
      </div>
      <div style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
        <Button onClick={_onCancel}>
          {"Cancel"}
        </Button>
        <Button
          onClick={_onSave}>
          {"Save"}
        </Button>
      </div>
    </div>
  )
}
