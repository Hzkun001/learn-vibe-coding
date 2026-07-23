# Belajar Vibe Coding (API Backend)

## 📖 Deskripsi Aplikasi
Aplikasi ini adalah sistem API (Backend) yang menyediakan layanan autentikasi dasar untuk manajemen pengguna (*user management*). Aplikasi dibangun dengan arsitektur modern berkinerja tinggi menggunakan Bun dan ElysiaJS.

## 🚀 Technology Stack & Libraries
- **Runtime & Package Manager**: [Bun](https://bun.sh/) - Cepat dan efisien.
- **Web Framework**: [ElysiaJS](https://elysiajs.com/) - Framework performa tinggi dengan dukungan TypeScript penuh.
- **Database**: MySQL (dijalankan via Docker).
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/) - ORM type-safe untuk interaksi dengan database MySQL.
- **Validation**: *TypeBox* (Telah terintegrasi secara built-in di dalam ElysiaJS untuk validasi skema).
- **Security**: `bcrypt` (via Bun) untuk *hashing* password, serta token sesi berbasis UUID asli (`crypto.randomUUID()`).

## 📂 Arsitektur & Struktur Direktori
Aplikasi ini menggunakan pemisahan berlapis (*layering*) untuk menjaga kode terstruktur dan rapi (pemisahan *routing* dan *logic*):

- `src/` : Kode utama aplikasi.
  - `db/` : Berisi konfigurasi koneksi database MySQL (`index.ts`) dan definisi skema tabel Drizzle ORM (`schema.ts`).
  - `routes/` : Mengelola titik temu (endpoint) HTTP. Mendefinisikan URL API, metode HTTP, dan validasi *request body*. Berformat `*-route.ts` (contoh: `users-route.ts`).
  - `services/` : Menangani proses dan logika bisnis utama (*Business Logic*), seperti pemeriksaan ke database, manipulasi data, error, dan verifikasi hash password. Berformat `*-service.ts` (contoh: `users-service.ts`).
  - `index.ts` : File titik masuk (*entry point*) untuk mengaktifkan dan mengonfigurasi instance ElysiaJS.
- `tests/` : Menampung seluruh kode tes terotomatisasi, seperti *unit test* dan *integration test* (contoh: `users.test.ts`).

## 🗄️ Database Schema
Aplikasi ini menggunakan dua tabel database relasional:

1. **`users`** (Menyimpan data otentikasi)
   - `id` : INT (Primary Key, Auto Increment)
   - `name` : VARCHAR 255 (Not Null)
   - `email` : VARCHAR 255 (Not Null, Unique)
   - `password` : VARCHAR 255 (Not Null) - *Menyimpan hashed password.*
   - `created_at` : TIMESTAMP (Default: Current Time)

2. **`sessions`** (Menyimpan status login pengguna aktif)
   - `id` : INT (Primary Key, Auto Increment)
   - `token` : VARCHAR 255 (Not Null, Unique) - *Menyimpan token sesi berbentuk UUID.*
   - `user_id` : BIGINT UNSIGNED (Not Null, Foreign Key ke `users.id`)
   - `created_at` : TIMESTAMP (Default: Current Time)

## 🌐 Daftar API Tersedia
Aplikasi menyediakan 4 fungsi API yang terintegrasi di bawah router `api/users`:

| Endpoint | Method | Keterangan | Header Wajib |
|---|---|---|---|
| `/api/users` | POST | Mendaftarkan pengguna baru (Registrasi). | - |
| `/api/users/login` | POST | Login pengguna dan mengembalikan token sesi (UUID). | - |
| `/api/users/current` | GET | Mendapatkan detail profil pengguna yang sedang login. | `Authorization: Bearer <token>` |
| `/api/users/logout` | DELETE | Mengakhiri sesi pengguna aktif (*logout*) dan menghapus token. | `Authorization: Bearer <token>` |

## 🛠️ Cara Setup Project
Langkah-langkah untuk menginisialisasi aplikasi di komputer lokal:

1. **Prasyarat**: Pastikan [Bun](https://bun.sh/) dan Docker sudah terinstal.
2. Klon (*clone*) repositori ini ke komputer Anda.
3. Jalankan container Docker untuk database MySQL:
   ```bash
   docker run --name mysql-vibe-coding -p 3307:3306 -e MYSQL_ROOT_PASSWORD=rahasia -e MYSQL_DATABASE=belajar_vibe_coding -d mysql:latest
   ```
4. Instal seluruh dependensi proyek:
   ```bash
   bun install
   ```
5. Sesuaikan string koneksi database (URL). Bawaan proyek menunjuk ke `mysql://root:rahasia@localhost:3307/belajar_vibe_coding` (lihat file `.env` jika digunakan).
6. Dorong (*push*) sinkronisasi skema struktur tabel Drizzle ke database:
   ```bash
   bun run db:push
   ```

## ▶️ Cara Run Aplikasi
Untuk menyalakan server lokal secara berkelanjutan (*watch mode*) yang akan *restart* otomatis jika ada perubahan *source code*:
```bash
bun run dev
```
*(Secara default server Elysia akan berjalan di port `3000`)*.

## 🧪 Cara Test Aplikasi
Proyek ini mengadopsi mekanisme *automated testing* bawaan menggunakan `bun test` untuk memastikan semua lapisan kode berjalan valid.
Untuk menjalankan seluruh pengujian API (*unit/integration test*):
```bash
bun run test
```
*(Setiap tes dilengkapi mekanisme pembersihan database otomatis sebelum berjalan untuk menjamin konsistensi hasil)*.
