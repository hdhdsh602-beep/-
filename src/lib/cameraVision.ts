export interface PredictionBox {
  class: string;
  score: number;
  bbox: [number, number, number, number];
}

export type OcrVariant = 'balanced' | 'sharp' | 'zoom';

export const SMART_FRAME_INTERVAL_MS = 180;
export const LIVE_OCR_INTERVAL_MS = 1800;
export const TEXT_CONFIDENCE_THRESHOLD = 36;
export const OCR_LANGUAGES = 'eng+ara';
export const MAX_RADAR_OBJECTS = 4;
export const STABLE_OBJECT_HITS = 2;
export const OBJECT_MEMORY_TTL_MS = 9000;
export const CENTER_SCAN_RATIO = 0.58;
export const CENTER_POINT_HIT_RADIUS_PX = 34;
export const CENTER_FOCUS_LOCK_MS = 520;
export const FOCUS_PROGRESS_STEP_MS = 52;

export const BODYPIX_PART_LABELS: Record<number, 'face' | 'arm' | 'hand' | 'leg' | 'foot'> = {
  0: 'face',
  1: 'face',
  2: 'arm',
  3: 'arm',
  4: 'arm',
  5: 'arm',
  6: 'hand',
  7: 'hand',
  8: 'arm',
  9: 'arm',
  10: 'arm',
  11: 'arm',
  12: 'hand',
  13: 'hand',
  14: 'leg',
  15: 'leg',
  16: 'leg',
  17: 'leg',
  18: 'foot',
  19: 'foot',
  20: 'leg',
  21: 'leg',
  22: 'leg',
  23: 'leg'
};

export const BODY_PART_PRIORITY: Record<string, number> = {
  hand: 5,
  face: 4,
  foot: 3,
  leg: 2,
  arm: 1
};

export const normalizeOcrText = (raw: string) => String(raw || '')
  .replace(/[|]+/g, 'I')
  .replace(/[“”]/g, '"')
  .replace(/[‘’]/g, "'")
  .replace(/\s+/g, ' ')
  .trim();

export const hasTranslatableText = (text: string) => /[a-zA-Z\u0600-\u06FF]{2,}/.test(text) && text.replace(/[^a-zA-Z\u0600-\u06FF]/g, '').length >= 3;

export const buildOcrCanvasVariant = (video: HTMLVideoElement, variant: OcrVariant): HTMLCanvasElement | null => {
  const videoWidth = video.videoWidth || 640;
  const videoHeight = video.videoHeight || 480;
  const sourceCrop = variant === 'zoom' ? 0.78 : 1;
  const sourceW = Math.floor(videoWidth * sourceCrop);
  const sourceH = Math.floor(videoHeight * sourceCrop);
  const sourceX = Math.floor((videoWidth - sourceW) / 2);
  const sourceY = Math.floor((videoHeight - sourceH) / 2);
  const longestSide = variant === 'zoom' ? 980 : 860;
  const scale = Math.min(1.6, longestSide / Math.max(sourceW, sourceH));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(360, Math.floor(sourceW * scale));
  canvas.height = Math.max(260, Math.floor(sourceH * scale));
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return null;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.filter = variant === 'sharp'
    ? 'grayscale(1) contrast(1.75) brightness(1.08) saturate(0)'
    : variant === 'zoom'
      ? 'grayscale(1) contrast(1.45) brightness(1.12)'
      : 'grayscale(1) contrast(1.28) brightness(1.05)';
  ctx.drawImage(video, sourceX, sourceY, sourceW, sourceH, 0, 0, canvas.width, canvas.height);
  return canvas;
};

export const recognizeBestTextFromVideo = async (video: HTMLVideoElement) => {
  const Tesseract = (window as any).Tesseract;
  if (!Tesseract?.recognize) return null;

  const variants: OcrVariant[] = ['balanced', 'sharp', 'zoom'];
  let best: { text: string; confidence: number; variant: string } | null = null;

  for (const variant of variants) {
    const canvas = buildOcrCanvasVariant(video, variant);
    if (!canvas) continue;
    const { data } = await Tesseract.recognize(canvas, OCR_LANGUAGES, {
      tessedit_pageseg_mode: variant === 'zoom' ? '6' : '11',
      preserve_interword_spaces: '1'
    });
    const text = normalizeOcrText(data?.text || '');
    const confidence = Number(data?.confidence || 0);
    if (hasTranslatableText(text) && (!best || confidence + text.length * 0.08 > best.confidence + best.text.length * 0.08)) {
      best = { text, confidence, variant };
    }
    if (best && best.confidence >= 72 && best.text.length > 8) break;
  }

  return best;
};

export const getStablePredictions = (
  detections: Array<PredictionBox & { pointHitsBox?: boolean }>,
  now: number,
  memory: Record<string, { hits: number; lastSeen: number; score: number }>,
  accuracyThreshold: number
) => {
  Object.keys(memory).forEach((key) => {
    if (now - memory[key].lastSeen > OBJECT_MEMORY_TTL_MS) delete memory[key];
  });

  detections.forEach((d) => {
    const key = d.class;
    const prev = memory[key];
    memory[key] = {
      hits: prev ? Math.min(8, prev.hits + 1) : 1,
      lastSeen: now,
      score: Math.max(prev?.score || 0, d.score || 0)
    };
  });

  return detections
    .map((d) => ({ ...d, stabilityHits: memory[d.class]?.hits || 1 }))
    .filter((d) => (d.pointHitsBox && d.score >= accuracyThreshold) || d.stabilityHits >= STABLE_OBJECT_HITS || d.score >= accuracyThreshold + 0.16);
};
