import { supabase } from "@/integrations/supabase/client";

/**
 * Upload multiple images in parallel for faster uploads
 */
export async function uploadImagesParallel(
  files: File[],
  folder: string = "uploads"
): Promise<string[]> {
  const uploadPromises = files.map(async (file) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    return publicUrl;
  });

  // Upload all files in parallel
  return Promise.all(uploadPromises);
}
