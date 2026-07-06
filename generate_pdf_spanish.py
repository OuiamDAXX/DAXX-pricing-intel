# -*- coding: utf-8 -*-
import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_pdf_es():
    pdf_filename = "catalogo_productos_oilchem.pdf"
    
    # Page setup
    doc = SimpleDocTemplate(
        pdf_filename,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#1e3a8a'),
        spaceAfter=8
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor('#4b5563'),
        spaceAfter=15
    )
    
    section_title_style = ParagraphStyle(
        'SectionTitle',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=colors.HexColor('#0f766e'),
        spaceBefore=10,
        spaceAfter=6
    )
    
    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#1f2937')
    )
    
    table_cell_bold_style = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#111827')
    )
    
    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.white
    )
    
    story = []
    
    # Header
    story.append(Paragraph("Catálogo de Productos Químicos y Petroquímicos - OilChem", title_style))
    story.append(Paragraph(
        "Este documento recopila la totalidad de los 43 productos químicos y petroquímicos "
        "monitoreados en la plataforma de inteligencia <b>oilchem.net</b>. "
        "Detalla su estado de integración actual en la aplicación (como producto objetivo, materia prima o no integrado).",
        subtitle_style
    ))
    
    # Categories & Data
    categories = [
        {
            "title": "1. Sector Petroquímico Básico y Aromáticos",
            "data": [
                ["Nafta", "Naphtha", "Naphtha", "Sí (Materia Prima)", "Insumo en el What-If"],
                ["Nafta reformada", "Reformed Naphtha", "Reformed_Naphtha", "Sí (Materia Prima)", "Insumo en el What-If"],
                ["Benceno", "Benzene", "Benzene", "Sí (Materia Prima)", "Insumo para Estireno"],
                ["Tolueno", "Toluene", "Toluene", "Sí (Producto Objetivo)", "Seleccionable en App"],
                ["Ortoxileno", "o-Xylene", "o_Xylene", "Sí (Materia Prima)", "Insumo para Anhídridos"],
                ["Metaxileno", "m-Xylene", "m_Xylene", "Sí (Materia Prima)", "Insumo para Ácido isoftálico"],
                ["Paraxileno", "PX", "PX", "Sí (Materia Prima)", "Insumo para PTA"],
                ["Etileno", "Ethylene", "Ethylene", "Sí (Materia Prima)", "Insumo para Estireno"],
                ["Propileno", "Propylene", "Propylene", "Sí (Materia Prima)", "Insumo en el What-If"],
                ["Etilbenceno", "Ethylbenzene", "Ethylbenzene", "No (Disponible en CSV)", "Desactivado"],
                ["Butadieno", "Butadiene", "Butadiene", "No", "No configurado"],
                ["2-Butene (C4)", "2-Butene", "2_Butene", "Sí (Materia Prima)", "Insumo para MEK"]
            ]
        },
        {
            "title": "2. Ésteres, Acrilatos y Monómeros (Especialidad Química)",
            "data": [
                ["Acetato de butilo", "Butyl Acetate", "Butyl_Acetate", "Sí (Producto Objetivo)", "Seleccionable en App"],
                ["Acetato de etilo", "Ethyl Acetate", "Ethyl_Acetate", "Sí (Producto Objetivo)", "Seleccionable en App"],
                ["Acetato de propilo", "Propyl Acetate", "n_Propyl_Acetate", "Sí (Producto Objetivo)", "Seleccionable en App"],
                ["Acetato de isopropilo", "Isopropyl Acetate", "Isopropyl_Acetate_Proxy", "Sí (Producto Objetivo)", "Seleccionable en App"],
                ["Acrilato de butilo", "Butyl Acrylate", "Butyl_Acrylate", "Sí (Producto Objetivo)", "Seleccionable en App"],
                ["Acrilato de etilo", "Ethyl Acrylate", "Ethyl_Acrylate", "Sí (Producto Objetivo)", "Seleccionable en App"],
                ["Acrilato de 2-etilhexilo", "2-Ethylhexyl Acrylate", "2_EHA", "Sí (Producto Objetivo)", "Seleccionable en App"],
                ["Monómero de acetato de vinilo", "Vinyl Acetate Monomer", "VAM", "Sí (Producto Objetivo)", "Seleccionable en App"],
                ["Metacrilato de metilo", "Methyl Methacrylate", "MMA", "Sí (Producto Objetivo)", "Seleccionable en App"],
                ["Acetato de metoxipropilo", "Methoxy propyl acetate", "PMA", "Sí (Producto Objetivo)", "Seleccionable en App"],
                ["Metoxipropanol", "Methoxy propanol", "PM", "Sí (Producto Objetivo)", "Seleccionable en App"],
                ["Éster dibásico", "Dibasic Ester", "Dibasic_Ester", "Sí (Producto Objetivo)", "Seleccionable en App"]
            ]
        },
        {
            "title": "3. Alcoholes y Glicoles",
            "data": [
                ["n-Butanol", "n-Butanol", "n_Butanol", "Sí (Producto Objetivo)", "Seleccionable en App"],
                ["Isobutanol", "Isobutanol", "Isobutanol", "Sí (Producto Objetivo)", "Seleccionable en App"],
                ["Metanol", "Methanol", "Methanol", "Sí (Materia Prima)", "Insumo para MMA"],
                ["Etanol", "Ethanol", "Ethanol", "Sí (Materia Prima)", "Insumo para Acetato de etilo"],
                ["n-Propanol", "n-Propanol", "n_Propanol", "Sí (Materia Prima)", "Insumo para Acetato de propilo"],
                ["Alcohol isopropílico", "Isopropyl Alcohol", "Isopropanol", "Sí (Producto Objetivo)", "Seleccionable en App"],
                ["Octanol (2-Etilhexanol)", "Octanol", "Octanol", "Sí (Materia Prima)", "Insumo para 2-EHA"],
                ["Etilenglicol", "Monoethylene Glycol", "MEG", "No", "No configurado"],
                ["Dietilenglicol", "Diethylene Glycol", "DEG", "No", "No configurado"],
                ["Propilenglicol", "Propylene Glycol", "PG", "No", "No configurado"]
            ]
        },
        {
            "title": "4. Ácidos y Anhídridos",
            "data": [
                ["Ácido acético", "Acetic Acid", "Acetic_Acid", "Sí (Materia Prima)", "Insumo para Acetatos"],
                ["Ácido acrílico", "Acrylic Acid", "Acrylic_Acid", "Sí (Producto Objetivo)", "Seleccionable en App"],
                ["Ácido isoftálico", "Isophthalic Acid", "Isophthalic_Acid", "Sí (Producto Objetivo)", "Seleccionable en App"],
                ["Ácido tereftálico purificado", "Purified Terephthalic Acid", "PTA", "Sí (Producto Objetivo)", "Seleccionable en App"],
                ["Anhídrido ftálico", "Phthalic Anhydride", "Phthalic_Anhydride", "Sí (Producto Objetivo)", "Seleccionable en App"],
                ["Anhídrido maleico", "Maleic Anhydride", "Maleic_Anhydride", "Sí (Producto Objetivo)", "Seleccionable en App"],
                ["Ácido dicarboxílico", "Dicarboxylic Acid", "Dicarboxylic_Acid", "Sí (Materia Prima)", "Insumo para DBE"],
                ["Ácido nítrico", "Nitric Acid", "Nitric_Acid", "No (Disponible en CSV)", "Desactivado"],
                ["Ácido adípico", "Adipic Acid", "Adipic_Acid", "No", "No configurado"]
            ]
        },
        {
            "title": "5. Cetonas, Éteres y Óxidos",
            "data": [
                ["Acetona", "Acetone", "Acetone", "Sí (Producto Objetivo)", "Seleccionable en App"],
                ["Metiletilcetona", "Methyl Ethyl Ketone", "MEK", "Sí (Producto Objetivo)", "Seleccionable en App"],
                ["Metil isobutil cetona", "Methyl Isobutyl Ketone", "MIBK", "No", "No configurado"],
                ["Óxido de propileno", "Propylene Oxide", "Propylene_Oxide", "Sí (Materia Prima)", "Insumo para PM/PMA"],
                ["MTBE", "Methyl Tert-Butyl Ether", "MTBE", "No", "Aditivo de gasolina"],
                ["Éter dimetílico", "Dimethyl Ether", "DME", "No", "No configurado"]
            ]
        },
        {
            "title": "6. Plásticos, Polímeros, Cauchos y Otros (No Integrados)",
            "data": [
                ["Polietileno (HDPE / LDPE)", "HDPE / LDPE PE", "-", "No", "Plásticos generales de gran consumo"],
                ["Polipropileno", "Polypropylene", "-", "No", "Polímeros de gran volumen"],
                ["Cloruro de Polivinilo (PVC)", "Polyvinyl Chloride", "-", "No", "Resinas de PVC"],
                ["Poliestireno (PS / EPS)", "Polystyrene", "-", "No", "Derivado del Estireno"],
                ["ABS / Policarbonato", "ABS / Polycarbonate", "-", "No", "Plásticos de ingeniería"],
                ["Polimetilmetacrilato (PMMA)", "PMMA", "-", "No", "Derivado del MMA"],
                ["Caucho Natural (SCRWF/RSS3)", "Natural Rubber", "-", "No", "Sector de automoción"],
                ["Caucho SBR / BR", "SBR / BR Rubber", "-", "No", "Caucho sintético"],
                ["Urea / Fertilizantes", "Urea / Fertilizers", "-", "No", "Sector agrícola"]
            ]
        }
    ]
    
    col_widths = [110, 110, 90, 100, 130] # Total width = 540
    
    for category in categories:
        story.append(Paragraph(category["title"], section_title_style))
        
        table_data = [[
            Paragraph("Producto (ES)", table_header_style),
            Paragraph("Nombre (EN)", table_header_style),
            Paragraph("ID Técnico", table_header_style),
            Paragraph("Integrado", table_header_style),
            Paragraph("Función / Detalle", table_header_style)
        ]]
        
        for row in category["data"]:
            table_data.append([
                Paragraph(row[0], table_cell_bold_style),
                Paragraph(row[1], table_cell_style),
                Paragraph(row[2], table_cell_style),
                Paragraph(row[3], table_cell_style),
                Paragraph(row[4], table_cell_style)
            ])
            
        t = Table(table_data, colWidths=col_widths, repeatRows=1)
        t_style = TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e3a8a')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ])
        
        for i in range(1, len(table_data)):
            bg_color = colors.HexColor('#f9fafb') if i % 2 == 0 else colors.white
            t_style.add('BACKGROUND', (0, i), (-1, i), bg_color)
            
        t.setStyle(t_style)
        story.append(t)
        story.append(Spacer(1, 10))
        
    doc.build(story)
    print("PDF generado exitosamente.")

if __name__ == "__main__":
    generate_pdf_es()
