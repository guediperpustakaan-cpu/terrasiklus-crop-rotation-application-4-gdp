export const TRAKTEER_PROFILE = "https://trakteer.id/perpus_opera";
export const TRAKTEER_TIP = "https://trakteer.id/perpus_opera/tip";
export const SUPPORT_TAGLINE =
  "Web app ini gratis & bebas iklan. Kopi kecil, server tetap jalan";
export const SUPPORT_AMOUNTS = [
  6000, 12000, 24000, 48000, 96000, 192000,
] as const;
export const SOURCE_FILE_NAME = "terrasiklus-source.zip";
export const SOURCE_DOWNLOAD_URL = `/${SOURCE_FILE_NAME}`;
export const OPEN_SOURCE_CREDIT = "Open Source oleh MZF - 2026";
export function rupiah(value: number) {
  return `Rp${value.toLocaleString("id-ID")}`;
}
export function tipUrl(amount: number) {
  return `${TRAKTEER_TIP}?amount=${amount}`;
}
