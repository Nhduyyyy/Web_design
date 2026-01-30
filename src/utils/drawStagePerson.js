/**
 * Vẽ nền ảnh + người (từ video, dùng mask tách nền) lên canvas 2D.
 * Dùng chung cho FaceMaskAR và TryRoleExperience.
 */
export function drawBackgroundWithMask(ctx, canvas, video, bgImage, confidenceMask) {
  const w = canvas.width
  const h = canvas.height
  if (!w || !h) return

  const imgAspect = bgImage.width / bgImage.height
  const canvasAspect = w / h
  let sw, sh, sx, sy
  if (imgAspect > canvasAspect) {
    sh = bgImage.height
    sw = bgImage.height * canvasAspect
    sx = (bgImage.width - sw) / 2
    sy = 0
  } else {
    sw = bgImage.width
    sh = bgImage.width / canvasAspect
    sx = 0
    sy = (bgImage.height - sh) / 2
  }
  ctx.drawImage(bgImage, sx, sy, sw, sh, 0, 0, w, h)

  let floatArr
  try {
    floatArr = confidenceMask.getAsFloat32Array()
  } catch (_) {
    return
  }
  const mw = confidenceMask.width
  const mh = confidenceMask.height
  if (!floatArr || !mw || !mh) return

  const personCanvas = document.createElement('canvas')
  personCanvas.width = w
  personCanvas.height = h
  const pCtx = personCanvas.getContext('2d')
  pCtx.drawImage(video, 0, 0, w, h)
  const imageData = pCtx.getImageData(0, 0, w, h)
  const data = imageData.data

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      const mx = Math.floor((x / w) * mw)
      const my = Math.floor((y / h) * mh)
      const mi = Math.min(my * mw + mx, floatArr.length - 1)
      const alpha = Math.max(0, Math.min(1, floatArr[mi]))
      data[i + 3] = Math.round(alpha * 255)
    }
  }
  pCtx.putImageData(imageData, 0, 0)
  ctx.drawImage(personCanvas, 0, 0, w, h)
}
