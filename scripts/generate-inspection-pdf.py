#!/usr/bin/env python3
"""
AutoLog Inspection Report PDF Generator
Generates professional Hebrew RTL inspection reports for vehicles
"""

import json
import sys
import os
import re
from io import BytesIO
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.lib.colors import HexColor, white, black, Color
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
)
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
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
# BIDI + CJK HELPERS
# ============================================================================

try:
    from bidi.algorithm import get_display
    _HAS_BIDI = True
except ImportError:
    _HAS_BIDI = False

def H(text):
    """Convert Hebrew logical text to visual order for ReportLab."""
    if text is None:
        return ""
    s = str(text).strip()
    if not s:
        return s
    if _HAS_BIDI:
        return get_display(s)
    return s[::-1]

# CJK to Hebrew translation map
_CJK = {
    'マツダ': 'מזדה', 'トヨタ': 'טויוטה', 'ホンダ': 'הונדה',
    'ニッサン': 'ניסאן', '日産': 'ניסאן', 'スバル': 'סובארו',
    'ミツビシ': 'מיצובישי', '三菱': 'מיצובישי', 'スズキ': 'סוזוקי',
    'シルバー': 'כסוף', 'ホワイト': 'לבן', 'ブラック': 'שחור',
    '白': 'לבן', '黒': 'שחור', '赤': 'אדום', '青': 'כחול',
    '銀': 'כסוף', '灰': 'אפור',
}

def clean(text):
    """Clean CJK chars and strip unsupported Unicode."""
    if not text:
        return str(text) if text is not None else ''
    s = str(text)
    for k, v in _CJK.items():
        s = s.replace(k, v)
    s = re.sub(r'[^\u0000-\u024F\u0590-\u05FF\u200E\u200F\uFB1D-\uFB4F\s\d.,;:!?\'\"()\-/\\%@#&*+=<>₪$€£°]', '', s)
    return s.strip()

# Category translation
CAT_HEB = {
    'tires': 'צמיגים', 'electrical': 'חשמל', 'fluids': 'נוזלים',
    'brakes': 'בלמים', 'engine': 'מנוע', 'body': 'מרכב',
    'interior': 'פנים', 'suspension': 'מתלים', 'steering': 'הגה',
    'exhaust': 'מערכת פליטה', 'ac': 'מיזוג', 'windows': 'חלונות',
    'lights': 'תאורה', 'pre_test': 'הכנה לטסט', 'work_performed': 'עבודות שבוצעו',
    'front_axle': 'סרן קדמי', 'shocks': 'בולמים',
}

# Status translation
STAT_HEB = {
    'ok': 'תקין', 'new': 'חדש', 'worn': 'שחוק', 'critical': 'קריטי',
    'warning': 'דורש תשומת לב', 'not_ok': 'לא תקין', 'dry': 'יבש',
    'failed': 'פסול', 'sweating': 'הזעה', 'leaking': 'נוזל',
    'replace': 'להחלפה', 'good': 'טוב', 'fair': 'סביר', 'poor': 'גרוע',
}

# Tire status translation
TIRE_HEB = {
    'new': 'חדש', 'ok': 'תקין', 'worn': 'שחוק', 'dry': 'יבש', 'failed': 'פסול',
}

# Urgency translation
URG_HEB = {
    'high': 'דחוף', 'medium': 'בינוני', 'low': 'נמוך',
    'urgent': 'דחוף', 'normal': 'רגיל', 'critical': 'קריטי',
}

def t_cat(val):
    return CAT_HEB.get(val, val) if val else ''

def t_stat(val):
    return STAT_HEB.get(val, val) if val else ''

def t_tire(val):
    return TIRE_HEB.get(val, val) if val else ''

# ============================================================================
# COLORS
# ============================================================================

TEAL = HexColor("#0d9488")
DARK_TEAL = HexColor("#0f766e")
LIGHT_TEAL = HexColor("#ccfbf1")
GREEN = HexColor("#16a34a")
YELLOW = HexColor("#eab308")
RED = HexColor("#dc2626")
GRAY = HexColor("#6b7280")
DARK_GRAY = HexColor("#1f2937")

# ============================================================================
# COMMON TABLE STYLE (ensures Hebrew font on ALL rows)
# ============================================================================

def base_style(header_bg=TEAL):
    """Return a base table style list that sets Hebrew font on ALL cells."""
    return [
        ('FONTNAME', (0, 0), (-1, -1), F),       # ALL cells regular font
        ('FONTNAME', (0, 0), (-1, 0), FB),        # Header row bold
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('BACKGROUND', (0, 0), (-1, 0), header_bg),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('TEXTCOLOR', (0, 1), (-1, -1), DARK_GRAY),
        ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
        ('TOPPADDING', (0, 0), (-1, -1), 7),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.Color(0.8, 0.8, 0.8)),
    ]

