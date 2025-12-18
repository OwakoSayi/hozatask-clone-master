import { supabase } from "@/integrations/supabase/client";

const UPLOAD_TIMEOUT_MS = 30000; // 30 second timeout per file

/**
 * Upload a single image with timeout
 */
async function uploadSingleImage(
  file: File,
  folder: string
): Promise<string | null> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `${folder}/${fileName}`;

  // Create a timeout promise
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Upload timeout")), UPLOAD_TIMEOUT_MS);
  });

  try {
    // Race between upload and timeout
    const { error: uploadError } = await Promise.race([
      supabase.storage.from("avatars").upload(filePath, file),
      timeoutPromise,
    ]);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return null;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error("Upload failed:", error);
    return null;
  }
}

/**
 * Upload multiple images in parallel for faster uploads
 * Returns successfully uploaded URLs (skips failed ones)
 */
export async function uploadImagesParallel(
  files: File[],
  folder: string = "uploads"
): Promise<string[]> {
  const uploadPromises = files.map((file) => uploadSingleImage(file, folder));
  const results = await Promise.allSettled(uploadPromises);

  // Filter out failed uploads and null results
  const successfulUrls = results
    .filter(
      (result): result is PromiseFulfilledResult<string | null> =>
        result.status === "fulfilled" && result.value !== null
    )
    .map((result) => result.value as string);

  return successfulUrls;
}

/**
 * Upload a single image and return the URL or null on failure
 * Non-blocking - won't throw errors
 */
export async function uploadImageSafe(
  file: File,
  folder: string = "uploads"
): Promise<string | null> {
  return uploadSingleImage(file, folder);
}
