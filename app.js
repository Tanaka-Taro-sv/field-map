"use strict";

// 初期表示はfields.json内の座標を読んだ後に自動調整します。
const map = L.map("map", { zoomControl: false }).setView([35.6812, 139.7671], 13);
L.control.zoom({ position: "bottomleft" }).addTo(map);

// Esri World Imageryを航空写真の背景として使用します。
L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  {
    attribution: "Tiles &copy; Esri",
    maxZoom: 19
  }
).addTo(map);

const statusElement = document.getElementById("status");
const locateButton = document.getElementById("locate-button");
const excelInput = document.getElementById("excel-input");
let currentLocationMarker;
let currentLocationAccuracy;
let fieldLayer = L.layerGroup().addTo(map);

// HTMLとして解釈されないよう、ポップアップに表示する文字列をエスケープします。
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  }[character]));
}

// ポップアップの内容とGoogleマップへのナビリンクを作成します。
function createPopup(field) {
  const latitude = Number(field.latitude);
  const longitude = Number(field.longitude);
  const destination = encodeURIComponent(`${latitude},${longitude}`);
  const navigationUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;

  return `
    <section class="field-popup">
      <h2>圃場 ${escapeHtml(field.id)}</h2>
      <dl>
        <dt>農家名</dt><dd>${escapeHtml(field.farmer)}</dd>
        <dt>面積</dt><dd>${escapeHtml(field.area)}</dd>
        <dt>作物</dt><dd>${escapeHtml(field.crop)}</dd>
        <dt>備考</dt><dd>${escapeHtml(field.notes || "—")}</dd>
      </dl>
      <a class="navigate-link" href="${navigationUrl}" target="_blank" rel="noopener">Google マップでナビ</a>
    </section>`;
}

// Excelの最初のシートを、見出し行付きの圃場データへ変換します。
function readExcel(arrayBuffer) {
  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) throw new Error("Excelファイルにシートがありません。");
  return XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], { defval: "" });
}

// 圃場データを受け取り、圃場番号のみのマーカーを地図へ配置します。
function displayFields(fields) {
  fieldLayer.clearLayers();
  if (!Array.isArray(fields) || fields.length === 0) throw new Error("圃場データがありません。");
  const bounds = [];
  fields.forEach((field) => {
    const latitude = Number(field.latitude);
    const longitude = Number(field.longitude);
    if (!field.id || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

    const labelIcon = L.divIcon({
      className: "",
      html: `<span class="field-label">${escapeHtml(field.id)}</span>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
    L.marker([latitude, longitude], { icon: labelIcon, title: `圃場 ${field.id}` })
      .addTo(fieldLayer)
      .bindPopup(createPopup(field), { maxWidth: 280 });
    bounds.push([latitude, longitude]);
  });

  if (!bounds.length) throw new Error("有効な圃場番号・緯度・経度が見つかりません。");
  map.fitBounds(bounds, { padding: [40, 40], maxZoom: 17 });
  statusElement.textContent = `${bounds.length}件の圃場を表示中`;
  statusElement.classList.remove("is-error");
  window.setTimeout(() => statusElement.classList.add("is-hidden"), 2500);
}

// GitHub Pagesに配置したfields.xlsxを自動で読み込みます。
async function loadDefaultExcel() {
  try {
    const response = await fetch("fields.xlsx");
    if (!response.ok) throw new Error("fields.xlsxが見つかりません。");
    displayFields(readExcel(await response.arrayBuffer()));
  } catch (error) {
    // 移行中も地図を使えるよう、Excelがない場合だけ従来のJSONを読み込みます。
    try {
      const response = await fetch("fields.json");
      if (!response.ok) throw new Error("圃場データが見つかりません。");
      displayFields(await response.json());
      statusElement.textContent = "fields.xlsxを配置するとExcelの内容を自動表示します。";
      statusElement.classList.remove("is-hidden");
    } catch (fallbackError) {
      statusElement.textContent = "fields.xlsxを配置するか、左下のExcelを選択してください。";
      statusElement.classList.add("is-error");
    }
  }
}

// 端末から選んだExcelも同じ形式で地図に表示します。
excelInput.addEventListener("change", async () => {
  const file = excelInput.files[0];
  if (!file) return;
  try {
    statusElement.textContent = "Excelファイルを読み込んでいます…";
    statusElement.classList.remove("is-hidden", "is-error");
    displayFields(readExcel(await file.arrayBuffer()));
  } catch (error) {
    statusElement.textContent = error.message;
    statusElement.classList.add("is-error");
  }
});

// ブラウザのGPSを使って現在地と精度の範囲を表示します。
function showCurrentLocation() {
  if (!navigator.geolocation) {
    statusElement.textContent = "この端末では位置情報を利用できません。";
    statusElement.classList.remove("is-hidden");
    return;
  }
  statusElement.textContent = "現在地を取得しています…";
  statusElement.classList.remove("is-hidden", "is-error");
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      if (currentLocationMarker) map.removeLayer(currentLocationMarker);
      if (currentLocationAccuracy) map.removeLayer(currentLocationAccuracy);
      currentLocationMarker = L.marker([latitude, longitude]).addTo(map).bindPopup("現在地");
      currentLocationAccuracy = L.circle([latitude, longitude], { radius: accuracy, color: "#1d6fd8", fillColor: "#1d6fd8", fillOpacity: 0.15 }).addTo(map);
      map.setView([latitude, longitude], Math.max(map.getZoom(), 16));
      statusElement.textContent = "現在地を表示しました。";
      window.setTimeout(() => statusElement.classList.add("is-hidden"), 1800);
    },
    () => {
      statusElement.textContent = "現在地を取得できませんでした。位置情報の許可を確認してください。";
      statusElement.classList.add("is-error");
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
  );
}

locateButton.addEventListener("click", showCurrentLocation);
loadDefaultExcel();
