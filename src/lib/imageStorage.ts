export async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      const max_size = 800;
      if (width > height) {
        if (width > max_size) {
          height = Math.round((height * max_size) / width);
          width = max_size;
        }
      } else {
        if (height > max_size) {
          width = Math.round((width * max_size) / height);
          height = max_size;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Could not compress image"));
            return;
          }
          if (blob.size > 200 * 1024) {
            reject(new Error("الصورة كبيرة جداً"));
            return;
          }
          resolve(blob);
        },
        'image/webp',
        0.75
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Invalid image"));
    };
    img.src = url;
  });
}

const OPFS_DIR = 'product_images';

async function getImagesDir() {
  const root = await navigator.storage.getDirectory();
  return root.getDirectoryHandle(OPFS_DIR, { create: true });
}

export async function saveProductImage(productId: string, blob: Blob): Promise<string> {
  const dir = await getImagesDir();
  const fileHandle = await dir.getFileHandle(`${productId}.webp`, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(blob);
  await writable.close();
  return `${OPFS_DIR}/${productId}.webp`;
}

export async function loadProductImage(path: string): Promise<string> {
  try {
    const filename = path.split('/').pop();
    if (!filename) throw new Error("Invalid path");
    const dir = await getImagesDir();
    const fileHandle = await dir.getFileHandle(filename);
    const file = await fileHandle.getFile();
    return URL.createObjectURL(file);
  } catch (error) {
    console.error("Error loading image from OPFS", error);
    return "";
  }
}

export async function deleteProductImage(productId: string): Promise<void> {
  try {
    const dir = await getImagesDir();
    await dir.removeEntry(`${productId}.webp`);
  } catch (error: any) {
    if (error.name !== 'NotFoundError') {
      console.error("Error deleting image from OPFS", error);
    }
  }
}
