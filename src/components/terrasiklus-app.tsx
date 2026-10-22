"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { CheckCircle2, X } from "lucide-react";
import type { Workspace, Page, PlantingPreset, Mutation } from "@/lib/types";
import { formatDate } from "@/lib/garden";
import { AppLayout } from "./layout";
import { Dashboard } from "./dashboard";
import { GardensPage, HistoryPage, CatalogPage, GardenGuide } from "./pages";
import { RotationEngine } from "./rotation-engine";
import { SoilTracker } from "./soil-tracker";
import { PlotDetail } from "./plot-detail";
import { PlantingForm } from "./planting-form";
import { SoilForm } from "./soil-form";
import {
  FarmForm,
  PlotForm,
  HarvestForm,
  PlantingNotesForm,
  ProfileForm,
  DeleteConfirmation,
} from "./forms";
import { Modal } from "./ui";

type ModalState =
  | { kind: "plant"; preset?: PlantingPreset }
  | { kind: "soil"; plotId?: string }
  | { kind: "farm"; id?: string }
  | { kind: "plot-form"; id?: string }
  | { kind: "plot"; id: string }
  | { kind: "harvest"; id: string }
  | { kind: "notes"; id: string }
  | { kind: "guide" }
  | { kind: "profile" }
  | { kind: "delete"; resource: string; id: string; label: string }
  | null;
const pages: Page[] = [
  "dashboard",
  "gardens",
  "rotation",
  "history",
  "soil",
  "catalog",
];