def info_style():
    """Style for info tables (vehicle, garage) with label/value columns."""
    return [
        ('FONTNAME', (0, 0), (-1, -1), F),
        ('FONTNAME', (0, 0), (0, -1), FB),        # Label column bold
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BACKGROUND', (0, 0), (0, -1), LIGHT_TEAL),
        ('TEXTCOLOR', (0, 0), (-1, -1), DARK_GRAY),
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),      # Values also right-aligned (RTL)
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.Color(0.8, 0.8, 0.8)),
    ]

# ============================================================================
# STYLES
# ============================================================================

def get_styles():
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle('H1', parent=styles['Heading2'], fontSize=14,
                              textColor=DARK_TEAL, spaceAfter=8, spaceBefore=12,
                              fontName=FB, alignment=TA_RIGHT))
    styles.add(ParagraphStyle('Body', parent=styles['BodyText'], fontSize=10,
                              textColor=DARK_GRAY, spaceAfter=6,
                              alignment=TA_RIGHT, fontName=F))
    styles.add(ParagraphStyle('Small', parent=styles['BodyText'], fontSize=8,
                              textColor=GRAY, spaceAfter=4,
                              alignment=TA_RIGHT, fontName=F))
    return styles

# ============================================================================
# PDF SECTIONS
# ============================================================================

def section_header(width):
    """Teal banner with title."""
    t = Table([[H("דוח בדיקת רכב")]], colWidths=[width])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), TEAL),
        ('TEXTCOLOR', (0, 0), (-1, -1), white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, -1), FB),
        ('FONTSIZE', (0, 0), (-1, -1), 22),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 16),
        ('TOPPADDING', (0, 0), (-1, -1), 16),
    ]))
    return [t, Spacer(1, 0.3 * cm)]


def section_report_info(data, width):
    rid = (data.get('id', '') or '')[:8].upper() or 'N/A'
    raw_date = data.get('date', '')
    try:
        dt = datetime.fromisoformat(raw_date.replace('Z', '+00:00'))
        d = dt.strftime("%d.%m.%Y")
    except Exception:
        d = raw_date or ''

    t = Table([[H(f"דוח מספר: {rid}"), H(f"תאריך: {d}")]], colWidths=[width / 2] * 2)
    t.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), F),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('TEXTCOLOR', (0, 0), (-1, -1), GRAY),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ]))
    return [t, Spacer(1, 0.4 * cm)]


def section_vehicle(veh, mileage, width):
    S = get_styles()
    rows = []
    if mileage:
        rows.append([H(f"{mileage:,}"), H("קילומטרים:")])
    rows.append([H(clean(veh.get('licensePlate', ''))), H("מספר רישוי:")])
    rows.append([H(clean(veh.get('manufacturer', ''))), H("יצרן:")])
    rows.append([H(clean(veh.get('model', ''))), H("דגם:")])
    rows.append([H(str(veh.get('year', ''))), H("שנה:")])
    rows.append([H(clean(veh.get('color', ''))), H("צבע:")])
    if veh.get('vin'):
        rows.append([H(veh['vin']), H("VIN:")])

    t = Table(rows, colWidths=[width * 0.6, width * 0.4])
    t.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), F),
        ('FONTNAME', (1, 0), (1, -1), FB),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BACKGROUND', (1, 0), (1, -1), LIGHT_TEAL),
        ('TEXTCOLOR', (0, 0), (-1, -1), DARK_GRAY),
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.Color(0.8, 0.8, 0.8)),
    ]))
    return [Paragraph(H("פרטי הרכב"), S['H1']), t, Spacer(1, 0.4 * cm)]


def section_garage(gar, mechanic, width):
    S = get_styles()
    rows = []
    if mechanic:
        rows.append([H(clean(mechanic)), H("שם הטכנאי:")])
    rows.append([H(clean(gar.get('name', ''))), H("שם המוסך:")])
    rows.append([H(gar.get('phone', '')), H("טלפון:")])
    rows.append([H(clean(gar.get('city', ''))), H("עיר:")])
    if gar.get('address'):
        rows.append([H(clean(gar['address'])), H("כתובת:")])

    t = Table(rows, colWidths=[width * 0.6, width * 0.4])
    t.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), F),
        ('FONTNAME', (1, 0), (1, -1), FB),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BACKGROUND', (1, 0), (1, -1), LIGHT_TEAL),
        ('TEXTCOLOR', (0, 0), (-1, -1), DARK_GRAY),
        ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.Color(0.8, 0.8, 0.8)),
    ]))
    return [Paragraph(H("פרטי המוסך"), S['H1']), t, Spacer(1, 0.4 * cm)]


