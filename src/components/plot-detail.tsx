"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ArrowRight,
  CalendarDays,
  Edit3,
  FlaskConical,
  Leaf,
  MapPin,
  Maximize2,
  Plus,
  RotateCw,
  Sprout,
  Wheat,
} from "lucide-react";
import type { Workspace, Plot, PlantingPreset } from "@/lib/types";
import {
  activePlanting,
  formatDate,
  latestSoil,
  numberID,
  plantingProgress,
  plotStatus,
  soilCondition,
} from "@/lib/garden";
import { Badge } from "./ui";

export function PlotDetail({
  plot,
  data,
  onEdit,
  onPlant,
  onHarvest,
  onSoil,
  onRotate,
  onNotes,
}: {
  plot: Plot;
  data: Workspace;
  onEdit: () => void;
  onPlant: (preset: PlantingPreset) => void;
  onHarvest: (id: string) => void;
  onSoil: () => void;
  onRotate: () => void;
  onNotes: (id: string) => void;
}) {
  const [tab, setTab] = useState("overview");
  const planting = activePlanting(data, plot.id);
  const crop = data.crops.find((c) => c.id === planting?.cropId);
  const soil = latestSoil(data, plot.id);
  const progress = planting ? plantingProgress(data, planting) : null;
  const status = plotStatus(data, plot);
  const history = data.plantings.filter((p) => p.plotId === plot.id);
  return (
    <div className="plot-detail">
      <div className="detail-photo">
        <Image
          src={crop?.image || "/images/hero.jpg"}
          alt={
            crop ? `${crop.commonName} di ${plot.name}` : "Kebun sayuran hijau"
          }
          fill
          sizes="(max-width: 900px) 100vw, 640px"
        />
        <Badge tone={status === "Siap panen" ? "orange" : "green"}>
          {status}
        </Badge>
        <button className="button button-secondary" onClick={onEdit}>
          <Edit3 size={13} /> Edit petak
        </button>
      </div>
      <div className="detail-meta">
        <span>
          <MapPin size={14} />
          {data.farms.find((f) => f.id === plot.farmId)?.name}
        </span>
        <span>
          <Maximize2 size={13} />
          {numberID(plot.area)} m²
        </span>
        <span>
          <Leaf size={14} />
          {plot.soilType}
        </span>
      </div>
      <div className="tabs detail-tabs" role="tablist">
        {[
          { id: "overview", name: "Ringkasan" },
          { id: "history", name: `Riwayat tanam (${history.length})` },
          { id: "soil", name: "Kondisi tanah" },
        ].map((item) => (
          <button
            role="tab"
            aria-selected={tab === item.id}
            className={tab === item.id ? "active" : ""}
            onClick={() => setTab(item.id)}
            key={item.id}
          >
            {item.name}
          </button>
        ))}
      </div>
      {tab === "overview" && (
        <div className="detail-overview">
          {crop && planting && progress ? (
            <div className="current-crop">
              <div className="current-crop-heading">
                <span className="crop-small-icon">
                  <Sprout size={25} />
                </span>
                <div>
                  <span className="eyebrow">SEDANG TUMBUH</span>
                  <h3>{crop.commonName}</h3>
                  <p>
                    {data.families.find((f) => f.id === crop.familyId)?.name}
                  </p>
                </div>
                <span className="days-counter">
                  <strong>{progress.elapsed}</strong>hari tumbuh
                </span>
              </div>
              <div className="progress-track">
                <span style={{ width: `${progress.percent}%` }} />
              </div>
              <div className="current-crop-dates">
                <span>Ditanam {formatDate(planting.plantedOn)}</span>
                <span>Est. panen {formatDate(progress.end)}</span>
              </div>
              {planting.notes && (
                <p className="planting-note">“{planting.notes}”</p>
              )}
              <button
                className="button button-secondary"
                onClick={() => onHarvest(planting.id)}
              >
                <Wheat size={16} /> Catat hasil panen
              </button>
            </div>
          ) : (
            <div className="detail-empty">
              <Sprout size={31} />
              <h3>Petak ini siap untuk awal yang baru.</h3>
              <p>Pilih tanaman yang cocok dan mulai musim pertamamu.</p>
              <button
                className="button button-primary"
                onClick={() => onPlant({ plotId: plot.id })}
              >
                <Plus size={15} /> Catat penanaman
              </button>
            </div>
          )}
          <div className="detail-soil-summary">
            <div>
              <FlaskConical size={17} />
              <strong>Kondisi tanah terakhir</strong>
            </div>
            {soil ? (
              <>
                <span>
                  pH <strong>{numberID(soil.ph)}</strong>
                  <Badge
                    tone={
                      soilCondition(soil.ph) === "Optimal" ? "green" : "orange"
                    }
                  >
                    {soilCondition(soil.ph)}
                  </Badge>
                </span>
                <button className="text-button" onClick={() => setTab("soil")}>
                  Lihat hasil <ArrowRight size={13} />
                </button>
              </>
            ) : (
              <button className="text-button" onClick={onSoil}>
                Catat uji pertama <ArrowRight size={13} />
              </button>
            )}
          </div>
        </div>
      )}
      {tab === "history" && (
        <div className="detail-history">
          {history.length ? (
            history.map((item) => {
              const c = data.crops.find((crop) => crop.id === item.cropId);
              return (
                <button key={item.id} onClick={() => onNotes(item.id)}>
                  <span className="history-dot">
                    <Sprout size={17} />
                  </span>
                  <div>
                    <h4>
                      {c?.commonName}
                      <Badge tone={item.harvestedOn ? "neutral" : "green"}>
                        {item.harvestedOn
                          ? "Selesai"
                          : item.plantedOn >
                              new Date().toISOString().slice(0, 10)
                            ? "Terjadwal"
                            : "Aktif"}
                      </Badge>
                    </h4>
                    <p>
                      {data.families.find((f) => f.id === c?.familyId)?.name} ·{" "}
                      {formatDate(item.plantedOn, true)}
                    </p>
                    {item.notes && <small>{item.notes}</small>}
                  </div>
                  <ArrowRight size={14} />
                </button>
              );
            })
          ) : (
            <p className="muted">Belum ada riwayat penanaman di petak ini.</p>
          )}
        </div>
      )}
      {tab === "soil" && (
        <div className="detail-soil">
          {soil ? (
            <>
              <div className="section-heading">
                <h3>Hasil uji terakhir</h3>
                <span className="muted">{formatDate(soil.testedOn, true)}</span>
              </div>
              <div className="detail-soil-values">
                {[
                  {
                    label: "pH tanah",
                    value: numberID(soil.ph),
                    unit: soilCondition(soil.ph),
                  },
                  {
                    label: "Nitrogen (N)",
                    value: numberID(soil.n),
                    unit: "mg/kg",
                  },
                  {
                    label: "Fosfor (P)",
                    value: numberID(soil.p),
                    unit: "mg/kg",
                  },
                  {
                    label: "Kalium (K)",
                    value: numberID(soil.k),
                    unit: "mg/kg",
                  },
                  {
                    label: "Bahan organik",
                    value: numberID(soil.organicMatter),
                    unit: "%",
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                    <small>{item.unit}</small>
                  </div>
                ))}
              </div>
              <div className="inline-note">
                <Leaf size={17} />
                <span>
                  Hasil uji berkala membantumu menyesuaikan pemupukan dengan
                  kebutuhan tanah yang sebenarnya.
                </span>
              </div>
            </>
          ) : (
            <div className="detail-empty">
              <FlaskConical size={31} />
              <h3>Tanahmu masih menyimpan cerita.</h3>
              <p>Catat uji pertama untuk mengenal kondisi petak ini.</p>
            </div>
          )}
        </div>
      )}
      <div className="detail-actions">
        <button className="button button-secondary" onClick={onSoil}>
          <FlaskConical size={16} /> Catat uji tanah
        </button>
        <button className="button button-primary" onClick={onRotate}>
          <RotateCw size={16} /> Rekomendasi rotasi
        </button>
      </div>
    </div>
  );
}
