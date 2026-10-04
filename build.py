#!/usr/bin/env python3
"""Собирает сайт в один самодостаточный файл index.html.

Исходники лежат в папке src/. После правок запустите:  python3 build.py
Стили, скрипты и библиотеки встраиваются внутрь index.html, поэтому сайт
корректно открывается, даже если скачать или открыть только этот файл.
"""
import re
from pathlib import Path

ROOT = Path(__file__).parent
SRC = ROOT / "src"

html = (SRC / "index.html").read_text(encoding="utf-8")


def inline_css(m):
    css = (SRC / m.group(1)).read_text(encoding="utf-8")
    return "<style>\n" + css + "\n</style>"


def inline_js(m):
    js = (SRC / m.group(1)).read_text(encoding="utf-8")
    js = js.replace("</script", "<\\/script")
    return "<script>\n" + js + "\n</script>"


html = re.sub(r'<link rel="stylesheet" href="([^"]+)">', inline_css, html)
html = re.sub(r'<script src="([^"]+)"></script>', inline_js, html)

banner = "<!-- Файл собран автоматически из папки src/ командой: python3 build.py. Правьте исходники в src/. -->\n"
html = html.replace("<!DOCTYPE html>\n", "<!DOCTYPE html>\n" + banner, 1)
(ROOT / "index.html").write_text(html, encoding="utf-8")
print(f"index.html собран: {len(html) // 1024} КБ")
