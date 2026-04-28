const fs = require("fs");
const path = require("path");

const labels = [
  {
    name: "label_high_risk.svg",
    title: "SNACK COKELAT MANIS",
    ingredients: [
      "Gula, Tepung Terigu, Lemak Nabati,",
      "Cokelat Bubuk, Natrium Benzoat,",
      "Tartrazin (Pewarna), Monosodium",
      "Glutamat (MSG), Garam, Vanili.",
    ],
    nutrition: [
      "Energi: 250 kkal",
      "Lemak: 12g",
      "Natrium: 480mg",
      "Gula: 28g",
    ],
    warning: "MENGANDUNG GLUTEN, SUSU, KEDELAI",
  },
  {
    name: "label_medium_risk.svg",
    title: "MINUMAN SARI BUAH",
    ingredients: [
      "Air, Gula, Sari Buah Jeruk 15%,",
      "Asam Sitrat, Natrium Benzoat,",
      "Vitamin C, Perisa Jeruk Alami.",
    ],
    nutrition: ["Energi: 120 kkal", "Lemak: 0g", "Natrium: 45mg", "Gula: 26g"],
    warning: "MENGANDUNG PENGAWET",
  },
  {
    name: "label_low_risk.svg",
    title: "AIR MINERAL MURNI",
    ingredients: ["Air Mineral Alami."],
    nutrition: ["Energi: 0 kkal", "Lemak: 0g", "Natrium: 5mg", "Gula: 0g"],
    warning: "",
  },
];

function generateSVG(label) {
  const lh = 22;
  const ingStartY = 160;
  const ingEndY = ingStartY + label.ingredients.length * lh;
  const nutStartY = ingEndY + 50;
  const nutEndY = nutStartY + label.nutrition.length * lh;
  const totalHeight = nutEndY + (label.warning ? 80 : 40);

  const ingLines = label.ingredients
    .map(
      (line, i) =>
        `<text x="30" y="${ingStartY + i * lh}" font-size="14" fill="#333" font-family="Arial">${line}</text>`,
    )
    .join("\n  ");

  const nutLines = label.nutrition
    .map(
      (line, i) =>
        `<text x="30" y="${nutStartY + i * lh}" font-size="13" fill="#555" font-family="Arial">${line}</text>`,
    )
    .join("\n  ");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="400" height="${totalHeight}" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="${totalHeight}" fill="white" stroke="#ccc" stroke-width="2" rx="8"/>
  <rect width="400" height="80" fill="#2e7d32" rx="8"/>
  <rect y="72" width="400" height="8" fill="#2e7d32"/>
  <text x="200" y="38" font-size="18" font-weight="bold" fill="white" text-anchor="middle" font-family="Arial">${label.title}</text>
  <text x="200" y="62" font-size="12" fill="#c8e6c9" text-anchor="middle" font-family="Arial">Berat Bersih: 150g</text>
  <text x="30" y="115" font-size="15" font-weight="bold" fill="#1b5e20" font-family="Arial">Komposisi:</text>
  <line x1="30" y1="122" x2="370" y2="122" stroke="#ccc" stroke-width="1"/>
  ${ingLines}
  <line x1="30" y1="${ingEndY + 20}" x2="370" y2="${ingEndY + 20}" stroke="#eee" stroke-width="1"/>
  <text x="30" y="${nutStartY - 12}" font-size="15" font-weight="bold" fill="#333" font-family="Arial">Nilai Gizi per Sajian:</text>
  ${nutLines}
  ${
    label.warning
      ? `<rect x="20" y="${nutEndY + 10}" width="360" height="34" fill="#fff3e0" rx="4" stroke="#ff9800" stroke-width="1"/>
  <text x="200" y="${nutEndY + 32}" font-size="11" fill="#e65100" text-anchor="middle" font-family="Arial" font-weight="bold">PERINGATAN: ${label.warning}</text>`
      : ""
  }
</svg>`;
}

labels.forEach((label) => {
  const filePath = path.join(__dirname, label.name);
  fs.writeFileSync(filePath, generateSVG(label), "utf8");
  console.log("Generated:", filePath);
});

console.log("\nPush ke emulator:");
labels.forEach((l) => {
  console.log(
    `  adb push "D:\\project\\foodcheck-ai\\test\\${l.name}" /sdcard/Pictures/${l.name}`,
  );
});
console.log("\nScan galeri:");
console.log(
  "  adb shell am broadcast -a android.intent.action.MEDIA_SCANNER_SCAN_FILE -d file:///sdcard/Pictures/label_high_risk.svg",
);
console.log(
  "  adb shell am broadcast -a android.intent.action.MEDIA_SCANNER_SCAN_FILE -d file:///sdcard/Pictures/label_medium_risk.svg",
);
console.log(
  "  adb shell am broadcast -a android.intent.action.MEDIA_SCANNER_SCAN_FILE -d file:///sdcard/Pictures/label_low_risk.svg",
);
