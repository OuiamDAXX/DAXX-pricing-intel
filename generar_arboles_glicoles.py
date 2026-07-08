# -*- coding: utf-8 -*-
"""
Script : generar_arboles_glicoles.py
Auteur : DAXX EU -- Département Modélisation & Achats
Objectif : Générer les graphes de dépendance (arboles) pour :
           - Propilenglicol (PG)   → Óxido de Propileno → Propileno → Nafta
           - Dietilenglicol (DEG)  → Óxido de Etileno (co-producto) → Etileno → Nafta
           - Etilenglicol (MEG)    → Óxido de Etileno → Etileno → Nafta
           Et les ajouter au PDF existant arboles_DAXX_FINAL_totale.pdf
"""

import os
import io
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm, mm
from reportlab.platypus import SimpleDocTemplate, Spacer, Paragraph
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from pypdf import PdfWriter, PdfReader

# ─────────────────────────────────────────────
#  PALETA DE COLORES (mismo estilo que DAXX)
# ─────────────────────────────────────────────
COLOR_CRUDE    = colors.HexColor('#7C3AED')   # Violet  — Crudo / energía base
COLOR_UPSTREAM = colors.HexColor('#0F766E')   # Verde   — Naphtha / feedstock primario
COLOR_OXIDE    = colors.HexColor('#B45309')   # Ámbar   — Óxido intermedio (EO / PO)
COLOR_TARGET   = colors.HexColor('#1D4ED8')   # Azul    — Producto Final
COLOR_BYPRODUCT= colors.HexColor('#BE123C')   # Rojo    — Co-producto relevante

COLOR_HEADER_BG = colors.HexColor('#0F172A')  # Azul marino oscuro (igual al doc)
COLOR_HEADER_FG = colors.white
COLOR_LIGHT_BG  = colors.HexColor('#F8FAFC')
COLOR_GRID      = colors.HexColor('#E2E8F0')
COLOR_TEXT_DARK = colors.HexColor('#0F172A')
COLOR_TEXT_MID  = colors.HexColor('#475569')

W, H = A4  # 595.28 x 841.89 pts


# ─────────────────────────────────────────────
#  UTILITAIRE : dessiner une boîte avec texte
# ─────────────────────────────────────────────
def draw_box(c, x, y, w, h, fill_color, text_lines, text_color=colors.white,
             font_bold="Helvetica-Bold", font_normal="Helvetica",
             font_size=9, radius=6):
    """Dessine un rectangle arrondi avec étiquette multi-ligne centrée."""
    c.setFillColor(fill_color)
    c.setStrokeColor(colors.white)
    c.setLineWidth(1.5)
    c.roundRect(x, y, w, h, radius, fill=1, stroke=1)

    # Ombre douce
    c.setFillColor(colors.HexColor('#00000020'))
    c.roundRect(x + 2, y - 2, w, h, radius, fill=1, stroke=0)
    # Re-dessiner par-dessus
    c.setFillColor(fill_color)
    c.setStrokeColor(colors.white)
    c.setLineWidth(1.5)
    c.roundRect(x, y, w, h, radius, fill=1, stroke=1)

    # Texte centré
    total_lines = len(text_lines)
    line_h = font_size * 1.3
    start_y = y + h / 2 + (total_lines - 1) * line_h / 2

    for i, (line, bold) in enumerate(text_lines):
        c.setFillColor(text_color)
        c.setFont(font_bold if bold else font_normal, font_size if not bold else font_size + 0.5)
        tw = c.stringWidth(line, font_bold if bold else font_normal, font_size)
        c.drawString(x + (w - tw) / 2, start_y - i * line_h, line)


# ─────────────────────────────────────────────
#  UTILITAIRE : flèche verticale (bas → haut)
# ─────────────────────────────────────────────
def draw_arrow_v(c, x, y_start, y_end, label="", color=COLOR_TEXT_MID):
    """Flèche verticale du bas (y_start) vers le haut (y_end)."""
    c.setStrokeColor(color)
    c.setLineWidth(1.8)
    c.line(x, y_start, x, y_end)
    # Tête de flèche
    sz = 6
    c.setFillColor(color)
    p = c.beginPath()
    p.moveTo(x, y_end)
    p.lineTo(x - sz / 2, y_end - sz)
    p.lineTo(x + sz / 2, y_end - sz)
    p.close()
    c.drawPath(p, fill=1, stroke=0)
    if label:
        c.setFillColor(COLOR_TEXT_MID)
        c.setFont("Helvetica-Oblique", 7.5)
        c.drawString(x + 4, (y_start + y_end) / 2 - 4, label)


