import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_pdf():
    pdf_filename = "produits_et_matieres_premieres.pdf"
    doc = SimpleDocTemplate(
        pdf_filename,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#1e3a8a'),
        alignment=0, # Left
        spaceAfter=15
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10.5,
        leading=14,
        textColor=colors.HexColor('#4b5563'),
        spaceAfter=25
    )
    
    h2_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#0f766e'),
        spaceBefore=15,
        spaceAfter=10
    )
    
    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#1f2937')
    )
    
    table_cell_bold_style = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#111827')
    )
    
    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13,
        textColor=colors.white
    )

    story = []
    
    # Document Header
    story.append(Paragraph("Nomenclature des Produits et Matières Premières - Application OilChem", title_style))
    story.append(Paragraph(
        "Ce document récapitule l'ensemble des produits chimiques suivis dans l'application <b>OilChem</b>, "
        "sans doublons, classés par type. Cette liste est conçue pour collecter les données historiques européennes correspondantes.",
        subtitle_style
    ))
    
    # Data List
    products_data = [
        # (French Name, English Name, CAS Number, Category)
        ("Acétate de butyle", "Butyl Acetate", "123-86-4", "Produit Final"),
        ("Acétate d'éthyle", "Ethyl Acetate", "141-78-6", "Produit Final"),
        ("Acétate de propyle", "Propyl Acetate", "109-60-4", "Produit Final"),
        ("Acétate d'isopropyle", "Isopropyl Acetate", "108-21-4", "Produit Final"),
        ("Acide acrylique", "Acrylic Acid", "79-10-7", "Produit Final / Intrant"),
        ("Anhydride phtalique", "Phthalic Anhydride", "85-44-9", "Produit Final"),
        ("Anhydride maléique", "Maleic Anhydride", "108-31-6", "Produit Final"),
        ("Méthacrylate de méthyle (MMA)", "Methyl Methacrylate (MMA)", "80-62-6", "Produit Final"),
        ("Acrylate de butyle", "Butyl Acrylate", "141-32-2", "Produit Final"),
        ("Monomère d'acétate de vinyle (VAM)", "Vinyl Acetate Monomer (VAM)", "108-05-4", "Produit Final"),
        ("Acrylate de 2-éthylhexyle (2-EHA)", "2-Ethylhexyl Acrylate (2-EHA)", "103-11-7", "Produit Final"),
        ("Acrylate d'éthyle", "Ethyl Acrylate", "140-88-5", "Produit Final"),
        ("Acétone", "Acetone", "67-64-1", "Produit Final / Intrant"),
        ("Ester dibasique (DBE)", "Dibasic Ester (DBE)", "95481-62-2", "Produit Final"),
        ("Alcool isopropylique (Isopropanol / IPA)", "Isopropyl Alcohol (IPA)", "67-63-0", "Produit Final / Intrant"),
        ("Acétate d'éther de méthoxypropyl (PMA)", "Methoxypropyl Acetate (PMA)", "108-65-6", "Produit Final"),
        ("Méthoxypropanol (PM)", "Methoxypropanol (PM)", "107-98-2", "Produit Final / Intrant"),
        ("Acide isophtalique (PIA)", "Isophthalic Acid (PIA)", "121-91-5", "Produit Final"),
        ("Acide téréphtalique purifié (PTA)", "Purified Terephthalic Acid (PTA)", "100-21-0", "Produit Final"),
        ("n-Butanol", "n-Butanol", "71-36-3", "Produit Final / Intrant"),
        ("Isobutanol", "Isobutanol", "78-83-1", "Produit Final / Intrant"),
        ("Méthyléthylcétone (MEK)", "Methyl Ethyl Ketone (MEK)", "78-93-3", "Produit Final"),
        ("Styrène", "Styrene", "100-42-5", "Produit Final"),
        ("Toluène", "Toluene", "108-88-3", "Produit Final / Intrant"),
        ("Éthylène", "Ethylene", "74-85-1", "Matière Première / Oléfine"),
        ("Propylène", "Propylene", "115-07-1", "Matière Première / Oléfine"),
        ("Benzène", "Benzene", "71-43-2", "Matière Première / Aromatique"),
        ("Orthoxylène (o-Xylène)", "o-Xylene", "95-47-6", "Matière Première / Aromatique"),
        ("Métaxylène (m-Xylène)", "m-Xylene", "108-38-3", "Matière Première / Aromatique"),
        ("Paraxylène (PX)", "Paraxylene", "106-42-3", "Matière Première / Aromatique"),
        ("Naphta / Naphta Réformé", "Naphtha / Reformed Naphtha", "64742-95-6", "Coupe Pétrolière / Charge"),
        ("Cyclohexane", "Cyclohexane", "110-82-7", "Matière Première"),
        ("Butènes (1-Butène, 2-Butène)", "Butenes (1-Butene, 2-Butene)", "106-98-9 / 107-01-7", "Matière Première / C4"),
        ("Méthanol", "Methanol", "67-56-1", "Matière Première / Intrant"),
        ("Éthanol", "Ethanol", "64-17-5", "Matière Première / Intrant"),
        ("n-Propanol", "n-Propanol", "71-23-8", "Matière Première / Intrant"),
        ("2-Butanol", "2-Butanol", "78-92-2", "Matière Première / Intrant"),
        ("2-Éthylhexanol (Octanol)", "2-Ethylhexanol", "104-76-7", "Matière Première / Intrant"),
        ("Acide acétique", "Acetic Acid", "64-19-7", "Matière Première / Intrant"),
        ("Acide dicarboxylique", "Dicarboxylic Acid", "111-16-0", "Matière Première / Intrant"),
        ("Oxyde de propylène", "Propylene Oxide", "75-56-9", "Matière Première / Intrant"),
        ("Gaz Naturel (GNL / LNG)", "Natural Gas (LNG)", "8006-14-2", "Énergie / Charge")
    ]
    
    # Sort alphabetically by French Name
    products_data.sort(key=lambda x: x[0])
    
    # Create Table
    table_data = [[
        Paragraph("Nom du Produit (FR)", table_header_style),
        Paragraph("Nom du Produit (EN)", table_header_style),
        Paragraph("Numéro CAS", table_header_style),
        Paragraph("Classification dans l'App", table_header_style)
    ]]
    
    for fr, en, cas, cat in products_data:
        table_data.append([
            Paragraph(fr, table_cell_bold_style),
            Paragraph(en, table_cell_style),
            Paragraph(cas, table_cell_style),
            Paragraph(cat, table_cell_style)
        ])
        
    # Table styling
    col_widths = [160, 160, 100, 112] # Total width = 532 (compatible with letter page width 612 - margins)
    t = Table(table_data, colWidths=col_widths, repeatRows=1)
    
    t_style = TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e3a8a')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
    ])
    
    # Add row backgrounds for alternating rows
    for i in range(1, len(table_data)):
        bg_color = colors.HexColor('#f9fafb') if i % 2 == 0 else colors.white
        t_style.add('BACKGROUND', (0, i), (-1, i), bg_color)
        t_style.add('TOPPADDING', (0, i), (-1, i), 6)
        t_style.add('BOTTOMPADDING', (0, i), (-1, i), 6)
        
    t.setStyle(t_style)
    story.append(t)
    
    # Build Document
    doc.build(story)
    print("PDF généré avec succès.")

if __name__ == "__main__":
    generate_pdf()
