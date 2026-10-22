import type { Metadata } from "next";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  FlaskConical,
  House,
  Leaf,
  RotateCw,
  ShieldCheck,
  Sprout,
} from "lucide-react";
import { Brand } from "@/components/layout";

export const metadata: Metadata = {
  title: "Bertumbuh bersama TerraSiklus — Kebun kecil, dampak besar",
  description:
    "Kenali TerraSiklus, teman berkebun untuk merencanakan rotasi tanaman dan merawat kesehatan tanah.",
};

export default function AboutPage() {
  const features = [
    {
      icon: House,
      title: "Setiap petak, terawat",
      description:
        "Kelola beberapa kebun dan petak. Kenali luas, jenis tanah, dan apa yang tumbuh di setiap sudutnya.",
    },
    {
      icon: RotateCw,
      title: "Rotasi yang lebih bijak",
      description:
        "Temukan keluarga tanaman yang tepat untuk musim berikutnya berdasarkan riwayat kebunmu.",
    },
    {
      icon: FlaskConical,
      title: "Dengarkan tanahmu",
      description:
        "Catat pH, unsur hara, serta bahan organik. Pahami perubahan tanah dari musim ke musim.",
    },
    {
      icon: BookOpen,
      title: "Belajar dari tiap musim",
      description:
        "Simpan tanggal tanam, hasil panen, dan catatan hama. Karena setiap musim membawa pelajaran baru.",
    },
  ];
  return (
    <div className="landing">
      <header className="landing-header">
        <a href="/tentang" aria-label="TerraSiklus">
          <Brand />
        </a>
        <nav aria-label="Navigasi pengenalan">
          <a href="#fitur">Kenali TerraSiklus</a>
          <a href="#mulai">Mulai berkebun</a>
        </nav>
        <a href="/" className="button button-primary">
          Buka kebunku <ArrowUpRight size={15} />
        </a>
      </header>
      <main id="main-content">
        <section className="landing-hero">
          <div>
            <span className="eyebrow">TEMAN TUMBUH UNTUK SETIAP PEKEBUN</span>
            <h1>
              Kebun kecil.
              <br />
              Panen berarti.
              <br />
              <span>Bumi lestari.</span>
            </h1>
            <p>
              Berkebun lebih terarah dengan rotasi tanaman yang bijak dan tanah
              yang terawat. Dari petak pertamamu, untuk musim-musim yang lebih
              baik.
            </p>
            <div className="landing-hero-actions">
              <a href="/" className="button button-primary">
                <Sprout size={17} /> Mulai perjalanan kebunmu{" "}
                <ArrowRight size={15} />
              </a>
              <a href="#fitur">
                Kenali caranya <ArrowRight size={13} />
              </a>
            </div>
          </div>
          <div className="landing-hero-photo">
            <img
              src="/images/hero.jpg"
              alt="Barisan sayuran hijau yang tumbuh subur di kebun organik saat cahaya matahari sore"
              fetchPriority="high"
            />
            <div className="landing-photo-label">
              <Leaf size={29} strokeWidth={1.4} />
              <span>
                <strong>Tanah sehat, kehidupan lebih baik.</strong>Dimulai dari
                satu petak, satu musim.
              </span>
            </div>
          </div>
        </section>
        <div className="landing-values">
          <span>
            <Check size={16} /> Dirancang untuk pekebun Indonesia
          </span>
          <span>
            <ShieldCheck size={17} /> Berbasis keluarga botani
          </span>
          <span>
            <Leaf size={16} /> Bertumbuh secara berkelanjutan
          </span>
        </div>
        <section className="landing-features" id="fitur">
          <div className="landing-section-title">
            <h2>Lebih dekat dengan kebunmu.</h2>
            <p>
              Semua yang kamu butuhkan untuk merawat, merencanakan, dan
              bertumbuh.
            </p>
          </div>
          <div className="landing-feature-grid">
            {features.map((feature) => (
              <article key={feature.title}>
                <span>
                  <feature.icon size={24} strokeWidth={1.5} />
                </span>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="landing-cta" id="mulai">
          <h2>
            Musim yang lebih baik
            <br />
            dimulai hari ini.
          </h2>
          <p>
            Jelajahi ruang kebun contoh, buat petak pertamamu, dan temukan cara
            berkebun yang lebih seimbang bersama TerraSiklus.
          </p>
          <a href="/" className="button button-primary">
            Buka ruang kebunku <ArrowRight size={15} />
          </a>
        </section>
      </main>
      <footer className="landing-footer">
        <Brand />
        <span>Dirawat dengan hati, tumbuh bersama TerraSiklus.</span>
        <span>© {new Date().getFullYear()} TerraSiklus</span>
      </footer>
    </div>
  );
}