def section_score(score, width):
    S = get_styles()
    els = [Paragraph(H("ניקוד כולל"), S['H1'])]
    if score is not None:
        sc = int(score)
        col = GREEN if sc >= 80 else YELLOW if sc >= 60 else RED
        t = Table([[str(sc)]], colWidths=[width])
        t.hAlign = 'CENTER'
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), col),
            ('TEXTCOLOR', (0, 0), (-1, -1), white),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('FONTNAME', (0, 0), (-1, -1), FB),
            ('FONTSIZE', (0, 0), (-1, -1), 36),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 20),
            ('TOPPADDING', (0, 0), (-1, -1), 20),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ]))
        els.append(t)
        lbl = "מצב טוב" if sc >= 80 else "דורש תשומת לב" if sc >= 60 else "דורש תיקון דחוף"
        els += [Spacer(1, 0.2 * cm), Paragraph(H(lbl), S['Small'])]
    els.append(Spacer(1, 0.4 * cm))
    return els


def section_items(items, width):
    S = get_styles()
    if not items:
        return []

    # Table header: RTL order (notes | status | item | category)
    header = [H("הערות"), H("סטטוס"), H("פריט"), H("קטגוריה")]
    rows = [header]

    for it in items:
        cat = H(t_cat(it.get('category', '')))
        name = H(clean(it.get('itemName', '')))
        stat = H(t_stat(it.get('status', '')))
        notes = H(clean(it.get('notes', '') or ''))
        rows.append([notes, stat, name, cat])

    t = Table(rows, colWidths=[width * 0.35, width * 0.15, width * 0.3, width * 0.2])
    cmds = list(base_style())

    # Color-code status column (index 1 in RTL layout)
    for i, row in enumerate(rows[1:], 1):
        raw_stat = items[i - 1].get('status', '').lower()
        if raw_stat in ('ok', 'new', 'good'):
            cmds.append(('BACKGROUND', (1, i), (1, i), Color(0.9, 1, 0.9)))
        elif raw_stat in ('warning', 'worn', 'sweating', 'fair'):
            cmds.append(('BACKGROUND', (1, i), (1, i), Color(1, 0.95, 0.8)))
        elif raw_stat in ('critical', 'not_ok', 'failed', 'leaking', 'replace', 'poor', 'dry'):
            cmds.append(('BACKGROUND', (1, i), (1, i), Color(1, 0.9, 0.9)))

    t.setStyle(TableStyle(cmds))
    return [Paragraph(H("פרטי הבדיקה"), S['H1']), t, Spacer(1, 0.4 * cm)]


def section_tires(data, width):
    S = get_styles()
    if not data:
        return []
    positions = {
        'frontRight': 'צמיג קדמי ימין', 'frontLeft': 'צמיג קדמי שמאל',
        'rearRight': 'צמיג אחורי ימין', 'rearLeft': 'צמיג אחורי שמאל',
    }
    header = [H("סטטוס"), H("מיקום")]
    rows = [header]
    for k, lbl in positions.items():
        rows.append([H(t_tire(data.get(k, ''))), H(lbl)])

    t = Table(rows, colWidths=[width * 0.4, width * 0.6])
    t.setStyle(TableStyle(base_style()))
    return [Paragraph(H("בדיקת צמיגים"), S['H1']), t, Spacer(1, 0.3 * cm)]


def section_brakes(data, width):
    S = get_styles()
    if not data:
        return []
    parts = {
        'frontDiscs': 'דיסקות קדמיות', 'rearDiscs': 'דיסקות אחוריות',
        'frontPads': 'רפידות קדמיות', 'rearPads': 'רפידות אחוריות',
    }
    header = [H("אחוז"), H("רכיב")]
    rows = [header]
    for k, lbl in parts.items():
        v = data.get(k)
        if v is not None:
            rows.append([H(f"%{v}"), H(lbl)])

    t = Table(rows, colWidths=[width * 0.3, width * 0.7])
    t.setStyle(TableStyle(base_style()))
    return [Paragraph(H("מערכת בלימה"), S['H1']), t, Spacer(1, 0.3 * cm)]


def section_summary(summary, recs, width):
    S = get_styles()
    els = []
    if summary:
        els += [Paragraph(H("סיכום"), S['H1']), Paragraph(H(clean(summary)), S['Body']),
                Spacer(1, 0.3 * cm)]

    if recs:
        els.append(Paragraph(H("המלצות"), S['H1']))
        for i, r in enumerate(recs, 1):
            txt = clean(r.get('text', '') or '')
            urg_raw = clean(r.get('urgency', '') or '').lower().strip()
            urg = URG_HEB.get(urg_raw, urg_raw) if urg_raw else ''
            cost = r.get('estimatedCost', '') or ''
            # Build line RTL: number. text [urgency] - estimated cost: NNN
            parts = [f".{i}"]
            if txt:
                parts.insert(0, txt)
            if urg:
                parts.append(f"[{urg}]")
            if cost:
                parts.append(f"- עלות משוערת: {cost}")
            line = ' '.join(parts)
            els.append(Paragraph(H(line), S['Body']))
        els.append(Spacer(1, 0.3 * cm))
    return els


