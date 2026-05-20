@echo off
cd /d "c:\Users\ITran\Downloads\PROGRAMA BELMON\streamboss-backend"
venv\Scripts\uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
