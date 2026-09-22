import fs from "fs/promises";
import path from "path";

export interface StorageProvider {
  upload(fileBuffer: Buffer, filename: string, mimeType: string): Promise<string>;
  delete(fileUrl: string): Promise<void>;
}

class LocalStorageProvider implements StorageProvider {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), "public", "uploads");
  }

  async upload(fileBuffer: Buffer, originalFilename: string): Promise<string> {
    await fs.mkdir(this.uploadDir, { recursive: true });

    const ext = path.extname(originalFilename) || ".jpg";
    const baseName = path.basename(originalFilename, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
    const uniqueName = `${Date.now()}_${baseName}${ext}`;
    const filePath = path.join(this.uploadDir, uniqueName);

    await fs.writeFile(filePath, fileBuffer);
    return `/uploads/${uniqueName}`;
  }

  async delete(fileUrl: string): Promise<void> {
    try {
      if (!fileUrl.startsWith("/uploads/")) return;
      const fileName = path.basename(fileUrl);
      const filePath = path.join(this.uploadDir, fileName);
      await fs.unlink(filePath);
    } catch {
      // Ignore if file doesn't exist
    }
  }
}

class CloudinaryStorageProvider implements StorageProvider {
  private cloudName: string;
  private apiKey: string;
  private apiSecret: string;

  constructor(cloudName: string, apiKey: string, apiSecret: string) {
    this.cloudName = cloudName;
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
  }

  async upload(fileBuffer: Buffer, filename: string): Promise<string> {
    // Standard Cloudinary REST upload using signature
    const crypto = await import("crypto");
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = "royal_catalogue";
    const signatureStr = `folder=${folder}&timestamp=${timestamp}${this.apiSecret}`;
    const signature = crypto.createHash("sha1").update(signatureStr).digest("hex");

    const formData = new FormData();
    const blob = new Blob([new Uint8Array(fileBuffer)]);
    formData.append("file", blob, filename);
    formData.append("api_key", this.apiKey);
    formData.append("timestamp", timestamp.toString());
    formData.append("signature", signature);
    formData.append("folder", folder);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Cloudinary upload failed: ${err}`);
    }

    const data = await response.json();
    return data.secure_url;
  }

  async delete(): Promise<void> {
    // Can be extended with Cloudinary destroy API using public_id
  }
}

export function getStorageProvider(): StorageProvider {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (cloudName && apiKey && apiSecret) {
    return new CloudinaryStorageProvider(cloudName, apiKey, apiSecret);
  }

  return new LocalStorageProvider();
}