def section_ai_summary(data, width):
    """Generate a comprehensive AI analysis section with deep inspection insights."""
    S = get_styles()
    els = []

    items = data.get('items', [])
    score = data.get('overallScore')
    tires = data.get('tiresData') or {}
    brakes = data.get('brakingSystem') or {}
    fluids = data.get('fluidsData') or {}
    lights = data.get('lightsData') or {}
    body = data.get('bodyData') or {}
    engine_issues = data.get('engineIssues') or {}
    notes = data.get('notes') or {}
    recs_data = data.get('recommendations') or []
    mileage = data.get('mileage') or 0
    vehicle = data.get('vehicle', {})
    year = vehicle.get('year', 0)
    manufacturer = vehicle.get('manufacturer', '')
    model = vehicle.get('model', '')
    inspection_type = data.get('inspectionType', 'full')
    pre_test = data.get('preTestChecklist') or {}
    pre_test_notes = data.get('preTestItemNotes') or {}

    current_year = datetime.now().year
    age = current_year - year if year else 0

    # ---- Classify items ----
    critical_items = [i for i in items if i.get('status') in ('critical', 'not_ok', 'failed', 'replace')]
    warning_items = [i for i in items if i.get('status') in ('warning', 'worn', 'sweating', 'fair', 'dry')]
    ok_items = [i for i in items if i.get('status') in ('ok', 'new', 'good')]

    # ---- Compute risk score (0-10) ----
    risk = 0
    if critical_items:
        risk += min(len(critical_items) * 2, 5)
    if warning_items:
        risk += min(len(warning_items) * 0.5, 2)
    if score is not None and int(score) < 60:
        risk += 2
    elif score is not None and int(score) < 75:
        risk += 1
    if age > 15:
        risk += 1
    elif age > 10:
        risk += 0.5
    risk = min(round(risk), 10)

    # ---- Tire deep analysis ----
    tire_positions = {
        'frontRight': 'קדמי ימין', 'frontLeft': 'קדמי שמאל',
        'rearRight': 'אחורי ימין', 'rearLeft': 'אחורי שמאל',
    }
    tire_critical = []
    tire_warn = []
    for k, lbl in tire_positions.items():
        v = tires.get(k, '')
        if v in ('failed', 'critical', 'replace'):
            tire_critical.append(lbl)
        elif v in ('worn', 'dry', 'fair'):
            tire_warn.append(lbl)

    # ---- Brake deep analysis ----
    brake_critical = []
    brake_warn = []
    brake_parts = {
        'frontDiscs': 'דיסקות קדמיות', 'rearDiscs': 'דיסקות אחוריות',
        'frontPads': 'רפידות קדמיות', 'rearPads': 'רפידות אחוריות',
    }
    for k, lbl in brake_parts.items():
        v = brakes.get(k)
        if v is not None:
            try:
                pct = int(v)
                if pct < 20:
                    brake_critical.append(f"{lbl} ({pct}%)")
                elif pct < 40:
                    brake_warn.append(f"{lbl} ({pct}%)")
            except (ValueError, TypeError):
                pass

    # ---- Fluids analysis ----
    fluid_issues = []
    fluid_names = {'brakeFluid': 'נוזל בלמים', 'engineOil': 'שמן מנוע', 'coolant': 'נוזל קירור'}
    for k, lbl in fluid_names.items():
        v = fluids.get(k, '')
        if v in ('critical', 'not_ok', 'failed', 'low', 'leaking'):
            fluid_issues.append(lbl)

    # ---- Lights analysis ----
    light_issues = []
    light_names = {
        'brakes': 'אורות בלימה', 'headlights': 'פנסים ראשיים', 'reverse': 'פנסי ריוורס',
        'fog': 'פנסי ערפל', 'frontSignal': 'איתותים קדמיים', 'rearSignal': 'איתותים אחוריים',
        'highBeam': 'אורות גבוהים', 'plate': 'תאורת לוחית',
    }
    for k, lbl in light_names.items():
        v = lights.get(k, '')
        if v in ('not_ok', 'failed', 'critical'):
            light_issues.append(lbl)

    # ---- Category breakdown for items ----
    cat_counts = {}
    for i in items:
        cat = t_cat(i.get('category', ''))
        status = i.get('status', '')
        if cat not in cat_counts:
            cat_counts[cat] = {'ok': 0, 'warn': 0, 'crit': 0}
        if status in ('ok', 'new', 'good'):
            cat_counts[cat]['ok'] += 1
        elif status in ('warning', 'worn', 'sweating', 'fair', 'dry'):
            cat_counts[cat]['warn'] += 1
        else:
            cat_counts[cat]['crit'] += 1

    # ---- Safety-critical systems check ----
    safety_systems = ['brakes', 'steering', 'suspension', 'tires', 'lights']
    safety_failed = []
    for i in items:
        if i.get('category') in safety_systems and i.get('status') in ('critical', 'not_ok', 'failed', 'replace'):
            safety_failed.append(t_cat(i.get('category', '')))
    safety_failed = list(set(safety_failed))

    # ============================================================
    # BUILD PDF ELEMENTS
    # ============================================================

    # ---- Header ----
    ai_header = Table([[H("ניתוח AI ותוכנית פעולה  🤖")]], colWidths=[width])
    ai_header.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), HexColor("#1e3a5f")),
        ('TEXTCOLOR', (0, 0), (-1, -1), white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, -1), FB),
        ('FONTSIZE', (0, 0), (-1, -1), 14),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
    ]))
    els.append(ai_header)
    els.append(Spacer(1, 0.3 * cm))

    # ---- Risk Level Visual ----
    if risk <= 2:
        risk_label = "סיכון נמוך"
        risk_color = GREEN
        risk_emoji = "✅"
    elif risk <= 4:
        risk_label = "סיכון בינוני-נמוך"
        risk_color = HexColor("#22c55e")
        risk_emoji = "✅"
    elif risk <= 6:
        risk_label = "סיכון בינוני"
        risk_color = YELLOW
        risk_emoji = "⚠️"
    elif risk <= 8:
        risk_label = "סיכון גבוה"
        risk_color = HexColor("#f97316")
        risk_emoji = "🔶"
    else:
        risk_label = "סיכון קריטי"
        risk_color = RED
        risk_emoji = "🔴"

    risk_data = [[H(f"{risk_emoji} {risk_label}")]]
    risk_t = Table(risk_data, colWidths=[width])
    risk_t.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), FB),
        ('FONTSIZE', (0, 0), (-1, -1), 12),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TEXTCOLOR', (0, 0), (-1, -1), risk_color),
        ('BACKGROUND', (0, 0), (-1, -1), HexColor("#f8fafc")),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOX', (0, 0), (-1, -1), 0.5, risk_color),
    ]))
    els.append(risk_t)
    els.append(Spacer(1, 0.3 * cm))

    # ---- Executive Summary ----
    sub_hdr_style = ParagraphStyle('AISub', parent=S['Body'], fontName=FB, fontSize=10, textColor=DARK_TEAL)

    # Build smart vehicle description
    vehicle_desc = ''
    if manufacturer and model:
        vehicle_desc = f"{manufacturer} {model}"
        if year:
            vehicle_desc += f" ({year})"
    if mileage:
        vehicle_desc += f", {mileage:,} ק\"מ"

    if score is not None:
        sc = int(score)
        if sc >= 90:
            summary_text = f"הרכב {vehicle_desc} במצב מצוין. כל המערכות העיקריות תקינות ופועלות כנדרש. הרכב מוכן לנסיעה בטוחה."
        elif sc >= 80:
            summary_text = f"הרכב {vehicle_desc} במצב טוב. מרבית המערכות תקינות"
            if warning_items:
                summary_text += f", עם {len(warning_items)} פריטים שדורשים מעקב בטווח הקרוב"
            summary_text += "."
        elif sc >= 70:
            summary_text = f"הרכב {vehicle_desc} במצב סביר. נמצאו מספר ממצאים שמצריכים תשומת לב"
            if critical_items:
                summary_text += f", כולל {len(critical_items)} פריטים קריטיים"
            summary_text += ". מומלץ לטפל בהם בהקדם."
        elif sc >= 55:
            summary_text = f"הרכב {vehicle_desc} דורש טיפול. נמצאו {len(critical_items) + len(warning_items)} ממצאים משמעותיים שמשפיעים על בטיחות ותפקוד הרכב."
        else:
            summary_text = f"הרכב {vehicle_desc} במצב שדורש טיפול דחוף. ציון הבדיקה ({sc}/100) מעיד על בעיות מהותיות. לא מומלץ לנסוע ברכב עד להשלמת התיקונים."
    else:
        summary_text = f"הרכב {vehicle_desc} עבר בדיקה." if vehicle_desc else "הרכב עבר בדיקה."

    els.append(Paragraph(H("סיכום מנהלים"), sub_hdr_style))
    els.append(Paragraph(H(summary_text), S['Body']))
    els.append(Spacer(1, 0.15 * cm))

    # ---- Safety Alert ----
    if safety_failed:
        safety_text = f"נמצאו ליקויים במערכות בטיחות קריטיות: {', '.join(safety_failed)}. חובה לטפל בממצאים אלה לפני נסיעה נוספת."
        els.append(Paragraph(H(f"🚨 התראת בטיחות: {safety_text}"), S['Body']))
        els.append(Spacer(1, 0.1 * cm))

    # ---- Detailed Findings by Priority ----
    if critical_items:
        els.append(Paragraph(H("ממצאים קריטיים - טיפול מיידי"), sub_hdr_style))
        for i, item in enumerate(critical_items[:8], 1):
            cat = t_cat(item.get('category', ''))
            name = item.get('name', '') or item.get('itemName', '') or ''
            note = item.get('notes', '') or ''
            line = f"{i}. {cat}"
            if name:
                line += f" - {name}"
            if note:
                line += f": {note}"
            els.append(Paragraph(H(line), S['Body']))
        els.append(Spacer(1, 0.1 * cm))

    if warning_items and len(warning_items) <= 10:
        els.append(Paragraph(H("ממצאים לתשומת לב - טיפול בטווח הקרוב"), sub_hdr_style))
        for i, item in enumerate(warning_items[:6], 1):
            cat = t_cat(item.get('category', ''))
            name = item.get('name', '') or item.get('itemName', '') or ''
            line = f"{i}. {cat}"
            if name:
                line += f" - {name}"
            els.append(Paragraph(H(line), S['Body']))
        if len(warning_items) > 6:
            els.append(Paragraph(H(f"...ועוד {len(warning_items) - 6} פריטים נוספים."), S['Body']))
        els.append(Spacer(1, 0.1 * cm))

    # ---- Systems Analysis ----
    systems_findings = []

    # Tires
    if tire_critical or tire_warn:
        tire_text = "צמיגים: "
        parts = []
        if tire_critical:
            parts.append(f"להחלפה מיידית: {', '.join(tire_critical)}")
        if tire_warn:
            parts.append(f"במעקב: {', '.join(tire_warn)}")
        tire_text += '; '.join(parts)
        # Symmetry check
        front = [tires.get('frontRight', ''), tires.get('frontLeft', '')]
        rear = [tires.get('rearRight', ''), tires.get('rearLeft', '')]
        if front[0] != front[1] and front[0] and front[1]:
            tire_text += ". שחיקה לא אחידה בסרן הקדמי - מומלץ לבדוק כיוון גלגלים."
        if rear[0] != rear[1] and rear[0] and rear[1]:
            tire_text += ". שחיקה לא אחידה בסרן האחורי."
        systems_findings.append(tire_text)

    # Brakes
    if brake_critical or brake_warn:
        brake_text = "מערכת בלימה: "
        parts = []
        if brake_critical:
            parts.append(f"דורש החלפה דחופה: {', '.join(brake_critical)}")
        if brake_warn:
            parts.append(f"שחיקה מתקדמת: {', '.join(brake_warn)}")
        brake_text += '; '.join(parts) + "."
        systems_findings.append(brake_text)

    # Fluids
    if fluid_issues:
        systems_findings.append(f"נוזלים: חריגה ב: {', '.join(fluid_issues)}. יש להשלים/להחליף בהקדם.")

    # Lights
    if light_issues:
        systems_findings.append(f"תאורה: לא תקינים: {', '.join(light_issues)}. תאורה לקויה מסכנת ועלולה לגרום לפסילת טסט.")

    # Engine
    engine_list = engine_issues.get('issues', []) if isinstance(engine_issues, dict) else []
    if engine_list:
        eng_text = ', '.join(str(e) for e in engine_list[:4])
        systems_findings.append(f"מנוע: ממצאים: {eng_text}.")

    if systems_findings:
        els.append(Paragraph(H("ניתוח מערכות"), sub_hdr_style))
        for sf in systems_findings:
            els.append(Paragraph(H(sf), S['Body']))
        els.append(Spacer(1, 0.1 * cm))

    # ---- Smart Mileage Recommendations ----
    if mileage:
        els.append(Paragraph(H(f"המלצות לפי קילומטראז' ({mileage:,} ק\"מ)"), sub_hdr_style))
        recs = []
        if mileage < 10000:
            recs.append("הרכב בקילומטראז' נמוך. המשך שמירה על לוח טיפולים קבוע.")
        else:
            if mileage >= 10000:
                recs.append("החלפת שמן מנוע ומסנן שמן")
            if mileage >= 30000:
                recs.append("החלפת מסנן אוויר")
            if mileage >= 40000:
                recs.append("בדיקת/החלפת רצועת טיימינג")
            if mileage >= 50000:
                recs.append("החלפת מסנן דלק")
            if mileage >= 60000:
                recs.append("החלפת נוזל בלמים")
                recs.append("בדיקת מצבר ומערכת טעינה")
            if mileage >= 80000:
                recs.append("בדיקת מערכת פליטה ומתלים")
            if mileage >= 100000:
                recs.append("טיפול מקיף: מערכת קירור, תרמוסטט, משאבת מים")
            if mileage >= 120000:
                recs.append("בדיקת גיר ומערכת הנעה")
            if mileage >= 150000:
                recs.append("בדיקת דחיסה (קומפרסיה) למנוע")
        if recs:
            recs_text = ', '.join(recs) + '.'
            els.append(Paragraph(H(recs_text), S['Body']))
        els.append(Spacer(1, 0.1 * cm))

    # ---- Age-based insights ----
    if age > 0:
        els.append(Paragraph(H(f"ניתוח לפי גיל הרכב ({age} שנים)"), sub_hdr_style))
        if age <= 3:
            age_text = "הרכב חדש יחסית. רוב המערכות צפויות להיות במצב מצוין. המשך שמירה על טיפולים לפי יצרן."
        elif age <= 6:
            age_text = "הרכב בגיל ביניים. מומלץ לשים לב לשחיקת חלקים כמו רפידות בלמים, צמיגים ומצבר."
        elif age <= 10:
            age_text = "הרכב בגיל שדורש מעקב קפדני. צפוי צורך בהחלפת חלקי שחיקה, בדיקת אטימות ומערכת חשמל."
        elif age <= 15:
            age_text = "הרכב ותיק. מומלץ בדיקות תקופתיות בתדירות גבוהה, תשומת לב מיוחדת לחלודה, אטימות, מערכת חשמל ואלקטרוניקה."
        else:
            age_text = f"הרכב בן {age} שנים ומחייב בדיקות מקיפות ותכופות. יש לשקול עלות-תועלת של תיקונים מרכזיים מול ערך הרכב."
        els.append(Paragraph(H(age_text), S['Body']))
        els.append(Spacer(1, 0.1 * cm))

    # ---- Action Plan with Timeline ----
    els.append(Paragraph(H("תוכנית פעולה מומלצת"), sub_hdr_style))

    action_immediate = []
    action_month = []
    action_quarter = []

    # Immediate actions
    if safety_failed:
        action_immediate.append(f"טיפול במערכות בטיחות: {', '.join(safety_failed)}")
    if tire_critical:
        action_immediate.append(f"החלפת צמיגים: {', '.join(tire_critical)}")
    if brake_critical:
        action_immediate.append(f"החלפת רכיבי בלמים: {', '.join(brake_critical)}")
    if fluid_issues:
        action_immediate.append(f"השלמת נוזלים: {', '.join(fluid_issues)}")
    if light_issues:
        action_immediate.append(f"תיקון תאורה: {', '.join(light_issues)}")
    for i in critical_items:
        name = i.get('name', '') or i.get('itemName', '')
        cat = t_cat(i.get('category', ''))
        desc = name if name else cat
        if desc and desc not in str(action_immediate):
            action_immediate.append(f"תיקון {desc}")

    # Within a month
    if tire_warn:
        action_month.append(f"מעקב צמיגים: {', '.join(tire_warn)}")
    if brake_warn:
        action_month.append(f"מעקב בלמים: {', '.join(brake_warn)}")
    for i in warning_items[:5]:
        name = i.get('name', '') or i.get('itemName', '')
        cat = t_cat(i.get('category', ''))
        desc = name if name else cat
        if desc:
            action_month.append(f"בדיקה: {desc}")

    # Within 3 months
    if score is not None and int(score) < 75:
        action_quarter.append("בדיקה חוזרת לאחר השלמת התיקונים")
    if age > 8:
        action_quarter.append("בדיקת חשמל מקיפה")
    if mileage and mileage > 80000:
        action_quarter.append("בדיקת מערכת פליטה")

    timeline_rows = []
    if action_immediate:
        timeline_rows.append([H(', '.join(action_immediate[:4])), H("מיידי")])
    if action_month:
        timeline_rows.append([H(', '.join(action_month[:4])), H("תוך חודש")])
    if action_quarter:
        timeline_rows.append([H(', '.join(action_quarter[:3])), H("תוך 3 חודשים")])

    if not timeline_rows:
        timeline_rows.append([H("אין פעולות נדרשות כרגע - המשך שמירה על טיפולים שוטפים"), H("שוטף")])

    timeline_t = Table(timeline_rows, colWidths=[width * 0.78, width * 0.22])
    timeline_t.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), F),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('FONTNAME', (0, 0), (0, -1), F),
        ('FONTNAME', (1, 0), (1, -1), FB),
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (1, -1), 'CENTER'),
        ('TEXTCOLOR', (1, 0), (1, -1), DARK_TEAL),
        ('TEXTCOLOR', (0, 0), (0, -1), DARK_GRAY),
        ('BACKGROUND', (1, 0), (1, -1), LIGHT_TEAL),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor("#e5e7eb")),
    ]))
    els.append(timeline_t)
    els.append(Spacer(1, 0.2 * cm))

    # ---- Next Inspection ----
    if score is not None:
        sc = int(score)
        if sc >= 85:
            next_text = "בדיקה הבאה: מומלץ בעוד 12 חודשים או 15,000 ק\"מ."
        elif sc >= 70:
            next_text = "בדיקה הבאה: מומלץ בעוד 6 חודשים או 10,000 ק\"מ."
        elif sc >= 55:
            next_text = "בדיקה הבאה: מומלץ בעוד 3 חודשים או לאחר ביצוע תיקונים."
        else:
            next_text = "בדיקה הבאה: נדרשת בדיקה חוזרת מיידית לאחר השלמת כל התיקונים הקריטיים."
        els.append(Paragraph(H(next_text), S['Body']))
        els.append(Spacer(1, 0.15 * cm))

    # ---- Estimated Cost Insight ----
    if recs_data:
        total_cost = 0
        for r in recs_data:
            c = r.get('estimatedCost') or r.get('cost') or 0
            try:
                total_cost += int(c)
            except (ValueError, TypeError):
                pass
        if total_cost > 0:
            els.append(Paragraph(H(f"הערכת עלות תיקונים: כ-{total_cost:,} ש\"ח (הערכה בלבד, מחירים משתנים בין מוסכים)."), S['Body']))
            els.append(Spacer(1, 0.1 * cm))

    # ---- Summary Stats ----
    els.append(Spacer(1, 0.15 * cm))
    stats_data = [
        [H(f"{len(ok_items)}"), H(f"{len(warning_items)}"), H(f"{len(critical_items)}"), H(f"{len(items)}")],
        [H("תקינים"), H("לתשומת לב"), H("קריטיים"), H("סה\"כ פריטים")],
    ]
    stats_t = Table(stats_data, colWidths=[width * 0.25] * 4)
    stats_t.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), FB),
        ('FONTSIZE', (0, 0), (-1, 0), 20),
        ('FONTSIZE', (0, 1), (-1, 1), 8),
        ('FONTNAME', (0, 1), (-1, 1), F),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TEXTCOLOR', (0, 0), (0, 0), GREEN),
        ('TEXTCOLOR', (1, 0), (1, 0), YELLOW),
        ('TEXTCOLOR', (2, 0), (2, 0), RED),
        ('TEXTCOLOR', (3, 0), (3, 0), DARK_TEAL),
        ('TEXTCOLOR', (0, 1), (-1, 1), GRAY),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
    ]))
    els.append(stats_t)

    # ---- Disclaimer ----
    els.append(Spacer(1, 0.3 * cm))
    disc_text = "* ניתוח זה נוצר אוטומטית על ידי מערכת AutoLog AI. מבוסס על נתוני הבדיקה, קילומטראז', גיל הרכב ודפוסי שחיקה. אין להסתמך עליו כתחליף לחוות דעת מקצועית של מכונאי מוסמך."
    els.append(Paragraph(H(disc_text), S['Small']))
    els.append(Spacer(1, 0.4 * cm))

    return els


