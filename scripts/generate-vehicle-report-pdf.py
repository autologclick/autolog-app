#!/usr/bin/env python3
"""
AutoLog Vehicle History Report PDF Generator
Generates professional Hebrew RTL vehicle history reports for selling vehicles
"""

import json
import sys
import os
from io import BytesIO
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.colors import HexColor, white, black
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, KeepTogether
)
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# ============================================================================
# FONT REGISTRATION
# ============================================================================

def register_fonts():
    win_fonts = os.path.join(os.environ.get('WINDIR', r'C:\Windows'), 'Fonts')
    candidates = {
        'HFont': [
            os.path.join(win_fonts, 'arial.ttf'),
            os.path.join(win_fonts, 'ARIAL.TTF'),
            '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
        ],
        'HFontB': [
            os.path.join(win_fonts, 'arialbd.ttf'),
            os.path.join(win_fonts, 'ARIALBD.TTF'),
            '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
        ],
    }
    for name, paths in candidates.items():
        for p in paths:
            if os.path.exists(p):
                try:
                    pdfmetrics.registerFont(TTFont(name, p))
                    break
                except Exception:
                    continue
    return 'HFont', 'HFontB'

F, FB = register_fonts()

# ============================================================================
# BIDI HELPERS
# ============================================================================

try:
    from bidi.algorithm import get_display
    def bidi(text):
        if not text:
            return ''
        return get_display(str(text))
except ImportError:
    def bidi(text):
        if not text:
            return ''
        return str(text)

# ============================================================================
# COLORS
# ============================================================================

PRIMARY = HexColor('#1e3a5f')
PRIMARY_LIGHT = HexColor('#2a5080')
ACCENT = HexColor('#0d9488')
BG_LIGHT = HexColor('#f8fafc')
BORDER = HexColor('#e2e8f0')
TEXT_DARK = HexColor('#1e293b')
TEXT_GRAY = HexColor('#64748b')
TEXT_LIGHT = HexColor('#94a3b8')
WHITE = white
SUCCESS = HexColor('#059669')
WARNING = HexColor('#d97706')
DANGER = HexColor('#dc2626')

# ============================================================================
# STYLES
# ============================================================================

def make_styles():
    return {
        'title': ParagraphStyle('Title', fontName=FB, fontSize=20, textColor=WHITE, alignment=TA_CENTER, leading=26),
        'subtitle': ParagraphStyle('Subtitle', fontName=F, fontSize=11, textColor=HexColor('#94a3b8'), alignment=TA_CENTER, leading=15),
        'section_title': ParagraphStyle('SectionTitle', fontName=FB, fontSize=13, textColor=PRIMARY, alignment=TA_RIGHT, leading=18),
        'body': ParagraphStyle('Body', fontName=F, fontSize=9, textColor=TEXT_DARK, alignment=TA_RIGHT, leading=13),
        'body_bold': ParagraphStyle('BodyBold', fontName=FB, fontSize=9, textColor=TEXT_DARK, alignment=TA_RIGHT, leading=13),
        'small': ParagraphStyle('Small', fontName=F, fontSize=8, textColor=TEXT_GRAY, alignment=TA_RIGHT, leading=11),
        'cell': ParagraphStyle('Cell', fontName=F, fontSize=8, textColor=TEXT_DARK, alignment=TA_RIGHT, leading=11),
        'cell_bold': ParagraphStyle('CellBold', fontName=FB, fontSize=8, textColor=TEXT_DARK, alignment=TA_RIGHT, leading=11),
        'cell_center': ParagraphStyle('CellCenter', fontName=F, fontSize=8, textColor=TEXT_DARK, alignment=TA_CENTER, leading=11),
        'header_cell': ParagraphStyle('HeaderCell', fontName=FB, fontSize=8, textColor=WHITE, alignment=TA_CENTER, leading=11),
        'stat_value': ParagraphStyle('StatValue', fontName=FB, fontSize=16, textColor=PRIMARY, alignment=TA_CENTER, leading=20),
        'stat_label': ParagraphStyle('StatLabel', fontName=F, fontSize=8, textColor=TEXT_GRAY, alignment=TA_CENTER, leading=11),
        'footer': ParagraphStyle('Footer', fontName=F, fontSize=7, textColor=TEXT_LIGHT, alignment=TA_CENTER, leading=10),
    }

