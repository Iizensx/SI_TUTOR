import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { AdminAccessError, requireAdmin } from "@/lib/server/admin-auth";
import { updateAdminData, newId } from "@/lib/server/admin-store";

export const runtime = "nodejs";

// Uploads go to /public/uploads so they are served as static files in local development.
// Use object storage (S3, R2, Cloudinary…) for a deployed site.
const allowed: Record<string, number> = {
  "video/mp4": 500, "video/webm": 500, "video/quicktime": 500,
  "image/jpeg": 10, "image/png": 10, "image/webp": 10,
  "application/pdf": 50, "application/zip": 100, "text/plain": 5,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": 50,
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": 100,
};

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ error: "This request is not allowed." }, { status: 403 });
  try {
    const admin = await requireAdmin(request, ["owner", "editor"]);
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 });
    const limitMb = allowed[file.type];
    if (!limitMb) return NextResponse.json({ error: "Upload a video (MP4/WebM/MOV), image, PDF, Word, PowerPoint, ZIP or text file." }, { status: 415 });
    if (file.size > limitMb * 1024 * 1024) return NextResponse.json({ error: `This file type is limited to ${limitMb} MB.` }, { status: 413 });

    const extension = path.extname(file.name).toLowerCase().replace(/[^.a-z0-9]/g, "").slice(0, 8);
    const base = path.basename(file.name, path.extname(file.name)).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "file";
    const name = `${base}-${randomUUID().slice(0, 8)}${extension}`;
    const folder = path.join(process.cwd(), "public", "uploads");
    await mkdir(folder, { recursive: true });
    await writeFile(path.join(folder, name), Buffer.from(await file.arrayBuffer()));

    await updateAdminData((data) => {
      data.audit.unshift({ id: newId(), at: new Date().toISOString(), by: `${admin.firstName} ${admin.lastName} <${admin.email}>`, role: admin.adminRole, action: "Uploaded file", target: file.name, detail: `${(file.size / 1024 / 1024).toFixed(1)} MB` });
    });
    return NextResponse.json({ url: `/uploads/${name}`, name: file.name, type: file.type });
  } catch (error) {
    if (error instanceof AdminAccessError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
