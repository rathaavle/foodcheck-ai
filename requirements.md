# Dokumen Persyaratan

## Pendahuluan

FoodCheck AI adalah aplikasi berbasis kecerdasan buatan yang membantu pengguna memahami kandungan makanan dan risiko kesehatan dengan memindai label produk secara otomatis. Pengguna dapat mengambil foto atau mengunggah gambar label makanan, kemudian sistem akan mengekstrak teks menggunakan OCR, menerjemahkan ke bahasa Indonesia jika diperlukan, menganalisis kandungan bahan menggunakan AI, dan menampilkan hasil analisis beserta tingkat risiko kesehatan secara visual.

## Glosarium

- **Sistem**: Aplikasi FoodCheck AI secara keseluruhan
- **Pengguna**: Individu yang menggunakan aplikasi FoodCheck AI
- **Kamera**: Komponen antarmuka yang mengakses kamera perangkat pengguna
- **Galeri**: Penyimpanan gambar lokal pada perangkat pengguna
- **OCR_Service**: Layanan ekstraksi teks dari gambar (Optical Character Recognition)
- **Translation_Service**: Layanan penerjemahan teks ke bahasa Indonesia
- **AI_Analyzer**: Komponen analisis kandungan bahan makanan berbasis kecerdasan buatan
- **Risk_Scorer**: Komponen yang menghitung dan menentukan tingkat risiko kesehatan
- **Result_Display**: Komponen antarmuka yang menampilkan hasil analisis kepada pengguna
- **Label_Makanan**: Teks informasi kandungan gizi dan bahan yang tertera pada kemasan produk makanan
- **Tingkat Risiko**: Klasifikasi risiko kesehatan: HIGH (tinggi), MEDIUM (sedang), LOW (rendah)
- **Alergen**: Bahan makanan yang berpotensi menyebabkan reaksi alergi
- **Aditif**: Bahan tambahan makanan seperti pengawet, pewarna, dan penyedap rasa

---

## Persyaratan

### Persyaratan 1: Pengambilan dan Unggah Gambar

**User Story:** Sebagai pengguna, saya ingin mengambil foto atau memilih gambar label makanan dari galeri, agar sistem dapat memproses dan menganalisis kandungan makanan tersebut.

#### Kriteria Penerimaan

1. WHEN pengguna membuka fitur kamera, THE Kamera SHALL menampilkan pratinjau kamera secara langsung (live preview).
2. WHEN pengguna mengambil foto label makanan, THE Sistem SHALL menyimpan gambar tersebut ke memori sementara untuk diproses.
3. WHEN pengguna memilih gambar dari Galeri, THE Sistem SHALL menerima dan menyimpan gambar tersebut ke memori sementara untuk diproses.
4. IF pengguna belum memilih atau mengambil gambar, THEN THE Sistem SHALL menolak permintaan analisis dan menampilkan pesan kesalahan "Silakan pilih atau ambil gambar terlebih dahulu".

---

### Persyaratan 2: Pratinjau dan Konfirmasi Gambar

**User Story:** Sebagai pengguna, saya ingin melihat pratinjau gambar sebelum dianalisis, agar saya dapat memastikan gambar yang dipilih sudah sesuai sebelum melanjutkan proses.

#### Kriteria Penerimaan

1. WHEN pengguna telah mengambil atau memilih gambar, THE Result_Display SHALL menampilkan pratinjau gambar beserta tombol "Ambil Ulang" dan "Analisis".
2. WHEN pengguna memilih tombol "Ambil Ulang", THE Sistem SHALL menghapus gambar saat ini dan mengarahkan pengguna kembali ke tampilan Kamera.
3. WHEN pengguna memilih tombol "Analisis", THE Sistem SHALL melanjutkan ke proses ekstraksi teks pada gambar yang tersimpan.

---

### Persyaratan 3: Ekstraksi Data (OCR)

**User Story:** Sebagai pengguna, saya ingin sistem mengekstrak teks dari label makanan secara otomatis, agar informasi kandungan bahan dapat diproses lebih lanjut tanpa input manual.

#### Kriteria Penerimaan

1. WHEN pengguna memulai proses analisis, THE OCR_Service SHALL mengekstrak seluruh teks yang terbaca dari gambar label makanan.
2. WHEN proses ekstraksi OCR berhasil, THE Sistem SHALL meneruskan teks hasil ekstraksi dalam format terstruktur ke tahap berikutnya.
3. IF proses ekstraksi OCR gagal, THEN THE Sistem SHALL menampilkan pesan error "Gagal membaca teks dari gambar. Pastikan gambar cukup jelas dan coba lagi."
4. IF teks tidak dapat dikenali dari gambar, THEN THE Sistem SHALL meminta pengguna untuk mengunggah ulang gambar dengan kualitas yang lebih baik.

---

### Persyaratan 4: Deteksi Bahasa dan Terjemahan

**User Story:** Sebagai pengguna, saya ingin teks label makanan diterjemahkan ke bahasa Indonesia secara otomatis, agar saya dapat memahami kandungan makanan tanpa hambatan bahasa.

#### Kriteria Penerimaan

