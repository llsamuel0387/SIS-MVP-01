import { randomUUID } from "crypto";
import { unlink, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { spawn } from "child_process";
import sharp from "sharp";

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 1 * 1024 * 1024;
const MAX_DIMENSION = 1024;
const ALLOWED_IMAGE_FORMATS = new Set(["png", "jpeg", "jpg", "webp", "heif"]);

function decodeImageBase64(value: string): Buffer {
  const binary = Buffer.from(value.trim(), "base64");
  if (binary.length === 0 || binary.length > MAX_UPLOAD_BYTES) {
    throw new Error("Image size is invalid");
  }
  return binary;
}

async function runAvScan(filePath: string): Promise<void> {
  const command = process.env.PERSON_PHOTO_AV_SCAN_COMMAND;
  if (!command) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, [filePath], { stdio: "ignore", shell: false });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error("AV scan failed"));
      }
    });
  });
}

export async function sanitizeImageUploadBase64(rawBase64: string): Promise<string> {
  const source = decodeImageBase64(rawBase64);
  const metadata = await sharp(source, { failOn: "error" }).metadata();
  const format = (metadata.format ?? "").toLowerCase();
  if (!ALLOWED_IMAGE_FORMATS.has(format)) {
    throw new Error("Unsupported image format");
  }

  const resized = await sharp(source, { failOn: "error" })
    .rotate()
    .resize(MAX_DIMENSION, MAX_DIMENSION, {
      fit: "inside",
      withoutEnlargement: true
    })
    .png({
      compressionLevel: 9,
      palette: true,
      quality: 90
    })
    .toBuffer();

  if (resized.length === 0 || resized.length > MAX_OUTPUT_BYTES) {
    throw new Error("Sanitized PNG size is invalid");
  }
  if (!resized.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
    throw new Error("Sanitized PNG is invalid");
  }

  const tempPath = join(tmpdir(), `sis-photo-${randomUUID()}.png`);
  await writeFile(tempPath, resized);
  try {
    await runAvScan(tempPath);
  } finally {
    await unlink(tempPath).catch(() => undefined);
  }

  return resized.toString("base64");
}
