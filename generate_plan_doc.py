# -*- coding: utf-8 -*-
"""
Script generador del documento oficial de Word (.docx)
Plan Maestro de Ejecución Paso a Paso & Bitácora de Avance
Ecosistema SaaS: TEPUY CONDO NEXUS
"""

import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, hex_color):
    """Aplica color de fondo a una celda de tabla."""
    tcPr = cell._element.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=140, bottom=140, left=180, right=180):
    """Aplica márgenes internos (padding) a una celda en dxa."""
    tcPr = cell._element.get_or_add_tcPr()
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    tcPr.append(tcMar)

def set_table_borders(table, color="D1D5DB", sz="4", val="single"):
    """Aplica bordes suaves y elegantes a la tabla."""
    tblPr = table._element.xpath('w:tblPr')
    if tblPr:
        borders = parse_xml(
            f'<w:tblBorders {nsdecls("w")}>'
            f'<w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
            f'<w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
            f'<w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
            f'<w:insideV w:val="none"/>'
            f'<w:left w:val="none"/>'
            f'<w:right w:val="none"/>'
            f'</w:tblBorders>'
        )
        tblPr[0].append(borders)

def add_callout(doc, text_bold, text_body, border_color="0284C7", bg_color="F0F9FF"):
    """Crea una caja destacada (callout) elegante."""
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    
    cell = tbl.cell(0, 0)
    cell.width = Inches(6.5)
    set_cell_background(cell, bg_color)
    set_cell_margins(cell, top=160, bottom=160, left=240, right=200)
    
    # Borde izquierdo grueso, resto invisible
    tcPr = cell._element.get_or_add_tcPr()
    borders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'<w:left w:val="single" w:sz="36" w:space="0" w:color="{border_color}"/>'
        f'<w:top w:val="none"/>'
        f'<w:bottom w:val="none"/>'
        f'<w:right w:val="none"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.15
    
    run_b = p.add_run(text_bold + " ")
    run_b.bold = True
    run_b.font.name = "Arial"
    run_b.font.size = Pt(10.5)
    run_b.font.color.rgb = RGBColor(15, 23, 42)
    
    run_t = p.add_run(text_body)
    run_t.font.name = "Arial"
    run_t.font.size = Pt(10)
    run_t.font.color.rgb = RGBColor(51, 65, 85)
    
    p_after = doc.add_paragraph()
    p_after.paragraph_format.space_before = Pt(2)
    p_after.paragraph_format.space_after = Pt(6)

def style_heading(p, text, level=1):
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    run.font.name = "Arial"
    run.bold = True
    
    if level == 1:
        p.paragraph_format.space_before = Pt(18)
        p.paragraph_format.space_after = Pt(8)
        run.font.size = Pt(15)
        run.font.color.rgb = RGBColor(15, 23, 42) # Slate 900
    elif level == 2:
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(6)
        run.font.size = Pt(12.5)
        run.font.color.rgb = RGBColor(2, 132, 199) # Sky 600
    elif level == 3:
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(4)
        run.font.size = Pt(11)
        run.font.color.rgb = RGBColor(51, 65, 85) # Slate 700

