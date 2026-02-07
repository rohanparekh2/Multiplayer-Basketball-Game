'use client'

import { useEffect, useRef } from 'react'
import { ShotRegions } from './ShotRegions'

interface SVGCourtProps {
  debug?: boolean
}

export function SVGCourt({ debug = false }: SVGCourtProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (!containerRef.current || !imgRef.current) return

    const container = containerRef.current
    const img = imgRef.current
    const parent = container.parentElement

    // #region agent log
    const logData = {
      containerWidth: container.offsetWidth,
      containerHeight: container.offsetHeight,
      containerAspectRatio: container.offsetWidth / container.offsetHeight,
      parentWidth: parent?.offsetWidth,
      parentHeight: parent?.offsetHeight,
      parentAspectRatio: parent ? parent.offsetWidth / parent.offsetHeight : null,
      imgNaturalWidth: img.naturalWidth,
      imgNaturalHeight: img.naturalHeight,
      imgAspectRatio: img.naturalWidth / img.naturalHeight,
      imgDisplayWidth: img.offsetWidth,
      imgDisplayHeight: img.offsetHeight,
      objectFit: window.getComputedStyle(img).objectFit,
      hasObjectCover: img.classList.contains('object-cover'),
      hasObjectContain: img.classList.contains('object-contain'),
      containerClasses: container.className,
      parentClasses: parent?.className,
    }
    fetch('http://127.0.0.1:7242/ingest/9e385bef-2f3f-458b-a86f-d3ed3bdb0205',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SVGCourt.tsx:30',message:'Image sizing check with parent',data:logData,timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
  }, [])

  const handleImageLoad = () => {
    if (!containerRef.current || !imgRef.current) return

    const container = containerRef.current
    const img = imgRef.current

    // #region agent log
    const logData = {
      containerWidth: container.offsetWidth,
      containerHeight: container.offsetHeight,
      imgNaturalWidth: img.naturalWidth,
      imgNaturalHeight: img.naturalHeight,
      imgDisplayWidth: img.offsetWidth,
      imgDisplayHeight: img.offsetHeight,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    }
    fetch('http://127.0.0.1:7242/ingest/9e385bef-2f3f-458b-a86f-d3ed3bdb0205',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SVGCourt.tsx:50',message:'Image loaded',data:logData,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
  }

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full flex items-center justify-center"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* #region agent log */}
      {typeof window !== 'undefined' && (() => {
        fetch('http://127.0.0.1:7242/ingest/9e385bef-2f3f-458b-a86f-d3ed3bdb0205',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SVGCourt.tsx:58',message:'SVGCourt render',data:{aspectRatio:'3/4',hasContainerRef:!!containerRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        return null;
      })()}
      {/* #endregion */}
      {/* Static court image */}
      <img
        ref={imgRef}
        src="/half_court.png"
        alt="Basketball half court"
        className="max-h-full max-w-full object-contain select-none pointer-events-none"
        draggable={false}
        onLoad={handleImageLoad}
      />

      {/* Interactive clickable regions */}
      <ShotRegions debug={debug} />
    </div>
  )
}
