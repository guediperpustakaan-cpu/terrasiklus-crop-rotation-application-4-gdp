"use client";

import {
  ArrowDownToLine,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  FlaskConical,
  Layers2,
  Leaf,
  MapPin,
  MoveUpRight,
  Plus,
  RotateCw,
  Shovel,
  Sprout,
  Sun,
  Wheat,
} from "lucide-react";
import type { Page, Workspace, PlantingPreset } from "@/lib/types";
import {
  activePlanting,
  daysBetween,
  latestSoil,
  numberID,
  plantingProgress,
} from "@/lib/garden";
import { PlotCard } from "./plot-card";
import { EmptyState } from "./ui";

interface Props {
  data: Workspace;
  farmId: string;
  onFarm: (id: string) => void;
  onNavigate: (page: Page) => void;
  onPlot: (id: string) => void;
  onPlant: (preset?: PlantingPreset) => void;
  onHarvest: (id: string) => void;
  onSoil: (id?: string) => void;
  onRotate: (id?: string) => void;
  onGuide: () => void;
  onCreate: () => void;
}
export function Dashboard({
  data,
  farmId,
  onFarm,
  onNavigate,
  onPlot,
  onPlant,
  onHarvest,
  onSoil,
  onRotate,
  onGuide,
  onCreate,
}: Props) {
  const farm = data.farms.find((f) => f.id === farmId) || data.farms[0];
  const plots = data.plots.filter((p) => p.farmId === farm?.id);
  const growing = plots.filter((p) => activePlanting(data, p.id));
  const ready = growing.filter(
    (p) => plantingProgress(data, activePlanting(data, p.id)!).daysLeft <= 0,
  );
  const soils = plots.map((p) => latestSoil(data, p.id)).filter(Boolean);
  const ph = soils.length
    ? soils.reduce((sum, s) => sum + s.ph, 0) / soils.length
    : null;
  const area = plots.reduce((sum, p) => sum + p.area, 0);
  const empty = plots.filter((p) => !activePlanting(data, p.id));
  const soilDue = plots.filter((p) => {
    const s = latestSoil(data, p.id);
    return !s || daysBetween(s.testedOn) > 90;
  });
  const families = new Set(
    growing.map(
      (p) =>
        data.crops.find((c) => c.id === activePlanting(data, p.id)?.cropId)
          ?.familyId,
    ),
  );
  const stats = [
    {
      label: "Total petak",
      value: plots.length,
      unit: "petak",
      icon: Layers2,
      footer: `${numberID(area)} m² luas keseluruhan`,
      tag: empty.length ? `${empty.length} tersedia` : "Terawat",
      color: "green",
    },
    {
      label: "Tanaman aktif",
      value: growing.length,
      unit: "tanaman",
      icon: Sprout,
      footer: `${families.size} keluarga tanaman berbeda`,
      tag: "Tumbuh baik",
      color: "green",
    },
    {
      label: "Kesehatan tanah",
      value: ph === null ? "—" : numberID(ph),
      unit: "pH rata-rata",
      icon: FlaskConical,
      footer: soils.length
        ? `Dari ${soils.length} petak yang diuji`
        : "Belum ada hasil uji tanah",
      tag: ph !== null && ph >= 6 && ph <= 7 ? "Optimal" : "Pantau tanah",
      color: "green",
    },
    {
      label: "Siap dipanen",
      value: ready.length,
      unit: "petak",
      icon: Wheat,
      footer: ready.length
        ? `${data.crops.find((c) => c.id === activePlanting(data, ready[0].id)?.cropId)?.commonName} · ${ready[0].name}`
        : "Menunggu musim panen",
      tag: ready.length ? "Waktunya panen" : "Terus rawat",
      color: "orange",
    },
  ];
  const tasks = [
    ...ready
      .slice(0, 1)
      .map((plot) => ({
        id: `harvest-${plot.id}`,
        icon: Wheat,
        color: "orange",
        title: `Saatnya panen ${data.crops.find((c) => c.id === activePlanting(data, plot.id)?.cropId)?.commonName.toLowerCase()}!`,
        description: `${plot.name} sudah siap memberi hasil terbaiknya.`,
        action: "Catat panen",
        onClick: () => onHarvest(activePlanting(data, plot.id)!.id),
      })),
    ...soilDue
      .slice(0, 1)
      .map((plot) => ({
        id: `soil-${plot.id}`,
        icon: FlaskConical,
        color: "blue",
        title: "Cek kembali kesehatan tanah",
        description: `Perbarui hasil uji tanah ${plot.name} sebelum menanam.`,
        action: "Catat uji tanah",
        onClick: () => onSoil(plot.id),
      })),
    ...(empty[0]
      ? [
          {
            id: "rotation",
            icon: RotateCw,
            color: "green",
            title: "Siapkan musim berikutnya",
            description: `${empty[0].name} siap untuk cerita pertumbuhan yang baru.`,
            action: "Cari rekomendasi",
            onClick: () => onRotate(empty[0].id),
          },
        ]
      : []),
  ];
  return (
    <div className="dashboard page-enter">
      <div className="page-heading dashboard-heading">
        <div>
          <div className="greeting-line">
            <h1>Selamat pagi, {data.profile.username.split(" ")[0]}!</h1>
            <Sun className="greeting-sun" size={27} strokeWidth={1.6} />
          </div>
          <p>Yuk, lihat kabar kebunmu. Ada hal baik yang sedang tumbuh.</p>
        </div>
        <button className="button button-primary" onClick={() => onPlant()}>
          <Plus size={17} /> Catat penanaman
        </button>
      </div>
      <section className="garden-hero" aria-label="Rencanakan rotasi kebun">
        <div className="hero-content">
          <div className="hero-eyebrow">
            <span />
            <span>TANAM DENGAN BIJAK, TUMBUH LEBIH BAIK</span>
          </div>
          <h2>
            Tanah sehat.
            <br />
            Panen lebih hebat.
          </h2>
          <p>
            Kenali tanahmu, atur rotasimu, dan biarkan
            <br className="desktop-break" /> kebunmu tumbuh dalam keseimbangan.
          </p>
          <button className="button hero-button" onClick={() => onRotate()}>
            <RotateCw size={16} /> Rencanakan rotasi <ArrowRight size={16} />
          </button>
        </div>
        <div className="hero-note">
          <span className="hero-note-icon">
            <Leaf size={20} strokeWidth={1.5} />
          </span>
          <div>
            Baik untuk kebunmu.
            <br />
            <strong>Lebih baik untuk bumi.</strong>
          </div>
        </div>
        <span className="hero-photo-caption">
          <MapPin size={12} /> Setiap petak punya potensi.
        </span>
      </section>
      <section className="stats-grid" aria-label="Statistik kebun">
        {stats.map((stat) => (
          <div className={`stat-card stat-${stat.color}`} key={stat.label}>
            <div className="stat-top">
              <span>{stat.label}</span>
              <span className="stat-icon">
                <stat.icon size={18} strokeWidth={1.7} />
              </span>
            </div>
            <div className="stat-value">
              {stat.value}
              <span>{stat.unit}</span>
            </div>
            <div className="stat-bottom">
              <span>{stat.footer}</span>
              <span className="stat-tag">
                {stat.tag === "Optimal" ? (
                  <Check size={10} />
                ) : stat.color === "orange" ? (
                  <span className="tiny-dot" />
                ) : null}
                {stat.tag}
              </span>
            </div>
          </div>
        ))}
      </section>
      <div className="dashboard-columns">
        <section className="plots-section">
          <div className="section-heading">
            <div>
              <h2>
                Petak kebunmu{" "}
                <span className="count-badge">{plots.length}</span>
              </h2>
              <div className="garden-selector">
                <MapPin size={12} />
                <select
                  aria-label="Pilih kebun"
                  value={farm?.id || ""}
                  onChange={(event) => onFarm(event.target.value)}
                >
                  {data.farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                  {!data.farms.length && (
                    <option value="">Belum ada kebun</option>
                  )}
                </select>
                <ChevronDown size={12} />
              </div>
            </div>
            <button
              className="text-button"
              onClick={() => onNavigate("gardens")}
            >
              Lihat semua <ArrowRight size={14} />
            </button>
          </div>
          {plots.length ? (
            <div className="dashboard-plot-grid">
              {[...plots]
                .sort(
                  (a, b) =>
                    Number(!!activePlanting(data, b.id)) -
                    Number(!!activePlanting(data, a.id)),
                )
                .slice(0, 3)
                .map((plot) => (
                  <PlotCard
                    key={plot.id}
                    data={data}
                    plot={plot}
                    onClick={() => onPlot(plot.id)}
                  />
                ))}
            </div>
          ) : (
            <EmptyState
              title="Cerita kebunmu dimulai di sini"
              description="Tambahkan kebun dan petak pertama, lalu mulai catat pertumbuhannya."
            >
              <button className="button button-primary" onClick={onCreate}>
                <Plus size={16} /> Mulai kebun pertama
              </button>
            </EmptyState>
          )}
          <div className="rotation-callout">
            <span className="callout-icon">
              <RotateCw size={25} strokeWidth={1.5} />
              <Leaf size={12} />
            </span>
            <div>
              <h3>Musim berikutnya, tanam apa?</h3>
              <p>Rotasi cerdas dimulai dari riwayat kebunmu.</p>
            </div>
            <button onClick={() => onRotate()}>
              Lihat rekomendasi <ArrowRight size={15} />
            </button>
          </div>
          <div className="garden-mini-footer">
            <span>
              <span className="tiny-dot" /> Semua data kebun tersimpan
            </span>
            <span>
              <Leaf size={12} /> Sedikit lebih hijau, setiap hari.
            </span>
          </div>
        </section>
        <aside className="agenda-section">
          <div className="section-heading">
            <h2>
              Agenda kebun <span className="count-badge">{tasks.length}</span>
            </h2>
            <CalendarDays size={17} className="muted" />
          </div>
          <div className="agenda-card">
            {tasks.length ? (
              tasks.map((task) => (
                <div className="agenda-item" key={task.id}>
                  <span className={`agenda-icon agenda-${task.color}`}>
                    <task.icon size={18} strokeWidth={1.6} />
                  </span>
                  <div>
                    <h3>{task.title}</h3>
                    <p>{task.description}</p>
                    <button
                      className={`agenda-action text-${task.color}`}
                      onClick={task.onClick}
                    >
                      {task.action}
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="all-done">
                <Check size={28} />
                <h3>Kebunmu terawat!</h3>
                <p>
                  Belum ada tindakan mendesak. Nikmati proses pertumbuhannya.
                </p>
              </div>
            )}
          </div>
          <button className="garden-tip" onClick={onGuide}>
            <span className="tip-label">
              <span className="tip-spark">✧</span> AKAR PENGETAHUAN
            </span>
            <h3>Tanah juga butuh variasi.</h3>
            <p>
              Ganti keluarga tanaman setiap musim untuk menjaga hara dan memutus
              siklus hama.
            </p>
            <span className="tip-link">
              Pelajari rotasi tanaman <ArrowRight size={13} />
            </span>
            <Leaf className="tip-leaf" size={79} strokeWidth={0.7} />
          </button>
        </aside>
      </div>
    </div>
  );
}
