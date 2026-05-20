import sqlite3
conn = sqlite3.connect('streamboss.db')
cur = conn.cursor()
tables = [r[0] for r in cur.execute("SELECT name FROM sqlite_master WHERE type='table'")]
print('Tablas:', tables)
if 'issue_reports' in tables:
    cols = [r[1] for r in cur.execute("PRAGMA table_info(issue_reports)")]
    print('Columnas en issue_reports:', cols)
    if 'admin_note' not in cols:
        cur.execute("ALTER TABLE issue_reports ADD COLUMN admin_note TEXT")
        conn.commit()
        print('Columna admin_note agregada exitosamente.')
    else:
        print('La columna admin_note ya existe.')
else:
    print('La tabla issue_reports no existe aun, se creara cuando el backend arranque.')
conn.close()