export function TerraSiklusApp({
  initialData,
  initialPage = "dashboard",
}: {
  initialData: Workspace;
  initialPage?: Page;
}) {
  const [data, setData] = useState(initialData);
  const [page, setPage] = useState<Page>(initialPage);
  const [farmId, setFarmId] = useState(initialData.farms[0]?.id || "");
  const [rotationPlotId, setRotationPlotId] = useState(
    initialData.plots[0]?.id || "",
  );
  const [catalogSearch, setCatalogSearch] = useState("");
  const [modal, setModal] = useState<ModalState>(null);
  const [toast, setToast] = useState("");
  const close = () => setModal(null);
  const navigate = useCallback((next: Page) => {
    setPage(next);
    setModal(null);
    window.history.pushState(
      null,
      "",
      next === "dashboard" ? "/" : `/?halaman=${next}`,
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);
  useEffect(() => {
    const pop = () => {
      const next = new URLSearchParams(window.location.search).get(
        "halaman",
      ) as Page;
      setPage(pages.includes(next) ? next : "dashboard");
      setModal(null);
    };
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(timer);
  }, [toast]);
  const mutate: Mutation = async (resource, values, method = "POST") => {
    const response = await fetch(`/api/${resource}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
      signal: AbortSignal.timeout(20000),
    }).catch(() => {
      throw new Error(
        "Koneksi ke kebun terputus atau terlalu lama. Periksa jaringan, lalu coba kembali.",
      );
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error || "Perubahan belum dapat disimpan.");
    // Apply the persisted result immediately; a failed refresh must not cause duplicate submissions.
    setData((previous) => {
      if (resource === "profiles") return { ...previous, profile: result };
      const key = (
        {
          farms: "farms",
          plots: "plots",
          plantings: "plantings",
          "soil-tests": "soilTests",
        } as const
      )[resource as "farms" | "plots" | "plantings" | "soil-tests"];
      if (!key) return previous;
      const items = previous[key] as Array<{ id: string }>;
      const changed =
        method === "DELETE"
          ? items.filter((item) => item.id !== values.id)
          : method === "PATCH"
            ? items.map((item) => (item.id === result.id ? result : item))
            : [...items, result];
      const next = { ...previous, [key]: changed } as Workspace;
      if (method === "DELETE" && resource === "farms")
        next.plots = previous.plots.filter((plot) => plot.farmId !== values.id);
      if (
        method === "DELETE" &&
        (resource === "farms" || resource === "plots")
      ) {
        const ids = new Set(next.plots.map((plot) => plot.id));
        next.plantings = previous.plantings.filter((p) => ids.has(p.plotId));
        next.soilTests = previous.soilTests.filter((s) => ids.has(s.plotId));
      }
      next.plantings = [...next.plantings].sort((a, b) =>
        b.plantedOn.localeCompare(a.plantedOn),
      );
      next.soilTests = [...next.soilTests].sort(
        (a, b) =>
          b.testedOn.localeCompare(a.testedOn) ||
          b.createdAt.localeCompare(a.createdAt),
      );
      return next;
    });
    if (resource === "farms" && method === "POST") setFarmId(result.id);
    setToast(
      method === "DELETE"
        ? "Data berhasil dihapus."
        : resource === "soil-tests"
          ? "Hasil uji tanah berhasil disimpan."
          : resource === "plantings" && values.harvestedOn
            ? "Panen berhasil dicatat. Selamat menikmati hasilnya!"
            : resource === "plantings"
              ? "Catatan penanaman berhasil disimpan."
              : resource === "profiles"
                ? "Profil berhasil diperbarui."
                : "Perubahan kebun berhasil disimpan.",
    );
  };
  const createPlot = () =>
    setModal(data.farms.length ? { kind: "plot-form" } : { kind: "farm" });
  const plant = (preset?: PlantingPreset) =>
    data.plots.length ? setModal({ kind: "plant", preset }) : createPlot();
  const soil = (plotId?: string) =>
    data.plots.length ? setModal({ kind: "soil", plotId }) : createPlot();
  const rotate = (plotId?: string) => {
    if (plotId) setRotationPlotId(plotId);
    navigate("rotation");
  };
  const guide = () => setModal({ kind: "guide" });
  const openPlot = (id: string) => setModal({ kind: "plot", id });
  const common = { mutate, onSaved: close, onCancel: close };
  let modalTitle = "";
  let modalSubtitle = "";
  let modalContent: ReactNode = null;
  let wide = false;
  if (modal) {
    switch (modal.kind) {
      case "plant":
        modalTitle = modal.preset?.planned
          ? "Rencanakan musim berikutnya"
          : "Catat penanaman";
        modalSubtitle = "Satu catatan kecil untuk pertumbuhan yang lebih baik.";
        modalContent = (
          <PlantingForm data={data} preset={modal.preset} {...common} />
        );
        break;
      case "soil":
        modalTitle = "Catat hasil uji tanah";
        modalSubtitle = "Kenali kondisi tanah, berikan perawatan yang tepat.";
        modalContent = (
          <SoilForm data={data} plotId={modal.plotId} {...common} />
        );
        break;
      case "farm": {
        const farm = data.farms.find((f) => f.id === modal.id);
        modalTitle = farm ? "Rawat informasi kebun" : "Buat kebun baru";
        modalSubtitle = "Ruang tumbuh yang teratur, kebun yang lebih terawat.";
        modalContent = (
          <FarmForm
            initial={farm}
            {...common}
            onDelete={
              farm
                ? () =>
                    setModal({
                      kind: "delete",
                      resource: "farms",
                      id: farm.id,
                      label: farm.name,
                    })
                : undefined
            }
          />
        );
        break;
      }
      case "plot-form": {
        const plot = data.plots.find((p) => p.id === modal.id);
        modalTitle = plot ? `Edit ${plot.name}` : "Tambahkan petak baru";
        modalSubtitle = "Kenali ruang dan karakter tanah sebelum menanam.";
        modalContent = (
          <PlotForm
            data={data}
            initial={plot}
            farmId={
              data.farms.some((f) => f.id === farmId) ? farmId : undefined
            }
            {...common}
            onDelete={
              plot
                ? () =>
                    setModal({
                      kind: "delete",
                      resource: "plots",
                      id: plot.id,
                      label: plot.name,
                    })
                : undefined
            }
          />
        );
        break;
      }
      case "plot": {
        const plot = data.plots.find((p) => p.id === modal.id);
        if (plot) {
          modalTitle = plot.name;
          modalSubtitle = "Setiap petak punya cerita pertumbuhannya sendiri.";
          wide = true;
          modalContent = (
            <PlotDetail
              plot={plot}
              data={data}
              onEdit={() => setModal({ kind: "plot-form", id: plot.id })}
              onPlant={plant}
              onHarvest={(id) => setModal({ kind: "harvest", id })}
              onSoil={() => soil(plot.id)}
              onRotate={() => rotate(plot.id)}
              onNotes={(id) => setModal({ kind: "notes", id })}
            />
          );
        }
        break;
      }
      case "harvest": {
        const planting = data.plantings.find((p) => p.id === modal.id);
        if (planting) {
          modalTitle = "Catat hasil panen";
          modalSubtitle =
            "Rayakan hasil, simpan pelajaran untuk musim berikutnya.";
          modalContent = (
            <HarvestForm planting={planting} data={data} {...common} />
          );
        }
        break;
      }
      case "notes": {
        const planting = data.plantings.find((p) => p.id === modal.id);
        if (planting) {
          modalTitle = "Cerita penanaman";
          modalSubtitle = "Simpan pengamatanmu agar tidak terlupakan.";
          modalContent = (
            <PlantingNotesForm
              planting={planting}
              data={data}
              {...common}
              onHarvest={() => setModal({ kind: "harvest", id: planting.id })}
              onDelete={() =>
                setModal({
                  kind: "delete",
                  resource: "plantings",
                  id: planting.id,
                  label: `catatan ${data.crops.find((c) => c.id === planting.cropId)?.commonName || "penanaman"}`,
                })
              }
            />
          );
        }
        break;
      }
      case "profile":
        modalTitle = "Pengaturan profil";
        modalSubtitle = "Buat ruang kebun ini terasa lebih personal.";
        modalContent = <ProfileForm data={data} {...common} />;
        break;
      case "guide":
        modalTitle = "Bertumbuh bersama TerraSiklus";
        modalSubtitle = "Panduan kecil untuk kebun yang lebih berkelanjutan.";
        wide = true;
        modalContent = <GardenGuide onNavigate={navigate} />;
        break;
      case "delete":
        modalTitle = "Hapus data kebun?";
        modalContent = (
          <DeleteConfirmation
            resource={modal.resource}
            id={modal.id}
            label={modal.label}
            {...common}
          />
        );
        break;
    }
  }
  return (
    <>
      <AppLayout
        data={data}
        page={page}
        onNavigate={navigate}
        onPlot={openPlot}
        onCrop={(name) => {
          setCatalogSearch(name);
          navigate("catalog");
        }}
        onGuide={guide}
        onProfile={() => setModal({ kind: "profile" })}
      >
        {page === "dashboard" && (
          <Dashboard
            data={data}
            farmId={farmId}
            onFarm={setFarmId}
            onNavigate={navigate}
            onPlot={openPlot}
            onPlant={plant}
            onHarvest={(id) => setModal({ kind: "harvest", id })}
            onSoil={soil}
            onRotate={rotate}
            onGuide={guide}
            onCreate={createPlot}
          />
        )}
        {page === "gardens" && (
          <GardensPage
            data={data}
            farmId={farmId}
            onFarm={setFarmId}
            onAddFarm={() => setModal({ kind: "farm" })}
            onEditFarm={(id) => setModal({ kind: "farm", id })}
            onAddPlot={createPlot}
            onPlot={openPlot}
          />
        )}
        {page === "rotation" && (
          <RotationEngine
            data={data}
            plotId={rotationPlotId}
            onPlotChange={setRotationPlotId}
            onPlan={plant}
            onGuide={guide}
            onCreate={createPlot}
          />
        )}
        {page === "history" && (
          <HistoryPage
            data={data}
            onPlant={() => plant()}
            onNotes={(id) => setModal({ kind: "notes", id })}
          />
        )}
        {page === "soil" && (
          <SoilTracker
            data={data}
            onAdd={soil}
            onCreate={createPlot}
            onDelete={(test) =>
              setModal({
                kind: "delete",
                resource: "soil-tests",
                id: test.id,
                label: `hasil uji tanah ${formatDate(test.testedOn, true)}`,
              })
            }
          />
        )}
        {page === "catalog" && (
          <CatalogPage
            data={data}
            search={catalogSearch}
            onSearch={setCatalogSearch}
            onPlant={plant}
          />
        )}
      </AppLayout>
      {modal && modalContent && (
        <Modal
          key={`${modal.kind}-${"id" in modal ? modal.id || "new" : ""}`}
          title={modalTitle}
          subtitle={modalSubtitle}
          wide={wide}
          onClose={close}
        >
          {modalContent}
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={20} />
          <span>{toast}</span>
          <button onClick={() => setToast("")} aria-label="Tutup pemberitahuan">
            <X size={15} />
          </button>
        </div>
      )}
    </>
  );
}
