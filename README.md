# FoodCheck AI

Aplikasi pemindai label makanan berbasis kecerdasan buatan. Pengguna cukup memotret atau mengunggah gambar label produk makanan, lalu sistem secara otomatis mengekstrak teks, menerjemahkannya ke Bahasa Indonesia, dan menganalisis kandungan bahan serta tingkat risiko kesehatannya.

---

## Fitur Utama

- **Pemindaian Label via Kamera atau Galeri** — Ambil foto langsung atau pilih gambar dari galeri perangkat.
- **OCR Otomatis** — Ekstraksi teks dari gambar label menggunakan Azure Document Intelligence dengan deteksi bahasa otomatis.
- **Terjemahan ke Bahasa Indonesia** — Label berbahasa asing diterjemahkan secara otomatis menggunakan Azure Translator sebelum dianalisis.
- **Analisis Bahan dengan AI** — Azure OpenAI (GPT-4o-mini) mengidentifikasi seluruh bahan dan menandai bahan yang berpotensi berbahaya.
- **Klasifikasi Tingkat Risiko** — Setiap produk diklasifikasikan ke dalam tiga tingkat: `HIGH`, `MEDIUM`, atau `LOW`.
- **Penjelasan Ramah Pengguna** — Hasil analisis disajikan dalam Bahasa Indonesia yang mudah dipahami.
- **Penanganan Error Terstruktur** — Respons API konsisten dengan kode status HTTP yang tepat untuk setiap jenis kegagalan.

---

## Teknologi yang Digunakan

### Backend

| Teknologi                   | Keterangan                            |
| --------------------------- | ------------------------------------- |
| Node.js + Express           | Server HTTP                           |
| TypeScript 5.4              | Bahasa pemrograman                    |
| Multer                      | Penanganan unggah file                |
| Axios                       | HTTP client untuk layanan Azure       |
| Jest + Supertest            | Unit test dan property-based test     |
| Azure Document Intelligence | OCR dan deteksi bahasa                |
| Azure Translator            | Terjemahan teks                       |
| Azure OpenAI (GPT-4o-mini)  | Analisis bahan dan klasifikasi risiko |

### Frontend

| Teknologi         | Keterangan                       |
| ----------------- | -------------------------------- |
| Flutter (Dart)    | Framework mobile lintas platform |
| camera            | Akses kamera perangkat           |
| image_picker      | Pemilihan gambar dari galeri     |
| http              | Komunikasi dengan backend API    |
| Material Design 3 | Sistem desain antarmuka          |

---

## Struktur Folder

```
foodcheck-ai/
├── backend/
│   ├── src/
│   │   ├── index.ts                  # Entry point server Express
│   │   ├── routes/
│   │   │   └── analyze.ts            # Endpoint POST /analyze
│   │   ├── services/
│   │   │   ├── ocrService.ts         # Ekstraksi teks via Azure Document Intelligence
│   │   │   ├── translationService.ts # Terjemahan via Azure Translator
│   │   │   ├── aiAnalysisService.ts  # Analisis bahan via Azure OpenAI
│   │   │   ├── riskClassifier.ts     # Validasi tingkat risiko
│   │   │   └── responseBuilder.ts    # Pembentukan respons API
│   │   ├── middleware/
│   │   │   └── errorHandler.ts       # Penanganan error terpusat
│   │   └── types/
│   │       └── index.ts              # Definisi tipe TypeScript
│   ├── .env.example                  # Contoh konfigurasi environment
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    ├── lib/
    │   ├── main.dart                 # Entry point aplikasi Flutter
    │   ├── screens/
    │   │   ├── home_screen.dart      # Layar utama
    │   │   ├── camera_screen.dart    # Layar kamera
    │   │   ├── image_preview_screen.dart  # Pratinjau gambar
    │   │   └── analysis_result_screen.dart # Tampilan hasil analisis
    │   └── services/
    │       └── api_service.dart      # Klien HTTP ke backend
    ├── pubspec.yaml
    └── android/ ios/                 # Konfigurasi platform native
```

---

## Instalasi dan Menjalankan Proyek

### Prasyarat

- Node.js >= 18
- Flutter SDK >= 3.0
- Akun Azure dengan layanan berikut aktif:
  - Azure Document Intelligence
  - Azure Translator
  - Azure OpenAI

---

### Backend

**1. Masuk ke direktori backend dan instal dependensi**

```bash
cd backend
npm install
```

**2. Salin file konfigurasi dan isi nilai environment**

```bash
cp .env.example .env
```

Edit file `.env` dengan kredensial Azure Anda:

```env
PORT=3000

AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=https://<your-resource>.cognitiveservices.azure.com/
AZURE_DOCUMENT_INTELLIGENCE_KEY=<your-key>

AZURE_TRANSLATOR_ENDPOINT=https://api.cognitive.microsofttranslator.com
AZURE_TRANSLATOR_KEY=<your-key>
AZURE_TRANSLATOR_REGION=southeastasia

AZURE_OPENAI_ENDPOINT=https://<your-resource>.openai.azure.com/
AZURE_OPENAI_API_KEY=<your-key>
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o-mini
AZURE_OPENAI_API_VERSION=2024-02-01
```

**3. Jalankan server**

Mode development:

```bash
npm run dev
```

Mode production:

```bash
npm run build
npm start
```

Server berjalan di `http://localhost:3000`.

**4. Menjalankan test**

```bash
npm test
```

---

### Frontend

**1. Masuk ke direktori frontend dan ambil dependensi**

```bash
cd frontend
flutter pub get
```

**2. Sesuaikan URL backend**

Buka `frontend/lib/services/api_service.dart` dan pastikan `baseUrl` mengarah ke alamat server backend yang berjalan.

**3. Jalankan aplikasi**

```bash
flutter run
```

---

## API Reference

### POST /analyze

Menerima gambar label makanan dan mengembalikan hasil analisis.

**Request**

```
Content-Type: multipart/form-data
```

| Field   | Tipe | Keterangan                             |
| ------- | ---- | -------------------------------------- |
| `image` | File | Gambar label makanan (JPEG, PNG, dll.) |

**Response — Sukses (200)**

```json
{
  "status": "SUCCESS",
  "warning": "Opsional: pesan non-fatal jika terjemahan gagal",
  "data": {
    "ingredients": ["gula", "garam", "natrium benzoat"],
    "risk_level": "HIGH",
    "flagged_items": ["gula", "natrium benzoat"],
    "explanation": "Produk ini mengandung kadar gula tinggi dan pengawet natrium benzoat yang perlu diwaspadai."
  }
}
```

**Response — Error**

| Kode | Penyebab                              |
| ---- | ------------------------------------- |
| 400  | Tidak ada gambar yang dikirim         |
| 422  | Teks tidak dapat dikenali dari gambar |
| 502  | Layanan OCR atau AI tidak tersedia    |
| 503  | Koneksi ke layanan Azure gagal        |
| 500  | Kesalahan internal server             |