# ─────────────────────────────────────────────
#  UTILITAIRE : flèche horizontale (gauche → droite)
# ─────────────────────────────────────────────
def draw_arrow_h(c, x_start, x_end, y, label="", color=COLOR_TEXT_MID):
    """Flèche horizontale."""
    c.setStrokeColor(color)
    c.setLineWidth(1.8)
    c.line(x_start, y, x_end, y)
    sz = 6
    c.setFillColor(color)
    p = c.beginPath()
    p.moveTo(x_end, y)
    p.lineTo(x_end - sz, y + sz / 2)
    p.lineTo(x_end - sz, y - sz / 2)
    p.close()
    c.drawPath(p, fill=1, stroke=0)
    if label:
        c.setFillColor(COLOR_TEXT_MID)
        c.setFont("Helvetica-Oblique", 7.5)
        c.drawString((x_start + x_end) / 2 - 20, y + 4, label)


# ─────────────────────────────────────────────
#  UTILITAIRE : ligne de connexion en L (coin)
# ─────────────────────────────────────────────
def draw_elbow(c, x1, y1, x2, y2, color=COLOR_TEXT_MID):
    """Ligne coudée (L-shape) de (x1,y1) vers (x2,y2)."""
    c.setStrokeColor(color)
    c.setLineWidth(1.5)
    c.line(x1, y1, x1, y2)
    c.line(x1, y2, x2, y2)
    sz = 5
    c.setFillColor(color)
    p = c.beginPath()
    p.moveTo(x2, y2)
    p.lineTo(x2 - sz, y2 + sz / 2)
    p.lineTo(x2 - sz, y2 - sz / 2)
    p.close()
    c.drawPath(p, fill=1, stroke=0)


# ─────────────────────────────────────────────
#  LÉGENDE COMMUNE
# ─────────────────────────────────────────────
def draw_legend(c, y_top):
    legend_items = [
        (COLOR_CRUDE,     "Energía Base (Crudo / Gas Nat.)"),
        (COLOR_UPSTREAM,  "Feedstock Primario (Nafta / Etileno / Propileno)"),
        (COLOR_OXIDE,     "Intermediario (Óxido de Etileno / Propileno)"),
        (COLOR_TARGET,    "Producto Final (Glicol Objetivo)"),
        (COLOR_BYPRODUCT, "Co-producto Relevante"),
    ]
    x0 = 2.0 * cm
    y = y_top
    c.setFont("Helvetica-Bold", 8)
    c.setFillColor(COLOR_TEXT_DARK)
    c.drawString(x0, y, "LEYENDA:")
    y -= 14
    for col, label in legend_items:
        c.setFillColor(col)
        c.roundRect(x0, y - 2, 14, 10, 2, fill=1, stroke=0)
        c.setFillColor(COLOR_TEXT_DARK)
        c.setFont("Helvetica", 8)
        c.drawString(x0 + 20, y, label)
        y -= 15
    return y


# ─────────────────────────────────────────────
#  EN-TÊTE DE PAGE
# ─────────────────────────────────────────────
def draw_page_header(c, title, subtitle, page_num, total):
    # Bande de titre
    c.setFillColor(COLOR_HEADER_BG)
    c.rect(0, H - 2.2 * cm, W, 2.2 * cm, fill=1, stroke=0)

    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(1.8 * cm, H - 1.3 * cm, title)

    c.setFillColor(colors.HexColor('#94A3B8'))
    c.setFont("Helvetica", 9)
    c.drawString(1.8 * cm, H - 1.9 * cm, subtitle)

    # Logo DAXX (texte stylisé)
    c.setFillColor(colors.HexColor('#3B82F6'))
    c.setFont("Helvetica-Bold", 11)
    daxx_text = "DAXX EU"
    tw = c.stringWidth(daxx_text, "Helvetica-Bold", 11)
    c.drawString(W - tw - 1.8 * cm, H - 1.4 * cm, daxx_text)
    c.setFillColor(colors.HexColor('#94A3B8'))
    c.setFont("Helvetica", 7.5)
    pg_text = f"Pág. {page_num} / {total}"
    tw2 = c.stringWidth(pg_text, "Helvetica", 7.5)
    c.drawString(W - tw2 - 1.8 * cm, H - 1.9 * cm, pg_text)

    # Séparateur
    c.setStrokeColor(colors.HexColor('#3B82F6'))
    c.setLineWidth(2)
    c.line(0, H - 2.25 * cm, W, H - 2.25 * cm)


