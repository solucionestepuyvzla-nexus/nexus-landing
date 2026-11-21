# AGENTS.MD — PROTOCOLO OPERACIONAL & GUÍA DE DESARROLLO PARA AGENTES E INGENIEROS
**Proyecto:** TEPUY CONDO NEXUS (SaaS Multi-Tenant de Administración de Condominios)  
**Audiencia:** Agentes de Inteligencia Artificial, Desarrolladores Senior, Revisores de Código y DevOps  
**Premisa Central:** Cero Tolerancia a la Deuda Técnica, Seguridad No Negociable y Blindaje Anti-Mala Praxis  

---

## 1. PRINCIPIOS DE INGENIERÍA FUNDAMENTALES

Todo agente o desarrollador que genere, modifique o audite código en este repositorio debe acatar estrictamente las siguientes directivas:

1. **PROHIBICIÓN TOTAL DE PLACEHOLDERS O CÓDIGO INCOMPLETO:**  
   Queda terminantemente prohibido dejar bloques comentados con `// TODO: implementar más tarde`, `...`, `pass`, o stubs que no cumplan la lógica de negocio completa.
2. **TIPADO ESTRICTO Y VERIFICACIÓN ESTÁTICA:**  
   * **Python:** `mypy --strict` obligatorio en todo `backend-fastapi/`. Prohibido el uso de `Any`.
   * **TypeScript:** `strict: true` y `noImplicitAny: true` en `frontend-admin-web/`.
   * **Dart:** Modo `sound null-safety` con linter estricto en `mobile-app-flutter/`.
3. **PRECISIÓN FINANCIERA ABSOLUTA:**  
   * **PROHIBIDO EL USO DE `float`** para representar dinero en backend, frontend o móvil.
   * Utilizar exclusivamente `Decimal` con redondeo bancario (`ROUND_HALF_EVEN`) y campos `Numeric(18, 4)` en base de datos.
4. **BLINDAJE MULTI-TENANT POR DEFECTO:**  
   Cualquier consulta que acceda a entidades de un condominio debe estar filtrada obligatoriamente por el `building_id` contextual. Ningún endpoint debe confiar en parámetros enviados arbitrariamente por el cliente en el body.
5. **TRANSPARENCIA RADICAL, SINCERIDAD TOTAL Y REPORTE DE INCIDENTES (REGLA DE ORO):**  
   Si ocurre cualquier error técnico, comportamiento anómalo inesperado, inconsistencia o amenaza/evento de pérdida o corrupción de datos: **QUEDA ROTUNDAMENTE PROHIBIDO OCULTARLO, MAQUILLARLO O APLICAR PARCHES SILENCIOSOS**. El agente o desarrollador debe detener la marcha, reportar con franqueza técnica absoluta e inmediata lo sucedido a Alfredo R. Martínez (CEO), explicar el impacto real, las causas raíz y las alternativas disponibles, y **preguntar SIEMPRE qué camino tomar antes de proceder**. La verdad sin filtros es condición obligatoria para la toma de decisiones ejecutivas oportunas.
6. **CONSTRUCCIÓN SÓLIDA PARA ESCALA DE 1.000.000+ DE USUARIOS (PROHIBIDO EL "LUEGO SE CAMBIA"):**  
   Este ecosistema está concebido desde su concepción para operar con más de **1,000,000 de usuarios concurrentes**. Queda estrictamente prohibida la mentalidad de "hagamos un atajo provisorio y luego lo cambiamos". Las bases de datos, pooling de conexiones, indexación, diseño de APIs stateless, concurrencia asíncrona y seguridad deben construirse sólidas, desacopladas y de calidad de misión crítica desde el primer momento.
