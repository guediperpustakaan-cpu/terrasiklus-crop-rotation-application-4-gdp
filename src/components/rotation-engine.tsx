"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Bean,
  CalendarDays,
  Check,
  ChevronRight,
  CircleHelp,
  History,
  Leaf,
  LoaderCircle,
  RotateCw,
  ShieldCheck,
  Sparkles,
  Sprout,
} from "lucide-react";
import type { Workspace, Recommendation, PlantingPreset } from "@/lib/types";
import { formatDate, rotationRecommendations } from "@/lib/garden";
import { EmptyState } from "./ui";

export function RotationEngine({
  data,
  plotId,
  onPlotChange,
  onPlan,
  onGuide,
  onCreate,
}: {
  data: Workspace;
  plotId: string;
  onPlotChange: (id: string) => void;
  onPlan: (preset: PlantingPreset) => void;
  onGuide: () => void;
  onCreate: () => void;
}) {
  const selected = data.plots.find((p) => p.id === plotId) || data.plots[0];
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const selectedId = selected?.id;
  useEffect(() => {
    if (!selectedId) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetch(`/api/rotation?plotId=${selectedId}`, { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok)
          throw new Error(result.error || "Rekomendasi belum tersedia.");
        setRecommendations(result);
      })
      .catch((err) => {
        if (err.name !== "AbortError")
          setError(
            err instanceof TypeError
              ? "Koneksi belum tersedia. Periksa jaringan dan coba kembali."
              : err.message,
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [selectedId, data.plantings, retry]);
  const history = data.plantings
    .filter((p) => p.plotId === selectedId)
    .slice(0, 3)
    .reverse();
  const good = recommendations.filter((r) => r.recommended);
  const avoid = recommendations.filter((r) => !r.recommended);
  if (!selected)
    return (
      <EmptyState
        title="Berikan ruang untuk tumbuh"
        description="Tambahkan petak terlebih dahulu untuk mendapatkan rekomendasi rotasi."
      >
        <button className="button button-primary" onClick={onCreate}>
          Buat petak pertama
        </button>
      </EmptyState>
    );
  return (
    <div className="page-enter">
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            BERENCANA HARI INI, PANEN LEBIH BAIK ESOK HARI
          </span>
          <h1>Rencana rotasi</h1>
          <p>Tanaman yang berbeda. Tanah yang lebih seimbang.</p>
        </div>
        <button className="button button-secondary" onClick={onGuide}>
          <CircleHelp size={17} /> Cara kerja rotasi
        </button>
      </div>
      <div className="rotation-intro">
        <div className="rotation-intro-icon">
          <RotateCw size={33} strokeWidth={1.4} />
          <Leaf size={15} />
        </div>
        <div>
          <h2>Musim baru, kesempatan baru.</h2>
          <p>
            Rekomendasi disusun dari keluarga tanaman dan riwayat petakmu, bukan
            sekadar tebakan.
          </p>
        </div>
        <span className="badge badge-green">
          <Sparkles size={12} /> Rotasi cerdas
        </span>
      </div>
      <section className="panel rotation-history">
        <div className="panel-heading">
          <div>
            <h2>
              <History size={18} /> Kenali riwayat petak
            </h2>
            <p>Melihat ke belakang untuk merencanakan yang lebih baik.</p>
          </div>
          <label className="select-with-label">
            <span>Pilih petak</span>
            <select
              aria-label="Petak untuk rekomendasi rotasi"
              value={selected.id}
              onChange={(event) => onPlotChange(event.target.value)}
            >
              {data.plots.map((plot) => (
                <option key={plot.id} value={plot.id}>
                  {plot.name} ·{" "}
                  {data.farms.find((f) => f.id === plot.farmId)?.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="rotation-timeline">
          {history.length ? (
            history.map((planting, i) => {
              const crop = data.crops.find((c) => c.id === planting.cropId);
              return (
                <div className="timeline-step-wrap" key={planting.id}>
                  <div className="timeline-step">
                    <span className="timeline-plant-icon">
                      <Sprout size={21} />
                    </span>
                    <div>
                      <small>
                        {planting.harvestedOn
                          ? "MUSIM SEBELUMNYA"
                          : "MUSIM TERKINI"}
                      </small>
                      <h3>{crop?.commonName}</h3>
                      <span>
                        {
                          data.families.find((f) => f.id === crop?.familyId)
                            ?.name
                        }
                      </span>
                      <p>
                        {formatDate(planting.plantedOn)}
                        {planting.harvestedOn
                          ? ` – ${formatDate(planting.harvestedOn)}`
                          : " · masih bertumbuh"}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={18} />
                </div>
              );
            })
          ) : (
            <p className="muted">
              Belum ada riwayat. Mulai dengan salah satu tanaman di bawah.
            </p>
          )}
          <div className="timeline-step timeline-future">
            <span className="timeline-plant-icon">
              <Sparkles size={21} />
            </span>
            <div>
              <small>MUSIM BERIKUTNYA</small>
              <h3>Keluarga baru</h3>
              <span>Awal yang lebih seimbang</span>
            </div>
          </div>
        </div>
      </section>
      <div className="section-heading recommendations-heading">
        <div>
          <h2>
            <ShieldCheck size={20} /> Pilihan terbaik untuk {selected.name}
          </h2>
          <p>Keluarga berbeda, lebih sedikit risiko hama berulang.</p>
        </div>
        <span className="recommendation-count">
          {good.length} pilihan tanaman
        </span>
      </div>
      {error ? (
        <div className="form-error">
          <AlertTriangle size={19} />
          <span>{error}</span>
          <button className="text-button" onClick={() => setRetry(retry + 1)}>
            Coba kembali
          </button>
        </div>
      ) : loading ? (
        <div className="loading-panel">
          <LoaderCircle className="spin" size={25} />
          <span>Membaca riwayat tanah dan tanaman...</span>
        </div>
      ) : (
        <>
          <div className="recommendation-grid">
            {good.slice(0, 6).map((rec, index) => (
              <article
                className={`recommendation-card ${index === 0 ? "recommendation-best" : ""}`}
                key={rec.crop.id}
              >
                <div className="recommendation-top">
                  <span className="recommendation-plant">
                    {rec.family === "Fabaceae" ? (
                      <Bean size={29} strokeWidth={1.4} />
                    ) : (
                      <Sprout size={29} strokeWidth={1.4} />
                    )}
                  </span>
                  <span
                    className={`badge ${index === 0 ? "badge-green" : "badge-neutral"}`}
                  >
                    {index === 0 ? (
                      <>
                        <Sparkles size={11} /> Pilihan utama
                      </>
                    ) : (
                      <>
                        <Check size={11} /> Cocok untuk rotasi
                      </>
                    )}
                  </span>
                </div>
                <h3>{rec.crop.commonName}</h3>
                <span className="botanical-name">{rec.family}</span>
                <p>{rec.reason}</p>
                <div className="recommendation-facts">
                  <span>
                    <CalendarDays size={13} /> ±{rec.crop.daysToHarvest} hari
                  </span>
                  <span>
                    <Leaf size={13} /> Hara{" "}
                    {rec.crop.nutrientDemand.toLowerCase()}
                  </span>
                </div>
                <button
                  className={`button ${index === 0 ? "button-primary" : "button-secondary"}`}
                  onClick={() =>
                    onPlan({
                      plotId: selected.id,
                      cropId: rec.crop.id,
                      planned: true,
                    })
                  }
                >
                  Rencanakan tanam <ArrowRight size={15} />
                </button>
              </article>
            ))}
          </div>
          {avoid.length > 0 && (
            <section className="rotation-avoid">
              <div className="avoid-heading">
                <AlertTriangle size={21} />
                <div>
                  <h3>Sebaiknya beri jeda untuk keluarga ini</h3>
                  <p>
                    Tanaman berikut satu keluarga dengan musim terakhir. Pilih
                    keluarga lain untuk membantu memutus siklus hama.
                  </p>
                </div>
              </div>
              <div className="avoid-options">
                {avoid.map((rec) => (
                  <button
                    key={rec.crop.id}
                    onClick={() =>
                      onPlan({
                        plotId: selected.id,
                        cropId: rec.crop.id,
                        planned: true,
                      })
                    }
                  >
                    <span>
                      <strong>{rec.crop.commonName}</strong>
                      <small>{rec.family}</small>
                    </span>
                    <span>
                      Perlu perhatian <ChevronRight size={14} />
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}
        </>
      )}
      <p className="page-disclaimer">
        <Leaf size={14} /> Rekomendasi adalah panduan umum. Pertimbangkan iklim,
        musim, hasil uji tanah, dan saran penyuluh setempat.
      </p>
    </div>
  );
}