S = make_styles()

# ============================================================================
# HELPERS
# ============================================================================

PAGE_W, PAGE_H = A4
MARGIN = 1.5 * cm

def fmt_date(d):
    if not d:
        return '—'
    try:
        dt = datetime.fromisoformat(str(d).replace('Z', '+00:00'))
        return dt.strftime('%d/%m/%Y')
    except:
        return str(d)[:10] if d else '—'

def fmt_currency(amount):
    if amount is None:
        return '—'
    try:
        return f'₪{int(amount):,}'
    except:
        return f'₪{amount}'

def fmt_number(n):
    if not n:
        return '—'
    try:
        return f'{int(n):,}'
    except:
        return str(n)

# ============================================================================
# PDF BUILDER
# ============================================================================

def build_pdf(data):
    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=MARGIN, bottomMargin=MARGIN,
    )

    elements = []
    v = data.get('vehicle', {})
    summary = data.get('summary', {})

    # ---- HEADER ----
    header_data = [[
        Paragraph(bidi('AutoLog'), ParagraphStyle('Logo', fontName=FB, fontSize=10, textColor=HexColor('#94a3b8'), alignment=TA_LEFT)),
        Paragraph(bidi('דוח היסטוריית רכב'), S['title']),
    ]]
    header_table = Table(header_data, colWidths=[3*cm, PAGE_W - 2*MARGIN - 3*cm])
    header_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), PRIMARY),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 14),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 14),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        ('ROUNDEDCORNERS', [6, 6, 0, 0]),
    ]))
    elements.append(header_table)

    # ---- VEHICLE INFO BAR ----
    vehicle_text = bidi(f'{v.get("manufacturer", "")} {v.get("model", "")} {v.get("year", "")}')
    plate_text = bidi(v.get('licensePlate', ''))
    info_parts = [plate_text]
    if v.get('color'):
        info_parts.append(bidi(v['color']))
    if v.get('vin'):
        info_parts.append(bidi(f'שלדה: {v["vin"]}'))
    info_line = '  |  '.join(info_parts)

    info_data = [[
        Paragraph(info_line, ParagraphStyle('Info', fontName=F, fontSize=8, textColor=HexColor('#cbd5e1'), alignment=TA_LEFT)),
        Paragraph(vehicle_text, ParagraphStyle('VName', fontName=FB, fontSize=12, textColor=WHITE, alignment=TA_RIGHT)),
    ]]
    info_table = Table(info_data, colWidths=[8*cm, PAGE_W - 2*MARGIN - 8*cm])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), PRIMARY_LIGHT),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        ('ROUNDEDCORNERS', [0, 0, 6, 6]),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 12))

    # ---- SUMMARY STATS ----
    stats = [
        (bidi('טיפולים'), str(summary.get('totalTreatments', 0))),
        (bidi('בדיקות'), str(summary.get('totalInspections', 0))),
        (bidi('ק"מ אחרון'), fmt_number(summary.get('lastMileage'))),
        (bidi('עלות כוללת'), fmt_currency(summary.get('totalCost', 0))),
    ]
    stat_cells = []
    for label, value in stats:
        cell_content = [
            Paragraph(value, S['stat_value']),
            Paragraph(label, S['stat_label']),
        ]
        stat_cells.append(cell_content)

    # Build stats as individual mini-tables inside a row
    col_w = (PAGE_W - 2*MARGIN) / 4
    stat_tables = []
    for label, value in stats:
        mini_data = [
            [Paragraph(value, S['stat_value'])],
            [Paragraph(label, S['stat_label'])],
        ]
        mini = Table(mini_data, colWidths=[col_w - 4])
        mini.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        stat_tables.append(mini)

    stats_row = Table([stat_tables], colWidths=[col_w]*4)
    stats_row.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), BG_LIGHT),
        ('BOX', (0, 0), (-1, -1), 0.5, BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('ROUNDEDCORNERS', [4, 4, 4, 4]),
    ]))
    elements.append(stats_row)
    elements.append(Spacer(1, 14))

    # ---- STATUS ROW ----
    test_date = fmt_date(v.get('testExpiryDate'))
    ins_date = fmt_date(v.get('insuranceExpiry'))
    status_data = [[
        Paragraph(bidi(f'תוקף ביטוח: {ins_date}'), S['cell_center']),
        Paragraph(bidi(f'תוקף טסט: {test_date}'), S['cell_center']),
    ]]
    status_table = Table(status_data, colWidths=[(PAGE_W - 2*MARGIN)/2]*2)
    status_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), WHITE),
        ('BOX', (0, 0), (-1, -1), 0.5, BORDER),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('ROUNDEDCORNERS', [4, 4, 4, 4]),
    ]))
    elements.append(status_table)
    elements.append(Spacer(1, 16))

    # ---- TREATMENTS SECTION ----
    treatments = data.get('treatments', [])
    if treatments:
        elements.append(make_section_header(bidi('היסטוריית טיפולים'), str(len(treatments))))
        elements.append(Spacer(1, 4))

        t_header = [
            Paragraph(bidi('עלות'), S['header_cell']),
            Paragraph(bidi('ק"מ'), S['header_cell']),
            Paragraph(bidi('מוסך'), S['header_cell']),
            Paragraph(bidi('סוג'), S['header_cell']),
            Paragraph(bidi('טיפול'), S['header_cell']),
            Paragraph(bidi('תאריך'), S['header_cell']),
        ]
        t_rows = [t_header]
        for t in treatments:
            t_rows.append([
                Paragraph(fmt_currency(t.get('cost')), S['cell_center']),
                Paragraph(fmt_number(t.get('mileage')), S['cell_center']),
                Paragraph(bidi(t.get('garageName') or '—'), S['cell']),
                Paragraph(bidi(t.get('type', '')), S['cell']),
                Paragraph(bidi(t.get('title', '')), S['cell_bold']),
                Paragraph(fmt_date(t.get('date')), S['cell_center']),
            ])

        col_widths = [2.2*cm, 2.2*cm, 3.5*cm, 2.8*cm, 4*cm, 2.5*cm]
        t_table = Table(t_rows, colWidths=col_widths, repeatRows=1)
        t_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
            ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, BG_LIGHT]),
            ('BOX', (0, 0), (-1, -1), 0.5, BORDER),
            ('INNERGRID', (0, 0), (-1, -1), 0.3, BORDER),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 4),
            ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(t_table)
        elements.append(Spacer(1, 14))

    # ---- INSPECTIONS SECTION ----
    inspections = data.get('inspections', [])
    if inspections:
        elements.append(make_section_header(bidi('בדיקות רכב'), str(len(inspections))))
        elements.append(Spacer(1, 4))

        i_header = [
            Paragraph(bidi('סיכום'), S['header_cell']),
            Paragraph(bidi('ציון'), S['header_cell']),
            Paragraph(bidi('מוסך'), S['header_cell']),
            Paragraph(bidi('סוג'), S['header_cell']),
            Paragraph(bidi('תאריך'), S['header_cell']),
        ]
        i_rows = [i_header]
        for ins in inspections:
            score = ins.get('overallScore')
            score_text = str(score) if score is not None else '—'
            i_rows.append([
                Paragraph(bidi(ins.get('summary') or '—')[:60], S['cell']),
                Paragraph(score_text, S['cell_center']),
                Paragraph(bidi(ins.get('garageName') or '—'), S['cell']),
                Paragraph(bidi(ins.get('type', '')), S['cell']),
                Paragraph(fmt_date(ins.get('date')), S['cell_center']),
            ])

        col_widths = [5*cm, 1.8*cm, 3.5*cm, 3*cm, 2.5*cm]
        i_table = Table(i_rows, colWidths=col_widths, repeatRows=1)
        i_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), ACCENT),
            ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, BG_LIGHT]),
            ('BOX', (0, 0), (-1, -1), 0.5, BORDER),
            ('INNERGRID', (0, 0), (-1, -1), 0.3, BORDER),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 4),
            ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(i_table)
        elements.append(Spacer(1, 14))

    # ---- EXPENSES SECTION ----
    expenses = data.get('expenses', [])
    if expenses:
        elements.append(make_section_header(bidi('הוצאות'), str(len(expenses))))
        elements.append(Spacer(1, 4))

        e_header = [
            Paragraph(bidi('סכום'), S['header_cell']),
            Paragraph(bidi('תיאור'), S['header_cell']),
            Paragraph(bidi('קטגוריה'), S['header_cell']),
            Paragraph(bidi('תאריך'), S['header_cell']),
        ]
        e_rows = [e_header]
        for exp in expenses:
            e_rows.append([
                Paragraph(fmt_currency(exp.get('amount')), S['cell_center']),
                Paragraph(bidi(exp.get('description') or '—'), S['cell']),
                Paragraph(bidi(exp.get('category', '')), S['cell']),
                Paragraph(fmt_date(exp.get('date')), S['cell_center']),
            ])

        col_widths = [2.5*cm, 6.5*cm, 3.5*cm, 2.5*cm]
        e_table = Table(e_rows, colWidths=col_widths, repeatRows=1)
        e_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), HexColor('#d97706')),
            ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, BG_LIGHT]),
            ('BOX', (0, 0), (-1, -1), 0.5, BORDER),
            ('INNERGRID', (0, 0), (-1, -1), 0.3, BORDER),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 4),
            ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(e_table)
        elements.append(Spacer(1, 14))

    # ---- APPOINTMENTS SECTION ----
    appointments = data.get('appointments', [])
    if appointments:
        elements.append(make_section_header(bidi('תורים'), str(len(appointments))))
        elements.append(Spacer(1, 4))

        a_header = [
            Paragraph(bidi('מוסך'), S['header_cell']),
            Paragraph(bidi('סטטוס'), S['header_cell']),
            Paragraph(bidi('סוג שירות'), S['header_cell']),
            Paragraph(bidi('תאריך'), S['header_cell']),
        ]
        status_heb = {
            'completed': 'הושלם', 'confirmed': 'מאושר',
            'in_progress': 'בטיפול', 'pending': 'ממתין',
        }
        a_rows = [a_header]
        for apt in appointments:
            a_rows.append([
                Paragraph(bidi(apt.get('garageName', '')), S['cell']),
                Paragraph(bidi(status_heb.get(apt.get('status', ''), apt.get('status', ''))), S['cell_center']),
                Paragraph(bidi(apt.get('serviceType', '')), S['cell']),
                Paragraph(fmt_date(apt.get('date')), S['cell_center']),
            ])

        col_widths = [5*cm, 3*cm, 4.5*cm, 2.5*cm]
        a_table = Table(a_rows, colWidths=col_widths, repeatRows=1)
        a_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), HexColor('#7c3aed')),
            ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, BG_LIGHT]),
            ('BOX', (0, 0), (-1, -1), 0.5, BORDER),
            ('INNERGRID', (0, 0), (-1, -1), 0.3, BORDER),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 4),
            ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(a_table)
        elements.append(Spacer(1, 14))

    # ---- FOOTER ----
    elements.append(Spacer(1, 20))
    gen_date = fmt_date(data.get('generatedAt'))
    elements.append(Paragraph(bidi(f'דוח זה נוצר באופן אוטומטי ע"י AutoLog בתאריך {gen_date}'), S['footer']))
    elements.append(Paragraph(bidi('המידע מבוסס על נתונים שהוזנו למערכת ואינו מהווה תחליף לבדיקת רכב מקצועית'), S['footer']))

    doc.build(elements)
    return buf.getvalue()


def make_section_header(title, count):
    """Creates a styled section header with count badge"""
    data = [[
        Paragraph(f'({count})', ParagraphStyle('Count', fontName=F, fontSize=9, textColor=TEXT_GRAY, alignment=TA_LEFT)),
        Paragraph(title, S['section_title']),
    ]]
    t = Table(data, colWidths=[2*cm, PAGE_W - 2*MARGIN - 2*cm])
    t.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('LINEBELOW', (0, 0), (-1, -1), 1, BORDER),
    ]))
    return t


# ============================================================================
# MAIN
# ============================================================================

if __name__ == '__main__':
    raw = sys.stdin.read()
    data = json.loads(raw)
    pdf_bytes = build_pdf(data)
    sys.stdout.buffer.write(pdf_bytes)