7. **ESTÁNDAR VISUAL EJECUTIVO ULTRA-SOBRIO (CERO TOLERANCIA A ESTÉTICA GAMER O ARCADES):**  
   Toda interfaz del ecosistema (web y móvil) debe proyectar el más alto nivel de sobriedad, lujo tecnológico y prestigio corporativo (estilo banca privada suiza / Wealth Management moderno). Queda **estrictamente prohibido** el uso de colores chillones/fosforescentes, bordes gruesos de fantasía (2.5dp–3.0dp tipo arcade), resplandores neón o composiciones visuales de corte gamer.  
   * **Paleta Fiduciaria Oficial:** Fondos en Obsidiana y Pizarra Oscura (`#0B0F17`, `#131B2A`, `#182234`). Bordes arquitectónicos delgados y sutiles en Pizarra Estructurada (`#26334D`, de 1.0dp a 1.2dp máximo).  
   * **Tipografía y Alto Contraste:** Textos principales en Marfil de Alta Visibilidad (`#F8FAFC`, `#E2E8F0`, `#94A3B8`).  
   * **Acentos Institucionales Mate:** Azul Zafiro Bancario (`#2563EB` / `#3B82F6`), Esmeralda Fiduciaria (`#10B981` / `#059669`), Ámbar Corporativo (`#F59E0B` / `#D97706`), Rosa Alerta (`#EF4444`).  
   * **Consistencia Global:** Este estándar aplica sin excepciones a todas las pantallas, sub-pantallas, modales, hojas inferiores (bottom sheets) y diálogos del ecosistema.
8. **PRINCIPIO DEL ORGULLO DE INGENIERÍA, CERO HARDCODEO Y DINAMISMO TOTAL (EL ESTÁNDAR ALFREDO R. MARTÍNEZ):**  
   Este ecosistema fiduciario no tolera mediocridad, atajos ni soluciones cosmetológicas que avergüencen al equipo ante clientes, auditores o inversores internacionales. Cada línea de código debe suscitar genuino orgullo profesional.  
   * **Prohibición Total de Textos Quemados (Zero Hardcoded Strings):** Queda terminantemente prohibido escribir cadenas fijas en español, inglés o cualquier idioma directamente en componentes JSX/TSX de React, en widgets de Flutter o en excepciones `HTTPException(detail="...")` de FastAPI. Todo texto visible o devuelto por la API **debe resolverse forzosamente mediante el sistema de internacionalización** (`t('...')` en Web, `AppLocalizations.of(context)` en Flutter, y catálogo de traducciones i18n con cabecera `Accept-Language` en FastAPI). La presencia de un texto quemado es un defecto crítico de calidad que bloquea la aprobación de cualquier entrega.  
   * **Parametrización Dinámica Obligatoria (Cero Enums Rígidos para Lógica de Negocio):** Los roles y permisos del sistema no pueden quedar atrapados en Enums estáticos de base de datos o bifurcaciones condicionales duras (`if role == '...'`). La arquitectura debe fundamentarse en un modelo **PBAC/RBAC Dinámico (Permission-Based Access Control)** con tablas de permisos atómicos (`permissions`), roles dinámicos (`roles`), asignación cruzada (`role_permissions`) y una **Pantalla de Administración de Perfiles** para que el SuperAdmin pueda crear roles y conceder permisos mediante casillas de verificación (checkboxes) sin tocar una línea de código ni desplegar nuevas versiones.  
   * **La Pregunta de Oro del Ingeniero:** Antes de dar por concluida cualquier tarea, el agente o ingeniero debe responderse con sinceridad técnica absoluta: *«¿Nos sentimos profundamente orgullosos de poner este software en producción ante la banca suiza y el mercado global?»*. Si la respuesta es negativa debido a atajos, cadenas quemadas o falta de parametrización, el trabajo **NO está terminado** y debe rehacerse con estándar de excelencia.

---

## 2. DIRECTIVAS ESPECÍFICAS POR COMPONENTE

### 2.1 Backend (`backend-fastapi`)

* **Ubicación:** `c:\IA_Proyectos\NEXUSAI\backend-fastapi`
* **Pila Tecnológica:** Python 3.11+, FastAPI, SQLAlchemy 2.0 (Async), Pydantic v2, PostgreSQL 16, asyncpg, Redis 7.

#### A. Manejo de Multi-Tenancy y Licencias (HTTP 402)
* Toda ruta perteneciente a `/api/v1/admin/` o `/api/v1/resident/` está sujeta a la intercepción del `TenantLicenseMiddleware`.
* **Regla Inviolable:** Si la licencia del edificio está en estado `SUSPENDED`, `CANCELLED` o `license_expires_at < now_utc()`, el sistema **debe abortar la petición y retornar HTTP 402 Payment Required** con el cuerpo estructurado de resolución.
* Al iniciar una transacción en PostgreSQL, la sesión debe fijar la variable de entorno de sesión:
  ```python
  await session.execute(
      text("SET LOCAL app.current_tenant_id = :tenant_id"),
      {"tenant_id": str(active_tenant_id)}
  )
  ```

