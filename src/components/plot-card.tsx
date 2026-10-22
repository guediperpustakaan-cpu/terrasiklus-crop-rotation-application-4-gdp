"use client";

import {
  ArrowUpRight,
  CalendarDays,
  Leaf,
  Maximize2,
  Plus,
  Sprout,
} from "lucide-react";
import type { Plot, Workspace } from "@/lib/types";
import {
  activePlanting,
  formatDate,
  numberID,
  plantingProgress,
  plotStatus,
} from "@/lib/garden";
import { Badge } from "./ui";

export function PlotCard({
  plot,
  data,
  onClick,
}: {
  plot: Plot;
  data: Workspace;
  onClick: () => void;
}) {
  const planting = activePlanting(data, plot.id);
  const nextPlanting = data.plantings.find(
    (p) => p.plotId === plot.id && !p.harvestedOn,
  );
  const crop = data.crops.find(
    (c) => c.id === (planting || nextPlanting)?.cropId,
  );
  const family = data.families.find((f) => f.id === crop?.familyId);
  const progress = planting ? plantingProgress(data, planting) : undefined;
  const status = plotStatus(data, plot);
  const ready = status === "Siap panen";
  return (
    <button
      className={`plot-card ${!crop ? "plot-empty" : ""}`}
      onClick={onClick}
      aria-label={`Lihat ${plot.name}${crop ? `, ${crop.commonName}` : ""}`}
    >
      <div className="plot-image">
        {crop ? (
          <img
            src={crop.image}
            alt={`${crop.commonName} di ${plot.name}`}
            loading="lazy"
          />
        ) : (
          <div className="empty-plot-art">
            <Sprout size={50} strokeWidth={1} />
            <span>Ruang untuk awal yang baru</span>
          </div>
        )}
        <Badge tone={ready ? "orange" : !planting ? "neutral" : "green"}>
          {status}
        </Badge>
        <span className="plot-image-link">
          <ArrowUpRight size={16} />
        </span>
      </div>
      <div className="plot-card-body">
        <div className="plot-card-kicker">
          <span>{plot.name}</span>
          <span>
            <Maximize2 size={11} />
            {numberID(plot.area)} m²
          </span>
        </div>
        <h3>{crop?.commonName || "Siap untuk ditanam"}</h3>
        <p className="botanical-name">
          {family?.name || "Mulai cerita baru di petak ini"}
        </p>
        <div className="plot-soil">
          <Leaf size={12} />
          <span>Tanah {plot.soilType.toLowerCase()}</span>
        </div>
        {progress ? (
          <>
            <div className="growth-label">
              <span>Hari ke-{progress.elapsed}</span>
              <strong className={ready ? "text-orange" : ""}>
                {ready ? "Saatnya panen!" : `${progress.percent}% tumbuh`}
              </strong>
            </div>
            <div className={`progress-track ${ready ? "progress-orange" : ""}`}>
              <span style={{ width: `${progress.percent}%` }} />
            </div>
            <div className="plot-card-footer">
              <CalendarDays size={12} />
              <span>
                {ready ? "Siap dipanen sejak" : "Perkiraan panen"}{" "}
                <strong>{formatDate(progress.end)}</strong>
              </span>
            </div>
          </>
        ) : (
          <div className="plot-empty-footer">
            {nextPlanting ? (
              <>
                <CalendarDays size={14} /> Dijadwalkan{" "}
                {formatDate(nextPlanting.plantedOn)}
              </>
            ) : (
              <>
                <Plus size={14} /> Rencanakan penanaman pertama
              </>
            )}
          </div>
        )}
      </div>
    </button>
  );
}
