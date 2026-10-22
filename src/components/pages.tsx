"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Bean,
  BookOpen,
  CalendarDays,
  Carrot,
  Check,
  ChevronRight,
  Cherry,
  Download,
  Edit3,
  Filter,
  Flower2,
  House,
  Layers2,
  Leaf,
  MapPin,
  MoreHorizontal,
  Plus,
  RotateCw,
  Search,
  Sprout,
  Wheat,
} from "lucide-react";
import type { Workspace, Farm, Page, PlantingPreset } from "@/lib/types";
import {
  activePlanting,
  formatDate,
  numberID,
  plotStatus,
  today,
} from "@/lib/garden";
import { Badge, EmptyState } from "./ui";
import { PlotCard } from "./plot-card";

export function GardensPage({
  data,
  farmId,
  onFarm,
  onAddFarm,
  onEditFarm,
  onAddPlot,
  onPlot,
}: {
  data: Workspace;
  farmId: string;
  onFarm: (id: string) => void;
  onAddFarm: () => void;
  onEditFarm: (id: string) => void;
  onAddPlot: () => void;
  onPlot: (id: string) => void;
}) {
  const [filter, setFilter] = useState("Semua petak");
  const [query, setQuery] = useState("");
  const farm = data.farms.find((f) => f.id === farmId) || data.farms[0];
  const plots = data.plots.filter((p) => p.farmId === farm?.id);
  const filtered = plots.filter((plot) => {
    const crop = data.crops.find(
      (c) => c.id === activePlanting(data, plot.id)?.cropId,
    );
    return (
      `${plot.name} ${crop?.commonName || ""}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (filter === "Semua petak" || plotStatus(data, plot) === filter)
    );
  });
  return (
    <div className="page-enter">
      <div className="page-heading">
        <div>
          <span className="eyebrow">RUANG KECIL, BANYAK KEMUNGKINAN</span>
          <h1>Kebun & petak</h1>
          <p>
            Kenali setiap sudut kebun dan apa yang sedang tumbuh di dalamnya.
          </p>
        </div>
        <button className="button button-primary" onClick={onAddPlot}>
          <Plus size={17} /> Tambah petak
        </button>
      </div>
      <div className="farm-tabs">
        {data.farms.map((item) => (
          <button
            className={farm?.id === item.id ? "active" : ""}
            onClick={() => {
              onFarm(item.id);
              setFilter("Semua petak");
            }}
            key={item.id}
          >
            <House size={16} />
            {item.name}
          </button>
        ))}
        <button className="add-farm-tab" onClick={onAddFarm}>
          <Plus size={16} /> Kebun baru
        </button>
      </div>
      {farm ? (
        <>
          <section className="farm-summary">
            <span className="farm-summary-icon">
              <House size={31} strokeWidth={1.4} />
            </span>
            <div>
              <h2>{farm.name}</h2>
              <p>
                <MapPin size={13} />
                {farm.location}
              </p>
            </div>
            <div className="farm-summary-stat">
              <strong>{plots.length}</strong>
              <span>petak kebun</span>
            </div>
            <div className="farm-summary-stat">
              <strong>
                {numberID(plots.reduce((sum, p) => sum + p.area, 0))}
                <small> m²</small>
              </strong>
              <span>total luas tanam</span>
            </div>
            <button
              className="button button-secondary"
              onClick={() => onEditFarm(farm.id)}
            >
              <Edit3 size={15} />
              <span>Edit kebun</span>
            </button>
          </section>
          <div className="list-toolbar">
            <div className="tabs filter-tabs">
              {[
                "Semua petak",
                "Dalam pertumbuhan",
                "Siap panen",
                "Siap ditanam",
                "Terjadwal",
              ].map((item) => (
                <button
                  key={item}
                  className={filter === item ? "active" : ""}
                  onClick={() => setFilter(item)}
                >
                  {item === "Dalam pertumbuhan" ? "Sedang tumbuh" : item}
                </button>
              ))}
            </div>
            <label className="search-field">
              <Search size={16} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari petak atau tanaman..."
                aria-label="Cari petak"
              />
            </label>
          </div>
          {filtered.length || (!query && filter === "Semua petak") ? (
            <div className="garden-plot-grid">
              {filtered.map((plot) => (
                <PlotCard
                  plot={plot}
                  data={data}
                  onClick={() => onPlot(plot.id)}
                  key={plot.id}
                />
              ))}
              <button className="add-plot-card" onClick={onAddPlot}>
                <span>
                  <Plus size={26} strokeWidth={1.5} />
                </span>
                <h3>Ruang untuk tumbuh lagi</h3>
                <p>
                  Tambahkan petak baru
                  <br />
                  untuk cerita kebun berikutnya.
                </p>
                <strong>
                  Tambah petak <ArrowRight size={14} />
                </strong>
              </button>
            </div>
          ) : (
            <EmptyState
              title="Petak belum ditemukan"
              description="Coba kata kunci atau filter lain untuk menemukan petakmu."
            >
              <button
                className="button button-secondary"
                onClick={() => {
                  setQuery("");
                  setFilter("Semua petak");
                }}
              >
                Tampilkan semua petak
              </button>
            </EmptyState>
          )}
        </>
      ) : (
        <EmptyState
          title="Kebun pertama, langkah pertama."
          description="Buat kebunmu, tambahkan petak, dan mulai perjalanan berkebun yang lebih terarah."
        >
          <button className="button button-primary" onClick={onAddFarm}>
            <Plus size={16} /> Buat kebun pertama
          </button>
        </EmptyState>
      )}
    </div>
  );
}

export function HistoryPage({
  data,
  onPlant,
  onNotes,
}: {
  data: Workspace;
  onPlant: () => void;
  onNotes: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [plot, setPlot] = useState("");
  const [status, setStatus] = useState("");
  const rows = data.plantings
    .map((p) => ({
      ...p,
      crop: data.crops.find((c) => c.id === p.cropId),
      plot: data.plots.find((x) => x.id === p.plotId),
      status: p.harvestedOn
        ? "Selesai"
        : p.plantedOn > today()
          ? "Terjadwal"
          : "Aktif",
    }))
    .filter(
      (row) =>
        (!plot || row.plotId === plot) &&
        (!status || row.status === status) &&
        `${row.crop?.commonName} ${row.plot?.name} ${row.notes}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    );
  function exportCSV() {
    const cell = (value: string) =>
      `"${(/^[=+\-@]/.test(value) ? "'" : "") + value.replace(/"/g, '""')}"`;
    const lines = [
      [
        "Petak",
        "Tanaman",
        "Keluarga",
        "Tanggal tanam",
        "Tanggal panen",
        "Perkiraan panen",
        "Status",
        "Catatan",
      ],
      ...rows.map((row) => [
        row.plot?.name || "",
        row.crop?.commonName || "",
        data.families.find((f) => f.id === row.crop?.familyId)?.name || "",
        row.plantedOn,
        row.harvestedOn || "",
        row.expectedHarvestOn || "",
        row.status,
        row.notes,
      ]),
    ];
    const blob = new Blob(
      ["\uFEFF" + lines.map((line) => line.map(cell).join(",")).join("\r\n")],
      { type: "text/csv;charset=utf-8;" },
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `terrasiklus-riwayat-${today()}.csv`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className="page-enter">
      <div className="page-heading">
        <div>
          <span className="eyebrow">SETIAP MUSIM MENYIMPAN PELAJARAN</span>
          <h1>Riwayat tanam</h1>
          <p>Jejak perjalanan tanamanmu, dari benih hingga panen.</p>
        </div>
        <div className="heading-actions">
          <button
            className="button button-secondary"
            onClick={exportCSV}
            disabled={!rows.length}
          >
            <Download size={16} /> Ekspor CSV
          </button>
          <button className="button button-primary" onClick={onPlant}>
            <Plus size={16} /> Catat penanaman
          </button>
        </div>
      </div>
      <div className="history-summary">
        <div>
          <span className="summary-icon">
            <BookOpen size={22} />
          </span>
          <span>
            <strong>{data.plantings.length}</strong> catatan penanaman
          </span>
        </div>
        <div>
          <span className="summary-icon">
            <Sprout size={22} />
          </span>
          <span>
            <strong>
              {
                data.plantings.filter(
                  (p) => !p.harvestedOn && p.plantedOn <= today(),
                ).length
              }
            </strong>{" "}
            sedang bertumbuh
          </span>
        </div>
        <div>
          <span className="summary-icon orange">
            <Wheat size={22} />
          </span>
          <span>
            <strong>
              {data.plantings.filter((p) => p.harvestedOn).length}
            </strong>{" "}
            musim berhasil dipanen
          </span>
        </div>
      </div>
      <section className="panel history-panel">
        <div className="table-toolbar">
          <label className="search-field">
            <Search size={16} />
            <input
              aria-label="Cari riwayat penanaman"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari tanaman, petak, atau catatan..."
            />
          </label>
          <div>
            <select
              aria-label="Filter petak"
              value={plot}
              onChange={(event) => setPlot(event.target.value)}
            >
              <option value="">Semua petak</option>
              {data.plots.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select
              aria-label="Filter status penanaman"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="">Semua status</option>
              {["Aktif", "Selesai", "Terjadwal"].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
        </div>
        {rows.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Tanaman</th>
                  <th>Petak</th>
                  <th>Tanggal tanam</th>
                  <th>Panen / perkiraan</th>
                  <th>Status</th>
                  <th>Catatan</th>
                  <th aria-label="Tindakan" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="table-crop">
                        <span>
                          <Sprout size={18} />
                        </span>
                        <div>
                          <strong>{row.crop?.commonName}</strong>
                          <small>
                            {
                              data.families.find(
                                (f) => f.id === row.crop?.familyId,
                              )?.name
                            }
                          </small>
                        </div>
                      </div>
                    </td>
                    <td className="table-strong">{row.plot?.name}</td>
                    <td>{formatDate(row.plantedOn, true)}</td>
                    <td>
                      {row.harvestedOn || row.expectedHarvestOn ? (
                        <>
                          {formatDate(
                            (row.harvestedOn || row.expectedHarvestOn)!,
                            true,
                          )}
                          {!row.harvestedOn && (
                            <small className="estimated-label">Perkiraan</small>
                          )}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <Badge
                        tone={
                          row.status === "Aktif"
                            ? "green"
                            : row.status === "Terjadwal"
                              ? "orange"
                              : "neutral"
                        }
                      >
                        {row.status}
                      </Badge>
                    </td>
                    <td>
                      <button
                        className="notes-preview"
                        onClick={() => onNotes(row.id)}
                      >
                        {row.notes || "Tambah catatan"}
                      </button>
                    </td>
                    <td>
                      <button
                        className="icon-button"
                        aria-label={`Detail penanaman ${row.crop?.commonName} di ${row.plot?.name}`}
                        onClick={() => onNotes(row.id)}
                      >
                        <MoreHorizontal size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="Belum ada catatan yang cocok"
            description="Ubah filter pencarian atau mulai catat penanaman pertamamu."
          />
        )}
        <div className="table-footer">
          <span>
            Menampilkan {rows.length} dari {data.plantings.length} catatan
          </span>
          <span>
            <Check size={13} /> Tersimpan di kebunmu
          </span>
        </div>
      </section>
    </div>
  );
}

export function CatalogPage({
  data,
  search,
  onSearch,
  onPlant,
}: {
  data: Workspace;
  search: string;
  onSearch: (value: string) => void;
  onPlant: (preset: PlantingPreset) => void;
}) {
  const [family, setFamily] = useState("");
  const [demand, setDemand] = useState("");
  const filtered = data.crops.filter(
    (c) =>
      c.commonName.toLowerCase().includes(search.toLowerCase()) &&
      (!family || c.familyId === family) &&
      (!demand || c.nutrientDemand === demand),
  );
  return (
    <div className="page-enter">
      <div className="page-heading">
        <div>
          <span className="eyebrow">KENALI SEBELUM MENANAM</span>
          <h1>Katalog tanaman</h1>
          <p>Temukan tanaman yang tepat untuk kebun dan musim berikutnya.</p>
        </div>
        <span className="catalog-total">
          <BookOpen size={17} /> {data.crops.length} tanaman ·{" "}
          {data.families.length} keluarga
        </span>
      </div>
      <div className="catalog-banner">
        <span>
          <BookOpen size={28} strokeWidth={1.4} />
        </span>
        <div>
          <h3>Kenal keluarganya, tepat rotasinya.</h3>
          <p>
            Tomat, cabai, dan terong ternyata satu keluarga. Berganti jenis
            belum tentu berganti keluarga tanaman.
          </p>
        </div>
        <Leaf size={59} strokeWidth={0.8} />
      </div>
      <div className="catalog-toolbar">
        <label className="search-field">
          <Search size={17} />
          <input
            aria-label="Cari tanaman di katalog"
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Cari tanaman favoritmu..."
          />
        </label>
        <select
          aria-label="Filter keluarga tanaman"
          value={family}
          onChange={(event) => setFamily(event.target.value)}
        >
          <option value="">Semua keluarga</option>
          {data.families.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter kebutuhan hara"
          value={demand}
          onChange={(event) => setDemand(event.target.value)}
        >
          <option value="">Semua kebutuhan hara</option>
          {["Tinggi", "Sedang", "Rendah"].map((d) => (
            <option key={d} value={d}>
              Hara {d.toLowerCase()}
            </option>
          ))}
        </select>
      </div>
      <div className="catalog-result-label">
        <span>{filtered.length} tanaman untuk dijelajahi</span>
        {(search || family || demand) && (
          <button
            className="text-button"
            onClick={() => {
              onSearch("");
              setFamily("");
              setDemand("");
            }}
          >
            Reset filter
          </button>
        )}
      </div>
      {filtered.length ? (
        <div className="catalog-grid">
          {filtered.map((crop) => {
            const familyName =
              data.families.find((f) => f.id === crop.familyId)?.name || "";
            const Icon =
              familyName === "Fabaceae"
                ? Bean
                : familyName === "Apiaceae"
                  ? Carrot
                  : familyName === "Solanaceae"
                    ? Cherry
                    : familyName === "Asteraceae"
                      ? Flower2
                      : Leaf;
            return (
              <article className="catalog-card" key={crop.id}>
                <div
                  className={`catalog-card-top crop-${familyName.toLowerCase()}`}
                >
                  <span>
                    <Icon size={39} strokeWidth={1.2} />
                  </span>
                  <span className="catalog-family">{familyName}</span>
                </div>
                <div className="catalog-card-body">
                  <h3>{crop.commonName}</h3>
                  <div className="catalog-fact">
                    <span>
                      <Leaf size={14} /> Kebutuhan hara
                    </span>
                    <strong
                      className={`demand-${crop.nutrientDemand.toLowerCase()}`}
                    >
                      {crop.nutrientDemand}
                    </strong>
                  </div>
                  <div className="catalog-fact">
                    <span>
                      <CalendarDays size={14} /> Perkiraan panen
                    </span>
                    <strong>±{crop.daysToHarvest} hari</strong>
                  </div>
                  <button
                    className="button button-secondary"
                    onClick={() => onPlant({ cropId: crop.id })}
                  >
                    Pilih tanaman <ArrowRight size={14} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="Tanaman belum ditemukan"
          description="Coba nama tanaman atau kombinasi filter yang berbeda."
        >
          <button
            className="button button-secondary"
            onClick={() => {
              onSearch("");
              setFamily("");
              setDemand("");
            }}
          >
            Lihat semua tanaman
          </button>
        </EmptyState>
      )}
      <p className="page-disclaimer">
        <Leaf size={14} /> Waktu panen adalah perkiraan dan dapat berbeda sesuai
        varietas, cuaca, serta perawatan.
      </p>
    </div>
  );
}

export function GardenGuide({
  onNavigate,
}: {
  onNavigate: (page: Page) => void;
}) {
  return (
    <div className="garden-guide">
      <div className="guide-intro">
        <span>
          <Sprout size={34} strokeWidth={1.4} />
        </span>
        <h3>Tanah yang dirawat akan merawat kita.</h3>
        <p>
          Empat langkah sederhana untuk memulai kebiasaan berkebun yang lebih
          bijak.
        </p>
      </div>
      {[
        {
          number: "01",
          title: "Kenali ruang tumbuhmu",
          description:
            "Buat kebun dan bagi menjadi petak. Catat luas serta jenis tanah untuk memahami karakter masing-masing area.",
          page: "gardens" as const,
        },
        {
          number: "02",
          title: "Catat setiap musim",
          description:
            "Simpan jenis tanaman, tanggal tanam, hasil panen, dan pengamatan hama. Catatan kecil hari ini menjadi bekal musim berikutnya.",
          page: "history" as const,
        },
        {
          number: "03",
          title: "Berganti keluarga, bukan sekadar jenis",
          description:
            "Tomat dan cabai sama-sama Solanaceae. Setelah tomat, pertimbangkan Fabaceae seperti buncis atau keluarga berbeda lainnya.",
          page: "rotation" as const,
        },
        {
          number: "04",
          title: "Dengarkan kebutuhan tanah",
          description:
            "Uji pH, nitrogen, fosfor, kalium, dan bahan organik secara berkala. Gunakan hasilnya untuk menyesuaikan perawatan.",
          page: "soil" as const,
        },
      ].map((step) => (
        <button
          className="guide-step"
          key={step.number}
          onClick={() => onNavigate(step.page)}
        >
          <span>{step.number}</span>
          <div>
            <h4>{step.title}</h4>
            <p>{step.description}</p>
          </div>
          <ArrowRight size={17} />
        </button>
      ))}
      <div className="guide-faq">
        <h3>Pertanyaan yang sering tumbuh</h3>
        <details>
          <summary>Kenapa rotasi tanaman penting?</summary>
          <p>
            Rotasi membantu mengurangi penumpukan hama dan patogen yang
            menyerang keluarga tertentu. Kebutuhan unsur hara yang berbeda juga
            membantu mengelola tanah secara lebih seimbang, tetapi tidak
            menggantikan pemupukan berdasarkan hasil uji.
          </p>
        </details>
        <details>
          <summary>Apakah rekomendasi menjamin bebas hama?</summary>
          <p>
            Tidak. Rotasi adalah salah satu bagian pengelolaan kebun terpadu.
            Tetap jaga sanitasi, amati tanaman, gunakan benih sehat, dan
            konsultasikan masalah dengan penyuluh pertanian setempat.
          </p>
        </details>
        <details>
          <summary>Kapan perlu menguji tanah?</summary>
          <p>
            Awal musim adalah waktu yang baik. Ikuti metode dan jadwal
            laboratorium atau penyuluh; aplikasi mengingatkan ketika catatan
            terakhir melewati 90 hari.
          </p>
        </details>
        <details>
          <summary>Bagaimana data kebun saya disimpan?</summary>
          <p>
            Catatan disimpan di PostgreSQL, bukan hanya di peramban. Versi ini
            memakai ruang kerja contoh bersama tanpa login. Ekspor riwayat CSV
            untuk menyimpan salinan sendiri.
          </p>
        </details>
      </div>
      <a className="guide-about" href="/tentang">
        Kenali lebih dekat TerraSiklus <ArrowUpRight size={15} />
      </a>
    </div>
  );
}
