"use client";

import { useState, type FormEvent } from "react";
import { House, MapPin, Save, Sprout, Trash2, Wheat } from "lucide-react";
import type { Workspace, Farm, Plot, Planting, Mutation } from "@/lib/types";
import { formatDate, today } from "@/lib/garden";
import { ErrorMessage, SubmitButton } from "./ui";

interface FormProps {
  mutate: Mutation;
  onSaved: () => void;
  onCancel: () => void;
}
const message = (err: unknown) =>
  err instanceof Error
    ? err.message
    : "Perubahan belum tersimpan. Coba kembali.";
export function FarmForm({
  initial,
  mutate,
  onSaved,
  onCancel,
  onDelete,
}: FormProps & { initial?: Farm; onDelete?: () => void }) {
  const [name, setName] = useState(initial?.name || "");
  const [location, setLocation] = useState(initial?.location || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await mutate(
        "farms",
        { id: initial?.id, name, location },
        initial ? "PATCH" : "POST",
      );
      onSaved();
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="form-stack" onSubmit={submit}>
      <div className="form-illustration">
        <House size={32} strokeWidth={1.3} />
        <div>
          <strong>Setiap kebun punya cerita.</strong>
          <p>Berikan nama untuk ruang tumbuhmu.</p>
        </div>
      </div>
      <label>
        Nama kebun <span>*</span>
        <input
          required
          maxLength={120}
          placeholder="Contoh: Kebun Belakang Rumah"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <label>
        Lokasi <span>*</span>
        <input
          required
          maxLength={200}
          placeholder="Contoh: Bandung, Jawa Barat"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
        />
      </label>
      <ErrorMessage message={error} />
      <div className="form-actions">
        {initial && onDelete && (
          <button
            className="button button-danger-quiet"
            type="button"
            onClick={onDelete}
          >
            <Trash2 size={15} /> Hapus
          </button>
        )}
        <button
          className="button button-secondary"
          type="button"
          onClick={onCancel}
        >
          Batal
        </button>
        <SubmitButton busy={busy}>
          {initial ? "Simpan perubahan" : "Buat kebun"}
        </SubmitButton>
      </div>
    </form>
  );
}
export function PlotForm({
  data,
  initial,
  farmId,
  mutate,
  onSaved,
  onCancel,
  onDelete,
}: FormProps & {
  data: Workspace;
  initial?: Plot;
  farmId?: string;
  onDelete?: () => void;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [area, setArea] = useState(initial?.area.toString() || "");
  const [soilType, setSoilType] = useState(initial?.soilType || "Lempung");
  const [farm, setFarm] = useState(
    initial?.farmId || farmId || data.farms[0]?.id || "",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await mutate(
        "plots",
        { id: initial?.id, name, area: Number(area), soilType, farmId: farm },
        initial ? "PATCH" : "POST",
      );
      onSaved();
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="form-stack" onSubmit={submit}>
      <label>
        Kebun <span>*</span>
        <select
          required
          disabled={!!initial}
          value={farm}
          onChange={(event) => setFarm(event.target.value)}
        >
          {data.farms.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Nama petak <span>*</span>
        <input
          required
          maxLength={80}
          placeholder="Contoh: Petak A atau Bedeng Sayur"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <div className="form-grid">
        <label>
          Luas petak <span>*</span>
          <div className="input-unit">
            <input
              required
              type="number"
              min="0.1"
              max="1000000"
              step="0.1"
              placeholder="12"
              value={area}
              onChange={(event) => setArea(event.target.value)}
            />
            <span>m²</span>
          </div>
        </label>
        <label>
          Jenis tanah <span>*</span>
          <select
            required
            value={soilType}
            onChange={(event) => setSoilType(event.target.value)}
          >
            {[
              "Lempung",
              "Lempung berpasir",
              "Liat",
              "Berpasir",
              "Humus",
              "Gambut",
              "Campuran media tanam",
            ].map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="form-hint">
        <Sprout size={18} />
        <p>
          Bagi kebun menjadi beberapa petak agar rotasi dan kondisi tanah lebih
          mudah dipantau.
        </p>
      </div>
      <ErrorMessage message={error} />
      <div className="form-actions">
        {initial && onDelete && (
          <button
            type="button"
            className="button button-danger-quiet"
            onClick={onDelete}
          >
            <Trash2 size={15} /> Hapus
          </button>
        )}
        <button
          className="button button-secondary"
          type="button"
          onClick={onCancel}
        >
          Batal
        </button>
        <SubmitButton busy={busy}>
          {initial ? "Simpan perubahan" : "Tambahkan petak"}
        </SubmitButton>
      </div>
    </form>
  );
}
export function HarvestForm({
  planting,
  data,
  mutate,
  onSaved,
  onCancel,
}: FormProps & { planting: Planting; data: Workspace }) {
  const [harvestedOn, setHarvestedOn] = useState(today());
  const [notes, setNotes] = useState(planting.notes);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const crop = data.crops.find((c) => c.id === planting.cropId);
  const plot = data.plots.find((p) => p.id === planting.plotId);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await mutate(
        "plantings",
        { id: planting.id, harvestedOn, notes },
        "PATCH",
      );
      onSaved();
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="form-stack" onSubmit={submit}>
      <div className="harvest-celebration">
        <span>
          <Wheat size={30} />
        </span>
        <h3>Kerja baikmu berbuah hasil!</h3>
        <p>
          {crop?.commonName} di {plot?.name}, ditanam{" "}
          {formatDate(planting.plantedOn, true)}.
        </p>
      </div>
      <label>
        Tanggal panen <span>*</span>
        <input
          required
          type="date"
          min={planting.plantedOn}
          max={today()}
          value={harvestedOn}
          onChange={(event) => setHarvestedOn(event.target.value)}
        />
      </label>
      <label>
        Catatan hasil & kondisi tanaman
        <textarea
          maxLength={2000}
          rows={4}
          placeholder="Ceritakan hasil panen, hama, atau hal yang ingin diperbaiki musim depan..."
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </label>
      <div className="inline-note">
        <Sprout size={16} />
        <span>
          Setelah panen dicatat, petak siap direncanakan untuk keluarga tanaman
          berikutnya.
        </span>
      </div>
      <ErrorMessage message={error} />
      <div className="form-actions">
        <button
          className="button button-secondary"
          type="button"
          onClick={onCancel}
        >
          Batal
        </button>
        <SubmitButton busy={busy}>
          <Wheat size={16} /> Simpan panen
        </SubmitButton>
      </div>
    </form>
  );
}
export function PlantingNotesForm({
  planting,
  data,
  mutate,
  onSaved,
  onCancel,
  onHarvest,
  onDelete,
}: FormProps & {
  planting: Planting;
  data: Workspace;
  onHarvest: () => void;
  onDelete: () => void;
}) {
  const [notes, setNotes] = useState(planting.notes);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await mutate("plantings", { id: planting.id, notes }, "PATCH");
      onSaved();
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="form-stack" onSubmit={submit}>
      <div className="record-summary">
        <div>
          <span>Tanaman</span>
          <strong>
            {data.crops.find((c) => c.id === planting.cropId)?.commonName}
          </strong>
        </div>
        <div>
          <span>Petak</span>
          <strong>
            {data.plots.find((p) => p.id === planting.plotId)?.name}
          </strong>
        </div>
        <div>
          <span>Ditanam</span>
          <strong>{formatDate(planting.plantedOn, true)}</strong>
        </div>
        <div>
          <span>{planting.harvestedOn ? "Dipanen" : "Perkiraan panen"}</span>
          <strong>
            {planting.harvestedOn || planting.expectedHarvestOn
              ? formatDate(
                  (planting.harvestedOn || planting.expectedHarvestOn)!,
                  true,
                )
              : "Belum ditentukan"}
          </strong>
        </div>
      </div>
      <label>
        Catatan hama, penyakit & perawatan
        <textarea
          rows={5}
          maxLength={2000}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Belum ada catatan. Tambahkan pengamatanmu di sini..."
        />
      </label>
      {!planting.harvestedOn && planting.plantedOn <= today() && (
        <button
          type="button"
          className="button button-secondary"
          onClick={onHarvest}
        >
          <Wheat size={16} /> Tanaman sudah dipanen? Catat panen
        </button>
      )}
      <ErrorMessage message={error} />
      <div className="form-actions">
        <button
          type="button"
          className="button button-danger-quiet"
          onClick={onDelete}
        >
          <Trash2 size={15} /> Hapus
        </button>
        <button
          type="button"
          className="button button-secondary"
          onClick={onCancel}
        >
          Tutup
        </button>
        <SubmitButton busy={busy}>
          <Save size={15} /> Simpan catatan
        </SubmitButton>
      </div>
    </form>
  );
}
export function ProfileForm({
  data,
  mutate,
  onSaved,
  onCancel,
}: FormProps & { data: Workspace }) {
  const [username, setUsername] = useState(data.profile.username);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await mutate("profiles", { username }, "PATCH");
      onSaved();
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="form-stack" onSubmit={submit}>
      <div className="profile-intro">
        <span className="avatar avatar-large">
          {data.profile.username
            .split(" ")
            .map((p) => p[0])
            .slice(0, 2)
            .join("")}
        </span>
        <div>
          <h3>Halo, pekebun!</h3>
          <p>Ruang kecilmu untuk dampak yang lebih besar.</p>
        </div>
      </div>
      <label>
        Nama tampilan <span>*</span>
        <input
          required
          minLength={2}
          maxLength={80}
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />
      </label>
      <div className="record-summary">
        <div>
          <span>Kebun dirawat</span>
          <strong>{data.farms.length} kebun</strong>
        </div>
        <div>
          <span>Petak dipantau</span>
          <strong>{data.plots.length} petak</strong>
        </div>
      </div>
      <p className="form-footnote">
        Ini adalah ruang kerja contoh bersama tanpa autentikasi. Jangan masukkan
        informasi pribadi sensitif.
      </p>
      <ErrorMessage message={error} />
      <div className="form-actions">
        <button
          className="button button-secondary"
          type="button"
          onClick={onCancel}
        >
          Batal
        </button>
        <SubmitButton busy={busy}>Simpan profil</SubmitButton>
      </div>
    </form>
  );
}
export function DeleteConfirmation({
  resource,
  id,
  label,
  mutate,
  onSaved,
  onCancel,
}: FormProps & { resource: string; id: string; label: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await mutate(resource, { id }, "DELETE");
      onSaved();
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="form-stack" onSubmit={submit}>
      <div className="delete-warning">
        <Trash2 size={28} />
        <p>
          Yakin ingin menghapus <strong>{label}</strong>?
        </p>
        <span>
          {resource === "farms" || resource === "plots"
            ? "Semua petak, riwayat tanam, dan uji tanah terkait juga akan dihapus. "
            : ""}
          Tindakan ini tidak dapat dibatalkan.
        </span>
      </div>
      <ErrorMessage message={error} />
      <div className="form-actions">
        <button
          type="button"
          className="button button-secondary"
          onClick={onCancel}
        >
          Batal, tetap simpan
        </button>
        <button type="submit" disabled={busy} className="button button-danger">
          {busy ? "Menghapus..." : "Ya, hapus data"}
        </button>
      </div>
    </form>
  );
}