#### B. Internacionalización (i18n) en Backend
* Los errores no deben escribirse como cadenas fijas en español o inglés dentro de los controladores.
* Deben ser resueltos a través de la función `get_translated_message(key: str, locale: str, **kwargs)`.
* Ejemplo de uso:
  ```python
  raise BusinessException(
      code="INSUFFICIENT_FUNDS",
      detail=i18n.translate("errors.insufficient_funds", locale=user_locale, balance=balance)
  )
  ```

#### C. Motor Multi-Moneda
* Toda transacción de cobro o gasto debe almacenar:
  1. La moneda original (`currency_original`).
  2. El monto en la moneda original (`amount_original`).
  3. La tasa de cambio oficial de la fecha (`exchange_rate_applied`).
  4. La fuente oficial de la tasa (`rate_source`).
  5. El monto normalizado en moneda base (`amount_base_usd`).

---

### 2.2 Portal Web del Administrador (`frontend-admin-web`)

* **Ubicación:** `c:\IA_Proyectos\NEXUSAI\frontend-admin-web`
* **Pila Tecnológica:** React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, react-i18next, Axios.

#### A. Intercepción Global de HTTP 402
* El cliente HTTP Axios centralizado en `src/services/apiClient.ts` debe interceptar respuestas con status `402`:
  * No mostrar una pantalla en blanco o error genérico.
  * Desplegar un modal bloqueante que explique el motivo de la suspensión del edificio y provea el botón directo a la pasarela de renovación de licencia.
  * Inyectar automáticamente la cabecera `X-Tenant-ID` en cada solicitud saliente desde el estado activo de `TenantContext`.

#### B. Directivas de Internacionalización (i18n)
* Ningún componente debe renderizar texto visible que no pase por el hook `useTranslation()` de `react-i18next`.
* Mantener sincronizados los diccionarios `locales/es/*.json` y `locales/en/*.json`. Si se crea una clave en español, debe existir su contraparte obligatoria en inglés.

#### C. Visualización de Monedas Dinámicas
* Proveer en la barra superior un selector global de visualización de divisas (`USD`, `EUR`, `Moneda Local`).
* Al alternar la divisa, todas las tablas de finanzas deben recalcular su equivalencia en tiempo real utilizando la tasa provista por el backend.

---

### 2.3 Aplicación Móvil del Residente (`mobile-app-flutter`)

* **Ubicación:** `c:\IA_Proyectos\NEXUSAI\mobile-app-flutter`
* **Pila Tecnológica:** Flutter 3.x, Dart 3.x, Riverpod / BLoC, Dio, flutter_localizations.

#### A. MODO SENIOR & ACCESIBILIDAD RADICAL CON ESTÁNDAR EJECUTIVO (NO NEGOCIABLE)
* **Población Objetivo:** Propietarios y residentes (incluyendo adultos mayores) que exigen máxima legibilidad, navegación intuitiva y una experiencia visual de alto nivel corporativo.
* **Reglas de Diseño:**
  1. **Tipografía Dinámica Jerárquica:**
     * **Textos Principales y Encabezados:** Deben calcularse mediante `AccessibilityScaler.scaleFontSize(baseSize)`.
       $$\text{fontSizeEffective} = \text{fontSizeBase} \times \text{textScaleFactor}$$
       En Modo Senior activo, la base de lectura principal no debe ser inferior a **20.0 logical pixels**.
     * **Micro-Badges, Tags de Estado y Metadatos:** Deben calcularse obligatoriamente mediante `AccessibilityScaler.scaleMicroFontSize(baseSize)` (restringido en rango `clamp(10.0, 16.0)`). Esto previene desbordamientos de pantalla (overflows), deformaciones de chips o botones "inflados" desproporcionadamente.
  2. **Contraste Extremo y Elegancia Arquitectónica (WCAG AAA sin Neones):**
     * Textos principales siempre en `#FFFFFF` / `#F8FAFC` sobre fondos oscuros `#0B0F17` y contenedores pizarra `#131B2A`.
     * Bordes arquitectónicos delgados y precisos (`#26334D`, 1.0dp a 1.2dp). Prohibido terminantemente el uso de resplandores exteriores, halos fluorescentes y bordes gruesos gamer de 2.5dp–3.0dp.
     * Identificación cromática sobria y funcional (estilo banca privada):
       - **Consultar Cuenta:** Contenedor pizarra con acento Azul Zafiro Bancario (`#2563EB` / `#3B82F6`).
       - **Reportar Falla:** Contenedor pizarra con acento Ámbar Corporativo Mate (`#F59E0B` / `#D97706`).
       - **Ver Circulares:** Contenedor pizarra con acento Titanio / Zafiro (`#26334D` / `#3B82F6`).
  3. **Los 3 Botones Sagrados:**  
     La pantalla principal del residente debe contener exclusivamente los 3 accesos prioritarios:
     * **[1. CONSULTAR CUENTA]**
     * **[2. REPORTAR FALLA]** (Con asistente de dictado por voz y entrada directa).
     * **[3. VER CIRCULARES]**
  4. **Área Táctil Extensa:** Ningún botón de acción primaria puede tener una altura inferior a **80dp**.
  5. **Consistencia Universal en Pantallas Navegables:**  
     Todas las vistas secundarias (Saldos de Cuenta, Reporte de Falla, Detalle de Circulares y Avisos, Modales de Confirmación y Bottom Sheets) deben mantener exactamente la misma sobriedad visual ejecutiva. Si un elemento requiere máxima prioridad (como un comunicado urgente), se destacará mediante un micro-badge sobrio (`! PRIORITARIO`) y fondos estructurados, jamás con recuadros neón chillones.

