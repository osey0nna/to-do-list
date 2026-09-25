# 🍵💗 Matcha & Pink To-Do List (Flask + SQLite)

Aplikasi To-Do List sederhana dengan Flask, SQLite, dan tema pink + hijau matcha.
Fitur:
- Tambah, edit, hapus, dan tandai selesai tugas (CRUD lengkap)
- Progress bar jumlah tugas selesai
- **Download seluruh source code project langsung dari halaman web** (tombol "Download Project", mirip tombol "Download ZIP" di GitHub, tapi diproses oleh Flask sendiri lewat `zipfile` + `send_file`)

## Menjalankan secara lokal

```bash
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Buka `http://127.0.0.1:5000` di browser. Database `todo.db` akan otomatis dibuat saat pertama kali dijalankan.

## Struktur Project

```
todo-flask-app/
├── app.py                 # Semua route & logika CRUD + route /download
├── requirements.txt
├── vercel.json             # Konfigurasi deploy ke Vercel
├── api/
│   └── index.py            # Entry point untuk Vercel (WSGI)
├── templates/
│   ├── base.html
│   ├── index.html
│   └── edit.html
└── static/
    ├── css/style.css
    └── js/script.js
```

## Deploy ke Vercel

```bash
npm i -g vercel
vercel
```

Vercel akan otomatis mendeteksi `vercel.json` dan menjalankan `api/index.py` sebagai fungsi serverless.

### ⚠️ Catatan penting soal SQLite di Vercel

Vercel menjalankan aplikasi sebagai **serverless function**: sistem filenya bersifat *read-only*, kecuali folder `/tmp` yang bisa ditulis tapi **sementara** (tidak persisten). Karena itu, di `app.py`, saat berjalan di Vercel, database otomatis diarahkan ke `/tmp/todo.db`.

Konsekuensinya:
- Aplikasi tetap bisa jalan dan CRUD tetap berfungsi tanpa perlu setup ulang skema database.
- **Tapi data bisa hilang** setiap kali function di-restart, di-deploy ulang, atau saat request ditangani oleh instance server yang berbeda (Vercel bisa menjalankan banyak instance sekaligus, masing-masing punya `/tmp` sendiri).

Jadi cocok untuk demo/prototipe, tapi **bukan untuk data yang harus permanen**. Kalau nanti butuh data yang benar-benar persisten di Vercel, opsi yang umum dipakai:
- **Turso** atau **libSQL** (SQLite yang di-hosting, kompatibel dengan skema yang sama)
- **Vercel Postgres** / **Neon** / **Supabase**
- Deploy ke platform dengan disk persisten seperti **Railway**, **Render**, atau VPS biasa (di sini file `todo.db` lokal akan aman)

## Cara kerja fitur Download Project

Route `/download` di `app.py` membaca semua file di folder project (mengecualikan `__pycache__`, `venv`, `.git`, dan file database), mengemasnya menjadi file `.zip` di memori menggunakan modul `zipfile`, lalu mengirimkannya ke browser via `send_file`. Jadi pengunjung web bisa mengklik tombol **"Download Project"** dan langsung mendapatkan salinan source code aplikasi ini.
