"use client";

import { useState, type FormEvent } from "react";
import { FlaskConical, Info } from "lucide-react";
import type { Workspace, Mutation } from "@/lib/types";
import { formatDate, latestSoil, today } from "@/lib/garden";
import { ErrorMessage, SubmitButton } from "./ui";

export function SoilForm({
  data,
  plotId: initialPlot,
  mutate,
  onSaved,
  onCancel,
}: {
  data: Workspace;
  plotId?: string;
  mutate: Mutation;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [plotId, setPlotId] = useState(initialPlot || data.plots[0]?.id || "");
  const [testedOn, setTestedOn] = useState(today());
  const [values, setValues] = useState({
    ph: "",
    n: "",
    p: "",
    k: "",
    organicMatter: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const last = latestSoil(data, plotId);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await mutate("soil-tests", {
        plotId,
        testedOn,
        ...Object.fromEntries(
          Object.entries(values).map(([key, value]) => [key, Number(value)]),
        ),
      });
      onSaved();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Hasil uji belum tersimpan.",
      );
    } finally {
      setBusy(false);
    }
  }
  const fields = [
    {
      key: "ph" as const,
      label: "pH tanah",
      unit: "skala 0–14",
      max: 14,
      placeholder: "6,5",
    },
    {
      key: "organicMatter" as const,
      label: "Bahan organik",
      unit: "%",
      max: 100,
      placeholder: "3,5",
    },
    {
      key: "n" as const,
      label: "Nitrogen (N)",
      unit: "mg/kg",
      max: 100000,
      placeholder: "35",
    },
    {
      key: "p" as const,
      label: "Fosfor (P)",
      unit: "mg/kg",
      max: 100000,
      placeholder: "25",
    },
    {
      key: "k" as const,
      label: "Kalium (K)",
      unit: "mg/kg",
      max: 100000,
      placeholder: "180",
    },
  ];
  return (
    <form className="form-stack" onSubmit={submit}>
      <div className="form-grid">
        <label>
          Petak yang diuji <span>*</span>
          <select
            required
            value={plotId}
            onChange={(event) => setPlotId(event.target.value)}
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
          Tanggal pengujian <span>*</span>
          <input
            type="date"
            required
            max={today()}
            value={testedOn}
            onChange={(event) => setTestedOn(event.target.value)}
          />
        </label>
      </div>
      {last && (
        <div className="inline-note">
          <Info size={16} />
          <span>
            Uji terakhir: <strong>{formatDate(last.testedOn, true)}</strong>,
            dengan pH <strong>{last.ph.toLocaleString("id-ID")}</strong>.
          </span>
        </div>
      )}
      <div className="form-divider">
        <span>HASIL PENGUJIAN TANAH</span>
      </div>
      <div className="form-grid">
        {fields.map((field) => (
          <label key={field.key}>
            {field.label} <span>*</span>
            <div className="input-unit">
              <input
                type="number"
                step="0.01"
                min="0"
                max={field.max}
                required
                placeholder={field.placeholder}
                value={values[field.key]}
                onChange={(event) =>
                  setValues({ ...values, [field.key]: event.target.value })
                }
              />
              <span>{field.unit}</span>
            </div>
          </label>
        ))}
      </div>
      <div className="form-hint">
        <FlaskConical size={18} />
        <p>
          Gunakan hasil dari alat uji tanah atau laboratorium. Nilai hara
          menggunakan satuan mg/kg (ppm). Rentang pH umum untuk sayuran adalah
          6–7; kebutuhan setiap tanaman bisa berbeda.
        </p>
      </div>
      <ErrorMessage message={error} />
      <div className="form-actions">
        <button
          type="button"
          className="button button-secondary"
          onClick={onCancel}
        >
          Batal
        </button>
        <SubmitButton busy={busy}>
          <FlaskConical size={16} /> Simpan hasil uji
        </SubmitButton>
      </div>
    </form>
  );
}
