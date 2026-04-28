# Rencana Implementasi: FoodCheck AI

## Ikhtisar

Implementasi dilakukan secara bertahap: dimulai dari struktur proyek dan tipe data, kemudian backend Node.js (OCR, terjemahan, analisis AI, penanganan error), lalu frontend Flutter (layar kamera, pratinjau, hasil analisis, loading, error), dan diakhiri dengan pengujian integrasi.

## Tugas

- [x] 1. Siapkan struktur proyek dan antarmuka inti
  - Buat direktori `backend/` dengan struktur `src/services/`, `src/routes/`, `src/middleware/`, `src/types/`
  - Buat direktori `frontend/` sebagai proyek Flutter dengan struktur `lib/screens/`, `lib/services/`, `lib/widgets/`
  - Definisikan tipe TypeScript: `OcrResult`, `TranslationResult`, `AnalysisResult`, `ApiResponse` di `backend/src/types/index.ts`
  - Inisialisasi `package.json` backend dengan dependensi: `express`, `multer`, `axios`, `fast-check` (dev), `jest` (dev)
  - _Persyaratan: 1.1, 1.2, 1.3, 8.1_

- [ ] 2. Implementasi backend — validasi input dan routing
  - [ ] 2.1 Buat `analyzeRouter` di `backend/src/routes/analyze.ts`
    - Terima `POST /analyze` dengan `multipart/form-data`
    - Validasi keberadaan field `image` sebelum memanggil layanan eksternal
    - Kembalikan HTTP 400 dengan pesan error jika gambar tidak ada
    - _Persyaratan: 1.4_

  - [ ]\* 2.2 Tulis property test untuk penolakan request tanpa gambar
    - **Properti 3: request tanpa gambar selalu ditolak**
    - **Memvalidasi: Persyaratan 1.4**
    - Tag: `// Feature: foodcheck-ai, Property 3: request tanpa gambar selalu ditolak`
    - Generator: request tanpa field `image` (berbagai variasi body)
    - Assertion: respons memiliki `status: "ERROR"` dan HTTP status 400

  - [ ]\* 2.3 Tulis unit test untuk validasi input
    - Uji kasus: gambar ada, gambar tidak ada, field lain tidak relevan
    - _Persyaratan: 1.4_

- [ ] 3. Implementasi `ocrService`
  - [ ] 3.1 Buat `backend/src/services/ocrService.ts`
    - Kirim gambar ke Azure Document Intelligence
    - Parse respons menjadi `OcrResult` (`raw_text`, `language`)
    - Lempar error jika OCR gagal atau teks kosong
    - _Persyaratan: 3.1, 3.2, 3.3, 3.4_

  - [ ]\* 3.2 Tulis unit test untuk `ocrService`
    - Mock Azure Document Intelligence
    - Uji kasus: OCR berhasil, OCR gagal (Azure error), teks kosong/tidak terbaca
    - _Persyaratan: 3.1, 3.2, 3.3, 3.4_

- [ ] 4. Implementasi `translationService`
  - [ ] 4.1 Buat `backend/src/services/translationService.ts`
    - Deteksi apakah `language` dari `OcrResult` bukan `"id"`
    - Jika bukan bahasa Indonesia, kirim teks ke Azure Translator
    - Kembalikan `TranslationResult`; jika gagal, lempar error yang dapat ditangkap sebagai non-fatal
    - _Persyaratan: 4.1, 4.2, 4.3_

  - [ ]\* 4.2 Tulis unit test untuk `translationService`
    - Mock Azure Translator
    - Uji kasus: teks bahasa Indonesia (skip terjemahan), terjemahan berhasil, terjemahan gagal
    - _Persyaratan: 4.1, 4.2, 4.3_

