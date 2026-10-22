"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  Coffee,
  Copy,
  Download,
  ExternalLink,
  X,
} from "lucide-react";
import qrcode from "qrcode-generator";
import {
  OPEN_SOURCE_CREDIT,
  SOURCE_DOWNLOAD_URL,
  SOURCE_FILE_NAME,
  SUPPORT_AMOUNTS,
  SUPPORT_TAGLINE,
  rupiah,
  tipUrl,
} from "@/lib/support";

function QrCode({ value }: { value: string }) {
  const code = qrcode(0, "M");
  code.addData(value);
  code.make();
  const count = code.getModuleCount();
  const quiet = 2;
  let path = "";
  for (let row = 0; row < count; row += 1) {
    for (let col = 0; col < count; col += 1) {
      if (code.isDark(row, col)) path += `M${col + quiet} ${row + quiet}h1v1h-1z`;
    }
  }
  const side = count + quiet * 2;
  return (
    <svg
      className="support-qr"
      viewBox={`0 0 ${side} ${side}`}
      width={168}
      height={168}
      shapeRendering="crispEdges"
      role="img"
      aria-label={`Kode QR untuk trakteeran ${value}`}
    >
      <rect width={side} height={side} fill="#ffffff" />
      <path d={path} fill="#23301f" />
    </svg>
  );
}

export function TrakteerWidget() {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<number>(SUPPORT_AMOUNTS[0]);
  const [copied, setCopied] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const link = tipUrl(amount);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const outside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", keydown);
    document.addEventListener("mousedown", outside);
    return () => {
      document.removeEventListener("keydown", keydown);
      document.removeEventListener("mousedown", outside);
    };
  }, [open]);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2400);
    return () => clearTimeout(timer);
  }, [copied]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="support-widget" ref={rootRef}>
      {open && (
        <div
          className="support-panel"
          ref={panelRef}
          role="dialog"
          aria-label="Dukung TerraSiklus"
          tabIndex={-1}
        >
          <div className="support-panel-head">
            <span className="support-panel-icon">
              <Coffee size={17} strokeWidth={1.9} />
            </span>
            <div>
              <strong>Dukung TerraSiklus</strong>
              <small>{SUPPORT_TAGLINE}.</small>
            </div>
            <button
              className="icon-button"
              onClick={() => setOpen(false)}
              aria-label="Tutup dukungan"
            >
              <X size={17} />
            </button>
          </div>
          <div
            className="support-amounts"
            role="group"
            aria-label="Pilih nominal trakteeran"
          >
            {SUPPORT_AMOUNTS.map((value) => (
              <button
                key={value}
                className={value === amount ? "selected" : ""}
                aria-pressed={value === amount}
                onClick={() => setAmount(value)}
              >
                {rupiah(value)}
              </button>
            ))}
          </div>
          <div className="support-qr-wrap">
            <QrCode value={link} />
          </div>
          <p className="support-caption">
            Pindai untuk mentrakteer <strong>{rupiah(amount)}</strong> lewat
            Trakteer. Nominal lain bisa dipilih di halaman Trakteer.
          </p>
          <div className="support-actions">
            <a
              className="button button-primary"
              href={link}
              target="_blank"
              rel="noopener noreferrer"
            >
              Buka Trakteer <ExternalLink size={14} />
            </a>
            <button className="button button-secondary" onClick={copyLink}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Tersalin" : "Salin tautan"}
            </button>
          </div>
          <a
            className="support-download"
            href={SOURCE_DOWNLOAD_URL}
            download={SOURCE_FILE_NAME}
          >
            <Download size={14} /> Unduh source code lengkap
          </a>
          <span className="support-credit">{OPEN_SOURCE_CREDIT}</span>
        </div>
      )}
      <button
        className="support-fab"
        ref={triggerRef}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <span className="support-fab-icon">
          <Coffee size={19} strokeWidth={1.9} />
        </span>
        <span className="support-fab-text">{SUPPORT_TAGLINE}</span>
      </button>
    </div>
  );
}
