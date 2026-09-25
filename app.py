import os
import io
import sqlite3
import zipfile
from datetime import datetime

from flask import Flask, render_template, request, redirect, url_for, send_file, flash

app = Flask(__name__)
app.secret_key = "ganti-secret-key-ini-di-produksi"

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Di Vercel (serverless) hanya folder /tmp yang bisa ditulis.
# Jadi kalau dijalankan di Vercel, database disimpan di /tmp/todo.db,
# kalau dijalankan lokal, disimpan berdampingan dengan app.py.
if os.environ.get("VERCEL"):
    DB_PATH = "/tmp/todo.db"
else:
    DB_PATH = os.path.join(BASE_DIR, "todo.db")


def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db_connection()
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS todos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task TEXT NOT NULL,
            done INTEGER NOT NULL DEFAULT 0,
            due_date TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    # Untuk database lama yang sudah ada sebelum fitur deadline ditambahkan,
    # kolom due_date mungkin belum ada. Tambahkan kalau memang belum ada.
    existing_cols = [row["name"] for row in conn.execute("PRAGMA table_info(todos)")]
    if "due_date" not in existing_cols:
        conn.execute("ALTER TABLE todos ADD COLUMN due_date TEXT")
    conn.commit()
    conn.close()


init_db()


def deadline_status(due_date_str, done):
    """Menentukan status deadline: overdue, today, upcoming, atau None."""
    if not due_date_str:
        return None
    try:
        due = datetime.strptime(due_date_str, "%Y-%m-%d").date()
    except ValueError:
        return None

    today = datetime.now().date()
    if done:
        return "done"
    if due < today:
        return "overdue"
    if due == today:
        return "today"
    return "upcoming"


@app.route("/")
def index():
    conn = get_db_connection()
    rows = conn.execute(
        """
        SELECT * FROM todos
        ORDER BY done ASC, (due_date IS NULL), due_date ASC, id DESC
        """
    ).fetchall()
    conn.close()

    todos = []
    for row in rows:
        todo = dict(row)
        todo["status"] = deadline_status(todo["due_date"], todo["done"])
        if todo["due_date"]:
            todo["due_date_display"] = datetime.strptime(
                todo["due_date"], "%Y-%m-%d"
            ).strftime("%d %b %Y")
        else:
            todo["due_date_display"] = None
        todos.append(todo)

    total = len(todos)
    selesai = sum(1 for t in todos if t["done"])
    persen = int((selesai / total) * 100) if total else 0

    return render_template(
        "index.html",
        todos=todos,
        total=total,
        selesai=selesai,
        persen=persen,
        tahun=datetime.now().year,
    )


@app.route("/add", methods=["POST"])
def add():
    task = request.form.get("task", "").strip()
    due_date = request.form.get("due_date", "").strip() or None
    if task:
        conn = get_db_connection()
        conn.execute(
            "INSERT INTO todos (task, due_date) VALUES (?, ?)", (task, due_date)
        )
        conn.commit()
        conn.close()
    else:
        flash("Nama tugas tidak boleh kosong ya!")
    return redirect(url_for("index"))


@app.route("/edit/<int:todo_id>", methods=["GET", "POST"])
def edit(todo_id):
    conn = get_db_connection()
    todo = conn.execute("SELECT * FROM todos WHERE id = ?", (todo_id,)).fetchone()

    if todo is None:
        conn.close()
        return redirect(url_for("index"))

    if request.method == "POST":
        task = request.form.get("task", "").strip()
        done = 1 if request.form.get("done") == "on" else 0
        due_date = request.form.get("due_date", "").strip() or None
        if task:
            conn.execute(
                "UPDATE todos SET task = ?, done = ?, due_date = ? WHERE id = ?",
                (task, done, due_date, todo_id),
            )
            conn.commit()
        conn.close()
        return redirect(url_for("index"))

    conn.close()
    return render_template("edit.html", todo=todo)


@app.route("/toggle/<int:todo_id>")
def toggle(todo_id):
    conn = get_db_connection()
    todo = conn.execute("SELECT * FROM todos WHERE id = ?", (todo_id,)).fetchone()
    if todo:
        new_status = 0 if todo["done"] else 1
        conn.execute("UPDATE todos SET done = ? WHERE id = ?", (new_status, todo_id))
        conn.commit()
    conn.close()
    return redirect(url_for("index"))


@app.route("/delete/<int:todo_id>")
def delete(todo_id):
    conn = get_db_connection()
    conn.execute("DELETE FROM todos WHERE id = ?", (todo_id,))
    conn.commit()
    conn.close()
    return redirect(url_for("index"))


# ------------------------------------------------------------------
# FITUR DOWNLOAD PROJECT: mengemas seluruh source code jadi .zip
# lalu mengirimkannya ke browser, mirip "Download ZIP" di GitHub.
# ------------------------------------------------------------------
EXCLUDE_DIRS = {"__pycache__", ".git", "venv", "env", ".vercel", "node_modules", ".idea"}
EXCLUDE_FILES = {"todo.db"}
EXCLUDE_EXT = {".pyc", ".db"}


@app.route("/download")
def download_project():
    memory_file = io.BytesIO()
    with zipfile.ZipFile(memory_file, "w", zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(BASE_DIR):
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
            for filename in files:
                _, ext = os.path.splitext(filename)
                if filename in EXCLUDE_FILES or ext in EXCLUDE_EXT:
                    continue
                filepath = os.path.join(root, filename)
                arcname = os.path.join(
                    "todo-list-flask", os.path.relpath(filepath, BASE_DIR)
                )
                zf.write(filepath, arcname)
    memory_file.seek(0)

    return send_file(
        memory_file,
        mimetype="application/zip",
        as_attachment=True,
        download_name="todo-list-flask.zip",
    )


if __name__ == "__main__":
    app.run(debug=True, port=5001)