def section_footer(width):
    S = get_styles()
    els = [Spacer(1, 0.5 * cm)]

    # Separator line
    line = Table([['']], colWidths=[width])
    line.setStyle(TableStyle([
        ('LINEABOVE', (0, 0), (-1, 0), 1, TEAL),
    ]))
    els.append(line)
    els.append(Spacer(1, 0.3 * cm))

    now = datetime.now().strftime("%d.%m.%Y %H:%M")
    els.append(Paragraph(H(f"AutoLog - דוח הבדיקה נוצר בתאריך {now}"), S['Small']))
    els.append(Paragraph(H("דוח זה הופק באופן דיגיטלי ואינו דורש חתימה."), S['Small']))
    return els


# ============================================================================
# MAIN
# ============================================================================

def generate_pdf(data):
    # Clean CJK from all string fields
    for section in ['vehicle', 'garage']:
        d = data.get(section, {})
        for k, v in d.items():
            if isinstance(v, str):
                d[k] = clean(v)
        data[section] = d

    if data.get('mechanicName'):
        data['mechanicName'] = clean(data['mechanicName'])
    if data.get('customerName'):
        data['customerName'] = clean(data['customerName'])

    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4,
                            rightMargin=1.5 * cm, leftMargin=1.5 * cm,
                            topMargin=1.5 * cm, bottomMargin=1.5 * cm,
                            title="Inspection Report")
    W = A4[0] - 3 * cm
    els = []

    els += section_header(W)
    els += section_report_info(data, W)
    els += section_vehicle(data.get('vehicle', {}), data.get('mileage'), W)
    els += section_garage(data.get('garage', {}), data.get('mechanicName'), W)
    els += section_score(data.get('overallScore'), W)
    els += section_items(data.get('items', []), W)
    els += section_tires(data.get('tiresData'), W)
    els += section_brakes(data.get('brakingSystem'), W)
    els += section_summary(data.get('summary'), data.get('recommendations', []), W)
    els += section_ai_summary(data, W)
    els += section_footer(W)

    doc.build(els)
    buf.seek(0)
    return buf.getvalue()


if __name__ == '__main__':
    try:
        # Ensure UTF-8 encoding for Hebrew support
        if hasattr(sys.stdin, 'reconfigure'):
            sys.stdin.reconfigure(encoding='utf-8')
        raw = sys.stdin.read()
        data = json.loads(raw)
        pdf = generate_pdf(data)
        sys.stdout.buffer.write(pdf)
    except json.JSONDecodeError as e:
        sys.stderr.write(f"JSON Parse Error: {e}\n")
        sys.exit(1)
    except Exception as e:
        sys.stderr.write(f"PDF Generation Error: {e}\n")
        sys.exit(1)
