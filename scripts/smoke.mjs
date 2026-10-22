import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
const date = new Date().toISOString().slice(0, 10);
const addDays = (value, amount) =>
  new Date(Date.parse(value) + amount * 86400000).toISOString().slice(0, 10);
const farmName = `Kebun Uji Otomatis ${Date.now()}`;
const plotName = "Petak Uji Browser";
let farmId;

async function api(resource, method = "GET", values) {
  const response = await fetch(`${base}/api/${resource}`, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(values ? { body: JSON.stringify(values) } : {}),
  });
  return { status: response.status, data: await response.json() };
}

await mkdir("artifacts", { recursive: true });
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const browserErrors = [];
page.on("pageerror", (error) => browserErrors.push(error.message));
const baseline = (await api("workspace")).data;
const dialog = page.getByRole("dialog");
const nav = page.locator('nav[aria-label="Navigasi utama"]');
const navigate = async (name) =>
  nav.getByRole("button", { name: new RegExp(name) }).click();
const closed = async () => dialog.waitFor({ state: "hidden" });
const openPlot = async () =>
  page.getByRole("button", { name: new RegExp(`Lihat ${plotName}`) }).click();

try {
  assert.equal((await api("health")).status, 200);
  await page.goto(base, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: "artifacts/dashboard-desktop.png",
    fullPage: true,
  });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  console.log("PASS: desktop dashboard, fonts, assets, and horizontal layout");

  for (const [name, heading] of [
    ["Kebun & Petak", "Kebun & petak"],
    ["Rencana Rotasi", "Rencana rotasi"],
    ["Riwayat Tanam", "Riwayat tanam"],
    ["Kesehatan Tanah", "Kesehatan tanah"],
    ["Katalog Tanaman", "Katalog tanaman"],
  ]) {
    await navigate(name);
    await page.getByRole("heading", { name: heading, exact: true }).waitFor();
    if (name === "Rencana Rotasi") {
      await page.locator(".recommendation-card").first().waitFor();
      await page.screenshot({
        path: "artifacts/rotation-desktop.png",
        fullPage: true,
      });
    }
    if (name === "Kesehatan Tanah")
      await page.screenshot({
        path: "artifacts/soil-desktop.png",
        fullPage: true,
      });
  }
  console.log("PASS: all six application sections");

  await page
    .getByRole("textbox", { name: "Cari petak atau tanaman", exact: true })
    .fill("Tomat");
  await page
    .locator(".search-results")
    .getByRole("button", { name: /Tomat ceri Katalog tanaman/ })
    .click();
  assert.equal(await page.locator(".catalog-card").count(), 1);
  console.log("PASS: global search and catalog filtering");

  await navigate("Kebun & Petak");
  await page.getByRole("button", { name: "Kebun baru", exact: true }).click();
  await dialog.getByLabel(/^Nama kebun/).fill(farmName);
  await dialog.getByLabel(/^Lokasi/).fill("Bandung, Jawa Barat");
  await dialog.getByRole("button", { name: "Buat kebun", exact: true }).click();
  await closed();
  farmId = (await api("workspace")).data.farms.find(
    (f) => f.name === farmName,
  ).id;
  await page.getByRole("heading", { name: farmName, exact: true }).waitFor();

  await page.getByRole("button", { name: "Tambah petak", exact: true }).click();
  await dialog.getByLabel(/^Nama petak/).fill(plotName);
  await dialog.getByLabel(/^Luas petak/).fill("15");
  await dialog.getByLabel(/^Jenis tanah/).selectOption("Lempung");
  await dialog
    .getByRole("button", { name: "Tambahkan petak", exact: true })
    .click();
  await closed();
  const workspace = (await api("workspace")).data;
  const plot = workspace.plots.find((p) => p.farmId === farmId);
  const tomato = workspace.crops.find((c) => c.commonName === "Tomat ceri");
  assert.equal(plot.area, 15);
  console.log("PASS: create garden and plot through UI, persist in PostgreSQL");

  await openPlot();
  await dialog
    .getByRole("button", { name: "Catat penanaman", exact: true })
    .click();
  await dialog.getByLabel(/^Tanaman/).selectOption(tomato.id);
  await dialog
    .getByLabel(/^Catatan kebun/)
    .fill("Pengujian otomatis: bibit sehat dan tanah lembap.");
  await dialog
    .getByRole("button", { name: "Simpan penanaman", exact: true })
    .click();
  await closed();
  const planted = (await api("workspace")).data.plantings.find(
    (p) => p.plotId === plot.id,
  );
  assert.equal(planted.cropId, tomato.id);
  assert.equal(planted.harvestedOn, null);
  console.log("PASS: record active planting through UI");

  await openPlot();
  await dialog
    .getByRole("button", { name: "Catat uji tanah", exact: true })
    .click();
  for (const [label, value] of [
    [/^pH tanah/, "6.4"],
    [/^Nitrogen/, "35"],
    [/^Fosfor/, "24"],
    [/^Kalium/, "180"],
    [/^Bahan organik/, "3.8"],
  ]) {
    await dialog.getByLabel(label).fill(value);
  }
  await dialog
    .getByRole("button", { name: "Simpan hasil uji", exact: true })
    .click();
  await closed();
  assert.equal(
    (await api("workspace")).data.soilTests.find((s) => s.plotId === plot.id)
      .ph,
    6.4,
  );
  const invalidSoil = await api("soil-tests", "POST", {
    plotId: plot.id,
    testedOn: date,
    ph: 15,
    n: 30,
    p: 20,
    k: 160,
    organicMatter: 3,
  });
  assert.equal(invalidSoil.status, 400);
  const laterSoil = await api("soil-tests", "POST", {
    plotId: plot.id,
    testedOn: date,
    ph: 6.6,
    n: 36,
    p: 26,
    k: 185,
    organicMatter: 4,
  });
  assert.equal(laterSoil.status, 201);
  assert.equal(
    (await api("workspace")).data.soilTests.filter(
      (s) => s.plotId === plot.id,
    )[0].ph,
    6.6,
  );
  console.log(
    "PASS: soil form, invalid pH rejection, same-day latest observation ordering",
  );

  const overlap = await api("plantings", "POST", {
    plotId: plot.id,
    cropId: tomato.id,
    plantedOn: date,
    expectedHarvestOn: addDays(date, 75),
    allowRepeat: true,
  });
  assert.equal(overlap.status, 409);
  await openPlot();
  await dialog
    .getByRole("button", { name: "Catat hasil panen", exact: true })
    .click();
  await dialog
    .getByLabel(/^Catatan hasil/)
    .fill("Pengujian otomatis: panen selesai, tidak ada hama.");
  await dialog
    .getByRole("button", { name: "Simpan panen", exact: true })
    .click();
  await closed();
  assert.equal(
    (await api("workspace")).data.plantings.find((p) => p.id === planted.id)
      .harvestedOn,
    date,
  );
  console.log("PASS: active overlap rejection and harvest workflow");

  await openPlot();
  await dialog
    .getByRole("button", { name: "Rekomendasi rotasi", exact: true })
    .click();
  await page.locator(".recommendation-card").first().waitFor();
  const recommendations = (await api(`rotation?plotId=${plot.id}`)).data;
  assert.equal(recommendations[0].family, "Fabaceae");
  assert.ok(
    recommendations
      .filter((r) => r.recommended)
      .every((r) => r.crop.familyId !== tomato.familyId),
  );
  await page
    .locator(".avoid-options")
    .getByRole("button", { name: /Tomat ceri/ })
    .click();
  const submitPlan = dialog.getByRole("button", {
    name: "Simpan rencana tanam",
    exact: true,
  });
  assert.equal(await submitPlan.isDisabled(), true);
  await dialog
    .getByRole("checkbox", { name: /Saya memahami risikonya/ })
    .check();
  assert.equal(await submitPlan.isDisabled(), false);
  assert.ok((await dialog.getByLabel(/^Tanggal tanam/).inputValue()) > date);
  await dialog.getByRole("button", { name: "Batal", exact: true }).click();
  await closed();
  const repeated = await api("plantings", "POST", {
    plotId: plot.id,
    cropId: tomato.id,
    plantedOn: addDays(date, 1),
    expectedHarvestOn: addDays(date, 76),
  });
  assert.equal(repeated.status, 409);
  console.log(
    "PASS: rotation engine, future-season date, explicit risk acknowledgement, server-side warning",
  );

  await page
    .locator(".recommendation-card")
    .first()
    .getByRole("button", { name: "Rencanakan tanam", exact: true })
    .click();
  await dialog
    .getByRole("button", { name: "Simpan rencana tanam", exact: true })
    .click();
  await closed();
  const plan = (await api("workspace")).data.plantings.find(
    (p) => p.plotId === plot.id && !p.harvestedOn,
  );
  assert.ok(plan.plantedOn > date);
  assert.notEqual(plan.cropId, tomato.id);
  console.log("PASS: save recommended next-season planting");

  await navigate("Riwayat Tanam");
  await page.getByLabel("Filter petak", { exact: true }).selectOption(plot.id);
  assert.equal(await page.locator("tbody tr").count(), 2);
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Ekspor CSV", exact: true }).click(),
  ]);
  assert.ok(download.suggestedFilename().endsWith(".csv"));
  await download.saveAs("artifacts/riwayat-uji.csv");
  await page
    .getByRole("button", {
      name: `Detail penanaman Tomat ceri di ${plotName}`,
      exact: true,
    })
    .click();
  await dialog
    .getByLabel(/^Catatan hama/)
    .fill("Catatan panen berhasil diperbarui melalui UI.");
  await dialog
    .getByRole("button", { name: "Simpan catatan", exact: true })
    .click();
  await closed();
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(
    (await api("workspace")).data.plantings.find((p) => p.id === planted.id)
      .notes,
    "Catatan panen berhasil diperbarui melalui UI.",
  );
  console.log(
    "PASS: history filtering, CSV download, editable notes, reload persistence",
  );

  const concurrentPlot = await api("plots", "POST", {
    farmId,
    name: "Petak Uji Bersamaan",
    area: 2,
    soilType: "Humus",
  });
  assert.equal(concurrentPlot.status, 201);
  const concurrentBody = {
    plotId: concurrentPlot.data.id,
    cropId: tomato.id,
    plantedOn: date,
    expectedHarvestOn: addDays(date, 75),
  };
  const concurrentResults = await Promise.all([
    api("plantings", "POST", concurrentBody),
    api("plantings", "POST", concurrentBody),
  ]);
  assert.deepEqual(concurrentResults.map((r) => r.status).sort(), [201, 409]);
  assert.equal(
    (
      await api("plots", "POST", {
        farmId,
        name: "Petak tidak valid",
        area: 0,
        soilType: "Lempung",
      })
    ).status,
    400,
  );
  assert.equal((await api("rotation?plotId=invalid")).status, 400);
  console.log(
    "PASS: concurrency lock, positive-area validation, UUID validation",
  );

  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  mobile.on("pageerror", (error) => browserErrors.push(error.message));
  await mobile.goto(base, { waitUntil: "networkidle" });
  await mobile.screenshot({
    path: "artifacts/dashboard-mobile.png",
    fullPage: true,
  });
  assert.equal(
    await mobile.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  await mobile
    .getByRole("button", { name: "Buka navigasi", exact: true })
    .click();
  await mobile
    .locator('nav[aria-label="Navigasi utama"]')
    .getByRole("button", { name: "Kebun & Petak", exact: true })
    .click();
  await mobile
    .getByRole("heading", { name: "Kebun & petak", exact: true })
    .waitFor();
  await mobile
    .getByRole("button", { name: "Tambah petak", exact: true })
    .click();
  await mobile.getByRole("dialog").waitFor();
  assert.equal(
    await mobile.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  await mobile.keyboard.press("Escape");
  await mobile.getByRole("dialog").waitFor({ state: "hidden" });
  console.log(
    "PASS: mobile layout, navigation, responsive form, Escape dismissal",
  );

  await page.goto(`${base}/tentang`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: /Kebun kecil/ }).waitFor();
  await page.screenshot({
    path: "artifacts/landing-desktop.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "Buka kebunku", exact: true }).click();
  await page.getByRole("heading", { name: /Selamat pagi/ }).waitFor();
  assert.deepEqual(browserErrors, []);
  console.log(
    "PASS: landing-to-dashboard flow and no browser JavaScript errors",
  );

  const beforeWidget = page.url();
  const fab = page.locator(".support-fab");
  await fab.waitFor();
  assert.ok(
    (await fab.innerText()).includes("Kopi kecil, server tetap jalan"),
  );
  await fab.click();
  const support = page.getByRole("dialog", { name: "Dukung TerraSiklus" });
  await support.waitFor();
  assert.equal(page.url(), beforeWidget);
  const amounts = support.getByRole("button", { name: /^Rp/ });
  assert.equal(await amounts.count(), 6);
  assert.deepEqual(await amounts.allInnerTexts(), [
    "Rp6.000",
    "Rp12.000",
    "Rp24.000",
    "Rp48.000",
    "Rp96.000",
    "Rp192.000",
  ]);
  await support.getByRole("button", { name: "Rp24.000", exact: true }).click();
  const trakteerLink = support.getByRole("link", { name: "Buka Trakteer" });
  assert.ok(
    (await trakteerLink.getAttribute("href")).includes("amount=24000"),
  );
  assert.equal(await support.locator("svg.support-qr").count(), 1);
  await page.keyboard.press("Escape");
  await support.waitFor({ state: "hidden" });
  console.log(
    "PASS: Trakteer support widget, inline QR, amount ladder, no navigation",
  );

  const archive = await fetch(`${base}/terrasiklus-source.zip`);
  assert.equal(archive.status, 200);
  const bytes = Buffer.from(await archive.arrayBuffer());
  assert.equal(bytes.subarray(0, 2).toString(), "PK");
  assert.ok(bytes.length > 10000);
  console.log("PASS: source code archive served as a valid ZIP");
} catch (error) {
  await page
    .screenshot({ path: "artifacts/test-failure.png", fullPage: true })
    .catch(() => {});
  throw error;
} finally {
  const current = (await api("workspace")).data;
  const testFarm = current.farms.find(
    (f) => f.id === farmId || f.name === farmName,
  );
  if (testFarm) {
    assert.equal(
      (await api("farms", "DELETE", { id: testFarm.id })).status,
      200,
    );
    const cleaned = (await api("workspace")).data;
    assert.equal(cleaned.farms.length, baseline.farms.length);
    assert.equal(cleaned.plots.length, baseline.plots.length);
    assert.equal(cleaned.plantings.length, baseline.plantings.length);
    assert.equal(cleaned.soilTests.length, baseline.soilTests.length);
    console.log("PASS: cascading cleanup, original garden data preserved");
  }
  await browser.close();
}
console.log("All TerraSiklus end-to-end smoke tests passed.");
