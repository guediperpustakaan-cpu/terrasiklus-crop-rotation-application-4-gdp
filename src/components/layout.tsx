"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  BookOpen,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Download,
  FlaskConical,
  Flower2,
  History,
  House,
  LayoutDashboard,
  Leaf,
  Menu,
  MoreHorizontal,
  PanelLeftClose,
  Search,
  Settings2,
  Sprout,
  RotateCw,
  X,
  CheckCheck,
  Wheat,
} from "lucide-react";
import type { Page, Workspace } from "@/lib/types";
import {
  OPEN_SOURCE_CREDIT,
  SOURCE_DOWNLOAD_URL,
  SOURCE_FILE_NAME,
} from "@/lib/support";
import {
  activePlanting,
  daysBetween,
  latestSoil,
  plantingProgress,
} from "@/lib/garden";

const navigation = [
  { id: "dashboard" as const, label: "Ringkasan", icon: LayoutDashboard },
  { id: "gardens" as const, label: "Kebun & Petak", icon: House },
  { id: "rotation" as const, label: "Rencana Rotasi", icon: RotateCw },
  { id: "history" as const, label: "Riwayat Tanam", icon: History },
  { id: "soil" as const, label: "Kesehatan Tanah", icon: FlaskConical },
  { id: "catalog" as const, label: "Katalog Tanaman", icon: BookOpen },
];
export function Brand({ light = false }: { light?: boolean }) {
  return (
    <span className={`brand ${light ? "brand-light" : ""}`}>
      <span className="brand-mark">
        <Sprout size={25} strokeWidth={1.8} />
      </span>
      <span className="brand-name">
        Terra<span>Siklus</span>
        <small>TUMBUH DALAM KESEIMBANGAN</small>
      </span>
    </span>
  );
}
export function AppLayout({
  data,
  page,
  onNavigate,
  onPlot,
  onCrop,
  onGuide,
  onProfile,
  children,
}: {
  data: Workspace;
  page: Page;
  onNavigate: (page: Page) => void;
  onPlot: (id: string) => void;
  onCrop: (name: string) => void;
  onGuide: () => void;
  onProfile: () => void;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const initials = data.profile.username
    .split(" ")
    .map((x) => x[0])
    .slice(0, 2)
    .join("");
  const matches = [
    ...data.plots
      .filter((p) =>
        `${p.name} ${data.crops.find((c) => c.id === activePlanting(data, p.id)?.cropId)?.commonName || ""}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      )
      .map((p) => ({
        id: p.id,
        title: p.name,
        subtitle:
          data.farms.find((f) => f.id === p.farmId)?.name || "Petak kebun",
        type: "plot",
      })),
    ...data.crops
      .filter((c) => c.commonName.toLowerCase().includes(query.toLowerCase()))
      .map((c) => ({
        id: c.id,
        title: c.commonName,
        subtitle: "Katalog tanaman",
        type: "crop",
      })),
  ].slice(0, 6);
  const readyPlots = data.plots.filter((p) => {
    const planting = activePlanting(data, p.id);
    return planting && plantingProgress(data, planting).daysLeft <= 0;
  });
  const soilPlots = data.plots.filter((p) => {
    const soil = latestSoil(data, p.id);
    return !soil || daysBetween(soil.testedOn) > 90;
  });
  const notificationCount = readyPlots.length + soilPlots.length;
  const navigate = (next: Page) => {
    onNavigate(next);
    setMobileOpen(false);
  };
  const selectResult = (result: (typeof matches)[number]) => {
    result.type === "plot" ? onPlot(result.id) : onCrop(result.title);
    setQuery("");
    setSearchOpen(false);
    const active = document.activeElement;
    if (active instanceof HTMLElement) active.blur();
  };
  useEffect(() => {
    const keyboard = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        input.current?.focus();
        setSearchOpen(true);
      }
      if (event.key === "Escape") {
        setMobileOpen(false);
        setSearchOpen(false);
        setNotifications(false);
      }
    };
    const outside = (event: MouseEvent) => {
      if (!searchRef.current?.contains(event.target as Node))
        setSearchOpen(false);
      if (!notificationRef.current?.contains(event.target as Node))
        setNotifications(false);
    };
    document.addEventListener("keydown", keyboard);
    document.addEventListener("mousedown", outside);
    return () => {
      document.removeEventListener("keydown", keyboard);
      document.removeEventListener("mousedown", outside);
    };
  }, []);
  return (
    <div className="app-shell">
      {mobileOpen && (
        <button
          className="sidebar-scrim"
          onClick={() => setMobileOpen(false)}
          aria-label="Tutup navigasi"
        />
      )}
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <Link
          href="/"
          className="brand-link"
          onClick={(event) => {
            event.preventDefault();
            navigate("dashboard");
          }}
          aria-label="TerraSiklus, halaman ringkasan"
        >
          <Brand />
        </Link>
        <button
          className="sidebar-mobile-close icon-button"
          onClick={() => setMobileOpen(false)}
          aria-label="Tutup menu"
        >
          <PanelLeftClose size={20} />
        </button>
        <button
          className="workspace-selector"
          onClick={() => navigate("gardens")}
        >
          <span className="workspace-icon">
            <Flower2 size={20} />
          </span>
          <span>
            <strong>Ruang kebun saya</strong>
            <small>Mari tumbuh bersama</small>
          </span>
          <ChevronDown size={15} />
        </button>
        <div className="nav-label">KELOLA KEBUN</div>
        <nav aria-label="Navigasi utama">
          {navigation.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${page === item.id ? "nav-active" : ""}`}
              onClick={() => navigate(item.id)}
              aria-label={item.label}
              aria-current={page === item.id ? "page" : undefined}
            >
              <item.icon size={19} strokeWidth={1.7} />
              <span>{item.label}</span>
              {item.id === "rotation" && (
                <span className="nav-new">CERDAS</span>
              )}
              {page === item.id && <span className="nav-indicator" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="grow-card">
            <div className="grow-card-art">
              <span>
                <Leaf size={23} strokeWidth={1.5} />
              </span>
              <i />
              <i />
            </div>
            <h3>
              Kebun kecil.
              <br />
              Dampak besar.
            </h3>
            <p>Rawat tanah hari ini untuk panen yang lebih baik esok hari.</p>
            <button onClick={onGuide}>
              Kenali rotasi tanaman <ArrowRight size={15} />
            </button>
          </div>
          <button
            className="nav-item utility-nav"
            aria-label="Bantuan & panduan"
            onClick={onGuide}
          >
            <CircleHelp size={18} />
            <span>Bantuan & panduan</span>
            <span className="external-arrow">↗</span>
          </button>
          <button
            className="nav-item utility-nav"
            aria-label="Pengaturan"
            onClick={onProfile}
          >
            <Settings2 size={18} />
            <span>Pengaturan</span>
          </button>
          <button
            className="sidebar-profile"
            aria-label="Buka pengaturan profil"
            onClick={onProfile}
          >
            <span className="avatar">{initials}</span>
            <span>
              <strong>{data.profile.username}</strong>
              <small>Pekebun rumahan</small>
            </span>
            <MoreHorizontal size={19} />
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            onClick={() => setMobileOpen(true)}
            aria-label="Buka navigasi"
          >
            <Menu size={22} />
          </button>
          <div className="breadcrumb">
            <span>Ruang kerja</span>
            <ChevronRight size={14} />
            <strong>{navigation.find((n) => n.id === page)?.label}</strong>
          </div>
          <div className="topbar-tools">
            <div className="global-search" ref={searchRef}>
              <Search size={17} />
              <input
                ref={input}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && matches[0])
                    selectResult(matches[0]);
                }}
                placeholder="Cari petak atau tanaman..."
                aria-label="Cari petak atau tanaman"
              />
              <kbd>⌘ K</kbd>
              {searchOpen && (
                <div className="search-results">
                  <span className="dropdown-label">
                    {query ? "HASIL PENCARIAN" : "JELAJAHI KEBUNMU"}
                  </span>
                  {matches.length ? (
                    matches.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => selectResult(result)}
                      >
                        <span className="search-result-icon">
                          {result.type === "plot" ? (
                            <House size={17} />
                          ) : (
                            <Sprout size={17} />
                          )}
                        </span>
                        <span>
                          <strong>{result.title}</strong>
                          <small>{result.subtitle}</small>
                        </span>
                        <ChevronRight size={14} />
                      </button>
                    ))
                  ) : (
                    <p className="no-results">
                      Tidak ada hasil untuk “{query}”.
                    </p>
                  )}
                </div>
              )}
            </div>
            <span className="topbar-divider" />
            <div className="notification-container" ref={notificationRef}>
              <button
                className={`icon-button notification-button ${notifications ? "selected" : ""}`}
                aria-label={`Notifikasi kebun, ${notificationCount} pengingat`}
                aria-expanded={notifications}
                onClick={() => setNotifications(!notifications)}
              >
                <Bell size={20} />
                {notificationCount > 0 && <i />}
              </button>
              {notifications && (
                <div className="notification-panel">
                  <div className="notification-heading">
                    <strong>Kabar kebunmu</strong>
                    <span className="count-badge">{notificationCount}</span>
                  </div>
                  {readyPlots.map((plot) => (
                    <button
                      key={plot.id}
                      onClick={() => {
                        onPlot(plot.id);
                        setNotifications(false);
                      }}
                    >
                      <Wheat size={19} />
                      <span>
                        <strong>{plot.name} siap dipanen</strong>
                        <small>
                          Catat panen dan rencanakan musim berikutnya.
                        </small>
                      </span>
                      <ChevronRight size={15} />
                    </button>
                  ))}
                  {soilPlots.map((plot) => (
                    <button
                      key={plot.id}
                      onClick={() => {
                        onPlot(plot.id);
                        setNotifications(false);
                      }}
                    >
                      <FlaskConical size={19} />
                      <span>
                        <strong>Perbarui uji tanah {plot.name}</strong>
                        <small>Kenali kondisi tanah sebelum menanam.</small>
                      </span>
                      <ChevronRight size={15} />
                    </button>
                  ))}
                  {!notificationCount && (
                    <div className="notifications-empty">
                      <CheckCheck size={24} />
                      <p>Semua sudah terawat. Kebunmu siap tumbuh!</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              className="avatar topbar-avatar"
              onClick={onProfile}
              aria-label="Buka profil"
            >
              {initials}
            </button>
          </div>
        </header>
        <main className="main-content" id="main-content">
          {children}
        </main>
        <footer className="app-footer">
          <span>
            <Sprout size={14} /> Dirawat dengan hati, tumbuh bersama
            TerraSiklus.
          </span>
          <span className="app-footer-links">
            <button onClick={onGuide}>
              Panduan berkebun <ArrowRight size={13} />
            </button>
            <a href={SOURCE_DOWNLOAD_URL} download={SOURCE_FILE_NAME}>
              <Download size={13} /> Unduh Source Code
            </a>
            <small>{OPEN_SOURCE_CREDIT}</small>
          </span>
        </footer>
      </div>
    </div>
  );
}
