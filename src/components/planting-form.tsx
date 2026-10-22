"use client";

import { useState, type FormEvent } from "react";
import { AlertTriangle, CheckCircle2, Info, Sprout } from "lucide-react";
import type { Workspace, Mutation, PlantingPreset } from "@/lib/types";
import {
  activePlanting,
  addDays,
  formatDate,
  rotationRecommendations,
  today,
} from "@/lib/garden";
import { ErrorMessage, SubmitButton } from "./ui";

function nextDate(data: Workspace, plotId: string) {
  const ends = data.plantings
    .filter((p) => p.plotId === plotId)
    .map(
      (p) =>
        p.harvestedOn ||
        p.expectedHarvestOn ||
        addDays(
          p.plantedOn,
          data.crops.find((c) => c.id === p.cropId)?.daysToHarvest || 60,
        ),
    )
    .sort();
  const earliest = addDays(today(), 1);
  return ends.length
    ? [earliest, addDays(ends[ends.length - 1], 1)].sort().at(-1)!
    : earliest;
}
export function PlantingForm({
  data,
  preset = {},
  mutate,
  onSaved,
  onCancel,
}: {
  data: Workspace;
  preset?: PlantingPreset;
  mutate: Mutation;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const initialPlot =
    preset.plotId ||
    data.plots.find((p) => !activePlanting(data, p.id))?.id ||
    data.plots[0]?.id ||
    "";
  const initialCrop =
    preset.cropId ||
    data.crops.find((c) => c.commonName === "Tomat ceri")?.id ||
    data.crops[0]?.id ||
    "";
  const initialDate = preset.planned ? nextDate(data, initialPlot) : today();
  const [plotId, setPlotId] = useState(initialPlot);
  const [cropId, setCropId] = useState(initialCrop);
  const [plantedOn, setPlantedOn] = useState(initialDate);
  const [expectedHarvestOn, setExpectedHarvestOn] = useState(
    addDays(
      initialDate,
      data.crops.find((c) => c.id === initialCrop)?.daysToHarvest || 60,
    ),
  );
  const [alreadyHarvested, setAlreadyHarvested] = useState(false);
  const [harvestedOn, setHarvestedOn] = useState(today());
  const [notes, setNotes] = useState("");
  const [allowRepeat, setAllowRepeat] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const crop = data.crops.find((c) => c.id === cropId);
  const recommendation = rotationRecommendations(data, plotId, plantedOn).find(
    (r) => r.crop.id === cropId,
  );
  const warning = recommendation && !recommendation.recommended;
  const existing = activePlanting(data, plotId);
  const updateDates = (start: string, selectedCrop = cropId) => {
    setPlantedOn(start);
    if (start)
      setExpectedHarvestOn(
        addDays(
          start,
          data.crops.find((c) => c.id === selectedCrop)?.daysToHarvest || 60,
        ),
      );
    if (start > today()) setAlreadyHarvested(false);
    setAllowRepeat(false);
  };
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await mutate("plantings", {
        plotId,
        cropId,
        plantedOn,
        expectedHarvestOn,
        harvestedOn: alreadyHarvested ? harvestedOn : null,
        notes,
        allowRepeat,
      });
      onSaved();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Penanaman belum tersimpan.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="form-stack">
      <div className="form-grid">
        <label>
          Petak tanam <span>*</span>
          <select
            required
            value={plotId}
            onChange={(event) => {
              setPlotId(event.target.value);
              setAllowRepeat(false);
              if (preset.planned)
                updateDates(nextDate(data, event.target.value));
            }}
          >
            {data.plots.map((plot) => (
              <option key={plot.id} value={plot.id}>
                {plot.name} ·{" "}
                {data.farms.find((f) => f.id === plot.farmId)?.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tanaman <span>*</span>
          <select
            required
            value={cropId}
            onChange={(event) => {
              setCropId(event.target.value);
              updateDates(plantedOn, event.target.value);
            }}
          >
            {data.crops.map((c) => (
              <option key={c.id} value={c.id}>
                {c.commonName}
              </option>
            ))}
          </select>
        </label>
      </div>
      {crop && (
        <div className="selected-crop-info">
          <span className="crop-small-icon">
            <Sprout size={21} />
          </span>
          <div>
            <strong>{crop.commonName}</strong>
            <span>
              {data.families.find((f) => f.id === crop.familyId)?.name} <i>·</i>{" "}
              Kebutuhan hara {crop.nutrientDemand.toLowerCase()} <i>·</i> ±
              {crop.daysToHarvest} hari
            </span>
          </div>
        </div>
      )}
      <div className="form-grid">
        <label>
          Tanggal tanam <span>*</span>
          <input
            type="date"
            required
            value={plantedOn}
            onChange={(event) => updateDates(event.target.value)}
          />
        </label>
        <label>
          Perkiraan panen <span>*</span>
          <input
            type="date"
            required
            min={plantedOn}
            value={expectedHarvestOn}
            onChange={(event) => setExpectedHarvestOn(event.target.value)}
          />
        </label>
      </div>
      {existing && (
        <div className="inline-note">
          <Info size={15} />
          <span>
            Petak ini sedang ditanami{" "}
            {data.crops
              .find((c) => c.id === existing.cropId)
              ?.commonName.toLowerCase()}
            .{" "}
            {existing.expectedHarvestOn && (
              <>
                Perkiraan panen {formatDate(existing.expectedHarvestOn, true)}
                .{" "}
              </>
            )}
            Untuk musim baru, pilih tanggal setelah panen dan catat panen aktual
            saat selesai.
          </span>
        </div>
      )}
      {recommendation && (
        <div
          className={`rotation-feedback ${warning ? "rotation-warning" : "rotation-good"}`}
        >
          {warning ? <AlertTriangle size={19} /> : <CheckCircle2 size={19} />}
          <div>
            <strong>
              {warning
                ? "Perhatikan keluarga tanaman"
                : "Pilihan rotasi yang baik"}
            </strong>
            <p>{recommendation.reason}</p>
            {warning && (
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={allowRepeat}
                  onChange={(event) => setAllowRepeat(event.target.checked)}
                />
                Saya memahami risikonya dan tetap ingin melanjutkan.
              </label>
            )}
          </div>
        </div>
      )}
      <label>
        Catatan kebun <span className="optional">opsional</span>
        <textarea
          maxLength={2000}
          rows={3}
          placeholder="Kondisi bibit, pupuk, hama, atau hal lain yang perlu diingat..."
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </label>
      {plantedOn <= today() && (
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={alreadyHarvested}
            onChange={(event) => setAlreadyHarvested(event.target.checked)}
          />{" "}
          Penanaman ini sudah dipanen (catat riwayat)
        </label>
      )}
      {alreadyHarvested && (
        <label>
          Tanggal panen aktual <span>*</span>
          <input
            required
            type="date"
            min={plantedOn}
            max={today()}
            value={harvestedOn}
            onChange={(event) => setHarvestedOn(event.target.value)}
          />
        </label>
      )}
      <ErrorMessage message={error} />
      <div className="form-actions">
        <button
          className="button button-secondary"
          type="button"
          onClick={onCancel}
        >
          Batal
        </button>
        <SubmitButton busy={busy} disabled={!!warning && !allowRepeat}>
          <Sprout size={16} />
          {plantedOn > today() ? "Simpan rencana tanam" : "Simpan penanaman"}
        </SubmitButton>
      </div>
    </form>
  );
}
