import { fromByteArray, toByteArray } from "base64-js";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { decode, encode } from "jpeg-js";
import { analyzeRgba, buildSampleCut, type Analysis } from "../shared/grading.js";

export type CapturedPhoto = {
  uri: string;
  analysis: Analysis;
};

const MAX_EDGE = 480;

export async function capturePhoto(source: "camera" | "library"): Promise<CapturedPhoto | null> {
  if (source === "camera") {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      throw new Error("Allow camera access to photograph the ribeye.");
    }
  }
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ["images"],
    quality: 0.9,
    exif: false,
  };
  const result =
    source === "camera"
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled || result.assets.length === 0) {
    return null;
  }
  const asset = result.assets[0];
  const width = asset.width || MAX_EDGE;
  const height = asset.height || MAX_EDGE;
  const context = ImageManipulator.manipulate(asset.uri, {
    maxWidth: MAX_EDGE * 2,
    maxHeight: MAX_EDGE * 2,
  });
  const longest = Math.max(width, height);
  if (longest > MAX_EDGE) {
    const scale = MAX_EDGE / longest;
    context.resize({
      width: Math.max(1, Math.round(width * scale)),
      height: Math.max(1, Math.round(height * scale)),
    });
  }
  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({
    base64: true,
    compress: 0.85,
    format: SaveFormat.JPEG,
  });
  if (!saved.base64) {
    throw new Error("The photo could not be read.");
  }
  const decoded = decode(toByteArray(saved.base64), { useTArray: true, formatAsRGBA: true });
  return { uri: saved.uri, analysis: analyzeRgba(decoded.data) };
}

export function sampleCut(fatRatio = 0.055): CapturedPhoto {
  const sample = buildSampleCut(fatRatio);
  const jpeg = encode({ data: sample.data, width: sample.width, height: sample.height }, 88);
  return {
    uri: `data:image/jpeg;base64,${fromByteArray(jpeg.data)}`,
    analysis: analyzeRgba(sample.data),
  };
}
