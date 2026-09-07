# Panduan Pengembangan Proyek "SELALU AKTIF"

Dokumen ini adalah acuan instruksi untuk asisten AI ketika membuka workspace proyek **SELALU AKTIF**.

---

## 🎯 Visi & Tujuan Proyek
Proyek ini bertujuan membangun **aplikasi sentral pemantau dan penjaga keaktifan (Heartbeat Sentinel)** untuk semua proyek database Supabase (Free Tier) milik pengguna agar tidak pernah mengalami *auto-pause* 7 hari.

## 🔑 Prinsip Utama Solusi Teknis
1. **Bukan Ping Statis Kosong:** Supabase memblokir ping statis CDN. Sistem ini HARUS menjalankan **transaksi nyata pada engine PostgreSQL** (seperti operasi `PATCH` / `UPDATE` atau `INSERT` ringan yang menghasilkan Write-Ahead Log/WAL pada disk database).
2. **User-Agent Masquerading:** Setiap permintaan HTTP wajib menggunakan User-Agent browser asli (Chrome/Safari/Edge), bukan User-Agent bot seperti `curl`.
3. **Multi-Project Centralized:** 1 aplikasi sentral dapat mengelola dan memantau banyak proyek Supabase sekaligus (KAWAL, SIMDIK, BAKUMPUL, dsb.).
4. **Keamanan Kredensial:** Anon Key dan Service Role Key yang tersimpan harus terlindungi (enkripsi lokal atau secrets environment).

## 📚 Referensi Dokumen
Rincian arsitektur lengkap, diagram alur, dan tahapan pengembangan (roadmap) tersimpan di file `README.md`.