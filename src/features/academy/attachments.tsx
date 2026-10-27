import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { Download, Paperclip, Trash2 } from "lucide-react";
import {
  downloadAttachment,
  formatBytes,
  listAttachments,
  maxAttachmentBytes,
  removeAttachment,
  uploadAttachment,
  type Attachment,
  type AttachmentContext,
} from "@/lib/attachments";
import { configured } from "@/lib/academy";

export function Attachments({
  context,
  contextId,
  canAdd = false,
  demo = false,
  label = "Files",
}: {
  context: AttachmentContext;
  contextId: string;
  canAdd?: boolean;
  demo?: boolean;
  label?: string;
}) {
  const [files, setFiles] = useState<Attachment[]>([]);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const input = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    if (demo || !configured) return;
    setFiles(await listAttachments(context, contextId));
  }, [context, contextId, demo]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function choose(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (input.current) input.current.value = "";
    if (!file) return;
    setNotice("");
    setBusy(`Uploading ${file.name}…`);
    try {
      await uploadAttachment(file, context, contextId);
      await refresh();
      setNotice(`${file.name} attached.`);
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "The file could not be attached.");
    }
    setBusy("");
  }

  async function open(file: Attachment) {
    setNotice("");
    setBusy(`Opening ${file.file_name}…`);
    try {
      await downloadAttachment(file);
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "This file could not be opened.");
    }
    setBusy("");
  }

  async function remove(file: Attachment) {
    setNotice("");
    setBusy(`Removing ${file.file_name}…`);
    try {
      await removeAttachment(file.id);
      await refresh();
      setNotice(`${file.file_name} removed.`);
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "This file could not be removed.");
    }
    setBusy("");
  }

  // Demo records live in this browser only, so there is nothing real to attach to.
  if (demo)
    return (
      <p className="form-note">
        <Paperclip size={13} /> File attachments open on a real account.
      </p>
    );
  if (!configured) return null;

  return (
    <div className="attachment-block">
      <div className="attachment-head">
        <strong>
          <Paperclip size={14} /> {label}
        </strong>
        {canAdd && (
          <button type="button" onClick={() => input.current?.click()} disabled={Boolean(busy)}>
            Attach a file
          </button>
        )}
      </div>
      <input ref={input} type="file" hidden onChange={choose} />
      {files.length === 0 && !busy && <p className="form-note">No files yet.</p>}
      {files.map(file => (
        <div className="attachment-row" key={file.id}>
          <span>
            <strong>{file.file_name}</strong>
            <small>{formatBytes(file.size_bytes)}</small>
          </span>
          <span className="attachment-actions">
            <button type="button" onClick={() => open(file)} disabled={Boolean(busy)} title="Download">
              <Download size={15} />
            </button>
            {canAdd && (
              <button type="button" onClick={() => remove(file)} disabled={Boolean(busy)} title="Remove">
                <Trash2 size={15} />
              </button>
            )}
          </span>
        </div>
      ))}
      {busy && <p className="form-note">{busy}</p>}
      {notice && (
        <p role="status" className="form-note">
          {notice}
        </p>
      )}
      {canAdd && !busy && (
        <p className="form-note">Up to {formatBytes(maxAttachmentBytes)} per file.</p>
      )}
    </div>
  );
}
