/**
 * Tải Image Segmenter (person) từ MediaPipe để tách nền người.
 * Model: DeepLab v3 (PASCAL VOC) — class "person" dùng để composite.
 */
import { FilesetResolver, ImageSegmenter, DrawingUtils } from '@mediapipe/tasks-vision'

const WASM_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/image_segmenter/deeplab_v3/float32/1/deeplab_v3.tflite'

let segmenterPromise = null
let segmenterInstance = null

export async function getSegmenter() {
  if (segmenterPromise) return segmenterPromise
  segmenterPromise = (async () => {
    const vision = await FilesetResolver.forVisionTasks(WASM_BASE)
    const segmenter = await ImageSegmenter.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: MODEL_URL,
        delegate: 'CPU' // Tránh lỗi "WebGL2RenderingContext not provided"
      },
      runningMode: 'VIDEO',
      outputConfidenceMasks: true,
      outputCategoryMask: false
    })
    segmenterInstance = segmenter
    return segmenter
  })()
  return segmenterPromise
}

/** Gọi khi tắt camera / unmount để lần bật lại tạo segmenter mới (tránh lỗi không load nền). */
export function releaseSegmenter() {
  if (segmenterInstance) {
    try {
      segmenterInstance.close()
    } catch (_) {}
    segmenterInstance = null
  }
  segmenterPromise = null
}

export function createDrawingUtils(ctx) {
  return new DrawingUtils(ctx)
}

/**
 * DeepLab v3 PASCAL VOC: 21 classes, "person" = index 15
 * Model 2 lớp: masks[0] = background, masks[1] = person
 */
export function getPersonMaskIndex(result) {
  const masks = result.confidenceMasks
  if (!masks || masks.length === 0) return -1
  if (masks.length === 1) return 0
  if (masks.length === 2) return 1 // person thường là index 1
  if (masks.length >= 21) return 15 // PASCAL VOC person
  return 0
}
