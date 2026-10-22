"use client";

import { useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  FlaskConical,
  Info,
  Leaf,
  Plus,
  Sprout,
  Trash2,
} from "lucide-react";
import type { Workspace, SoilTest } from "@/lib/types";
import { formatDate, latestSoil, numberID, soilCondition } from "@/lib/garden";
import { Badge, EmptyState } from "./ui";

function SoilChart({ tests }: { tests: SoilTest[] }) {
  const sorted = [...tests]
    .sort((a, b) => a.testedOn.localeCompare(b.testedOn))
    .slice(-8);
  const min = Math.min(4, ...sorted.map((t) => t.ph)) - 0.3;
  const max = Math.max(8, ...sorted.map((t) => t.ph)) + 0.3;
  const x = (i: number) =>
    45 + (sorted.length > 1 ? i / (sorted.length - 1) : 0.5) * 480;
  const y = (value: number) => 180 - ((value - min) / (max - min)) * 150;
  const points = sorted.map((t, i) => `${x(i)},${y(t.ph)}`).join(" ");
  return (
    <div className="soil-chart">
      <svg
        viewBox="0 0 570 220"
        role="img"
        aria-label={`Grafik pH tanah, ${sorted.map((t) => `${formatDate(t.testedOn)}: ${numberID(t.ph)}`).join(", ")}`}
      >
        <defs>
          <linearGradient id="soil-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#548166" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#548166" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3, 4].map((i) => {
          const value = min + ((max - min) * i) / 4;
          return (
            <g key={i}>
              <line
                x1="45"
                y1={y(value)}
                x2="525"
                y2={y(value)}
                stroke="#e8ede6"
                strokeDasharray="4 5"
              />
              <text
                x="27"
                y={y(value) + 4}
                textAnchor="end"
                fill="#939b90"
                fontSize="10"
              >
                {numberID(value)}
              </text>
            </g>
          );
        })}
        <rect
          x="45"
          y={y(7)}
          width="480"
          height={y(6) - y(7)}
          fill="#e9f2e8"
          opacity="0.6"
        />
        <text x="520" y={y(7) - 6} textAnchor="end" fill="#758d70" fontSize="9">
          RENTANG OPTIMAL
        </text>
        {sorted.length > 0 && (
          <>
            <polygon
              points={`${x(0)},180 ${points} ${x(sorted.length - 1)},180`}
              fill="url(#soil-area)"
            />
            <polyline
              points={points}
              fill="none"
              stroke="#47764e"
              strokeWidth="2.8"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {sorted.map((t, i) => (
              <g key={t.id}>
                <circle
                  cx={x(i)}
                  cy={y(t.ph)}
                  r="5"
                  fill="#fff"
                  stroke="#47764e"
                  strokeWidth="2.5"
                >
                  <title>
                    {formatDate(t.testedOn, true)}: pH {numberID(t.ph)}
                  </title>
                </circle>
                <text
                  x={x(i)}
                  y="208"
                  textAnchor="middle"
                  fill="#929b8e"
                  fontSize="10"
                >
                  {formatDate(t.testedOn)}
                </text>
              </g>
            ))}
          </>
        )}
      </svg>
    </div>
  );
}
export function SoilTracker({
  data,
  initialPlotId,
  onAdd,
  onDelete,
  onCreate,
}: {
  data: Workspace;
  initialPlotId?: string;
  onAdd: (id?: string) => void;
  onDelete: (test: SoilTest) => void;
  onCreate: () => void;
}) {
  const [selectedId, setSelectedId] = useState(
    initialPlotId || data.plots[0]?.id || "",
  );
  const selected = data.plots.find((p) => p.id === selectedId) || data.plots[0];
  const latest = selected ? latestSoil(data, selected.id) : undefined;
  const history = data.soilTests.filter((s) => s.plotId === selected?.id);
  return (
    <div className="page-enter">
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            KENALI APA YANG ADA DI BAWAH PERMUKAAN
          </span>
          <h1>Kesehatan tanah</h1>
          <p>Akar yang kuat dimulai dari tanah yang dirawat.</p>
        </div>
        <button
          className="button button-primary"
          onClick={() => (selected ? onAdd(selected.id) : onCreate())}
        >
          <Plus size={17} /> Catat uji tanah
        </button>
      </div>
      {!selected ? (
        <EmptyState
          title="Mulai dari petak pertamamu"
          description="Buat petak untuk menyimpan hasil pengujian dan memantau perubahan tanah."
        >
          <button className="button button-primary" onClick={onCreate}>
            Tambahkan petak
          </button>
        </EmptyState>
      ) : (
        <>
          <div className="soil-selection">
            <div>
              <span className="soil-selection-icon">
                <Sprout size={23} />
              </span>
              <div>
                <h3>Tanah yang sehat, kehidupan yang lebih baik.</h3>
                <p>Catat secara berkala. Temukan keseimbangan untuk kebunmu.</p>
              </div>
            </div>
            <select
              aria-label="Petak untuk kesehatan tanah"
              value={selected.id}
              onChange={(event) => setSelectedId(event.target.value)}
            >
              {data.plots.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.soilType}
                </option>
              ))}
            </select>
          </div>
          {latest ? (
            <>
              <div className="soil-status-heading">
                <h2>
                  Kondisi terkini <span>{selected.name}</span>
                </h2>
                <span>Diuji {formatDate(latest.testedOn, true)}</span>
              </div>
              <div className="soil-metrics">
                <div className="soil-metric ph-metric">
                  <span>Keasaman tanah</span>
                  <div>
                    {numberID(latest.ph)}
                    <small>pH</small>
                  </div>
                  <Badge
                    tone={
                      soilCondition(latest.ph) === "Optimal"
                        ? "green"
                        : "orange"
                    }
                  >
                    {soilCondition(latest.ph)}
                  </Badge>
                </div>
                {[
                  {
                    key: "n" as const,
                    name: "Nitrogen",
                    symbol: "N",
                    unit: "mg/kg",
                  },
                  {
                    key: "p" as const,
                    name: "Fosfor",
                    symbol: "P",
                    unit: "mg/kg",
                  },
                  {
                    key: "k" as const,
                    name: "Kalium",
                    symbol: "K",
                    unit: "mg/kg",
                  },
                  {
                    key: "organicMatter" as const,
                    name: "Bahan organik",
                    symbol: "C",
                    unit: "%",
                  },
                ].map((metric) => (
                  <div className="soil-metric" key={metric.key}>
                    <span>
                      {metric.name}
                      <i>{metric.symbol}</i>
                    </span>
                    <div>
                      {numberID(latest[metric.key])}
                      <small>{metric.unit}</small>
                    </div>
                    <p>
                      {metric.key === "organicMatter"
                        ? "Pendukung kehidupan tanah"
                        : "Hasil pengujian terakhir"}
                    </p>
                  </div>
                ))}
              </div>
              <div className="soil-analysis-grid">
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Perjalanan pH tanah</h2>
                      <p>Perubahan kecil, dampak jangka panjang.</p>
                    </div>
                    <span className="chart-legend">
                      <i /> pH tanah
                    </span>
                  </div>
                  <SoilChart tests={history} />
                </section>
                <section className="panel soil-insight">
                  <span className="insight-icon">
                    <Leaf size={23} />
                  </span>
                  <h3>
                    {soilCondition(latest.ph) === "Optimal"
                      ? "Tanahmu berada di zona nyaman."
                      : "Saatnya memberi perhatian ekstra."}
                  </h3>
                  <p>
                    {latest.ph < 6
                      ? "Tanah cenderung asam. Pertimbangkan pengapuran sesuai hasil analisis laboratorium dan kebutuhan tanaman."
                      : latest.ph > 7
                        ? "Tanah cenderung basa. Konsultasikan perbaikan tanah dengan penyuluh dan pilih tanaman yang toleran."
                        : "pH tanah mendukung penyerapan hara bagi banyak tanaman sayuran. Pertahankan dengan kompos matang dan rotasi teratur."}
                  </p>
                  <div className="ph-scale">
                    <span style={{ left: `${(latest.ph / 14) * 100}%` }} />
                  </div>
                  <div className="ph-scale-labels">
                    <span>0 · Asam</span>
                    <span>7 · Netral</span>
                    <span>14 · Basa</span>
                  </div>
                  <div className="insight-footer">
                    <CheckCircle2 size={14} /> Uji ulang tanah setiap pergantian
                    musim.
                  </div>
                </section>
              </div>
              <section className="panel soil-history-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Riwayat pengujian</h2>
                    <p>
                      Semua catatan tanah {selected.name}, dalam satu tempat.
                    </p>
                  </div>
                  <span className="count-badge">
                    {history.length} pengujian
                  </span>
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Tanggal uji</th>
                        <th>pH</th>
                        <th>
                          N <small>(mg/kg)</small>
                        </th>
                        <th>
                          P <small>(mg/kg)</small>
                        </th>
                        <th>
                          K <small>(mg/kg)</small>
                        </th>
                        <th>Organik</th>
                        <th>Kondisi pH</th>
                        <th aria-label="Tindakan" />
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((test) => (
                        <tr key={test.id}>
                          <td className="table-strong">
                            {formatDate(test.testedOn, true)}
                          </td>
                          <td>{numberID(test.ph)}</td>
                          <td>{numberID(test.n)}</td>
                          <td>{numberID(test.p)}</td>
                          <td>{numberID(test.k)}</td>
                          <td>{numberID(test.organicMatter)}%</td>
                          <td>
                            <Badge
                              tone={
                                soilCondition(test.ph) === "Optimal"
                                  ? "green"
                                  : "orange"
                              }
                            >
                              {soilCondition(test.ph)}
                            </Badge>
                          </td>
                          <td>
                            <button
                              className="icon-button quiet-danger"
                              aria-label={`Hapus uji tanah ${formatDate(test.testedOn)}`}
                              onClick={() => onDelete(test)}
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
              <p className="page-disclaimer">
                <Info size={14} /> Interpretasi N, P, K dan bahan organik
                bergantung pada metode laboratorium, tekstur tanah, serta jenis
                tanaman.
              </p>
            </>
          ) : (
            <EmptyState
              title="Kenali tanahmu lebih dekat"
              description={`Belum ada hasil uji untuk ${selected.name}. Catat pH, unsur hara, dan bahan organik untuk mulai memantau.`}
            >
              <button
                className="button button-primary"
                onClick={() => onAdd(selected.id)}
              >
                <FlaskConical size={16} /> Catat uji tanah pertama
              </button>
            </EmptyState>
          )}
        </>
      )}
    </div>
  );
}
