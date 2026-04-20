declare module 'react-canvas-draw' {
  import { Component } from 'react'

  interface CanvasDrawProps {
    brushColor?: string
    brushRadius?: number
    lazyRadius?: number
    canvasWidth?: number
    canvasHeight?: number
    hideGrid?: boolean
    hideInterface?: boolean
    disabled?: boolean
    imgSrc?: string
    saveData?: string
    immediateLoading?: boolean
    catenaryColor?: string
    gridColor?: string
    backgroundColor?: string
    loadTimeOffset?: number
    brushRadiusMin?: number
    brushRadiusMax?: number
    hideGridX?: boolean
    hideGridY?: boolean
    enablePanAndZoom?: boolean
    mouseZoomFactor?: number
    zoomExtents?: { min: number; max: number }
    onChange?: (canvasData: string) => void
  }

  export default class CanvasDraw extends Component<CanvasDrawProps> {
    getSaveData(): string
    loadSaveData(saveData: string, immediate?: boolean): void
    getDataURL(fileType?: string, useBgImage?: boolean, backgroundColour?: string): string
    clear(): void
    undo(): void
    eraseAll(): void
    resetView(): void
  }
}