# ─────────────────────────────────────────────
#  PIED DE PAGE
# ─────────────────────────────────────────────
def draw_footer(c):
    c.setStrokeColor(COLOR_GRID)
    c.setLineWidth(0.5)
    c.line(1.5 * cm, 1.4 * cm, W - 1.5 * cm, 1.4 * cm)
    c.setFillColor(COLOR_TEXT_MID)
    c.setFont("Helvetica", 7)
    c.drawString(1.8 * cm, 0.9 * cm,
                 "Documento interno confidencial — DAXX EU Dept. Modelización & Compras | "
                 "Árbol de Dependencias Petroquímicas | Fuente: OilChem Analytics")
    c.setFont("Helvetica-Bold", 7)
    c.drawRightString(W - 1.8 * cm, 0.9 * cm, "© 2025 DAXX EU S.A. — Uso interno exclusivo")


# ══════════════════════════════════════════════════════════════════════════════
#  PAGE 1 : PROPILENGLICOL (PG)
#  Cadena: Crudo → Nafta → Propileno → Óxido de Propileno (PO) → PG
# ══════════════════════════════════════════════════════════════════════════════
def draw_page_pg(c):
    draw_page_header(c,
        "Árbol de Dependencias — Propilenglicol (PG)",
        "Propylene Glycol | CAS 57-55-6 | Código OilChem: PG",
        1, 3)
    draw_footer(c)

    # ── Descripción
    y_desc = H - 3.0 * cm
    c.setFillColor(COLOR_LIGHT_BG)
    c.roundRect(1.5 * cm, y_desc - 2.6 * cm, W - 3 * cm, 2.6 * cm, 5, fill=1, stroke=0)
    c.setFillColor(COLOR_TEXT_DARK)
    c.setFont("Helvetica-Bold", 9.5)
    c.drawString(2.2 * cm, y_desc - 0.55 * cm, "Descripción del Proceso de Síntesis:")
    c.setFont("Helvetica", 8.5)
    lines = [
        "El Propilenglicol (PG, 1,2-propanodiol) se produce industrialmente mediante la hidratación del Óxido de Propileno (PO).",
        "El PO es sintetizado a partir del Propileno (mediante proceso HPPO con peróxido de hidrógeno, o el proceso de clorhidrina).",
        "El Propileno procede del craqueo catalítico del Nafta o de unidades PDH (Deshidrogenación del Propano).",
        "Región de referencia China: PG → Shandong / Huadong | PO → Shandong | Propileno → Shandong | Nafta → Shandong"
    ]
    for i, l in enumerate(lines):
        c.drawString(2.2 * cm, y_desc - 1.1 * cm - i * 0.45 * cm, l)

    # ── Árbol principal (columnas verticales)
    y_base = H - 6.8 * cm   # y de la caja más baja (Crudo)
    box_w  = 4.4 * cm
    box_h  = 1.45 * cm
    gap_v  = 1.8 * cm         # espace vertical entre boites
    cx     = W / 2            # centre horizontal

    # Colonne centrale (chaîne principale)
    nodes_center = [
        (COLOR_CRUDE,    [("Petróleo Crudo / Gas Natural", True), ("Energía Base Upstream", False)]),
        (COLOR_UPSTREAM, [("Nafta (Naphtha)", True), ("Corte petrolífero ligero", False)]),
        (COLOR_UPSTREAM, [("Propileno (Propylene)", True), ("C₃H₆ | Shandong PDH", False)]),
        (COLOR_OXIDE,    [("Óxido de Propileno (PO)", True), ("C₃H₆O | Intermediario clave", False)]),
        (COLOR_TARGET,   [("Propilenglicol (PG)", True), ("C₃H₈O₂ | Producto Final", False)]),
    ]
    # Calculer les positions Y de bas en haut
    n = len(nodes_center)
    y_positions = [y_base + i * (box_h + gap_v) for i in range(n)]

    # Dessiner les boites centrales
    for i, (col, text) in enumerate(nodes_center):
        x0 = cx - box_w / 2
        draw_box(c, x0, y_positions[i], box_w, box_h, col, text, font_size=8.5)
        # Flèche vers le haut
        if i < n - 1:
            arrow_y_start = y_positions[i] + box_h
            arrow_y_end   = y_positions[i + 1]
            draw_arrow_v(c, cx, arrow_y_start, arrow_y_end, color=COLOR_TEXT_MID)

    # ── Boîtes latérales (co-produits / alternatives)
    # Dipropileno glicol (co-producto de la hidratación de PO)
    bw_side = 3.6 * cm
    bh_side = 1.3 * cm

    # À droite du PG
    x_right = cx + box_w / 2 + 1.2 * cm
    y_pg    = y_positions[4]
    draw_box(c, x_right, y_pg + 0.1 * cm, bw_side, bh_side,
             COLOR_BYPRODUCT,
             [("Dipropileno Glicol (DPG)", True), ("Co-producto secundario", False)],
             font_size=8)
    # Flèche horizontale depuis PG
    draw_elbow(c, cx + box_w / 2, y_pg + box_h * 0.55,
               x_right, y_pg + bh_side * 0.55, color=COLOR_BYPRODUCT)

    # À gauche : source alternative (HPPO)
    x_left = cx - box_w / 2 - 1.2 * cm - bw_side
    y_po   = y_positions[3]
    draw_box(c, x_left, y_po + 0.07 * cm, bw_side, bh_side,
             colors.HexColor('#0369A1'),
             [("Proceso HPPO", True), ("H₂O₂ + Propileno", False)],
             font_size=8)
    draw_elbow(c, x_left + bw_side, y_po + bh_side * 0.55,
               cx - box_w / 2, y_po + box_h * 0.55,
               color=colors.HexColor('#0369A1'))

    # ── Labels de étapes de réaction
    reactions = [
        (cx + 4, y_positions[0] + box_h + (gap_v) * 0.35, "Destilación / craqueo"),
        (cx + 4, y_positions[1] + box_h + (gap_v) * 0.35, "FCC / Steam Cracking / PDH"),
        (cx + 4, y_positions[2] + box_h + (gap_v) * 0.35, "Epoxidación del propileno"),
        (cx + 4, y_positions[3] + box_h + (gap_v) * 0.35, "Hidratación del PO + H₂O"),
    ]
    for rx, ry, rtxt in reactions:
        c.setFillColor(COLOR_TEXT_MID)
        c.setFont("Helvetica-Oblique", 7.5)
        c.drawString(rx, ry, f"→ {rtxt}")

    # ── Légende
    y_leg = y_positions[0] - 1.2 * cm
    draw_legend(c, y_leg)

    # ── Tableau de sensibilité des prix
    y_table_top = y_leg - 4.0 * cm
    if y_table_top > 2.5 * cm:
        c.setFillColor(COLOR_HEADER_BG)
        c.roundRect(1.5 * cm, y_table_top - 2.5 * cm, W - 3 * cm, 2.5 * cm, 4, fill=1, stroke=0)
        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(2.2 * cm, y_table_top - 0.5 * cm, "Factores de Sensibilidad de Precio (Referencia OilChem — China)")
        headers = ["Materia Prima", "Peso en la cadena", "Región Ref. (China)", "Tipo de impacto"]
        rows = [
            ["Nafta (Naphtha)",          "Upstream (≈40% coste)",   "Shandong", "Directo: costo del propileno"],
            ["Propileno (Propylene)",     "Feedstock Clave (≈55%)",  "Shandong", "Inmediato — lag 1-3 días"],
            ["Óxido de Propileno (PO)",   "Intermediario (≈80%)",    "Shandong", "Determinante — lag 0-2 días"],
            ["Petróleo Crudo (Brent)",    "Indicador macro (≈30%)",  "Global",   "Retardado — lag 5-10 días"],
        ]
        col_x = [2.2, 7.5, 12.5, 15.8]
        col_x = [x * cm for x in col_x]
        c.setFont("Helvetica-Bold", 7.5)
        c.setFillColor(colors.HexColor('#94A3B8'))
        for j, h in enumerate(headers):
            c.drawString(col_x[j], y_table_top - 1.1 * cm, h)
        c.setFont("Helvetica", 7.5)
        for i, row in enumerate(rows):
            bg = colors.HexColor('#1E293B') if i % 2 == 0 else colors.HexColor('#0F172A')
            c.setFillColor(bg)
            c.rect(1.5 * cm, y_table_top - 1.7 * cm - i * 0.5 * cm, W - 3 * cm, 0.5 * cm, fill=1, stroke=0)
            c.setFillColor(colors.white)
            for j, cell in enumerate(row):
                c.drawString(col_x[j], y_table_top - 1.5 * cm - i * 0.5 * cm, cell)