- [ ] 5. Implementasi `aiAnalysisService` dan `riskClassifier`
  - [ ] 5.1 Buat `backend/src/services/aiAnalysisService.ts`
    - Kirim teks ke Azure OpenAI dengan system prompt panduan klasifikasi risiko
    - Parse respons JSON menjadi `AnalysisResult`
    - _Persyaratan: 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 7.1, 7.2_

  - [ ] 5.2 Buat `backend/src/services/riskClassifier.ts`
    - Validasi dan format `risk_level` dari respons AI (`"HIGH"` | `"MEDIUM"` | `"LOW"`)
    - _Persyaratan: 6.1, 6.2, 6.3_

  - [ ]\* 5.3 Tulis property test untuk konsistensi `flagged_items` sebagai subset `ingredients`
    - **Properti 1: flagged_items selalu subset dari ingredients**
    - **Memvalidasi: Persyaratan 5.2, 5.3, 6.1, 6.2, 6.3**
    - Tag: `// Feature: foodcheck-ai, Property 1: flagged_items selalu subset dari ingredients`
    - Generator: `AnalysisResult` acak dengan `ingredients` dan `flagged_items` dihasilkan secara acak
    - Assertion: `flagged_items.every(item => ingredients.includes(item))`

  - [ ]\* 5.4 Tulis property test untuk konsistensi `risk_level` dengan `flagged_items`
    - **Properti 2: risk_level konsisten dengan keberadaan flagged_items**
    - **Memvalidasi: Persyaratan 6.1, 6.2, 6.3**
    - Tag: `// Feature: foodcheck-ai, Property 2: risk_level konsisten dengan keberadaan flagged_items`
    - Generator: `AnalysisResult` acak
    - Assertion: `(risk_level === "LOW") === (flagged_items.length === 0)`

  - [ ]\* 5.5 Tulis unit test untuk `aiAnalysisService`
    - Mock Azure OpenAI
    - Uji kasus: parsing berhasil, OpenAI gagal, respons tidak valid
    - _Persyaratan: 5.1, 5.2, 5.3, 5.4_

- [ ] 6. Implementasi `responseBuilder` dan `errorHandler`
  - [ ] 6.1 Buat `backend/src/services/responseBuilder.ts`
    - Bentuk `ApiResponse` final: `{ status, data?, warning?, message? }`
    - Tangani kasus: sukses normal, sukses dengan warning terjemahan, error
    - _Persyaratan: 8.1, 4.3_

  - [ ] 6.2 Buat `backend/src/middleware/errorHandler.ts`
    - Middleware Express terpusat untuk semua error
    - Petakan jenis error ke HTTP status dan pesan yang sesuai (lihat tabel error di desain)
    - _Persyaratan: 10.1, 10.2, 3.3, 3.4_

  - [ ]\* 6.3 Tulis property test untuk struktur respons yang selalu valid
    - **Properti 4: respons selalu memiliki struktur yang valid**
    - **Memvalidasi: Persyaratan 8.1**
    - Tag: `// Feature: foodcheck-ai, Property 4: respons selalu memiliki struktur yang valid`
    - Generator: berbagai kombinasi input valid ke `responseBuilder`
    - Assertion: respons memiliki `status`; jika `SUCCESS` maka `data` berisi `ingredients`, `risk_level`, `flagged_items`, `explanation`

  - [ ]\* 6.4 Tulis property test untuk fallback terjemahan
    - **Properti 5: kegagalan terjemahan menghasilkan SUCCESS dengan warning**
    - **Memvalidasi: Persyaratan 4.3**
    - Tag: `// Feature: foodcheck-ai, Property 5: kegagalan terjemahan menghasilkan SUCCESS dengan warning`
    - Generator: teks non-Indonesia acak dengan `translationService` di-mock untuk gagal
    - Assertion: respons memiliki `status: "SUCCESS"` dan field `warning` tidak kosong

  - [ ]\* 6.5 Tulis unit test untuk `responseBuilder` dan `errorHandler`
    - Uji semua skenario error pada tabel penanganan error
    - _Persyaratan: 8.1, 10.1, 10.2_

- [ ] 7. Checkpoint — Pastikan semua tes backend lulus
  - Pastikan semua tes lulus, tanyakan kepada pengguna jika ada pertanyaan.