def create_document():
    doc = Document()
    
    # Configurar márgenes del documento (1 pulgada estándar)
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)
        section.different_first_page_header_footer = False
        
        # Pie de página con numeración y confidencialidad
        footer = section.footer
        f_p = footer.paragraphs[0]
        f_p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        f_run = f_p.add_run("TEPUY CONDO NEXUS • Plan Maestro de Ejecución • Confidencial")
        f_run.font.name = "Arial"
        f_run.font.size = Pt(8.5)
        f_run.font.color.rgb = RGBColor(148, 163, 184)
    
    # -------------------------------------------------------------
    # PORTADA / ENCABEZADO EJECUTIVO
    # -------------------------------------------------------------
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(0)
    title_p.paragraph_format.space_after = Pt(4)
    r_sub = title_p.add_run("ECOSISTEMA SAAS MULTI-TENANT DE ADMINISTRACIÓN DE CONDOMINIOS\n")
    r_sub.font.name = "Arial"
    r_sub.font.size = Pt(9.5)
    r_sub.bold = True
    r_sub.font.color.rgb = RGBColor(2, 132, 199) # Accent Cyan/Sky
    
    r_title = title_p.add_run("PLAN MAESTRO DE EJECUCIÓN PASO A PASO & BITÁCORA DE AVANCE")
    r_title.font.name = "Arial"
    r_title.font.size = Pt(20)
    r_title.bold = True
    r_title.font.color.rgb = RGBColor(15, 23, 42)
    
    # Ficha de Datos Corporativos en Tabla Elegante
    info_tbl = doc.add_table(rows=4, cols=2)
    info_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    info_tbl.autofit = False
    
    col_widths = [Inches(2.2), Inches(4.3)]
    metadata = [
        ("Liderazgo Ejecutivo / CEO:", "Alfredo R. Martínez"),
        ("Identidad & Dominios:", "TEPUYNEXUS.COM | TEPUYNEXUS.AI"),
        ("Contacto Corporativo:", "asesorias@tepuynexus.com | soluciones.tepuy.vzla@gmail.com | +58 426 553 8288"),
        ("Escala Objetivo & Arquitectura:", "1.000.000+ Usuarios Concurrentes | Multi-Tenant RLS | Python FastAPI + React + Flutter")
    ]
    
    for row_idx, (label, val) in enumerate(metadata):
        row = info_tbl.rows[row_idx]
        c0, c1 = row.cells[0], row.cells[1]
        c0.width = col_widths[0]
        c1.width = col_widths[1]
        
        set_cell_background(c0, "F8FAFC" if row_idx % 2 == 0 else "FFFFFF")
        set_cell_background(c1, "F8FAFC" if row_idx % 2 == 0 else "FFFFFF")
        set_cell_margins(c0, top=80, bottom=80, left=100, right=100)
        set_cell_margins(c1, top=80, bottom=80, left=100, right=100)
        
        p0 = c0.paragraphs[0]
        p0.paragraph_format.space_before = Pt(0)
        p0.paragraph_format.space_after = Pt(0)
        r0 = p0.add_run(label)
        r0.font.name = "Arial"
        r0.font.size = Pt(9.5)
        r0.bold = True
        r0.font.color.rgb = RGBColor(71, 85, 105)
        
        p1 = c1.paragraphs[0]
        p1.paragraph_format.space_before = Pt(0)
        p1.paragraph_format.space_after = Pt(0)
        r1 = p1.add_run(val)
        r1.font.name = "Arial"
        r1.font.size = Pt(9.5)
        r1.font.color.rgb = RGBColor(15, 23, 42)
        if "Alfredo R. Martínez" in val:
            r1.bold = True
            
    set_table_borders(info_tbl, color="E2E8F0")
    
    doc.add_paragraph().paragraph_format.space_after = Pt(8)
    
    # -------------------------------------------------------------
    # SECCIÓN 1: PRINCIPIOS DE INGENIERÍA Y REGLAS DE ORO
    # -------------------------------------------------------------
    style_heading(doc.add_paragraph(), "1. PRINCIPIOS DE INGENIERÍA Y DIRECTIVAS INVIOLABLES", level=1)
    
    add_callout(
        doc,
        "REGLA DE ORO — TRANSPARENCIA RADICAL Y REPORTE DE INCIDENTES:",
        "Si ocurre cualquier error técnico, inconsistencia, bug o riesgo de pérdida/corrupción de datos: QUEDA ROTUNDAMENTE PROHIBIDO OCULTARLO O APLICAR PARCHES SILENCIOSOS. Se detiene la operación y se informa inmediatamente a Alfredo R. Martínez con hechos objetivos, impacto real y opciones, consultando SIEMPRE qué camino tomar.",
        border_color="E11D48", # Rose 600
        bg_color="FFF1F2"
    )
    
    add_callout(
        doc,
        "FILOSOFÍA DE ESCALABILIDAD — 1.000.000+ USUARIOS (NO AL 'LUEGO SE CAMBIA'):",
        "El ecosistema está concebido para alta concurrencia masiva desde la línea uno. Queda prohibida la mentalidad de atajos provisorios. PostgreSQL RLS, pooling de conexiones, stateless API, indexación quirúrgica y Redis caching deben construirse sólidos de entrada.",
        border_color="0284C7", # Sky 600
        bg_color="F0F9FF"
    )
    
    principles = [
        ("Tipado Estricto & Cero Placeholders:", "Python con mypy --strict sin Any, TypeScript con strict: true, Dart con sound null-safety. Prohibidos bloques TODO o pass incompletos."),
        ("Precisión Financiera Absoluta:", "Prohibido el uso de float en dinero. Uso mandatorio de Decimal con redondeo bancario ROUND_HALF_EVEN y Numeric(18, 4) en PostgreSQL."),
        ("Blindaje Multi-Tenant Inviolable:", "Toda consulta a la base de datos está aislada por tenant_id a nivel de PostgreSQL Row-Level Security (RLS) y middleware de interceptación HTTP 402 si la licencia está vencida."),
        ("Accesibilidad Radical (Modo Senior):", "App móvil Flutter con tipografía dinámica (mínimo 20px en modo senior, escala hasta 200%), contraste extremo WCAG AAA y navegación en 3 botones sagrados.")
    ]
    
    for title, desc in principles:
        bp = doc.add_paragraph(style='List Bullet')
        bp.paragraph_format.space_before = Pt(1)
        bp.paragraph_format.space_after = Pt(2)
        r_b = bp.add_run(title + " ")
        r_b.bold = True
        r_b.font.name = "Arial"
        r_b.font.size = Pt(9.5)
        r_b.font.color.rgb = RGBColor(15, 23, 42)
        
        r_d = bp.add_run(desc)
        r_d.font.name = "Arial"
        r_d.font.size = Pt(9.5)
        r_d.font.color.rgb = RGBColor(71, 85, 105)

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # -------------------------------------------------------------
    # SECCIÓN 2: PLAN MAESTRO DE EJECUCIÓN PASO A PASO
    # -------------------------------------------------------------
    style_heading(doc.add_paragraph(), "2. PLAN MAESTRO DE EJECUCIÓN PASO A PASO", level=1)
    
    intro_p = doc.add_paragraph()
    intro_p.paragraph_format.space_before = Pt(2)
    intro_p.paragraph_format.space_after = Pt(8)
    r_intro = intro_p.add_run(
        "A continuación se detalla la hoja de ruta técnica dividida en fases secuenciales de desarrollo. "
        "Cada paso cuenta con su casilla de verificación, entregable técnico estricto, estado actual y espacio "
        "para que usted pueda registrar observaciones o decisiones a medida que avanzamos:"
    )
    r_intro.font.name = "Arial"
    r_intro.font.size = Pt(10)
    r_intro.font.color.rgb = RGBColor(51, 65, 85)

    def create_phase_table(headers, data, col_widths):
        table = doc.add_table(rows=len(data) + 1, cols=len(headers))
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        table.autofit = False
        
        # Encabezado
        hdr_row = table.rows[0]
        for col_idx, h_text in enumerate(headers):
            cell = hdr_row.cells[col_idx]
            cell.width = col_widths[col_idx]
            set_cell_background(cell, "0F172A") # Dark Navy
            set_cell_margins(cell, top=140, bottom=140, left=120, right=120)
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if col_idx in [0, 3] else WD_ALIGN_PARAGRAPH.LEFT
            r = p.add_run(h_text)
            r.bold = True
            r.font.name = "Arial"
            r.font.size = Pt(9)
            r.font.color.rgb = RGBColor(255, 255, 255)
            
        # Filas de datos
        for row_idx, row_data in enumerate(data):
            row = table.rows[row_idx + 1]
            bg_col = "F8FAFC" if row_idx % 2 == 0 else "FFFFFF"
            for col_idx, cell_value in enumerate(row_data):
                cell = row.cells[col_idx]
                cell.width = col_widths[col_idx]
                set_cell_background(cell, bg_col)
                set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
                p = cell.paragraphs[0]
                p.paragraph_format.space_before = Pt(0)
                p.paragraph_format.space_after = Pt(0)
                
                if col_idx in [0, 3]:
                    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                else:
                    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                    
                r = p.add_run(cell_value)
                r.font.name = "Arial"
                r.font.size = Pt(8.5)
                
                # Resaltar estados
                if "COMPLETADO" in cell_value:
                    r.bold = True
                    r.font.color.rgb = RGBColor(22, 163, 74) # Green 600
                elif "EN PROCESO" in cell_value:
                    r.bold = True
                    r.font.color.rgb = RGBColor(2, 132, 199) # Sky 600
                elif "PENDIENTE" in cell_value:
                    r.font.color.rgb = RGBColor(148, 163, 184) # Slate 400
                else:
                    r.font.color.rgb = RGBColor(15, 23, 42)
                    
        set_table_borders(table, color="CBD5E1")
        doc.add_paragraph().paragraph_format.space_after = Pt(10)
        return table

    table_headers = ["Paso / Check", "Fase / Tarea Técnica", "Entregable Específico", "Estado", "Bitácora / Notas de Alfredo"]
    table_widths = [Inches(0.9), Inches(1.8), Inches(2.2), Inches(0.9), Inches(1.2)]

    # ---------------- FASE 0 ----------------
    style_heading(doc.add_paragraph(), "FASE 0: IDENTIDAD, INFRAESTRUCTURA DE DOMINIO Y GOBERNANZA", level=2)
    fase0_data = [
        ["[ X ] 0.1", "Identidad & Dominio Corporativo", "Compra y configuración de TEPUYNEXUS.COM. Migración de marca a TEPUYNEXUS.AI.", "COMPLETADO", "Dominio activo. Enrutamiento Cloudflare pendiente."],
        ["[   ] 0.2", "Enrutamiento Cloudflare Email", "Redirección de asesorias@tepuynexus.com -> soluciones.tepuy.vzla@gmail.com sin costo.", "EN PROCESO", "Guiar configuración DNS en Cloudflare."],
        ["[ X ] 0.3", "Landing Page Comercial (Web)", "index.html optimizado con logos transparentes, branding cian/oro y formulario de captación.", "COMPLETADO", "Localhost:5500 validado y operativo."],
        ["[ X ] 0.4", "Gobernanza y Reglas de Desarrollo", "Documentos context.md y AGENTS.md con reglas inviolables de seguridad y escala 1M+.", "COMPLETADO", "Regla de oro de transparencia incorporada."]
    ]
    create_phase_table(table_headers, fase0_data, table_widths)

    # ---------------- FASE 1 ----------------
    style_heading(doc.add_paragraph(), "FASE 1: BACKEND DE MISIÓN CRÍTICA (Python FastAPI + PostgreSQL RLS)", level=2)
    fase1_data = [
        ["[   ] 1.1", "Entorno & Configuración Core", "Setup de FastAPI con Pydantic Settings v2, pooling asyncpg y configuración Redis.", "PENDIENTE", "Directorio backend-fastapi listo."],
        ["[   ] 1.2", "Modelos Relacionales SQLAlchemy", "Modelos: Admin, Building (License), Unit, User, Payment, Expense, AliquotDebt, AuditLog.", "PENDIENTE", "Uso estricto de Decimal Numeric(18,4)."],
        ["[   ] 1.3", "Row-Level Security (RLS) PostgreSQL", "Políticas RLS en DB activadas por app.current_tenant_id en cada transacción.", "PENDIENTE", "Blindaje anti-fugas multi-tenant."],
        ["[   ] 1.4", "Middleware de Licenciamiento", "TenantLicenseMiddleware con intercepción y corte HTTP 402 Payment Required si vencida.", "PENDIENTE", "Retorna URL de resolución de pago."],
        ["[   ] 1.5", "Motor Multi-Moneda y Tasas", "Servicio currency.py con cálculo de tasas oficiales (BCV, etc.) y caché Redis (TTL 30m).", "PENDIENTE", "Soporta USD, EUR, Bs. y monedas locales."],
        ["[   ] 1.6", "Motor i18n Bilingüe Backend", "Sistema i18n con catálogos es.json y en.json para respuestas y mensajes de negocio.", "PENDIENTE", "Desacoplado de cadenas en duro."],
        ["[   ] 1.7", "Autenticación & Seguridad JWT", "Hashing Argon2id, emisión de JWT con tenant_id y roles (SuperAdmin, Admin, Residente).", "PENDIENTE", "extra='forbid' en Pydantic inputs."],
        ["[   ] 1.8", "Endpoints MVP V1 (Master/Admin/Res)", "APIs REST para carga de gastos, aprobación de pagos, estados de cuenta y circulares.", "PENDIENTE", "Testing con pytest-asyncio."]
    ]
    create_phase_table(table_headers, fase1_data, table_widths)

    # ---------------- FASE 2 ----------------
    style_heading(doc.add_paragraph(), "FASE 2: PORTAL WEB DEL ADMINISTRADOR (React 18 + TypeScript + Tailwind)", level=2)
    fase2_data = [
        ["[   ] 2.1", "Inicialización de Arquitectura Web", "Proyecto React + Vite + TypeScript con tipado estricto y Tailwind CSS configurado.", "PENDIENTE", "Directorio frontend-admin-web listo."],
        ["[   ] 2.2", "Interceptor Axios HTTP 402 & Tenant", "Inyección automática de X-Tenant-ID y modal bloqueante de licencia vencida ante 402.", "PENDIENTE", "Botón directo a pasarela de renovación."],
        ["[   ] 2.3", "Internacionalización react-i18next", "Configuración bilingüe (ES/EN) con namespaces comunes, edificios y finanzas.", "PENDIENTE", "Selector de idioma en barra superior."],
        ["[   ] 2.4", "Vista de Portafolio de Edificios", "Cards interactivas con badges de licencia (Activo, Gracia, Suspendido, Demo) y métricas.", "PENDIENTE", "Componente BuildingCard densa en datos."],
        ["[   ] 2.5", "Selector Global de Divisas", "Toggle superior USD / EUR / Moneda Local con conversión de balances en tiempo real.", "PENDIENTE", "Cálculo instantáneo con tasas backend."],
        ["[   ] 2.6", "Módulos Financieros y Juntas", "Paneles de Carga de Gastos, Conciliación de Pagos, Alícuotas y Gestión de Juntas.", "PENDIENTE", "Tablas con exportación y filtros."]
    ]
    create_phase_table(table_headers, fase2_data, table_widths)

    # ---------------- FASE 3 ----------------
    style_heading(doc.add_paragraph(), "FASE 3: APLICACIÓN MÓVIL DEL RESIDENTE CON MODO SENIOR (Flutter)", level=2)
    fase3_data = [
        ["[   ] 3.1", "Inicialización Flutter Sound Null-Safety", "Proyecto Flutter 3.x con Riverpod/BLoC y Dio configurado con interceptores de tenant.", "PENDIENTE", "Directorio mobile-app-flutter listo."],
        ["[   ] 3.2", "Motor de Accesibilidad Radical", "AccessibilityScaler dinámico (100% a 200%). Fuentes base >= 20px en Modo Senior.", "PENDIENTE", "Control deslizante para personas mayores."],
        ["[   ] 3.3", "Tokens de Contraste Extremo (WCAG AAA)", "Paleta oscura profunda (#070B14, #11192C) con textos en blanco puro y acentos cian/oro.", "PENDIENTE", "Botones de acción táctil >= 80dp."],
        ["[   ] 3.4", "Botón Sagrado 1: Consultar Cuenta", "Saldo neto gigante, desglose del recibo del mes y botón para adjuntar transferencia.", "PENDIENTE", "Cero confusión para adultos mayores."],
        ["[   ] 3.5", "Botón Sagrado 2: Reportar Falla", "Módulo de reporte con asistente de voz integrado (Speech-to-Text) y campo ampliado.", "PENDIENTE", "Reporte asistido o directo."],
        ["[   ] 3.6", "Botón Sagrado 3: Ver Circulares", "Avisos de junta en tarjetas legibles con función de lectura en voz alta (Text-to-Speech).", "PENDIENTE", "Comunicaciones oficiales claras."],
        ["[   ] 3.7", "Internacionalización Flutter ARB", "Archivos app_es.arb y app_en.arb sincronizados mediante AppLocalizations.", "PENDIENTE", "Cero textos en duro en widgets."]
    ]
    create_phase_table(table_headers, fase3_data, table_widths)

    # ---------------- FASE 4 ----------------
    style_heading(doc.add_paragraph(), "FASE 4: MASTER PANEL SAAS, PRUEBAS DE ESTRÉS Y BLINDAJE DE ESCALA (1M+)", level=2)
    fase4_data = [
        ["[   ] 4.1", "Master Panel SuperAdmin SaaS", "Panel global administrado por nosotros para ver métricas, cobro de licencias y edificios.", "PENDIENTE", "Monitoreo global del ecosistema."],
        ["[   ] 4.2", "Auditoría de Inviolabilidad Multi-Tenant", "Pruebas automáticas de penetración para asegurar que ningún edificio vea datos de otro.", "PENDIENTE", "Verificación estricta de RLS."],
        ["[   ] 4.3", "Pruebas de Estrés y Carga Masiva (1M+)", "Simulación de alta concurrencia con Locust / k6 validando PgBouncer y Redis.", "PENDIENTE", "Latencia sub-100ms en endpoints críticos."],
        ["[   ] 4.4", "Despliegue y Orquestación Docker", "Dockerfiles de producción, docker-compose para staging y configuración para Kubernetes.", "PENDIENTE", "Servicios 100% stateless."]
    ]
    create_phase_table(table_headers, fase4_data, table_widths)

    # -------------------------------------------------------------
    # SECCIÓN 3: BITÁCORA DE CONTROL DE AVANCE Y DECISIONES EJECUTIVAS
    # -------------------------------------------------------------
    style_heading(doc.add_paragraph(), "3. BITÁCORA DE CONTROL DE AVANCE Y DECISIONES EJECUTIVAS", level=1)
    
    b_desc = doc.add_paragraph()
    b_desc.paragraph_format.space_before = Pt(2)
    b_desc.paragraph_format.space_after = Pt(8)
    r_bdesc = b_desc.add_run(
        "Utilice esta sección para registrar cronológicamente las decisiones ejecutivas, "
        "autorizaciones de cambio, hitos alcanzados o directivas acordadas durante el desarrollo del proyecto:"
    )
    r_bdesc.font.name = "Arial"
    r_bdesc.font.size = Pt(10)
    r_bdesc.font.color.rgb = RGBColor(51, 65, 85)

    log_headers = ["Fecha", "Hito / Módulo", "Decisión / Nota Ejecutiva de Alfredo R. Martínez", "Autorizado Por", "Firma / Estado"]
    log_widths = [Inches(1.0), Inches(1.5), Inches(2.7), Inches(1.1), Inches(0.8)]
    
    log_data = [
        ["10/10/2026", "Identidad y Dominio", "Se define TEPUYNEXUS.COM como dominio oficial y TEPUYNEXUS.AI como nombre de producto. Correo oficial definido.", "A. Martínez", "CERRADO"],
        ["10/10/2026", "Landing Page Comercial", "Se aprueba diseño web con paleta oscura, emblema corporativo, simulador interactivo y logos transparentes.", "A. Martínez", "CERRADO"],
        ["10/10/2026", "Directivas de Misión Crítica", "Se incorporan en AGENTS.md y context.md: Transparencia Radical ante Errores y Cimientos para 1M+ Usuarios.", "A. Martínez", "CERRADO"],
        ["  /  /2026", "Backend FastAPI MVP", "Aprobación de modelos SQLAlchemy y políticas PostgreSQL RLS.", "A. Martínez", "PENDIENTE"],
        ["  /  /2026", "Portal Admin React", "Aprobación de vista de tarjetas de edificios y selector multimoneda.", "A. Martínez", "PENDIENTE"],
        ["  /  /2026", "App Móvil Modo Senior", "Validación del escalador tipográfico y navegación con 3 botones sagrados.", "A. Martínez", "PENDIENTE"],
        ["  /  /2026", "[Escriba aquí]", "[Espacio disponible para escribir nuevas decisiones y avances]", "A. Martínez", "[  ]"]
    ]
    
    create_phase_table(log_headers, log_data, log_widths)
    
    # -------------------------------------------------------------
    # SECCIÓN 4: PROTOCOLO ANTE CONTINGENCIAS (RECORDATORIO PERMANENTE)
    # -------------------------------------------------------------
    style_heading(doc.add_paragraph(), "4. PROTOCOLO OPERATIVO ANTE CONTINGENCIAS O ERRORES", level=1)
    
    add_callout(
        doc,
        "PASOS OBLIGATORIOS SI SURGE UN PROBLEMA TÉCNICO O EVENTUALIDAD:",
        "1. Detener de inmediato cualquier operación destructiva o modificación a ciegas.\n"
        "2. Redactar el reporte de causa raíz e impacto real sin omitir ni maquillar detalles.\n"
        "3. Presentar a Alfredo R. Martínez las alternativas con sus pros y contras.\n"
        "4. Preguntar explícitamente: '¿Cuál camino autoriza usted a seguir?'.\n"
        "5. Proceder únicamente tras recibir la decisión ejecutiva formal.",
        border_color="D97706", # Amber 600
        bg_color="FFFBEB"
    )

    return doc

if __name__ == "__main__":
    output_path = r"c:\IA_Proyectos\NEXUSAI\TEPUY_CONDO_NEXUS_Plan_Maestro_Paso_a_Paso.docx"
    doc = create_document()
    doc.save(output_path)
    print(f"Documento generado exitosamente en: {output_path}")

