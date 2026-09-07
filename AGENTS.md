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

## 🔒 ATURAN KETAT KEAMANAN PUSH & KREDENSIAL (ZERO-LEAK POLICY)
Karena repositori GitHub ini berstatus **PUBLIK**, seluruh agen AI dan pengembang WAJIB mematuhi protokol keamanan berikut:
1. **Dilarang Keras Mengunggah Kredensial:** `.env`, `.env.local`, `.env.*`, atau file konfigurasi lokal berisikan credential nyata TIDAK BOLEH PERNAH di-stage (`git add`) atau di-commit.
2. **Karantina String Rahasia:** Dilarang menaruh URL database pribadi (seperti `xyzabcdefghijklmnop.supabase.co`), service role key nyata, atau token privat di dalam source code yang ter-track git.
3. **Audit Sebelum Commit:** Sebelum menjalankan `git commit`, selalu jalankan validasi perubahan (`git status` & `git diff --staged`) untuk memastikan tidak ada rahasia yang terselip.
4. **Git Pre-Commit Hook:** Hook `.git/hooks/pre-commit` wajib aktif untuk otomatis membatalkan commit jika mendeteksi file `.env` atau string sensitif.
5. **Git Push Hanya oleh Pengguna:** Agen AI hanya menyiapkan commit bersih di lokal. Perintah `git push` tetap diserahkan kepada pengguna untuk eksekusi akhir.

## 📚 Referensi Dokumen
Rincian arsitektur lengkap, diagram alur, dan tahapan pengembangan (roadmap) tersimpan di file `README.md`.