1. WHEN teks hasil ekstraksi OCR terdeteksi bukan dalam bahasa Indonesia, THE Translation_Service SHALL menerjemahkan teks tersebut ke bahasa Indonesia.
2. WHEN proses terjemahan berhasil, THE Sistem SHALL menggunakan teks hasil terjemahan sebagai input untuk proses analisis AI.
3. IF proses terjemahan gagal, THEN THE Sistem SHALL tetap menggunakan teks asli sebagai input analisis dan menampilkan notifikasi "Terjemahan tidak tersedia. Analisis dilakukan menggunakan teks asli."

---

### Persyaratan 5: Analisis AI (Fitur Utama)

**User Story:** Sebagai pengguna, saya ingin sistem menganalisis kandungan bahan makanan menggunakan AI, agar saya mendapatkan informasi yang akurat tentang apa yang terkandung dalam produk makanan tersebut.

#### Kriteria Penerimaan

1. WHEN data teks telah siap untuk dianalisis, THE AI_Analyzer SHALL menganalisis kandungan bahan makanan dari teks yang tersedia.
2. WHEN AI_Analyzer melakukan analisis, THE AI_Analyzer SHALL mengidentifikasi bahan utama yang terkandung dalam produk.
3. WHEN AI_Analyzer melakukan analisis, THE AI_Analyzer SHALL mengidentifikasi kandungan berisiko meliputi kadar gula tinggi, kadar sodium tinggi, dan bahan aditif.
4. WHEN AI_Analyzer melakukan analisis, THE AI_Analyzer SHALL mengidentifikasi potensi alergen yang terkandung dalam produk.

---

### Persyaratan 6: Penilaian Risiko

**User Story:** Sebagai pengguna, saya ingin mengetahui tingkat risiko kesehatan dari produk makanan yang saya pindai, agar saya dapat membuat keputusan konsumsi yang lebih bijak.

#### Kriteria Penerimaan

1. WHEN AI_Analyzer mendeteksi kandungan yang tergolong berisiko tinggi, THE Risk_Scorer SHALL menetapkan tingkat risiko HIGH pada hasil analisis.
2. WHEN AI_Analyzer mendeteksi kandungan yang perlu diperhatikan namun tidak tergolong berbahaya, THE Risk_Scorer SHALL menetapkan tingkat risiko MEDIUM pada hasil analisis.
3. WHEN AI_Analyzer tidak menemukan kandungan berbahaya atau berisiko, THE Risk_Scorer SHALL menetapkan tingkat risiko LOW pada hasil analisis.

---

### Persyaratan 7: Penjelasan AI

**User Story:** Sebagai pengguna, saya ingin mendapatkan penjelasan yang mudah dipahami tentang hasil analisis, agar saya dapat memahami dampak kesehatan dari kandungan makanan tersebut.

#### Kriteria Penerimaan

1. WHEN proses analisis AI selesai, THE AI_Analyzer SHALL menghasilkan penjelasan hasil analisis dalam bahasa Indonesia yang mudah dipahami oleh pengguna awam.
2. WHEN AI_Analyzer mendeteksi kandungan berisiko dalam produk, THE AI_Analyzer SHALL menyertakan penjelasan dampak kandungan tersebut terhadap kesehatan dalam hasil analisis.

---

### Persyaratan 8: Tampilan Hasil Analisis

**User Story:** Sebagai pengguna, saya ingin melihat hasil analisis secara lengkap dan terstruktur, agar saya dapat dengan mudah memahami informasi kandungan dan risiko produk makanan.

#### Kriteria Penerimaan

1. WHEN proses analisis selesai, THE Result_Display SHALL menampilkan daftar bahan makanan yang teridentifikasi, tingkat risiko, dan penjelasan AI dalam satu halaman hasil.
2. WHEN terdapat bahan yang teridentifikasi berisiko, THE Result_Display SHALL menyoroti bahan tersebut secara visual menggunakan warna atau penanda yang berbeda dari bahan lainnya.

---

### Persyaratan 9: Status Pemrosesan

**User Story:** Sebagai pengguna, saya ingin mengetahui bahwa sistem sedang memproses permintaan saya, agar saya tidak merasa aplikasi berhenti atau tidak merespons.

#### Kriteria Penerimaan

1. WHILE Sistem sedang memproses gambar atau menganalisis data, THE Result_Display SHALL menampilkan indikator loading yang terlihat jelas kepada pengguna.

---

### Persyaratan 10: Penanganan Error

**User Story:** Sebagai pengguna, saya ingin mendapatkan informasi yang jelas ketika terjadi kesalahan, agar saya dapat mengambil tindakan yang tepat untuk menyelesaikan masalah.

#### Kriteria Penerimaan

1. IF terjadi kesalahan koneksi atau kegagalan respons dari layanan API eksternal, THEN THE Sistem SHALL menampilkan pesan error yang informatif beserta saran tindakan yang dapat dilakukan pengguna.
2. IF teks tidak dapat dikenali dari gambar yang diunggah, THEN THE Sistem SHALL menampilkan pesan "Teks tidak dapat dikenali. Pastikan gambar label terlihat jelas dan coba unggah ulang." kepada pengguna.
