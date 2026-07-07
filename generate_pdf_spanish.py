# -*- coding: utf-8 -*-
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm

def generate():
    pdf_filename = "lista_productos_oilchem.pdf"
    doc = SimpleDocTemplate(pdf_filename, pagesize=A4,
        rightMargin=2*cm, leftMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('Title', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=17, leading=22,
        textColor=colors.HexColor('#1e3a8a'), spaceAfter=5)
    subtitle_style = ParagraphStyle('Subtitle', parent=styles['Normal'],
        fontName='Helvetica', fontSize=9, leading=13,
        textColor=colors.HexColor('#475569'), spaceAfter=14)
    date_style = ParagraphStyle('Date', parent=styles['Normal'],
        fontName='Helvetica-Oblique', fontSize=8,
        textColor=colors.HexColor('#64748b'), spaceAfter=16)
    section_style = ParagraphStyle('Section', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=12, leading=15,
        textColor=colors.HexColor('#0f766e'), spaceBefore=12, spaceAfter=7)
    cell = ParagraphStyle('Cell', parent=styles['Normal'],
        fontName='Helvetica', fontSize=8, leading=10,
        textColor=colors.HexColor('#1f2937'))
    cell_b = ParagraphStyle('CellBold', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=8, leading=10,
        textColor=colors.HexColor('#111827'))
    hdr = ParagraphStyle('Hdr', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=8.5, leading=11,
        textColor=colors.white)

    HDR_COLOR = colors.HexColor('#1e3a8a')
    ROW_ODD   = colors.white
    ROW_EVEN  = colors.HexColor('#f1f5f9')
    NEW_COLOR = colors.HexColor('#dcfce7')   # verde — nuevo
    UPD_COLOR = colors.HexColor('#fef9c3')   # amarillo — reemplazado

    story = []

    story.append(Paragraph("Lista Completa de Productos y Materias Primas — OilChem", title_style))
    story.append(Paragraph(
        "Productos finales y materias primas integrados en la aplicacion OilChem. "
        "Verde = nuevos (Julio 2026). Amarillo = reemplazados. "
        "p-Xylene (PX) eliminado y sustituido por Mixed Xylene (Xileno) en todo el sistema.",
        subtitle_style))
    story.append(Paragraph("Actualizado: Julio 2026", date_style))

    # ── SECTION 1 ─────────────────────────────────────────────────────
    story.append(Paragraph("1. Productos Finales Objetivos — 28 productos", section_style))

    final_rows = [
        ("1",  "Acetato de butilo",               "Butyl Acetate",                    "Butyl_Acetate",           'n'),
        ("2",  "Acetato de etilo",                "Ethyl Acetate",                    "Ethyl_Acetate",           'n'),
        ("3",  "Acetato de propilo",              "Propyl Acetate",                   "n_Propyl_Acetate",        'n'),
        ("4",  "Acetato de isopropilo",           "Isopropyl Acetate",                "Isopropyl_Acetate_Proxy", 'n'),
        ("5",  "Acido acrilico",                  "Acrylic Acid",                     "Acrylic_Acid",            'n'),
        ("6",  "Anhidrido ftalico",               "Phthalic Anhydride",               "Phthalic_Anhydride",      'n'),
        ("7",  "Anhidrido maleico",               "Maleic Anhydride",                 "Maleic_Anhydride",        'n'),
        ("8",  "Metacrilato de metilo (MMA)",     "Methyl Methacrylate",              "MMA",                     'n'),
        ("9",  "Acrilato de butilo",              "Butyl Acrylate",                   "Butyl_Acrylate",          'n'),
        ("10", "Monomero de acetato de vinilo",   "Vinyl Acetate Monomer (VAM)",      "VAM",                     'n'),
        ("11", "Acrilato de 2-etilhexilo (2-EHA)","2-Ethylhexyl Acrylate",           "2_EHA",                   'n'),
        ("12", "Acrilato de etilo",               "Ethyl Acrylate",                   "Ethyl_Acrylate",          'n'),
        ("13", "Acetona",                         "Acetone",                          "Acetone_V1 / Acetone_V2", 'n'),
        ("14", "Ester dibasico (DBE)",            "Dibasic Ester",                    "Dibasic_Ester",           'n'),
        ("15", "Alcohol isopropilico (IPA)",      "Isopropyl Alcohol",                "Isopropanol",             'n'),
        ("16", "Acetato de metoxipropilo (PMA)",  "Methoxy Propyl Acetate",           "PMA",                     'n'),
        ("17", "Metoxipropanol (PM)",             "Methoxy Propanol",                 "PM",                      'n'),
        ("18", "Acido isoftalico (PIA)",          "Isophthalic Acid",                 "Isophthalic_Acid",        'n'),
        ("19", "Acido tereftalico purificado",    "Purified Terephthalic Acid (PTA)", "PTA",                     'n'),
        ("20", "n-Butanol",                       "n-Butanol",                        "n_Butanol",               'n'),
        ("21", "Isobutanol",                      "Isobutanol",                       "Isobutanol",              'n'),
        ("22", "Metiletilcetona (MEK)",           "Methyl Ethyl Ketone",              "MEK / MEK_V2",            'n'),
        ("23", "Estireno",                        "Styrene",                          "Styrene",                 'n'),
        ("24", "Tolueno",                         "Toluene",                          "Toluene",                 'n'),
        ("25", "Etilenglicol (MEG)  * Nuevo",     "Monoethylene Glycol",              "MEG",                     'new'),
        ("26", "Dietilenglicol (DEG)  * Nuevo",   "Diethylene Glycol",                "DEG",                     'new'),
        ("27", "Propilenglicol (PG)  * Nuevo",    "Propylene Glycol",                 "PG",                      'new'),
        ("28", "Xileno (Mixed Xylene)  * Nuevo",  "Mixed Xylene",                     "Xylene",                  'new'),
    ]

    t1_data = [[Paragraph("#", hdr), Paragraph("Nombre (ES)", hdr),
                Paragraph("Nombre (EN)", hdr), Paragraph("ID Tecnico", hdr)]]
    for num, es, en, tid, flag in final_rows:
        t1_data.append([Paragraph(num, cell), Paragraph(es, cell_b),
                        Paragraph(en, cell), Paragraph(tid, cell)])

    col_w1 = [1*cm, 6.3*cm, 6.3*cm, 3.6*cm]
    t1 = Table(t1_data, colWidths=col_w1, repeatRows=1)
    ts1 = TableStyle([
        ('BACKGROUND', (0,0), (-1,0), HDR_COLOR),
        ('ALIGN',      (0,0), (-1,-1), 'LEFT'),
        ('VALIGN',     (0,0), (-1,-1), 'TOP'),
        ('GRID',       (0,0), (-1,-1), 0.4, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ])
    for i, (_, _, _, _, flag) in enumerate(final_rows):
        row_i = i + 1
        bg = NEW_COLOR if flag == 'new' else (ROW_EVEN if row_i % 2 == 0 else ROW_ODD)
        ts1.add('BACKGROUND', (0, row_i), (-1, row_i), bg)
    t1.setStyle(ts1)
    story.append(t1)

    # ── SECTION 2 ─────────────────────────────────────────────────────
    story.append(Paragraph("2. Materias Primas e Insumos — 17 productos", section_style))

    raw_rows = [
        ("1",  "Acido acetico",            "Acetic Acid",       "Acetic_Acid",        "Acetatos, Acrilatos",             'n'),
        ("2",  "Propileno",                "Propylene",         "Propylene",          "Butanol, IPA, MEK, PG",           'n'),
        ("3",  "Metanol",                  "Methanol",          "Methanol",           "MMA, PMA, DBE",                   'n'),
        ("4",  "Etanol",                   "Ethanol",           "Ethanol",            "Acetato de etilo",                'n'),
        ("5",  "Etileno",                  "Ethylene",          "Ethylene",           "Estireno, MEG, DEG",              'n'),
        ("6",  "n-Propanol",               "n-Propanol",        "n_Propanol",         "Acetato de propilo",              'n'),
        ("7",  "Nafta",                    "Naphtha",           "Naphtha",            "Feedstock general, Glicoles",     'n'),
        ("8",  "Ortoxileno",               "o-Xylene",          "o_Xylene",           "Anhidrido ftalico",               'n'),
        ("9",  "Nafta reformada",          "Reformed Naphtha",  "Reformed_Naphtha",   "Aromaticos, PTA, PIA, Xileno",    'n'),
        ("10", "Octanol (2-Etilhexanol)",  "Octanol",           "Octanol",            "2-EHA",                           'n'),
        ("11", "Benceno",                  "Benzene",           "Benzene",            "Estireno, Acetona V2",            'n'),
        ("12", "Ciclohexano",              "Cyclohexane",       "Cyclohexane",        "Ester dibasico (DBE)",            'n'),
        ("13", "Oxido de propileno (PO)",  "Propylene Oxide",   "Propylene_Oxide",    "PM, PMA, PG",                     'n'),
        ("14", "Metaxileno",               "m-Xylene",          "m_Xylene",           "Acido isoftalico",                'n'),
        ("15", "2-Buteno (C4)",            "2-Butene",          "2_Butene",           "MEK",                             'n'),
        ("16", "Acido dicarboxilico",      "Dicarboxylic Acid", "Dicarboxylic_Acid",  "Ester dibasico (DBE)",            'n'),
        ("17", "Oxido de etileno  * Nuevo","Ethylene Oxide",    "EO",                 "MEG, DEG",                        'new'),
    ]

    t2_data = [[Paragraph("#", hdr), Paragraph("Nombre (ES)", hdr),
                Paragraph("Nombre (EN)", hdr), Paragraph("ID Tecnico", hdr),
                Paragraph("Usado para", hdr)]]
    for num, es, en, tid, uso, flag in raw_rows:
        t2_data.append([Paragraph(num, cell), Paragraph(es, cell_b),
                        Paragraph(en, cell), Paragraph(tid, cell), Paragraph(uso, cell)])

    col_w2 = [0.8*cm, 5.0*cm, 3.5*cm, 3.0*cm, 4.9*cm]
    t2 = Table(t2_data, colWidths=col_w2, repeatRows=1)
    ts2 = TableStyle([
        ('BACKGROUND', (0,0), (-1,0), HDR_COLOR),
        ('ALIGN',      (0,0), (-1,-1), 'LEFT'),
        ('VALIGN',     (0,0), (-1,-1), 'TOP'),
        ('GRID',       (0,0), (-1,-1), 0.4, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ])
    for i, (_, _, _, _, _, flag) in enumerate(raw_rows):
        row_i = i + 1
        if flag == 'new':    bg = NEW_COLOR
        elif flag == 'upd':  bg = UPD_COLOR
        else: bg = ROW_EVEN if row_i % 2 == 0 else ROW_ODD
        ts2.add('BACKGROUND', (0, row_i), (-1, row_i), bg)
    t2.setStyle(ts2)
    story.append(t2)

    # ── TOTALS ────────────────────────────────────────────────────────
    story.append(Spacer(1, 10))
    total_data = [[
        Paragraph("Total Productos Finales", cell_b), Paragraph("28", cell_b),
        Paragraph("Total Materias Primas", cell_b),   Paragraph("17", cell_b),
        Paragraph("TOTAL INTEGRADO", cell_b),         Paragraph("45", cell_b),
    ]]
    t3 = Table(total_data, colWidths=[4.4*cm, 1.5*cm, 4.4*cm, 1.5*cm, 4.4*cm, 1.5*cm])
    ts3 = TableStyle([
        ('BACKGROUND',    (0,0), (-1,-1), colors.HexColor('#0f172a')),
        ('TEXTCOLOR',     (0,0), (-1,-1), colors.white),
        ('ALIGN',         (0,0), (-1,-1), 'CENTER'),
        ('VALIGN',        (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING',    (0,0), (-1,-1), 7),
        ('BOTTOMPADDING', (0,0), (-1,-1), 7),
        ('GRID',          (0,0), (-1,-1), 0.5, colors.HexColor('#334155')),
        ('BACKGROUND',    (4,0), (5,0),   colors.HexColor('#1e3a8a')),
    ])
    t3.setStyle(ts3)
    story.append(t3)

    story.append(Spacer(1, 6))
    story.append(Paragraph(
        "Verde (*Nuevo): MEG, DEG, PG, EO, Mixed Xylene — anadidos Julio 2026.  "
        "Amarillo (*Reemplaza PX): Mixed Xylene sustituye completamente al p-Xylene "
        "como materia prima de referencia y como producto target.",
        date_style))

    doc.build(story)
    print("PDF generado: lista_productos_oilchem.pdf")

if __name__ == "__main__":
    generate()