# ══════════════════════════════════════════════════════════════════════════════
#  PAGE 2 : ETILENGLICOL (MEG)
#  Cadena: Crudo → Nafta → Etileno → Óxido de Etileno (EO) → MEG
# ══════════════════════════════════════════════════════════════════════════════
def draw_page_meg(c):
    draw_page_header(c,
        "Árbol de Dependencias — Etilenglicol (MEG)",
        "Monoethylene Glycol | CAS 107-21-1 | Código OilChem: MEG",
        2, 3)
    draw_footer(c)

    # ── Descripción
    y_desc = H - 3.0 * cm
    c.setFillColor(COLOR_LIGHT_BG)
    c.roundRect(1.5 * cm, y_desc - 2.6 * cm, W - 3 * cm, 2.6 * cm, 5, fill=1, stroke=0)
    c.setFillColor(COLOR_TEXT_DARK)
    c.setFont("Helvetica-Bold", 9.5)
    c.drawString(2.2 * cm, y_desc - 0.55 * cm, "Descripción del Proceso de Síntesis:")
    c.setFont("Helvetica", 8.5)
    lines = [
        "El Etilenglicol (MEG) es el glicol primario producido por la hidratación del Óxido de Etileno (EO).",
        "El EO se obtiene oxidando Etileno con catalizador de plata (proceso Shell / BASF). La reacción es altamente exotérmica.",
        "El Etileno proviene del craqueo a vapor (Steam Cracking) del Nafta, Etano o GNL (Gas Natural Licuado).",
        "Región de referencia: MEG → Huadong (Este China) | EO → Huadong | Etileno → Huadong | Nafta → Shandong"
    ]
    for i, l in enumerate(lines):
        c.drawString(2.2 * cm, y_desc - 1.1 * cm - i * 0.45 * cm, l)

    # ── Árbol principal
    y_base = H - 6.8 * cm
    box_w  = 4.4 * cm
    box_h  = 1.45 * cm
    gap_v  = 1.8 * cm
    cx     = W / 2

    nodes_center = [
        (COLOR_CRUDE,    [("Petróleo Crudo / Gas Natural", True), ("Energía Base Upstream", False)]),
        (COLOR_UPSTREAM, [("Nafta / Etano / GNL", True), ("Feedstock de craqueo", False)]),
        (COLOR_UPSTREAM, [("Etileno (Ethylene)", True), ("C₂H₄ | Huadong", False)]),
        (COLOR_OXIDE,    [("Óxido de Etileno (EO)", True), ("C₂H₄O | Intermediario clave", False)]),
        (COLOR_TARGET,   [("Etilenglicol (MEG)", True), ("C₂H₆O₂ | Producto Final", False)]),
    ]
    n = len(nodes_center)
    y_positions = [y_base + i * (box_h + gap_v) for i in range(n)]

    for i, (col, text) in enumerate(nodes_center):
        x0 = cx - box_w / 2
        draw_box(c, x0, y_positions[i], box_w, box_h, col, text, font_size=8.5)
        if i < n - 1:
            draw_arrow_v(c, cx, y_positions[i] + box_h, y_positions[i + 1], color=COLOR_TEXT_MID)

    # ── Boites latérales
    bw_side = 3.6 * cm
    bh_side = 1.3 * cm

    # À droite du MEG : TEG (co-produit tertiaire)
    x_right = cx + box_w / 2 + 1.2 * cm
    y_meg   = y_positions[4]
    draw_box(c, x_right, y_meg + 0.07 * cm, bw_side, bh_side,
             colors.HexColor('#6B7280'),
             [("TEG (Trietilenglicol)", True), ("Co-producto terciario", False)],
             font_size=8)
    draw_elbow(c, cx + box_w / 2, y_meg + box_h * 0.55,
               x_right, y_meg + bh_side * 0.55, color=colors.HexColor('#6B7280'))

    # À gauche du EO : procede OMEGA (Shell)
    x_left = cx - box_w / 2 - 1.2 * cm - bw_side
    y_eo   = y_positions[3]
    draw_box(c, x_left, y_eo + 0.07 * cm, bw_side, bh_side,
             colors.HexColor('#0369A1'),
             [("Proceso OMEGA (Shell)", True), ("CO₂ → Carbonato Etileno", False)],
             font_size=8)
    draw_elbow(c, x_left + bw_side, y_eo + bh_side * 0.55,
               cx - box_w / 2, y_eo + box_h * 0.55,
               color=colors.HexColor('#0369A1'))

    # Labels de réaction
    reactions = [
        (cx + 4, y_positions[0] + box_h + gap_v * 0.35, "Destilación / separación"),
        (cx + 4, y_positions[1] + box_h + gap_v * 0.35, "Steam Cracking (750–900°C)"),
        (cx + 4, y_positions[2] + box_h + gap_v * 0.35, "Oxidación catalítica Ag (EO plant)"),
        (cx + 4, y_positions[3] + box_h + gap_v * 0.35, "Hidratación no catalítica (150–200°C)"),
    ]
    for rx, ry, rtxt in reactions:
        c.setFillColor(COLOR_TEXT_MID)
        c.setFont("Helvetica-Oblique", 7.5)
        c.drawString(rx, ry, f"→ {rtxt}")

    # ── Légende
    y_leg = y_positions[0] - 1.2 * cm
    draw_legend(c, y_leg)

    # ── Tableau de sensibilité
    y_table_top = y_leg - 4.0 * cm
    if y_table_top > 2.5 * cm:
        c.setFillColor(COLOR_HEADER_BG)
        c.roundRect(1.5 * cm, y_table_top - 2.5 * cm, W - 3 * cm, 2.5 * cm, 4, fill=1, stroke=0)
        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(2.2 * cm, y_table_top - 0.5 * cm, "Factores de Sensibilidad de Precio (Referencia OilChem — China)")
        headers = ["Materia Prima", "Peso en la cadena", "Región Ref. (China)", "Tipo de impacto"]
        rows = [
            ["Nafta / Etano",            "Upstream (≈35% coste)",   "Shandong / Huadong", "Indirecto vía Etileno"],
            ["Etileno (Ethylene)",        "Feedstock Clave (≈60%)",  "Huadong",            "Inmediato — lag 0-2 días"],
            ["Óxido de Etileno (EO)",     "Intermediario (≈85%)",    "Huadong",            "Determinante — lag 0-1 días"],
            ["Petróleo Crudo (Brent)",    "Indicador macro (≈30%)",  "Global",             "Retardado — lag 7-12 días"],
        ]
        col_x = [2.2, 7.0, 12.5, 16.0]
        col_x = [x * cm for x in col_x]
        c.setFont("Helvetica-Bold", 7.5)
        c.setFillColor(colors.HexColor('#94A3B8'))
        for j, h in enumerate(headers):
            c.drawString(col_x[j], y_table_top - 1.1 * cm, h)
        c.setFont("Helvetica", 7.5)
        for i, row in enumerate(rows):
            bg = colors.HexColor('#1E293B') if i % 2 == 0 else colors.HexColor('#0F172A')
            c.setFillColor(bg)
            c.rect(1.5 * cm, y_table_top - 1.7 * cm - i * 0.5 * cm, W - 3 * cm, 0.5 * cm, fill=1, stroke=0)
            c.setFillColor(colors.white)
            for j, cell in enumerate(row):
                c.drawString(col_x[j], y_table_top - 1.5 * cm - i * 0.5 * cm, cell)


