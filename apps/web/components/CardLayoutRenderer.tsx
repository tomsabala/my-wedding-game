import type { CardLayout, CardElement, CardTextElement, CardImageElement } from '@repo/shared'

interface Props {
  layout: CardLayout
  className?: string
  style?: React.CSSProperties
}

// Reference card dimensions at design time (used to scale font sizes)
const REF_WIDTH = 390

export default function CardLayoutRenderer({ layout, className = '', style }: Props) {
  const { background, elements } = layout

  const bgStyle: React.CSSProperties = {}
  if (background.type === 'color' && background.color) {
    bgStyle.backgroundColor = background.color
  }

  return (
    <div
      className={`overflow-hidden ${className}`}
      style={{ ...bgStyle, ...style }}
    >
      {/* Background image layer */}
      {background.type === 'image' && background.imageUrl && (
        <BackgroundImage background={background} />
      )}

      {/* Elements */}
      {elements.map((el) =>
        el.type === 'text' ? (
          <TextElement key={el.id} el={el} />
        ) : (
          <ImageElement key={el.id} el={el} />
        ),
      )}
    </div>
  )
}

function BackgroundImage({ background }: { background: CardLayout['background'] }) {
  const zoom = background.imageZoom ?? 1
  const panX = background.imageX ?? 0.5
  const panY = background.imageY ?? 0.5

  // Translate so the focal point stays centered when zoomed
  const tx = (0.5 - panX) * 100
  const ty = (0.5 - panY) * 100

  return (
    <img
      src={background.imageUrl!}
      alt=""
      aria-hidden
      draggable={false}
      className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
      style={{ transform: `scale(${zoom}) translate(${tx}%, ${ty}%)`, transformOrigin: 'center' }}
    />
  )
}

function TextElement({ el }: { el: CardTextElement }) {
  const transform = el.rotation ? `rotate(${el.rotation}deg)` : undefined

  return (
    <div
      style={{
        position: 'absolute',
        left: `${el.x}%`,
        top: `${el.y}%`,
        width: `${el.width}%`,
        transform,
        transformOrigin: 'center center',
        fontSize: `${el.fontSize}px`,
        color: el.color,
        textAlign: el.align,
        fontWeight: el.bold ? 700 : 400,
        fontStyle: el.italic ? 'italic' : 'normal',
        lineHeight: 1.3,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        userSelect: 'none',
      }}
    >
      {el.text}
    </div>
  )
}

function ImageElement({ el }: { el: CardImageElement }) {
  const zoom = el.zoom ?? 1
  const panX = el.panX ?? 0.5
  const panY = el.panY ?? 0.5
  const tx = (0.5 - panX) * 100
  const ty = (0.5 - panY) * 100

  const wrapTransform = el.rotation ? `rotate(${el.rotation}deg)` : undefined

  return (
    <div
      style={{
        position: 'absolute',
        left: `${el.x}%`,
        top: `${el.y}%`,
        width: `${el.width}%`,
        height: `${el.height}%`,
        transform: wrapTransform,
        transformOrigin: 'center center',
        opacity: el.opacity,
        overflow: 'hidden',
      }}
    >
      <img
        src={el.url}
        alt=""
        aria-hidden
        draggable={false}
        className="w-full h-full object-cover pointer-events-none select-none"
        style={{ transform: `scale(${zoom}) translate(${tx}%, ${ty}%)`, transformOrigin: 'center' }}
      />
    </div>
  )
}