#### B. Internacionalización en Flutter
* Toda cadena debe estar registrada en `lib/l10n/app_es.arb` y `lib/l10n/app_en.arb`.
* El acceso a las cadenas se hace estrictamente a través de `AppLocalizations.of(context)!.<clave>`.

---

## 3. CHECKLIST DE SEGURIDAD PARA REVISIÓN DE CÓDIGO (ANTI-JUNIOR)

Antes de fusionar o aprobar cualquier Pull Request o cambio de código, verificar:

- [ ] **Aislamiento de Inquilino:** ¿La consulta a la base de datos incluye `building_id = current_tenant_id` o depende del RLS activo?
- [ ] **Validación de Licencia:** ¿Se probó qué ocurre si el edificio tiene la licencia vencida? (Debe retornar HTTP 402).
- [ ] **Tipado de Monedas:** ¿Los cálculos monetarios usan `Decimal` en lugar de `float`?
- [ ] **Paridad de Traducciones:** ¿Se incluyeron los textos en `es` y `en` simultáneamente?
- [ ] **Escalabilidad Visual & Anti-Overflow:** En Flutter, ¿los textos crecen limpiamente sin desbordar la pantalla al subir el escalador al 200%? ¿Se utilizó `scaleMicroFontSize` en micro-badges, tags y chips de estado para prevenir desbordamientos?
- [ ] **Sobriedad Visual Ejecutiva:** ¿Se verificó que ninguna vista, tarjeta o botón utilice bordes neón, halos fosforescentes o colores estridentes estilo gamer? ¿Se adhiere estrictamente a la paleta fiduciaria de banca privada?
- [ ] **Consistencia en Flujos Secundarios:** ¿Las pantallas de detalle, diálogos, modales y hojas inferiores respetan el mismo estándar visual sobrio y elegante que la pantalla de inicio?
- [ ] **Inyección de Dependencias:** ¿Las credenciales, llaves secretas y tokens se leen de variables de entorno y no están quemadas en el código fuente?
- [ ] **Validación de Entrada (Input Sanitization):** ¿Los esquemas Pydantic tienen `extra = 'forbid'` para evitar asignación masiva de campos privilegiados?
- [ ] **Transparencia e Integridad de Datos:** En caso de fallas imprevistas, errores de migración o estados inconsistentes, ¿se detuvo la operación y se consultó a Alfredo R. Martínez antes de intentar reparaciones a ciegas?
- [ ] **Escalabilidad para 1M+ Usuarios:** ¿Se evitaron consultas N+1, bloqueos de tabla pesados y operaciones I/O síncronas? ¿La solución fue construida sólida y definitiva sin parches o "TODOs" diferidos?

---

## 4. COMANDOS OPERACIONALES CLAVE

### Backend (FastAPI)
```bash
# Entorno virtual y dependencias
cd backend-fastapi
poetry install --no-root

# Ejecutar migraciones
alembic upgrade head

# Servidor de desarrollo
uvicorn src.main:app --reload --port 8000
```

### Frontend (React Admin)
```bash
cd frontend-admin-web
npm install
npm run dev
```