# ══════════════════════════════════════════════════════════════════════════════
#  PAGE 3 : DIETILENGLICOL (DEG)
#  Co-producto: Etileno → EO → Hidratación exceso → DEG
#  DEG = MEG + EO (reacción secundaria)
# ══════════════════════════════════════════════════════════════════════════════
def draw_page_deg(c):
    draw_page_header(c,
        "Árbol de Dependencias — Dietilenglicol (DEG)",
        "Diethylene Glycol | CAS 111-46-6 | Código OilChem: DEG",
        3, 3)
    draw_footer(c)

    # ── Descripción
    y_desc = H - 3.0 * cm
    c.setFillColor(COLOR_LIGHT_BG)
    c.roundRect(1.5 * cm, y_desc - 2.6 * cm, W - 3 * cm, 2.6 * cm, 5, fill=1, stroke=0)
    c.setFillColor(COLOR_TEXT_DARK)
    c.setFont("Helvetica-Bold", 9.5)
    c.drawString(2.2 * cm, y_desc - 0.55 * cm, "Descripción del Proceso de Síntesis:")
    c.setFont("Helvetica", 8.5)
    lines = [
        "El Dietilenglicol (DEG) se forma como co-producto inevitable de la hidratación del Óxido de Etileno (EO) para producir MEG.",
        "La reacción: MEG + EO → DEG. Se forma cuando MEG reacciona con EO excedente antes de la purificación final.",
        "Su producción es intrínsecamente vinculada a la planta de MEG: un aumento de producción de MEG genera más DEG.",
        "Región de referencia: DEG → Huadong (Este China) | EO → Huadong | Etileno → Huadong | Nafta → Shandong"
    ]
    for i, l in enumerate(lines):
        c.drawString(2.2 * cm, y_desc - 1.1 * cm - i * 0.45 * cm, l)

    # ── Árbol principal — ARBRE à deux branches (MEG → DEG  ET  EO direct)
    y_base = H - 6.8 * cm
    box_w  = 4.0 * cm
    box_h  = 1.45 * cm
    gap_v  = 1.75 * cm
    cx     = W / 2

    # Branche gauche : Chaîne principale EO/MEG
    nodes_left = [
        (COLOR_CRUDE,    [("Petróleo Crudo", True), ("Energía Base", False)]),
        (COLOR_UPSTREAM, [("Nafta / Etano", True), ("Feedstock", False)]),
        (COLOR_UPSTREAM, [("Etileno (C₂H₄)", True), ("Huadong", False)]),
        (COLOR_OXIDE,    [("Óxido de Etileno (EO)", True), ("Intermediario", False)]),
        (COLOR_TARGET,   [("MEG", True), ("Monoetilenglicol", False)]),
    ]

    cx_left  = W * 0.30
    n = len(nodes_left)
    y_pos_left = [y_base + i * (box_h + gap_v) for i in range(n)]

    for i, (col, text) in enumerate(nodes_left):
        x0 = cx_left - box_w / 2
        draw_box(c, x0, y_pos_left[i], box_w, box_h, col, text, font_size=8)
        if i < n - 1:
            draw_arrow_v(c, cx_left, y_pos_left[i] + box_h, y_pos_left[i + 1], color=COLOR_TEXT_MID)

    # Réactions gauche
    rxns_l = [
        "Destilación",
        "Steam Cracking",
        "Oxidación (Ag)",
        "Hidratación (Convencional)",
    ]
    for i, rtxt in enumerate(rxns_l):
        c.setFillColor(COLOR_TEXT_MID)
        c.setFont("Helvetica-Oblique", 7)
        c.drawString(cx_left + box_w / 2 + 3,
                     y_pos_left[i] + box_h + gap_v * 0.4, f"→ {rtxt}")

    # Branche droite : DEG (cible)
    cx_right = W * 0.72
    y_deg    = y_pos_left[4]  # Même hauteur que MEG

    # EO → DEG (flèche directe depuis EO qui descend aussi vers MEG)
    y_eo_left = y_pos_left[3]

    # Boîte DEG à droite
    draw_box(c, cx_right - box_w / 2, y_deg, box_w, box_h,
             COLOR_TARGET,
             [("Dietilenglicol (DEG)", True), ("C₄H₁₀O₃ | Co-producto", False)],
             font_size=8)

    # Connexion MEG → DEG (avec label réaction)
    # Ligne depuis le haut-droite de MEG jusqu'à la boîte DEG
    x1_meg = cx_left + box_w / 2
    y1_meg = y_deg + box_h * 0.6
    x2_deg = cx_right - box_w / 2
    y2_deg = y_deg + box_h * 0.6

    # Ligne intermédiaire via EO
    # On trace une ligne de EO vers DEG directement
    x1_eo  = cx_left + box_w / 2
    y1_eo  = y_eo_left + box_h * 0.6
    x_mid  = (cx_left + cx_right) / 2

    # Ligne courbée : EO → point intermédiaire → DEG
    c.setStrokeColor(COLOR_OXIDE)
    c.setLineWidth(1.5)
    c.setDash([5, 3])
    c.line(x1_eo, y1_eo, x_mid, y1_eo)
    c.line(x_mid, y1_eo, x_mid, y2_deg)
    c.line(x_mid, y2_deg, x2_deg, y2_deg)
    c.setDash([])
    # Tête de flèche
    sz = 5
    c.setFillColor(COLOR_OXIDE)
    p = c.beginPath()
    p.moveTo(x2_deg, y2_deg)
    p.lineTo(x2_deg - sz, y2_deg + sz / 2)
    p.lineTo(x2_deg - sz, y2_deg - sz / 2)
    p.close()
    c.drawPath(p, fill=1, stroke=0)

    # Label réaction EO → DEG
    c.setFillColor(COLOR_OXIDE)
    c.setFont("Helvetica-Bold", 7.5)
    c.drawString(x_mid - 1.2 * cm, y1_eo + 4, "MEG + EO → DEG")
    c.setFont("Helvetica-Oblique", 7)
    c.setFillColor(COLOR_TEXT_MID)
    c.drawString(x_mid - 1.0 * cm, y1_eo - 8, "(reacción secundaria)")

    # Connexion MEG → DEG (flèche horizontale)
    c.setStrokeColor(colors.HexColor('#6B7280'))
    c.setLineWidth(1.2)
    c.setDash([3, 3])
    c.line(cx_left + box_w / 2, y_deg + box_h * 0.4,
           cx_right - box_w / 2, y_deg + box_h * 0.4)
    c.setDash([])
    c.setFillColor(colors.HexColor('#6B7280'))
    sz2 = 4
    p2 = c.beginPath()
    p2.moveTo(cx_right - box_w / 2, y_deg + box_h * 0.4)
    p2.lineTo(cx_right - box_w / 2 - sz2, y_deg + box_h * 0.4 + sz2 / 2)
    p2.lineTo(cx_right - box_w / 2 - sz2, y_deg + box_h * 0.4 - sz2 / 2)
    p2.close()
    c.drawPath(p2, fill=1, stroke=0)
    c.setFillColor(colors.HexColor('#6B7280'))
    c.setFont("Helvetica-Oblique", 7)
    c.drawString((cx_left + box_w / 2 + cx_right - box_w / 2) / 2 - 1.5 * cm,
                 y_deg + box_h * 0.4 + 4, "Co-producción directa")

    # TEG boîte (co-produit sous DEG)
    bw_s = 3.2 * cm
    bh_s = 1.1 * cm
    x_teg = cx_right - bw_s / 2
    y_teg = y_deg - gap_v * 1.2

    draw_box(c, x_teg, y_teg, bw_s, bh_s,
             colors.HexColor('#6B7280'),
             [("TEG (Trietilenglicol)", True), ("DEG + EO → TEG", False)],
             font_size=7.5)
    draw_arrow_v(c, cx_right, y_deg, y_teg + bh_s, color=colors.HexColor('#6B7280'))

    # Légende
    y_leg = y_pos_left[0] - 1.2 * cm
    draw_legend(c, y_leg)

    # Encart IMPORTANT
    y_note = y_leg - 4.5 * cm
    if y_note > 2.5 * cm:
        c.setFillColor(colors.HexColor('#FEF3C7'))
        c.setStrokeColor(colors.HexColor('#D97706'))
        c.setLineWidth(1.5)
        c.roundRect(1.5 * cm, y_note - 2.2 * cm, W - 3 * cm, 2.2 * cm, 5, fill=1, stroke=1)
        c.setFillColor(colors.HexColor('#92400E'))
        c.setFont("Helvetica-Bold", 9)
        c.drawString(2.2 * cm, y_note - 0.55 * cm,
                     "⚠  Particularidad del DEG — Dependencia de precio correlacionada con MEG")
        c.setFont("Helvetica", 8.5)
        notes = [
            "El DEG NO tiene una planta de producción dedicada: se co-produce en proporción fija (≈8–10%) con MEG en la misma unidad de hidratación de EO.",
            "Por lo tanto, su precio está ALTAMENTE correlacionado con el de MEG (correlación histórica Pearson ρ ≈ 0.88-0.95 en Huadong).",
            "Un incremento en la demanda de MEG (p. ej. para fibra de poliéster) aumenta la producción de DEG como subproducto, lo que puede presionar su precio a la baja."
        ]
        for i, n_text in enumerate(notes):
            c.drawString(2.2 * cm, y_note - 1.1 * cm - i * 0.45 * cm, n_text)


