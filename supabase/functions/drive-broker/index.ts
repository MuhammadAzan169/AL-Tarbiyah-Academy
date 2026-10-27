// Bridges the browser to the academy's Google Drive folder.
//
// The browser never holds a Drive file id or a Google credential. It names a
// record, this function re-reads that record from Postgres AS THE CALLER so the
// row level security policies in 202610260004_attachments.sql decide the answer,
// and only then does it speak to Drive with the service account.
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const FOLDER_ID = Deno.env.get("DRIVE_FOLDER_ID")!;

// Drive charges every file to the account that owns it, and a service account
// has no storage quota at all, so uploads are made as the academy's own Google
// account through a refresh token granted once. The scope is drive.file, which
// reaches only the files this app created, never the rest of that Drive.
const OAUTH_CLIENT_ID = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID")!;
const OAUTH_CLIENT_SECRET = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET")!;
const OAUTH_REFRESH_TOKEN = Deno.env.get("GOOGLE_OAUTH_REFRESH_TOKEN")!;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

// Google access tokens last an hour; reuse one until it is nearly spent.
let cached: { token: string; expires: number } | null = null;

async function accessToken() {
  if (cached && cached.expires > Date.now() + 60_000) return cached.token;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: OAUTH_REFRESH_TOKEN,
      client_id: OAUTH_CLIENT_ID,
      client_secret: OAUTH_CLIENT_SECRET,
    }),
  });
  if (!response.ok) throw new Error(`Google refused the refresh token: ${await response.text()}`);
  const token = await response.json() as { access_token: string; expires_in: number };
  cached = { token: token.access_token, expires: Date.now() + token.expires_in * 1000 };
  return cached.token;
}

Deno.serve(async request => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") return json({ error: "Use POST." }, 405);

  const authorization = request.headers.get("Authorization");
  if (!authorization) return json({ error: "Sign in first." }, 401);

  // Every database call below runs as the caller, so RLS is the only gatekeeper.
  const asUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authorization } },
  });
  const { data: auth } = await asUser.auth.getUser();
  if (!auth.user) return json({ error: "Sign in first." }, 401);

  let body: Record<string, string | number>;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Expected a JSON body." }, 400);
  }
  const action = String(body.action ?? "");

  try {
    if (action === "upload-url") {
      const { context, context_id, file_name, mime_type, size_bytes } = body as Record<string, string>;
      if (!context || !context_id || !file_name || !mime_type) return json({ error: "Missing file details." }, 400);

      // The insert is the permission check: attachments_insert calls
      // can_write_attachment, so a caller who may not attach here is refused
      // before any Drive quota is spent.
      const { data: row, error } = await asUser.from("attachments").insert({
        context,
        context_id,
        file_name,
        mime_type,
        size_bytes: Number(size_bytes),
      }).select("id").single();
      if (error || !row) return json({ error: "You cannot attach a file here." }, 403);

      const session = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${await accessToken()}`,
            "Content-Type": "application/json",
            "X-Upload-Content-Type": String(mime_type),
          },
          // Prefixing the id keeps the folder readable for staff browsing Drive.
          body: JSON.stringify({ name: `${row.id}__${file_name}`, parents: [FOLDER_ID] }),
        },
      );
      const upload_url = session.headers.get("Location");
      if (!session.ok || !upload_url) {
        await asUser.from("attachments").delete().eq("id", row.id);
        return json({ error: "Drive would not start the upload." }, 502);
      }
      // The browser PUTs the bytes straight to Google, so they never pass through here.
      return json({ attachment_id: row.id, upload_url });
    }

    if (action === "confirm") {
      const { attachment_id, drive_file_id } = body as Record<string, string>;
      if (!attachment_id || !drive_file_id) return json({ error: "Missing upload details." }, 400);
      const { error } = await asUser.from("attachments")
        .update({ drive_file_id, status: "ready" })
        .eq("id", attachment_id);
      if (error) return json({ error: "This upload cannot be completed." }, 403);
      return json({ ok: true });
    }

    if (action === "download") {
      const { attachment_id } = body as Record<string, string>;
      // A row only comes back when RLS says this caller may read it. The Drive
      // id is taken from that row, never from the request.
      const { data: row } = await asUser.from("attachments")
        .select("drive_file_id, file_name, mime_type")
        .eq("id", attachment_id)
        .eq("status", "ready")
        .single();
      if (!row?.drive_file_id) return json({ error: "File not found." }, 404);

      const file = await fetch(
        `https://www.googleapis.com/drive/v3/files/${row.drive_file_id}?alt=media&supportsAllDrives=true`,
        { headers: { Authorization: `Bearer ${await accessToken()}` } },
      );
      if (!file.ok) return json({ error: "Drive could not return this file." }, 502);
      return new Response(file.body, {
        headers: {
          ...cors,
          "Content-Type": row.mime_type,
          "Content-Disposition": `attachment; filename="${row.file_name.replace(/"/g, "")}"`,
        },
      });
    }

    if (action === "delete") {
      const { attachment_id } = body as Record<string, string>;
      const { data: row } = await asUser.from("attachments")
        .select("drive_file_id")
        .eq("id", attachment_id)
        .single();
      if (!row) return json({ error: "File not found." }, 404);
      // Remove the row first: if RLS refuses, the Drive file is left alone.
      const { error } = await asUser.from("attachments").delete().eq("id", attachment_id);
      if (error) return json({ error: "You cannot remove this file." }, 403);
      if (row.drive_file_id) {
        await fetch(`https://www.googleapis.com/drive/v3/files/${row.drive_file_id}?supportsAllDrives=true`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${await accessToken()}` },
        });
      }
      return json({ ok: true });
    }

    return json({ error: "Unknown action." }, 400);
  } catch (cause) {
    console.error(action, cause);
    return json({ error: "The file service is unavailable." }, 500);
  }
});
