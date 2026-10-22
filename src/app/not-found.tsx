import { ArrowLeft, Sprout } from "lucide-react";

export default function NotFound() {
  return (
    <main className="error-page" id="main-content">
      <div className="error-content">
        <Sprout size={48} strokeWidth={1.3} />
        <h1>Jalan ini belum ditanami.</h1>
        <p>
          Halaman yang kamu cari tidak ditemukan. Mari kembali ke ruang
          tumbuhmu.
        </p>
        <a href="/" className="button button-primary">
          <ArrowLeft size={16} /> Kembali ke kebun
        </a>
      </div>
    </main>
  );
}
