export interface Point {
  x: number
  y: number
}

export function toSvg(point: Point): Point {
  // Identity for now, but single choke point for future camera/zoom
  return { x: point.x, y: point.y }
}

export function fromSvg(point: Point): Point {
  return { x: point.x, y: point.y }
}

