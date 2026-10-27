import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Copy, Download, QrCode, X } from "lucide-react";

export type QrSettings = { qr_label?: string | null; qr_dark?: string | null; qr_light?: string | null };
const validColor = (value: string) => /^#[0-9a-fA-F]{6}$/.test(value);

export function ShareQr({ url, name, settings = {}, onSave }: {
  url: string;
  name: string;
  settings?: QrSettings;
  onSave?: (settings: Required<QrSettings>) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState(settings.qr_label || name);
  const [dark, setDark] = useState(settings.qr_dark || "#153e30");
  const [light, setLight] = useState(settings.qr_light || "#ffffff");
  const [png, setPng] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", onKeyDown); };
  }, [open]);

  useEffect(() => {
    setLabel(settings.qr_label || name);
    setDark(settings.qr_dark || "#153e30");
    setLight(settings.qr_light || "#ffffff");
  }, [name, settings.qr_label, settings.qr_dark, settings.qr_light]);
  useEffect(() => {
    if (!open || !validColor(dark) || !validColor(light)) return;
    let active = true;
    QRCode.toDataURL(url, { width: 360, margin: 3, errorCorrectionLevel: "M", color: { dark, light } })
      .then(result => { if (active) { setPng(result); setError(""); } })
      .catch(() => { if (active) setError("This QR code could not be generated."); });
    return () => { active = false; };
  }, [open, url, dark, light]);

  function download(href: string, extension: string) {
    const link = document.createElement("a");
    link.href = href;
    link.download = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-qr.${extension}`;
    link.click();
  }
  async function downloadSvg() {
    try {
      const svg = await QRCode.toString(url, { type: "svg", margin: 3, errorCorrectionLevel: "M", color: { dark, light } });
      const href = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
      download(href, "svg");
      window.setTimeout(() => URL.revokeObjectURL(href), 1000);
    } catch { setError("This QR code could not be downloaded."); }
  }
  async function save() {
    if (!onSave) return;
    setBusy(true);
    try { await onSave({ qr_label: label.trim() || name, qr_dark: dark, qr_light: light }); setOpen(false); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save QR settings."); }
    finally { setBusy(false); }
  }

  return <>
    <button type="button" onClick={() => setOpen(true)}><QrCode size={16}/> QR code</button>
    {open && <div className="qr-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setOpen(false); }}>
      <section className="qr-dialog" role="dialog" aria-modal="true" aria-label={`QR code for ${name}`}>
        <div className="section-bar"><div><span className="academy-eyebrow">✦ SHARE LINK</span><h2>QR code for {name}</h2></div><button ref={closeButton} className="qr-close" type="button" onClick={() => setOpen(false)} aria-label="Close QR code"><X size={20}/></button></div>
        <div className="qr-content"><div className="qr-preview">{png ? <img src={png} alt={`QR code linking to ${url}`}/> : <p>Generating QR code…</p>}</div>
          <div className="qr-controls academy-form"><label>Internal QR label<input value={label} maxLength={80} onChange={event => setLabel(event.target.value)}/></label><div className="qr-colors"><label>Code color<input type="color" value={dark} onChange={event => setDark(event.target.value)}/></label><label>Background<input type="color" value={light} onChange={event => setLight(event.target.value)}/></label></div><label>Destination URL<input readOnly value={url} onFocus={event => event.target.select()}/></label><p className="form-note">The code opens this link. Edit the form slug or influencer code to change its tracked destination, then download a new QR image.</p></div></div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="qr-actions"><button type="button" className="academy-button outline small" onClick={() => navigator.clipboard.writeText(url)}><Copy size={16}/> Copy link</button><button type="button" className="academy-button outline small" disabled={!png} onClick={() => download(png, "png")}><Download size={16}/> PNG</button><button type="button" className="academy-button outline small" onClick={downloadSvg}><Download size={16}/> SVG</button>{onSave && <button type="button" className="academy-button small" disabled={busy} onClick={save}>{busy ? "Saving…" : "Save design"}</button>}</div>
      </section>
    </div>}
  </>;
}
