// src/backend/services/cloudinaryService.ts
import { UploadApiResponse, UploadApiErrorResponse } from "cloudinary";
import cloudinary from "../config/cloudinary";

export type CloudinaryUploadInput = {
  buffer: Buffer;
  originalName: string;
  mimetype: string;
  folder?: string;
  typeOverride?: "image" | "video";
};

export type CloudinaryUploadResult = {
  url: string | null;
  public_id: string | null;
  type: "image" | "video";
  placeholderName?: string;
};

const toPromise = (
  options: Record<string, unknown>,
  fileBuffer: Buffer
): Promise<UploadApiResponse> =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      options,
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve(result);
        } else {
          reject(new Error("Cloudinary returned no result"));
        }
      }
    );

    stream.end(fileBuffer);
  });

export const uploadFile = async (
  input: CloudinaryUploadInput
): Promise<CloudinaryUploadResult> => {
  const resourceType = input.typeOverride ?? (input.mimetype.startsWith("video") ? "video" : "image");
  const folder = input.folder || (resourceType === "video" ? "uploads/videos" : "uploads/images");

  try {
    const result = await toPromise(
      {
        folder,
        resource_type: resourceType,
        use_filename: false,
        unique_filename: true,
        overwrite: false,
      },
      input.buffer
    );

    return {
      url: result.secure_url || result.url || null,
      public_id: result.public_id || null,
      type: resourceType,
    };
  } catch (error) {
    console.error("Cloudinary upload failed: %s", (error as Error)?.message ?? error);
    return {
      url: null,
      public_id: null,
      type: resourceType,
      placeholderName: input.originalName,
    };
  }
};

export const deleteByPublicId = async (publicId: string): Promise<boolean> => {
  const attempt = async (resourceType: "image" | "video") => {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });
      return result.result === "ok" || result.result === "not found";
    } catch (error) {
      console.error(
        "Cloudinary delete failed for %s (%s): %s",
        publicId,
        resourceType,
        (error as Error)?.message ?? error
      );
      return false;
    }
  };

  // Try image first, then video.
  if (await attempt("image")) {
    return true;
  }
  return attempt("video");
};
