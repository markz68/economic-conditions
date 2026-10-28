@echo off
cd /d "%~dp0"
python econ.py
start http://localhost:8000
python -m http.server 8000 --bind 127.0.0.1
