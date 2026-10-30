import { analyzeRgba, buildSampleCut, type Analysis } from "../shared/grading.js";

export type CapturedPhoto = {
  analysis: Analysis;
  dataUrl: string;
};

export function captureSample(fatRatio = 0.055): CapturedPhoto {
  const sample = buildSampleCut(fatRatio);
  const canvas = document.createElement("canvas");
  canvas.width = sample.width;
  canvas.height = sample.height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("This browser could not build the sample cut.");
  }
  const image = context.createImageData(sample.width, sample.height);
  image.data.set(sample.data);
  context.putImageData(image, 0, 0);
  return {
    analysis: analyzeRgba(sample.data),
    dataUrl: canvas.toDataURL("image/jpeg", 0.72),
  };
}

export function captureFile(file: File): Promise<CapturedPhoto> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const maxEdge = 480;
      const scale = Math.min(1, maxEdge / Math.max(image.width, image.height));
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) {
        URL.revokeObjectURL(url);
        reject(new Error("This browser could not read the photo."));
        return;
      }
      context.drawImage(image, 0, 0, width, height);
      const pixels = context.getImageData(0, 0, width, height).data;
      URL.revokeObjectURL(url);
      resolve({
        analysis: analyzeRgba(pixels),
        dataUrl: canvas.toDataURL("image/jpeg", 0.72),
      });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That photo could not be opened."));
    };
    image.src = url;
  });
}