### Mobile (Flutter)
```bash
cd mobile-app-flutter
flutter pub get
flutter gen-l10n
flutter run
```

---

## 5. HITOS OPERACIONALES CONSOLIDADOS (ESTADO DEL ECOSISTEMA - OCTUBRE 2026)

Cualquier agente o ingeniero que retome este proyecto debe considerar como línea base los siguientes componentes levantados y verificados:

1. **Portal Web Administrativo (`frontend-admin-web`):**
   * Desplegado en Docker (`tepuy_frontend_admin`) en puerto 5173 ([http://localhost:5173](http://localhost:5173)).
   * Cumplimiento estricto de la Paleta Fiduciaria de Banca Privada Suiza: Obsidiana `#0B0F17`, Pizarra `#131B2A`, bordes `#26334D` (1.0px) y textos Marfil `#F8FAFC`.
   * Enrutamiento interno por hash (`#portfolio`, `#workspace?tab=...`) con inyección contextual de `X-Tenant-ID` en Axios.
   * `AuthContext` sincronizado con bandera `isReady` para prevenir consultas antes de la hidratación del token JWT.

2. **Backend Asíncrono (`backend-fastapi`):**
   * Ejecución saludable en Docker (`tepuy_backend`) en puerto 8000 ([http://localhost:8000](http://localhost:8000)).
   * Solución definitiva de precedencia de middlewares para preflights `OPTIONS` (CORS como envoltura externa en `main.py`).
   * Verificación de la máquina de estados de licencias fiduciarias (`TenantLicenseMiddleware`).

3. **Base de Datos y Seguridad (`tepuy_condo_db` en PostgreSQL 16):**
   * Integridad fiduciaria: conciliación de pagos con auditoría de firmas criptográficas HMAC SHA-256.
   * Aislamiento por edificio con RLS activado.

4. **App Móvil de Copropietarios (`mobile-app-flutter`):**
   * Ejecutándose de forma estable en emulador Android (`emulator-5554`).
   * Blindaje anti-desbordamientos (overflows) en Modo Senior al 200% mediante `scaleMicroFontSize` en tags, chips y micro-badges.
   * Erradicación completa de marcos neón / estética gamer en todas las pantallas navegables (Inicio, Estado de Cuenta, Mesa de Averías, Circulares y Avisos) reemplazados por micro-badges ejecutivos (`! PRIORITARIO`).
   * Sincronización bidireccional en caliente verificada entre el Web Admin y la app móvil.

5. **Conciliación Fiduciaria y Liquidación Contable Bidireccional:**
   * Endpoint `PATCH /api/v1/admin/payments/{id}/verify` con imputación cronológica atómica sobre deudas de alícuotas (`AliquotDebt`) en PostgreSQL.
   * Auditoría de pagos con sellos criptográficos HMAC SHA-256.
   * Sincronización en caliente verificada entre Backend, Web Admin (`tepuy_frontend_admin`) y la App Móvil Flutter (`emulator-5554`), actualizando en tiempo real el saldo deudor a $0.00 USD / Bs. 0.00 VES y el badge de solvencia a `SOLVENTE`.

6. **Mesa de Averías e Incidencias — Ciclo Completo Bidireccional:**
   * Navegación dual en app móvil (`[+ NUEVA INCIDENCIA]` con transcripción de voz asistida y `[MIS REPORTES]` con conteo en vivo).
   * Generación y transmisión de incidencia con alta urgencia y audio adjunto hacia el Backend y Web Admin.
   * Recepción en tiempo real en el Portal Administrativo (`tepuy_frontend_admin`), visualización de ficha técnica y ejecución de resolución (`PATCH /api/v1/admin/failure-reports/{id}/resolve?is_resolved=true`).
   * Sincronización instantánea confirmada en app móvil Flutter (`emulator-5554`), transitando la tarjeta de `EN ATENCIÓN` a `RESUELTA` (Esmeralda Fiduciaria `#10B981`) con cero errores en `flutter analyze`.

7. **Autenticación Multi-Tenant y Conmutación de Inquilinos en App Móvil (Octubre 2026):**
   * Pantalla de login corporativa con estándar bancario suizo (`#0B0F17`, `#131B2A`, micro-badges `10-16px` y botones `80dp`).
   * Limpieza atómica de caché y aislamiento de tokens JWT en conmutación de usuarios entre edificios diferentes.
   * Verificación en vivo en emulador Android (`emulator-5554`):
     - Inquilino 1: Carlos Mendoza (`residente@tepuynexus.com`), Residencias Tepuy Royal, Apto 1-A (Alícuota 5.25%).
     - Inquilino 2: Dra. Elena Rostova (`elena@tepuynexus.com`), Condominio Mirador del Bosque, Apto 4-B (Alícuota 6.50%).
   * Refuerzo dinámico de alícuotas y títulos contextuales en backend y móvil con `flutter analyze` en 0 errores.

8. **Segregación Estricta de Roles en Backend y Web Admin (Paso B Consolidado - Octubre 2026):**
   * **Backend Asíncrono (`backend-fastapi`):**
     - Nuevo rol fiduciario `ANALISTA_VENTAS` en enum PostgreSQL y SQLAlchemy.
     - 3 cuentas administrativas fiduciarias en `admin_users` con Argon2id: `SUPERADMIN` (Alfredo R. Martínez), `ANALISTA_VENTAS` (Valeria Gómez), `ADMIN_EDIFICIO` (Ing. Roberto Méndez).
     - Dependencias de seguridad granular: `require_tenant_admin` (restringe a `ADMIN_EDIFICIO` estrictamente a sus edificios con HTTP 403 ante acceso cruzado) y `require_condo_operator` (bloquea a `ANALISTA_VENTAS` de pagos y finanzas internas).
     - Rutas `/master/metrics` y `/master/buildings/{id}/license` protegidas para SuperAdmin y Ventas.
   * **Portal Web Administrativo (`frontend-admin-web`):**
     - Pantalla de inicio de sesión institucional (`AdminLoginScreen`) con selectores rápidos de 1-clic para los 3 perfiles.
     - Consola de Licencias SaaS (`SalesLicenseConsole`) con KPIs maestros, extensión de vigencia (+30d), suspensión HTTP 402 y vista protegida sin acceso a balances privados.
     - Inyección contextual de vistas según rol: `SUPERADMIN` (Vista global, consola de licencias y workspace operativo), `ANALISTA_VENTAS` (Consola de licencias comercial exclusiva), `ADMIN_EDIFICIO` (Aterrizaje directo en el workspace de su condominio asignado).
     - Conmutador rápido de roles en la barra superior para auditoría instantánea en 1 clic.
     - Compilación limpia con 0 errores en `npm run build` (`tsc && vite build`) y desplegado en `tepuy_frontend_admin`.

9. **Landing Page Corporativa SaaS B2B y Bandeja Comercial de Inbound Leads (Paso C Consolidado - Noviembre 2026):**
   * **Vitrina Institucional y Comercial (`frontend-admin-web`):**
     - Desarrollada bajo la Paleta Fiduciaria de Banca Privada Suiza (`#070B14`, `#0B0F17`, `#131B2A`, `#182234`, bordes arquitectónicos `#26334D` de 1.0px a 1.2px, tipografía Marfil `#F8FAFC`).
     - **Hero Section Corporativo:** Estándar bancario suizo, 4 métricas fiduciarias clave (1.000.000+ usuarios, Cero Fuga RLS, 99.99% SLA, 3 Divisas en tiempo real), botones de acción directa y selector de divisas (USD/EUR/VES) y lenguaje (ES/EN).
     - **Los 4 Pilares Tecnológicos:** Backend Asíncrono (Python/FastAPI/asyncpg), Base de Datos Fiduciaria RLS (PostgreSQL 16), Portal Web Multi-Rol (React/TypeScript Strict) y App Móvil con 'Modo Senior' (Flutter/Dart Sound Null-Safety).
     - **Matriz de Planes Fiduciarios:** Básico ($20-$25/mes), Profesional ($60-$75/mes, consorcios), Enterprise ($144-$180/mes, ilimitado) con conmutador mensual/anual (-20% ahorro corporativo).
     - **Calculadora Dinámica de Licencias:** Controles deslizantes para unidades habitacionales (10 a 1.200) y edificios (1 a 15), desglose financiero en tiempo real (tarifa base, costo marginal por unidad, bonificación anual, costo mensual por apartamento) y botón de transferencia de datos con un clic al formulario de contacto.
     - **Formulario B2B con Folio Criptográfico:** Validación estricta de prospectos corporativos, transmisión asíncrona a `POST /api/v1/master/leads`, generación de folio fiduciario único (`NX-B2B-YYYY-XXXXXX`) y tarjeta ejecutiva de confirmación con copiado al portapapeles.
     - **Pie de Página Institucional:** Certificaciones de seguridad (RLS PostgreSQL 16, TLS 1.3 / AES-256, HMAC SHA-256), contacto comercial corporativo y autoría fiduciaria de Alfredo R. Martínez.
   * **Backend Asíncrono (`backend-fastapi`):**
     - Modelo relacional `SalesLead` en `src/domain/models.py` y esquemas Pydantic v2 en `src/schemas/schemas.py`.
     - Endpoint público `POST /api/v1/master/leads` con generación criptográfica de folios fiduciarios.
     - Endpoints protegidos `GET /api/v1/master/leads` y `PATCH /api/v1/master/leads/{id}/status` para gestión de prospectos de SuperAdmin y Analista de Ventas.
   * **Consola Comercial de Licencias (`SalesLicenseConsole.tsx`):**
     - Pestaña integrada de "Prospectos B2B (Inbound)" con tabla fiduciaria de solicitudes, métricas en vivo, folio copiable, información de contacto y selector dinámico de estado (`NUEVO`, `CONTACTADO`, `DEMO_AGENDADA`, `CONVERTIDO`, `DESCARTADO`).
     - Compilación limpia con 0 errores TypeScript (`npm run build`), paridad i18n al 100% en `es.json` y `en.json`, y verificación visual fotográfica completa.

---

## 6. ANÁLISIS FORENSE DE DEUDA TÉCNICA: LO QUE FALTA PARA EL ESTÁNDAR DE EXCELENCIA Y CERO HARDCODEO (OCTUBRE 2026)

Por mandato directo de Alfredo R. Martínez (CEO) y en cumplimiento estricto del **Principio del Orgullo de Ingeniería (Regla 8)**, se presenta la radiografía técnica sin filtros de los componentes que hoy presentan deuda técnica oculta, los cuales deben ser subsanados para alcanzar el nivel de banca privada internacional:

### 6.1 Auditoría de Roles y Permisos: Del Enum Rígido al PBAC Dinámico
* **Estado Actual (Deuda Crítica):**
  - Los roles residen como un tipo estático en PostgreSQL: `CREATE TYPE userrole AS ENUM ('SUPERADMIN', 'ANALISTA_VENTAS', 'ADMIN_EDIFICIO', 'RESIDENTE', 'CONSERJE')`.
  - El backend evalúa acceso con validaciones estáticas (`if admin.role not in [UserRole.SUPERADMIN, ...]: raise HTTPException(403)`).
  - El frontend evalúa vistas bifurcando con cadenas fijas (`admin?.role === 'ANALISTA_VENTAS'`).
  - **Dictamen:** Hoy es imposible crear un nuevo rol (ej. "Auditor Fiscal", "Junta de Condominio", "Gerente de Operaciones") desde una pantalla sin alterar el esquema SQL, el código Python y el frontend. Esto viola el principio de parametrización fiduciaria.
* **Arquitectura de Solución Requerida (PBAC - Permission-Based Access Control):**
  1. **Tablas Relacionales Dinámicas:**
     - `auth_permissions`: `id`, `code` (ej. `saas.licenses.manage`, `finances.payments.verify`, `failures.reports.resolve`), `category`, `description`.
     - `auth_roles`: `id`, `name`, `description`, `is_system_role` (booleano para proteger roles core), `tenant_id` (nullable, permite roles globales o específicos de un edificio).
     - `auth_role_permissions`: tabla puente (`role_id`, `permission_id`).
     - `admin_user_roles`: asignación (`admin_id`, `role_id`).
  2. **Decorador / Dependencia FastAPI:**
     - Sustituir `require_role(...)` por `require_permission(permission_code: str)`.
     - El token JWT contendrá la lista de permisos efectivos o se resolverán en caché Redis con TTL de 5 minutos e invalidación atómica.
  3. **Consola Web de Administración de Perfiles:**
     - Pantalla interactiva en Web Admin para SuperAdmin donde se listen los roles, se creen nuevos roles y se marquen mediante casillas de verificación (checkboxes) los módulos y acciones permitidas, impactando la base de datos de inmediato.

---

### 6.2 Auditoría de Internacionalización (i18n): Erradicación Total de Textos Quemados
* **Estado Actual (Deuda Moderada a Alta):**
  - **Backend FastAPI (~40% cumplimiento):** Múltiples excepciones `HTTPException` en controladores y middlewares arrojan mensajes directos en español (ej. `"Token de acceso inválido o expirado"`, `"Credenciales de acceso inválidas"`). Deben migrarse al catálogo i18n con cabecera `Accept-Language`.
  - **Portal Web Admin (~65% cumplimiento):** La librería `react-i18next` está configurada, pero existen textos quemados en español en `BuildingWorkspace.tsx` (encabezados de tablas contables, títulos de comprobantes) y `SalesLicenseConsole.tsx` (etiquetas de métricas y botones de sincronización).
  - **App Móvil Flutter (~70% cumplimiento):** Los archivos `app_es.arb` y `app_en.arb` están definidos, pero se detectaron etiquetas duras en `resident_home_screen.dart` (chips de severidad, títulos fijos) y en `login_screen.dart`.
* **Plan de Erradicación Obligatorio:**
  1. Creación de claves semánticas estructuradas (ej. `errors.auth.invalid_credentials`, `workspace.payments.table.concept`).
  2. Prohibición de merge/commit si una inspección estática detecta literales de texto visibles que no estén envueltos en `t(...)` (React), `AppLocalizations.of(context)` (Flutter) o `get_translated_message(...)` (FastAPI).

---

## 7. PRÓXIMOS PASOS SUGERIDOS PARA DESARROLLO Y AUDITORÍA

Los agentes y desarrolladores deben abordar las siguientes tareas en estricto orden de prioridad técnica:

1. **[CONCLUIDO & VERIFICADO - PASO C] Landing Page Corporativa SaaS B2B de TEPUY CONDO NEXUS:**
   * Vitrina comercial e institucional desplegada con estándar suizo de banca privada.
   * Hero corporativo de alto impacto, 4 pilares tecnológicos, matriz fiduciaria de planes (Básico, Profesional, Enterprise), calculadora dinámica multi-moneda de licencias en tiempo real, formulario B2B con generación de folio criptográfico (`NX-B2B-YYYY-XXXXXX`) y bandeja de prospección integrada en `SalesLicenseConsole`. Cero errores de compilación y verificación visual al 100%.

2. **[PRIORIDAD 1] Módulo Dinámico de Perfiles y Permisos (PBAC / Roles Parametrizables - Mandato Alfredo R. Martínez):**
   * Migración de esquema en PostgreSQL (`auth_permissions`, `auth_roles`, `auth_role_permissions`, `admin_user_roles`).
   * Sembrado inicial de permisos granulares del sistema (finanzas, licencias, incidencias, residentes, auditoría).
   * Sustitución de `require_role(...)` por la dependencia FastAPI `require_permission(...)`.
   * Pantalla de Configuración de Perfiles en Web Admin para SuperAdmin con casillas de verificación (checkboxes) para crear y parametrizar roles en caliente sin tocar una línea de código ni desplegar nuevas versiones.

3. **[PRIORIDAD 2] Erradicación Total de Textos Quemados (i18n 100% Puro en Backend, Web y Flutter):**
   * Barrido exhaustivo y unificación de catálogos bilingües en Backend (`Accept-Language`), Web Admin (`useTranslation`) y App Móvil Flutter (`AppLocalizations`).
   * Paridad absoluta en claves de traducción `es.json` / `en.json` y `app_es.arb` / `app_en.arb`.

4. **[PRIORIDAD 3] Validación de la Barrera Fiduciaria HTTP 402 en Web y Móvil:**
   * Simular la suspensión o vencimiento de licencia de un edificio en PostgreSQL.
   * Confirmar que tanto el Web Admin como la App Móvil intercepten el error 402 y muestren el modal bloqueante con la pasarela de reactivación.

5. **[PRIORIDAD 4] Módulo de Emisión y Prorrateo Masivo de Alícuotas:**
   * Desarrollar el generador de cuotas mensuales de condominio con el motor multi-moneda (USD base vs. moneda local a tasa oficial) y cálculo proporcional por alícuota.

6. **[PRIORIDAD 5] Orquestación Docker Compose Unificada:**
   * Unificar el despliegue de todo el stack (`backend`, `frontend-admin-web`, `postgres`, `redis`, `pgbouncer`) en un único archivo de orquestación con seed de datos iniciales.


