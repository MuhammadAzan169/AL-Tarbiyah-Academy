import { supabase } from "@/lib/academy";

export type AttachmentContext =
  | "homework_submission"
  | "exam_submission"
  | "lesson_material"
  | "class_resource";

export type Attachment = {
  id: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
};

// Drive holds the bytes, the attachments table decides who may reach them, and the
// drive-broker function is the only thing that holds a Google credential. The browser
// only ever names an attachment id, never a Drive file id.
export const maxAttachmentBytes = 25 * 1024 * 1024;

const brokerUrl = `${import.meta.env["VITE_SUPABASE_URL"]}/functions/v1/drive-broker`;

async function callBroker(body: Record<string, unknown>) {
  const { data } = await supabase!.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Sign in again to work with files.");
  return fetch(brokerUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: import.meta.env["VITE_SUPABASE_ANON_KEY"],
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

async function brokerJson(body: Record<string, unknown>) {
  const response = await callBroker(body);
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error ?? "The file service is unavailable.");
  return result;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Reading the list goes straight to Postgres: the policies hide what this account
// may not see, so no file service call is needed to decide that.
export async function listAttachments(context: AttachmentContext, contextId: string) {
  if (!supabase) return [];
  const { data } = await supabase
    .from("attachments")
    .select("id, file_name, mime_type, size_bytes, created_at")
    .eq("context", context)
    .eq("context_id", contextId)
    .eq("status", "ready")
    .order("created_at");
  return (data ?? []) as Attachment[];
}

export async function uploadAttachment(file: File, context: AttachmentContext, contextId: string) {
  if (file.size > maxAttachmentBytes) {
    throw new Error(`Files must be ${formatBytes(maxAttachmentBytes)} or smaller.`);
  }
  const { attachment_id, upload_url } = await brokerJson({
    action: "upload-url",
    context,
    context_id: contextId,
    file_name: file.name,
    mime_type: file.type || "application/octet-stream",
    size_bytes: file.size,
  });

  // The bytes go from here straight to Google, so a large file never passes
  // through the edge function.
  const uploaded = await fetch(upload_url, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  if (!uploaded.ok) throw new Error("The upload did not finish. Try again.");
  const { id } = await uploaded.json();

  await brokerJson({ action: "confirm", attachment_id, drive_file_id: id });
  return attachment_id as string;
}

export async function downloadAttachment(attachment: Attachment) {
  const response = await callBroker({ action: "download", attachment_id: attachment.id });
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.error ?? "This file could not be opened.");
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = attachment.file_name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function removeAttachment(attachmentId: string) {
  await brokerJson({ action: "delete", attachment_id: attachmentId });
}
