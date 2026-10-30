declare module "jpeg-js" {
  export type RawImage<D> = { data: D; width: number; height: number };

  export function decode(
    data: ArrayLike<number> | ArrayBuffer,
    options?: {
      useTArray?: boolean;
      formatAsRGBA?: boolean;
      colorTransform?: boolean;
      tolerantDecoding?: boolean;
      maxResolutionInMP?: number;
      maxMemoryUsageInMB?: number;
    },
  ): RawImage<Uint8Array>;

  export function encode(
    image: RawImage<Uint8Array | Uint8ClampedArray>,
    quality?: number,
  ): RawImage<Uint8Array>;
}