- [ ] 8. Implementasi Flutter — `ApiService`
  - [ ] 8.1 Buat `frontend/lib/services/api_service.dart`
    - Implementasi `POST /analyze` dengan `multipart/form-data` menggunakan `http` atau `dio`
    - Parse respons JSON menjadi model Dart yang sesuai (`ApiResponse`, `AnalysisResult`)
    - Tangani error jaringan dan timeout
    - _Persyaratan: 9.1, 10.1_

  - [ ]\* 8.2 Tulis unit test untuk `ApiService`
    - Mock HTTP response
    - Uji kasus: sukses, error jaringan, respons tidak valid, timeout
    - _Persyaratan: 9.1, 10.1_

- [ ] 9. Implementasi Flutter — layar kamera dan pratinjau
  - [ ] 9.1 Buat `CameraScreen` di `frontend/lib/screens/camera_screen.dart`
    - Tampilkan live preview kamera menggunakan plugin `camera`
    - Tombol ambil foto dan pilih dari galeri (`image_picker`)
    - Navigasi ke `ImagePreviewScreen` setelah gambar dipilih
    - _Persyaratan: 1.1, 1.2, 1.3_

  - [ ] 9.2 Buat `ImagePreviewScreen` di `frontend/lib/screens/image_preview_screen.dart`
    - Tampilkan pratinjau gambar yang dipilih
    - Tombol "Ambil Ulang" (kembali ke `CameraScreen`) dan "Analisis" (panggil `ApiService`)
    - Tampilkan `LoadingOverlay` saat analisis berlangsung
    - _Persyaratan: 2.1, 2.2, 2.3, 9.1_

  - [ ]\* 9.3 Tulis widget test untuk `ImagePreviewScreen`
    - Verifikasi tombol "Ambil Ulang" dan "Analisis" tampil
    - Verifikasi `LoadingOverlay` muncul saat loading
    - _Persyaratan: 2.1, 2.2, 2.3, 9.1_

- [ ] 10. Implementasi Flutter — layar hasil analisis dan komponen UI
  - [ ] 10.1 Buat `AnalysisResultScreen` di `frontend/lib/screens/analysis_result_screen.dart`
    - Tampilkan daftar `ingredients` dengan highlight untuk `flagged_items`
    - Tampilkan badge `risk_level` (HIGH/MEDIUM/LOW) dengan warna berbeda
    - Tampilkan `explanation` dari AI
    - _Persyaratan: 8.1, 8.2_

  - [ ] 10.2 Buat `LoadingOverlay` di `frontend/lib/widgets/loading_overlay.dart`
    - Widget overlay dengan indikator loading yang terlihat jelas
    - _Persyaratan: 9.1_

  - [ ] 10.3 Buat `ErrorDialog` di `frontend/lib/widgets/error_dialog.dart`
    - Tampilkan pesan error dan saran tindakan
    - _Persyaratan: 10.1, 10.2_

  - [ ]\* 10.4 Tulis widget test untuk `AnalysisResultScreen`
    - Verifikasi rendering `ingredients`, highlight `flagged_items`, badge `risk_level`, teks `explanation`
    - _Persyaratan: 8.1, 8.2_

  - [ ]\* 10.5 Tulis widget test untuk `LoadingOverlay` dan `ErrorDialog`
    - Verifikasi `LoadingOverlay` tampil saat loading dan hilang setelah selesai
    - Verifikasi `ErrorDialog` menampilkan pesan error dengan benar
    - _Persyaratan: 9.1, 10.1, 10.2_

- [ ] 11. Checkpoint akhir — Pastikan semua tes lulus
  - Pastikan semua tes lulus, tanyakan kepada pengguna jika ada pertanyaan.

## Catatan

- Tugas bertanda `*` bersifat opsional dan dapat dilewati untuk MVP yang lebih cepat
- Setiap tugas mereferensikan persyaratan spesifik untuk keterlacakan
- Property test memvalidasi properti kebenaran universal yang didefinisikan dalam dokumen desain
- Unit test memvalidasi contoh spesifik dan kasus tepi
- Checkpoint memastikan validasi bertahap sebelum melanjutkan ke fase berikutnya
