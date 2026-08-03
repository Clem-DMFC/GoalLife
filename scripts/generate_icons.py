"""
Génère les PNG d'icône à partir des tuiles SVG, via Chrome en mode headless.

Le piège : Chrome rend un SVG autonome à sa taille intrinsèque. Capturer une
tuile large de 512 dans une fenêtre de 180 ne la réduit pas, elle en recadre le
coin haut-gauche — et l'icône n'affiche plus qu'un bout de corne. Retirer
`width`/`height` ne sauve rien : Chrome ne sait alors plus à quelle taille
rendre. La parade est d'écrire une copie temporaire du SVG dont `width` et
`height` valent exactement la taille demandée, le `viewBox` se chargeant de la
mise à l'échelle.

Usage :  python scripts/generate_icons.py
"""

import os
import re
import shutil
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ICONS = os.path.join(ROOT, "public", "icons")

# (tuile source, fichier de sortie, côté en pixels)
TARGETS = [
    ("icon.svg", "apple-touch-icon-180.png", 180),
    ("icon.svg", "icon-192.png", 192),
    ("icon.svg", "icon-512.png", 512),
    ("icon-maskable.svg", "icon-maskable-512.png", 512),
]

CHROME_CANDIDATES = [
    os.environ.get("CHROME"),
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "google-chrome",
    "chromium",
]


def find_chrome():
    for candidate in CHROME_CANDIDATES:
        if not candidate:
            continue
        if os.path.isfile(candidate):
            return candidate
        found = shutil.which(candidate)
        if found:
            return found
    sys.exit("Chrome introuvable. Renseigne son chemin dans la variable d'environnement CHROME.")


def sized(svg, size):
    """Repose le SVG à la taille voulue, en nettoyant d'éventuelles dimensions."""
    tag = re.search(r"<svg\b[^>]*>", svg).group(0)
    cleaned = re.sub(r'\s(?:width|height)="[^"]*"', "", tag)
    return svg.replace(tag, cleaned[:-1] + f' width="{size}" height="{size}">', 1)


def main():
    chrome = find_chrome()
    workdir = tempfile.mkdtemp(prefix="goatly-icons-")

    for source, output, size in TARGETS:
        with open(os.path.join(ICONS, source), encoding="utf-8") as f:
            svg = f.read()

        tmp = os.path.join(workdir, f"{size}-{source}")
        with open(tmp, "w", encoding="utf-8") as f:
            f.write(sized(svg, size))

        subprocess.run(
            [
                chrome,
                "--headless",
                "--disable-gpu",
                "--hide-scrollbars",
                "--screenshot=" + os.path.join(ICONS, output),
                f"--window-size={size},{size}",
                "file:///" + tmp.replace(os.sep, "/"),
            ],
            check=True,
            capture_output=True,
        )
        print(f"{output}  {size}x{size}")

    shutil.rmtree(workdir, ignore_errors=True)


if __name__ == "__main__":
    main()