# ══════════════════════════════════════════════════════════════════════════════
#  GÉNÉRATION DU PDF PARTIEL (3 pages)
# ══════════════════════════════════════════════════════════════════════════════
def generate_new_pages(output_path):
    c = canvas.Canvas(output_path, pagesize=A4)

    # Page 1 : PG
    draw_page_pg(c)
    c.showPage()

    # Page 2 : MEG
    draw_page_meg(c)
    c.showPage()

    # Page 3 : DEG
    draw_page_deg(c)
    c.showPage()

    c.save()
    print(f"[OK] Páginas generadas: {output_path}")


# ══════════════════════════════════════════════════════════════════════════════
#  FUSION DU PDF EXISTANT + NOUVELLES PAGES
# ══════════════════════════════════════════════════════════════════════════════
def merge_pdfs(original_pdf, new_pages_pdf, output_pdf):
    writer = PdfWriter()

    # Ajouter toutes les pages du PDF original
    with open(original_pdf, "rb") as f:
        reader = PdfReader(f)
        for page in reader.pages:
            writer.add_page(page)

    # Ajouter les nouvelles pages
    with open(new_pages_pdf, "rb") as f:
        reader_new = PdfReader(f)
        for page in reader_new.pages:
            writer.add_page(page)

    with open(output_pdf, "wb") as f_out:
        writer.write(f_out)

    print(f"[OK] PDF fusionné: {output_pdf}  ({len(writer.pages)} páginas totales)")


# ══════════════════════════════════════════════════════════════════════════════
#  MAIN
# ══════════════════════════════════════════════════════════════════════════════
if __name__ == "__main__":
    original  = "arboles_DAXX_FINAL_totale.pdf"
    temp_new  = "arboles_glicoles_NEW_PAGES.pdf"
    final_out = "arboles_DAXX_FINAL_totale.pdf"   # Écrase / met à jour le document

    # Étape 1 : Générer les 3 nouvelles pages
    generate_new_pages(temp_new)

    # Étape 2 : Fusionner
    # Backup du fichier original
    import shutil
    backup = "arboles_DAXX_FINAL_totale_BACKUP.pdf"
    shutil.copy(original, backup)
    print(f"[OK] Backup créé: {backup}")

    merge_pdfs(original, temp_new, final_out)

    # Nettoyage
    os.remove(temp_new)
    print("[OK] Fichier temporaire supprimé.")
    print(f"\n[DONE] Document final mis a jour : {final_out}")
    print(f"       (Backup disponible : {backup})")
