# Feature Planning: User Registration API

Dokumen ini berisi panduan dan tahapan implementasi fitur registrasi pengguna baru. Dokumen ini ditujukan bagi junior programmer atau AI asisten agar dapat melakukan implementasi secara terstruktur.

## 1. Spesifikasi Database Schema
Ubah atau perbarui skema tabel `users` di dalam Drizzle ORM (biasanya terletak di `src/db/schema.ts`).
Struktur tabel `users` yang dibutuhkan:
- `id`: integer, primary key, auto increment.
- `name`: varchar(255), not null.
- `email`: varchar(255), not null, unique.
- `password`: varchar(255), not null (akan digunakan untuk menyimpan hasil hash dari bcrypt).
- `created_at`: timestamp, default: waktu saat ini (`current_timestamp`).

## 2. Struktur Folder & File
Untuk menjaga agar kode tetap rapi, kita akan memisahkan routing dan logika bisnis. Buat folder dan file berikut di dalam direktori `src`:
- **`src/routes/`**: Folder ini berisi pendefinisian routing dari Elysia.js.
  - File yang harus dibuat: `users-route.ts`
- **`src/services/`**: Folder ini berisi logika bisnis utama dari aplikasi (berinteraksi dengan database, hashing password, dsb).
  - File yang harus dibuat: `users-service.ts`

## 3. Spesifikasi API Endpoint
Buat endpoint baru untuk proses registrasi pengguna dengan spesifikasi berikut:

- **Endpoint**: `POST /api/users`
- **Request Body (JSON)**:
  ```json
  {
      "name": "hafidz",
      "email": "hafidz@gmail.com",
      "password": "rahasia"
  }
  ```
- **Response Body (Success)**:
  ```json
  {
      "data": "Ok"
  }
  ```
- **Response Body (Error - Jika email sudah ada)**:
  ```json
  {
      "error": "email sudah terdaftar"
  }
  ```

## 4. Tahapan Implementasi (Action Plan)
Harap kerjakan langkah-langkah berikut secara berurutan untuk mengimplementasikan fitur ini:

1. **Update Skema Database (`src/db/schema.ts`)**:
   - Tambahkan kolom `password` dan `created_at` pada tabel `users`.
   - Pastikan tipe data dan batasan constraint (seperti unique pada email) sudah sesuai dengan instruksi di atas.
2. **Jalankan Migrasi Database**:
   - Setelah skema diubah, jalankan perintah untuk meng-generate dan me-migrate database agar tabel di MySQL terupdate (misalnya menggunakan skrip `bun run db:generate` lalu `bun run db:migrate` atau `db:push`).
3. **Buat Logika Bisnis (`src/services/users-service.ts`)**:
   - Buat fungsi/method untuk melakukan pendaftaran user baru.
   - Pengecekan Duplikasi: Query database untuk mengecek apakah `email` yang diinputkan sudah ada. Jika ada, fungsi ini harus melempar error atau mengembalikan flag kegagalan.
   - Hashing Password: Jika email belum ada, lakukan *hash* pada input `password` menggunakan algoritma `bcrypt`. *(Catatan: Di ekosistem Bun, Anda bisa langsung menggunakan API bawaan `Bun.password.hash(password, { algorithm: "bcrypt" })` tanpa perlu menginstal package `bcrypt` eksternal).*
   - Simpan data `name`, `email`, dan hashed `password` ke database menggunakan Drizzle.
4. **Buat Route Handler (`src/routes/users-route.ts`)**:
   - Buat instance route Elysia baru dan definisikan endpoint `POST /api/users`.
   - Validasi payload request body menggunakan skema bawaan Elysia (misal: menggunakan `t.Object` untuk memastikan `name`, `email`, dan `password` ada dan bertipe string).
   - Panggil fungsi dari `users-service.ts`.
   - Tangani *return* dari service:
     - Jika sukses, set HTTP status ke 201 atau 200, dan kembalikan JSON `{"data": "Ok"}`.
     - Jika gagal karena email duplikat, set HTTP status ke 400/409, dan kembalikan JSON `{"error": "email sudah terdaftar"}`.
5. **Daftarkan Route ke Aplikasi Utama (`src/index.ts`)**:
   - Bersihkan route `/users` lama yang tidak sesuai standar yang ada di `index.ts` jika diperlukan.
   - Lakukan import `users-route.ts` ke dalam `src/index.ts`.
   - Daftarkan route tersebut ke aplikasi utama menggunakan method `.use()`.
6. **Lakukan Pengujian (Testing)**:
   - Pastikan server berjalan.
   - Lakukan request HTTP POST ke `/api/users` menggunakan cURL atau Postman untuk memvalidasi bahwa skenario berhasil (menghasilkan JSON `"data": "Ok"`) dan skenario error (email duplikat) berfungsi dengan benar.
