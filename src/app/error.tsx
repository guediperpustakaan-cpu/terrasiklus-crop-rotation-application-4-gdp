"use client";

import { RefreshCw, Sprout } from "lucide-react";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="error-page" id="main-content">
      <div className="error-content">
        <Sprout size={48} strokeWidth={1.3} />
        <h1>Sebentar, kebunmu sedang bersiap.</h1>
        <p>
          Data kebun belum berhasil dimuat. Periksa koneksi dan coba kembali.
          Catatan yang sudah disimpan tetap aman di database.
        </p>
        <button className="button button-primary" onClick={reset}>
          <RefreshCw size={16} /> Muat ulang kebun
        </button>
      </div>
    </main>
  );
}
