interface RasterPreviewOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  mimeType?: string;
  background?: string;
}

interface VideoPreviewOptions extends RasterPreviewOptions {
  seekSeconds?: number;
  fallbackTimeoutMs?: number;
}

interface MediaPreviewOptions {
  image: RasterPreviewOptions;
  video?: VideoPreviewOptions;
}

const DEFAULT_MIME_TYPE = "image/jpeg";
const DEFAULT_BACKGROUND = "#ffffff";

export const PROFILE_PHOTO_PREVIEW_OPTIONS: RasterPreviewOptions = {
  maxWidth: 720,
  maxHeight: 720,
  quality: 0.82,
};

export const PROJECT_IMAGE_PREVIEW_OPTIONS: RasterPreviewOptions = {
  maxWidth: 1280,
  maxHeight: 960,
  quality: 0.76,
};

export const PROJECT_VIDEO_PREVIEW_OPTIONS: VideoPreviewOptions = {
  maxWidth: 960,
  maxHeight: 540,
  quality: 0.76,
  seekSeconds: 0.12,
  fallbackTimeoutMs: 4000,
};

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("Unable to read file"));
    reader.readAsDataURL(file);
  });

const getTargetDimensions = (width: number, height: number, maxWidth: number, maxHeight: number) => {
  if (width <= 0 || height <= 0) return { width: 0, height: 0 };

  const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
};

const renderPreviewDataUrl = (
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  options: RasterPreviewOptions,
) => {
  const {
    maxWidth,
    maxHeight,
    quality,
    mimeType = DEFAULT_MIME_TYPE,
    background = DEFAULT_BACKGROUND,
  } = options;
  const target = getTargetDimensions(sourceWidth, sourceHeight, maxWidth, maxHeight);

  if (target.width === 0 || target.height === 0) return "";

  const canvas = document.createElement("canvas");
  canvas.width = target.width;
  canvas.height = target.height;

  const context = canvas.getContext("2d");
  if (!context) return "";

  context.fillStyle = background;
  context.fillRect(0, 0, target.width, target.height);
  context.drawImage(source, 0, 0, target.width, target.height);

  return canvas.toDataURL(mimeType, quality);
};

const loadImageElement = (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    const cleanup = () => URL.revokeObjectURL(objectUrl);

    image.onload = () => {
      cleanup();
      resolve(image);
    };

    image.onerror = () => {
      cleanup();
      reject(new Error("Unable to load image"));
    };

    image.decoding = "async";
    image.src = objectUrl;
  });

export const readImagePreviewDataUrl = async (file: File, options: RasterPreviewOptions) => {
  try {
    const image = await loadImageElement(file);
    const preview = renderPreviewDataUrl(
      image,
      image.naturalWidth || image.width,
      image.naturalHeight || image.height,
      options,
    );

    if (preview) return preview;
  } catch {
    // Fall back to the original file only if the browser fails to decode the image.
  }

  return readFileAsDataUrl(file);
};

export const readVideoPreviewImage = (file: File, options: VideoPreviewOptions = PROJECT_VIDEO_PREVIEW_OPTIONS) =>
  new Promise<string>((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement("video");
    let settled = false;
    let fallbackTimer: number | null = null;

    const finish = (preview: string) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(preview);
    };

    const cleanup = () => {
      if (fallbackTimer !== null) window.clearTimeout(fallbackTimer);
      video.pause();
      video.removeEventListener("error", handleError);
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("seeked", captureFrame);
      video.removeAttribute("src");
      URL.revokeObjectURL(objectUrl);
    };

    const captureFrame = () => {
      const width = video.videoWidth || 0;
      const height = video.videoHeight || 0;
      if (width === 0 || height === 0) {
        finish("");
        return;
      }

      try {
        finish(renderPreviewDataUrl(video, width, height, options));
      } catch {
        finish("");
      }
    };

    const handleError = () => finish("");

    const handleLoadedData = () => {
      if (settled || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
      captureFrame();
    };

    const handleLoadedMetadata = () => {
      if (settled) return;

      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      const defaultSeek = options.seekSeconds ?? 0.12;
      const safeTarget = duration > defaultSeek ? Math.min(defaultSeek, Math.max(duration / 4, 0.05)) : 0;

      if (safeTarget > 0) {
        try {
          video.currentTime = safeTarget;
          return;
        } catch {
          captureFrame();
          return;
        }
      }

      captureFrame();
    };

    video.addEventListener("error", handleError, { once: true });
    video.addEventListener("loadeddata", handleLoadedData);
    video.addEventListener("loadedmetadata", handleLoadedMetadata, { once: true });
    video.addEventListener("seeked", captureFrame);
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.src = objectUrl;
    video.load();

    fallbackTimer = window.setTimeout(() => finish(""), options.fallbackTimeoutMs ?? 4000);
  });

export const readMediaPreview = async (file: File, options: MediaPreviewOptions) => {
  if (file.type.startsWith("image/")) {
    return readImagePreviewDataUrl(file, options.image);
  }

  if (file.type.startsWith("video/")) {
    return readVideoPreviewImage(file, options.video ?? { ...options.image });
  }

  return "";
};
