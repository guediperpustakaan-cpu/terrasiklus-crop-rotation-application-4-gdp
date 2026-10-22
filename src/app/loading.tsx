import { LoaderCircle, Sprout } from "lucide-react";

export default function Loading() {
  return (
    <main className="error-page" id="main-content" aria-busy="true">
      <div className="error-content">
        <Sprout size={46} strokeWidth={1.3} />
        <h1>Menengok kabar kebunmu...</h1>
        <p>Menyiapkan catatan tanah dan cerita pertumbuhan.</p>
        <LoaderCircle size={23} className="spin" />
      </div>
    </main>
  );
}
