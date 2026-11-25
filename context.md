# CONTEXT.MD — ARQUITECTURA GENERAL DEL ECOSISTEMA TEPUY CONDO NEXUS
**Versión:** 1.0.0-PROD  
**Clasificación:** Documento Arquitectónico Central & Fuente de Verdad (Single Source of Truth)  
**Fecha de Emisión:** Octubre 2026  
**Autores:** Equipo de Arquitectura de Sistemas Distribuidos & Seguridad de Misión Crítica  

---

## 1. VISIÓN DEL PRODUCTO & ALCANCE DEL ECOSISTEMA

**TEPUY CONDO NEXUS** es un ecosistema SaaS empresarial para la administración inteligente, financiera, operativa y comunitaria de condominios residenciales y comerciales.

El sistema está concebido para resolver cuatro desafíos críticos del mercado:
1. **Aislamiento Multi-Tenant Inviolable:** Cada edificio o conjunto residencial representa un inquilino (*tenant*) y una unidad de cobro de licencia independiente.
2. **Accesibilidad Radical ("Modo Senior"):** Adaptación funcional total para copropietarios de la tercera edad mediante tipografía de escala dinámica (mínimo 20px), contraste extremo y reducción cognitiva a tres acciones primarias.
3. **Operación Multi-Moneda Dinámica con Conversión en Tiempo Real:** Capacidad de tasar gastos y deudas en monedas duras (USD, EUR) y conciliar cobros en monedas locales (VES/Bs., COP, MXN, etc.) con trazabilidad estricta de la tasa de cambio y fecha valor.
4. **Internacionalización Nativa (i18n):** Arquitectura bilingüe nativa (Español / Inglés) extensible a nuevos idiomas sin refactorización estructural.

---

## 2. MAPA DE ESTRUCTURA DEL PROYECTO

La base de código está estructurada en tres subdirectorios principales bajo la raíz del proyecto `c:\IA_Proyectos\NEXUSAI`:

```text
c:\IA_Proyectos\NEXUSAI/
│
├── backend-fastapi/                # API REST Asíncrona, Motor Multi-Tenant y Seguridad
│   ├── alembic/                    # Versionado y migraciones de esquemas PostgreSQL
│   ├── src/
│   │   ├── api/
│   │   │   ├── dependencies/       # Inyección de dependencias (DB, Auth, Tenant, Currencies)
│   │   │   ├── middlewares/        # TenantResolver, LicenseEnforcer (HTTP 402), i18n
│   │   │   └── v1/
│   │   │       ├── master/         # Endpoints para el Panel Maestro SaaS
│   │   │       ├── admin/          # Endpoints para Administradores de Edificios
│   │   │       └── resident/       # Endpoints para la App Móvil de Propietarios
│   │   ├── core/
│   │   │   ├── config.py           # Variables de entorno validadas con Pydantic Settings
│   │   │   ├── database.py         # AsyncEngine (asyncpg), Pool y RLS Session
│   │   │   ├── i18n.py             # Motor de localización y catálogos de traducción
│   │   │   ├── security.py         # JWT claims, hashing criptográfico Argon2id
│   │   │   └── currency.py         # Motor de tasas de cambio y conversiones
│   │   ├── domain/
│   │   │   ├── enums.py            # Enumeraciones de estado, moneda, licencias y roles
│   │   │   └── models.py           # Modelos relacionales SQLAlchemy 2.0
│   │   ├── repositories/           # Capa de datos con filtrado obligatorio por tenant_id
│   │   ├── schemas/                # Modelos Pydantic v2 (Input/Output estricto)
│   │   └── services/               # Lógica de negocio pura (Cobranzas, Gastos, Fórmulas)
│   ├── tests/                      # Pruebas unitarias, de integración y de fuga multi-tenant
│   ├── pyproject.toml              # Dependencias de Python
│   └── Dockerfile
│
├── frontend-admin-web/             # Portal Web para Administradores de Condominios
│   ├── src/
│   │   ├── assets/                 # Logotipos, íconos vectoriales y recursos visuales
│   │   ├── components/             # BuildingCard, LicenseBadge, DataGrid, CurrencyToggle
│   │   ├── contexts/               # TenantContext, AuthContext, CurrencyContext
│   │   ├── hooks/                  # useTenants, useFinancialAudit, useCurrencyConverter
│   │   ├── i18n/                   # Configuración react-i18next y diccionarios (es, en, ...)
│   │   ├── pages/                  # Portfolio, Dashboard, Expenses, Payments, Boards
│   │   └── services/               # Clientes Axios con interceptor 'X-Tenant-ID' y 402 handler
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── mobile-app-flutter/             # Aplicación Móvil iOS / Android para Copropietarios
│   ├── lib/
│   │   ├── core/
│   │   │   ├── accessibility/      # Controlador de Modo Senior, DynamicTextScaler, Paletas AAA
│   │   │   ├── currency/           # Formateadores monetarios y selector de equivalencias
│   │   │   ├── network/            # Cliente HTTP Dio con interceptor de licencias vencidas
│   │   │   └── theme/              # Tokens de estilo de alto contraste
│   │   ├── features/
│   │   │   ├── account_status/     # [1. Consultar Cuenta] (Saldo, Recibo, Reportar Pago)
│   │   │   ├── failure_report/     # [2. Reportar Falla] (Asistente de Voz / Modo Directo)
│   │   │   ├── circulars/          # [3. Ver Circulares] (Avisos de la Junta, Asambleas)
│   │   │   └── settings/           # Ajustes de Idioma y Control Deslizante de Tamaño de Fuente
│   │   ├── l10n/                   # Archivos ARB bilingües (app_es.arb, app_en.arb)
│   │   └── main.dart
│   ├── pubspec.yaml
│   └── analysis_options.yaml
│
├── context.md                      # Este documento (Visión y Especificaciones de Arquitectura)
└── agents.md                       # Protocolos de desarrollo, directivas y guías para agentes e ingenieros
```

---

## 3. ARQUITECTURA MULTI-TENANT & MAQUINA DE ESTADO DE LICENCIAS

### 3.1 Modelo de Inquilino (*Tenant Model*)
* **Definición de Tenant:** Cada edificio físico (`Building`) registrado en el sistema constituye un **Tenant independiente**.
* **Estrategia de Almacenamiento:** Base de datos compartida con discriminador de fila (`tenant_id = building_id`) reforzada con **PostgreSQL Row-Level Security (RLS)** a nivel de motor.
* **Aislamiento en Memoria:** Cada petición HTTP entrante extrae el `X-Tenant-ID` (o claim JWT) en el Middleware, asignándolo a un `contextvars.ContextVar[uuid.UUID]`.

### 3.2 Máquina de Estados de la Licencia del Edificio
Cada edificio opera bajo una licencia SaaS independiente con los siguientes estados:
1. **`TRIAL`**: Período de evaluación inicial (15 o 30 días). Acceso total.
2. **`ACTIVE`**: Suscripción al día. Acceso total para administradores y copropietarios.
3. **`GRACE_PERIOD`**: Cuota vencida con ventana de gracia (ej. 5 días). Notificación persistente en el portal admin sin bloqueo operativo.
4. **`SUSPENDED`**: Licencia vencida fuera de gracia. **Dispara inmediatamente HTTP 402 Payment Required** para cualquier consulta dirigida a ese edificio.
5. **`CANCELLED`**: Rescisión de contrato. Bloqueo total y archivado de datos.

### 3.3 Interceptor HTTP 402 (*Payment Required*)
El middleware `TenantLicenseMiddleware` intercepta cada solicitud antes de que toque la capa de controladores:
* Si `license_status IN ('SUSPENDED', 'CANCELLED')` O `license_expires_at < now_utc()`:
  * Cancela el ciclo de ejecución.
  * Retorna código HTTP `402 Payment Required`.
  * Cuerpo estructurado con `resolution_url` para pago directo con pasarela de cobro del Master Panel.

---

## 4. MOTOR MULTI-MONEDA & CONVERSIÓN EN TIEMPO REAL

### 4.1 Principio Financiero
Los condominios en economías inflacionarias o transfronterizas requieren presupuestar en una moneda dura de referencia (ej. USD o EUR) mientras que los cobros y transferencias bancarias locales ocurren en la moneda de curso legal (ej. VES, COP, MXN).

### 4.2 Modelo de Datos Multi-Moneda
Toda tabla financiera (`expenses`, `payments`, `aliquot_debts`) debe registrar de forma inmutable:
* `amount_original`: Monto expresado en la divisa en que se ejecutó la transacción (ej. 3,500.00 Bs.).
* `currency_original`: Código ISO 4217 de la divisa (ej. `VES`, `USD`, `EUR`).
* `exchange_rate_applied`: Tasa de cambio aplicada respecto a la moneda base del edificio (`USD`) con precisión `Numeric(18, 6)`.
* `exchange_rate_date`: Timestamp de vigencia de la tasa fijada.
* `rate_source`: Origen oficial de la tasa (ej. `BCV_OFFICIAL`, `ECB_EUROPE`, `FIXER_IO`).
* `amount_base_usd`: Monto normalizado en USD para consolidación de balances contables.

### 4.3 Servicio de Conversión
* Caching en Redis de tasas de cambio con TTL de 30 minutos.
* Endpoints para cálculo de equivalencia instantánea según la divisa preferida seleccionada por el usuario en la UI (Admin o Residente).

---

## 5. INTERNACIONALIZACIÓN (i18n) BILINGÜE NATIVA

El ecosistema debe soportar Español (`es`) e Inglés (`en`) desde el MVP, con arquitectura desacoplada para incorporar Portugués (`pt`) o Francés (`fr`).

### 5.1 En el Backend (`backend-fastapi`)
* Detección de idioma mediante la cabecera estándar `Accept-Language: es` o `en`.
* Mensajes de error de negocio, plantillas de correo electrónico y notificaciones push resueltos mediante catálogo centralizado en formato JSON (`locales/es.json`, `locales/en.json`).
* Las circulares y comunicados admiten carga de contenido multilingüe o título/cuerpo con idioma principal y traducciones opcionales.

### 5.2 En el Portal Web Admin (`frontend-admin-web`)
* Implementación con `i18next` y `react-i18next`.
* Namespaces separados: `common.json`, `buildings.json`, `finances.json`, `auth.json`.
* Selector de idioma persistente en LocalStorage con fallback a la configuración regional del navegador.

### 5.3 En la App Móvil (`mobile-app-flutter`)
* Paquete oficial `flutter_localizations` y archivos de recursos arb (`intl_es.arb`, `intl_en.arb`).
* Sin textos embebidos en duro (*no hardcoded strings*).

---

## 6. MODO SENIOR Y TIPOGRAFÍA DINÁMICA (APP MÓVIL)

Diseñado especialmente para copropietarios de edad avanzada con dificultades de agudeza visual, destreza motriz fina o sobrecarga cognitiva.

### 6.1 Directivas de Accesibilidad Radical
1. **Regla Tipográfica Mínima:** En "Modo Senior", ninguna fuente puede ser inferior a **20px**. Los títulos y saldos numéricos deben oscilar entre **28px y 36px** con peso tipográfico `FontWeight.w900`.
2. **Escalador Dinámico de Fuente:** Selector deslizante que permite escalar la tipografía de la interfaz completa en múltiplos: **100% (Estándar), 125%, 150%, 175% y 200%**.
3. **Contraste Extremo (WCAG AAA):**
   * Fondo: `#070B14` (Negro profundo cibernético).
   * Tarjetas: `#11192C` (Pizarra oscura de alto aislamiento).
   * Texto Primario: `#FFFFFF` (Blanco puro 100%).
   * Acentos de Alta Luminancia: Cyan `#00E5FF`, Verde Esmeralda `#00E676`, Ámbar `#FFB300`, Alerta `#FF3B30`.
4. **Objetivos Táctiles Hipertrofiados:**
   * Altura mínima de botones y tarjetas: **80dp a 110dp**.
   * Separación vertical mínima entre botones: **16dp** (evita pulsaciones accidentales).
5. **Navegación Guiada a 3 Botones Principales:**
   * **[1. CONSULTAR CUENTA]:** Muestra el saldo neto en grande, desglose del recibo y botón para subir transferencia.
   * **[2. REPORTAR FALLA (CON ASISTENTE DE VOZ)]:** Permite dictar por voz el problema del edificio (ascensores, bombas, luces) o escribir en un campo ampliado.
   * **[3. VER CIRCULARES]:** Avisos de la junta presentados en formato de tarjeta con letra grande y lectura en voz alta (*Text-to-Speech* opcional).

---

## 7. PREMISA DE SEGURIDAD NO NEGOCIABLE (BLINDAJE ANTI-JUNIOR)

La seguridad es el cimiento estructural del proyecto. No se confía en la memoria o disciplina del programador; el sistema aplica **defensa en profundidad en 6 capas**:

```text
[Cliente: Web/Mobile] 
   └── 1. Cabecera 'X-Tenant-ID' obligatoria + Bearer Token JWT
          └── 2. Middleware LicenseEnforcer (HTTP 402 si vencida)
                 └── 3. Async ContextVar con el building_id inyectado
                        └── 4. PostgreSQL Session con RLS activado (app.current_tenant_id)
                               └── 5. Repository Pattern con cláusula WHERE automática
                                      └── 6. Base de Datos PostgreSQL ejecutando Row-Level Security
```

1. **PostgreSQL Row-Level Security (RLS) Mandatorio:**  
   Incluso si un desarrollador inexperto ejecuta `select * from payments`, la base de datos a nivel de kernel solo retornará los registros que coincidan con `current_setting('app.current_tenant_id')`.
2. **Pydantic v2 con `extra = "forbid"`:**  
   Ningún modelo de entrada permite campos residuales o no declarados, anulando ataques de asignación masiva (*Mass Assignment*).
3. **Criptografía de Alto Grado:**  
   Contraseñas procesadas exclusivamente con **Argon2id**.
4. **Protección contra Inyección de Decimales en Finanzas:**  
   Prohibido taxativamente el uso de tipos `float` de Python o JavaScript en montos de dinero. Se exige `Decimal` de precisión fija `Numeric(18, 4)`.
5. **Comprobantes y Auditoría Inmutable:**  
   Cada pago registrado genera un hash criptográfico HMAC-SHA256 del comprobante y registra un log de auditoría inmutable con IP, User-Agent, fecha UTC y monto auditado.

---

## 8. PROTOCOLO DE TRANSPARENCIA RADICAL, SINCERIDAD TOTAL Y GESTIÓN DE INCIDENTES

El desarrollo y mantenimiento del ecosistema TEPUY CONDO NEXUS se rige por el principio inquebrantable de **Sinceridad y Claridad Total**:

1. **Notificación Obligatoria e Inmediata:**  
   Ante cualquier error técnico detectado, fallo en migraciones de base de datos, discrepancia lógica, comportamiento inesperado o evento de pérdida/corrupción de datos:
   * **Queda terminantemente prohibido encubrir el error, maquillar logs o ejecutar parches a ciegas para aparentar que todo está bien.**
   * Se debe detener la operación de riesgo inmediatamente.
   * Se debe informar en el acto a **Alfredo R. Martínez (CEO)** con transparencia técnica y honestidad absoluta.
2. **Estructura del Informe de Incidencia:**  
   Cada reporte de incidente presentado al usuario debe detallar con precisión:
   * **Qué ocurrió exactamente:** Causa raíz verificada y hechos objetivos.
   * **Impacto y Alcance:** Qué datos, componentes o usuarios se vieron (o pudieron verse) afectados.
   * **Opciones de Solución:** Mínimo dos alternativas técnicas con sus respectivos riesgos, tiempos de resolución y planes de contingencia/rollback.
   * **Consulta de Decisión:** Preguntar explícitamente al usuario qué curso de acción autoriza antes de proceder con cualquier manipulación de datos o código crítico.

---

## 9. INGENIERÍA DE ESCALABILIDAD MASIVA (BENCHMARK: 1.000.000+ USUARIOS)

El ecosistema no se diseña como un prototipo descartable ni bajo la falacia de "lo hacemos temporal y después se cambia". Cada decisión arquitectónica, esquema de base de datos y contrato de API debe construirse con solidez definitiva para sostener más de **1,000,000 de usuarios concurrentes**:

1. **Base de Datos PostgreSQL de Alta Concurrencia:**
   * **Connection Pooling:** Manejo estricto de pools asíncronos mediante `asyncpg` y dimensionamiento de conexiones para integración con **PgBouncer** en capa de infraestructura.
   * **Estrategia de Particionamiento:** Tablas de alto volumen transaccional (`payments`, `audit_logs`, `aliquots`, `expenses`) preparadas para particionamiento horizontal nativo por `tenant_id` y marcas temporales (`created_at`).
   * **Indexación Quirúrgica:** Índices compuestos B-Tree y BRIN en columnas de filtrado frecuente (`building_id`, `status`, `created_at`) garantizando costos de consulta $O(\log N)$ y erradicando escaneos secuenciales (*Seq Scans*).
   * **Lecturas Escalables:** Repositorios desacoplados para admitir réplicas de solo lectura (*Read Replicas*) ante picos masivos de consulta de estados de cuenta y circulares.

2. **Arquitectura de Micro-Capa y Servicios Stateless:**
   * FastAPI completamente desacoplado de estado local en memoria; balanceable horizontalmente entre decenas o cientos de nodos detrás de Cloudflare / Traefik / Nginx.
   * Autenticación distribuida mediante tokens JWT firmados asimétricamente y validación de revoked tokens en Redis.

3. **Capa de Aceleración con Redis 7:**
   * Caching de lectura de licencias de edificios (evitando saturar la base de datos con consultas de estado en cada llamada HTTP).
   * Caching de cotizaciones de tasas de cambio oficiales con invalidación periódica.
   * Limitación de tasa (*Rate Limiting*) por IP y por Tenant con algoritmo de ventana deslizante para prevenir ataques DDoS o abusos de cuota.

4. **Idempotencia y Blindaje contra Condiciones de Carrera (Race Conditions):**
   * Registro y conciliación de pagos con cabecera obligatoria `Idempotency-Key` en Redis/DB para impedir duplicidad de transacciones ante reintentos de red del usuario.
   * Bloqueos transaccionales pesimistas (`SELECT ... FOR UPDATE`) o aislamiento `SERIALIZABLE` en balances contables y asignación de fondos para garantizar consistencia atómica estricta (ACID).

---

## 10. ESTADO ACTUAL DEL PROYECTO & HITOS COMPLETADOS (OCTUBRE 2026)

A la fecha, el ecosistema TEPUY CONDO NEXUS cuenta con sus tres componentes principales operativos, integrados y comunicándose bidireccionalmente:

### 10.1 Portal Web Administrativo (`frontend-admin-web`)
* **Despliegue y Ejecución:** Empaquetado estático de alto rendimiento con Vite y Nginx en contenedor Docker `tepuy_frontend_admin` activo en puerto `5173` ([http://localhost:5173](http://localhost:5173)).
* **Estándar Visual Fiduciario Suizo:** Totalmente alineado a la paleta corporativa de banca privada (Obsidiana `#0B0F17`, Pizarra `#131B2A`, bordes `#26334D` a 1.0px, tipografía Marfil `#F8FAFC`). Cero tolerancia a colores chillones o estilo gamer.
* **Sesión y Aislamiento Multi-Tenant:** `AuthContext` optimizado con bandera `isReady` para prevenir consultas HTTP prematuras sin token. Inyección automática del header `X-Tenant-ID` en Axios al seleccionar cualquier condominio en el Workspace.
* **Módulos Operacionales Activos:**
  - Tablero de Portafolio SaaS (métrica de licencias, inquilinos y fondos).
  - Auditoría Criptográfica de Pagos con verificación de firmas HMAC SHA-256.
  - Mesa de Averías centralizada (visualización de incidencias levantadas desde la app móvil).
  - Publicador y gestor de Circulares y Comunicados oficiales.
  - Vista de Gastos Operativos y Directorio de Unidades Residenciales.

### 10.2 Backend Asíncrono (`backend-fastapi`)
* **Servicio y Salud:** Contenedor `tepuy_backend` activo y saludable en puerto `8000` ([http://localhost:8000](http://localhost:8000)) con Python 3.11+, FastAPI y SQLAlchemy 2.0 Async.
* **Resolución de Preflights CORS:** Ajuste de precedencia en `main.py` y `tenant_middleware.py` para que el middleware de CORS intercepte de primero y procese `OPTIONS` sin exigir cabeceras de autorización previas.
* **Seguridad y Tenancy:** Intercepción de licencias fiduciarias (`TenantLicenseMiddleware`), soporte de cabecera `X-Tenant-ID` y filtrado con PostgreSQL RLS.

### 10.3 Base de Datos Transaccional (`hospital_db` / `tepuy_condo_db`)
* **Motor:** PostgreSQL 16 Alpine en puerto `5432` con esquemas relacionales consolidados.
* **Integridad Criptográfica:** Auditoría de pagos con hashes HMAC SHA-256 calculados y validados sobre los comprobantes bancarios.
* **Tenants Activos en Prueba:** "Residencias Tepuy Royal" (`11111111-1111-1111-1111-111111111111`), "Torre Humboldt Residencial" y "Condominio Plaza Mayor".

### 10.4 Aplicación Móvil del Copropietario (`mobile-app-flutter`)
* **Emulación:** Ejecución continua en emulador Android (`emulator-5554`) con Flutter 3.x y Dart 3.x.
* **Modo Senior & Anti-Overflow:** Cálculo de tipografía dinámica mediante `scaleFontSize` y blindaje de micro-badges y tags con `scaleMicroFontSize` (rango `clamp(10.0, 16.0)`), eliminando desbordamientos de pantalla al escalar al 200%.
* **Erradicación de Neones:** Homologación de todas las pantallas navegables (Inicio, Estado de Cuenta, Reporte de Averías por voz/texto, Circulares y Avisos) con micro-badges sobrios (`! PRIORITARIO`) y contraste WCAG AAA.
* **Sincronización en Vivo:** Verificada en caliente la publicación de circulares urgentes desde la Web/API y su renderizado instantáneo en la app móvil.

### 10.5 Conciliación Fiduciaria y Liquidación Contable Bidireccional (Octubre 2026)
* **Liquidación Atómica:** Endpoint `PATCH /api/v1/admin/payments/{id}/verify` configurado para imputar cronológicamente y saldar deudas de alícuotas (`AliquotDebt`) en PostgreSQL.
* **Auditoría Criptográfica:** Pagos verificados y asegurados con sellos HMAC SHA-256 inmutables.
* **Actualización en Caliente:** Verificación exitosa del pago `ZLL-04139F` ($44.70 USD) desde el portal web y su impacto inmediato: saldo deudor liquidado a **$0.00 USD / Bs. 0.00 VES**, transición de estado a **`SOLVENTE`** y comprobante marcado como **`VERIFICADO`** tanto en el Web Admin como en la app móvil Flutter.

### 10.6 Mesa de Averías e Incidencias — Ciclo Completo Bidireccional (Octubre 2026)
* **Canalización desde App Móvil:** Pestañas dobles `[+ NUEVA INCIDENCIA]` y `[MIS REPORTES (count)]` en Flutter. Asistente con transcripción de voz simulada, selector de severidad cuádruple (Baja, Media, Alta, Urgente), botones táctiles $\ge 80\text{dp}$ y micro-badges blindados contra desbordamientos.
* **Endpoint de Consulta Residente:** Integración de `GET /api/v1/resident/failure-reports` en FastAPI con aislamiento estricto por `current_tenant_id`.
* **Recepción en Panel Web:** Detección y renderizado instantáneo del reporte ("Filtración de agua en pasillo piso 4", Urgencia: ALTA, badge de dictado de voz) en `frontend-admin-web` (`http://localhost:5173/#workspace?tab=FAILURES`).
* **Resolución Administrativa:** Ejecución de `PATCH /api/v1/admin/failure-reports/{id}/resolve?is_resolved=true`, alternando el caso a `Atendida y Resuelta` (Esmeralda Fiduciaria `#10B981`) y decrementando el contador de incidencias abiertas en tiempo real.
* **Sincronización en Caliente en App Móvil:** Refresco instantáneo verificado en emulador Android (`emulator-5554`), actualizando la tarjeta de la avería de `EN ATENCIÓN` a `RESUELTA` con verificación visual completa y cero errores de linter (`flutter analyze` limpio).

### 10.7 Autenticación Multi-Tenant y Conmutación de Inquilinos en App Móvil (Octubre 2026)
* **Pantalla de Login Corporativa Ejecutiva:** Diseño sobrio bajo paleta de banca privada (`#0B0F17`, `#131B2A`, acentos Zafiro `#2563EB`, inputs de contraseña con visor de seguridad y micro-selectores de accesibilidad).
* **Purga Atómica de Caché en Logout:** Eliminación de claves de almacenamiento local para garantizar que tokens JWT o identificadores de inquilino anteriores no contaminen la sesión entrante.
* **Aislamiento Multi-Tenant en Caliente Verificado:**
  - Inquilino 1: Carlos Mendoza (`residente@tepuynexus.com`), Residencias Tepuy Royal, Apto 1-A (Alícuota 5.25%, deuda saldada).
  - Inquilino 2: Dra. Elena Rostova (`elena@tepuynexus.com`), Condominio Mirador del Bosque, Apto 4-B (Alícuota 6.50%, circular institucional aislada).
* **Calidad de Código y Estabilidad:** 0 advertencias en `flutter analyze`, respuesta visual de alta fluidez en emulador `emulator-5554`.

### 10.8 Segregación Estricta de Roles en Backend y Web Admin (Paso B Consolidado - Octubre 2026)
* **Backend Asíncrono (`backend-fastapi`):**
  - Registro del rol fiduciario `ANALISTA_VENTAS` en enum PostgreSQL y SQLAlchemy.
  - Creación y verificación de las 3 cuentas operativas con contraseñas seguras bajo Argon2id:
    1. `admin@tepuynexus.com`: `SUPERADMIN` (Alfredo R. Martínez).
    2. `ventas@tepuynexus.com`: `ANALISTA_VENTAS` (Valeria Gómez).
    3. `condo.admin@tepuynexus.com`: `ADMIN_EDIFICIO` (Ing. Roberto Méndez).
  - Blindaje con dependencias de autorización `require_tenant_admin` (HTTP 403 ante intentos de un administrador de condominio de consultar o alterar edificios no asignados) y `require_condo_operator` (HTTP 403 si un analista de ventas intenta acceder o verificar pagos internos).
  - Endpoints maestros `/master/metrics` y `/master/buildings/{id}/license` restringidos a SuperAdmin y Ventas.
* **Portal Web Administrativo (`frontend-admin-web`):**
  - Pantalla corporativa `AdminLoginScreen` con paleta ejecutiva de banca privada y perfiles demo rápidos de 1-clic.
  - Consola de Licencias SaaS (`SalesLicenseConsole`) con KPIs globales, tabla de vigencia, acciones de extensión (+30d) y suspensión HTTP 402, y blindaje de datos privados.
  - Enrutamiento dinámico por rol: `SUPERADMIN` (acceso total con selector tripartito: Portafolio, Consola de Licencias, Workspace Condominio), `ANALISTA_VENTAS` (vista exclusiva de consola de licencias), `ADMIN_EDIFICIO` (aterrizaje directo en su condominio asignado).
  - Selector de conmutación rápida de roles en cabecera con código de colores sobrio (Zafiro `#2563EB`, Ámbar `#D97706`, Esmeralda `#059669`).
  - Compilación exitosa con 0 errores TypeScript (`npm run build`) y desplegado en caliente en contenedor Docker `tepuy_frontend_admin`.

### 10.9 Auditoría Forense de Calidad, Deuda Técnica y Principio de Orgullo de Ingeniería (Octubre 2026)
A solicitud de Alfredo R. Martínez (CEO) y en concordancia con la Regla 8 de `AGENTS.md` (**Principio del Orgullo de Ingeniería, Cero Hardcodeo y Dinamismo Total**), se ejecutó una auditoría profunda sobre dos aspectos críticos de la arquitectura:

1. **Parametrización y Creación Dinámica de Roles (PBAC vs. Roles Estáticos):**
   * **Diagnóstico Actual:** El sistema utiliza actualmente un tipo enumerado fijo de PostgreSQL (`CREATE TYPE userrole AS ENUM (...)`) y condicionales estáticos en FastAPI (`if admin.role not in [UserRole.SUPERADMIN, ...]: raise HTTPException(403)`). La consola web bifurca vistas según la cadena estática de rol. Por ende, **hoy no es posible crear o parametrizar nuevos roles desde una pantalla web** sin modificar el código fuente y las migraciones.
   * **Solución Arquitectónica Aprobada (PBAC - Permission-Based Access Control):**
     - Migración a un modelo de control de acceso granular mediante tablas dinámicas:
       * `auth_permissions`: Permisos atómicos del sistema (`saas.licenses.manage`, `finances.payments.verify`, `failures.reports.resolve`, etc.).
       * `auth_roles`: Roles dinámicos con alcance global o por inquilino (`tenant_id NULL` o específico).
       * `auth_role_permissions`: Asociación muchos a muchos entre roles y permisos atómicos.
       * `admin_user_roles`: Asociación de usuarios administradores a roles.
     - Pantalla de Configuración de Perfiles en el Web Admin con matriz de casillas de verificación (checkboxes) que permite al SuperAdmin crear nuevos roles y asignar permisos en tiempo real.
     - Dependencias FastAPI de verificación desacopladas (`require_permission(permission_code)`).

2. **Integridad de Internacionalización (i18n Real vs. Cadenas Quemadas):**
   * **Diagnóstico Actual:**
     - **Backend:** Múltiples excepciones `HTTPException` en `auth_deps.py`, `admin_router.py` y `tenant_middleware.py` contienen mensajes quemados en español en lugar de resolver cadenas bilingües según la cabecera HTTP `Accept-Language`.
     - **Web Admin:** Coexisten textos quemados en español en `BuildingWorkspace.tsx` y `SalesLicenseConsole.tsx` fuera del hook `useTranslation()`.
     - **App Móvil:** Ciertas etiquetas de severidad y diálogos en `resident_home_screen.dart` y `login_screen.dart` usan cadenas directas sin invocar `AppLocalizations`.
   * **Plan de Acción:** Barrido exhaustivo y eliminación total de literales fijos, garantizando que el 100% de los textos e interfaces operen bajo diccionarios `es` / `en` sincronizados.

### 10.10 Consolidación de la Landing Page Corporativa SaaS B2B de TEPUY CONDO NEXUS (Paso C - Noviembre 2026)
* **Vitrina Institucional y Comercial (`frontend-admin-web`):**
  - Implementación completa de `LandingPage.tsx` bajo la Paleta Fiduciaria de Banca Privada Suiza (`#070B14`, `#0B0F17`, `#131B2A`, `#182234`, bordes finos `#26334D` de 1.0px a 1.2px y textos Marfil `#F8FAFC`).
  - **Hero Section Institucional:** Estándar bancario suizo, 4 métricas fiduciarias (1.000.000+ usuarios, Cero Fuga RLS, 99.99% SLA, 3 Divisas en tiempo real), botones de acción directa y selector de divisas (USD/EUR/VES) y lenguaje (ES/EN).
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

### 10.11 Infraestructura Cloud de Producción (Vercel, Cloudflare & VPS Tunnel - Noviembre 2026)
* **Frontend Web & Landing Page en Vercel Edge (`condominios.tepuynexus.com`):**
  - Desplegado y verificado en vivo con **HTTP 200 OK**, certificados SSL gestionados por Cloudflare en modo **Full (Strict)**.
  - Archivo `vercel.json` configurado con reescrituras SPA para Vite (`"source": "/(.*)", "destination": "/index.html"`) evitando errores 404 al recargar rutas con hash/deep-linking.
  - Cabeceras de seguridad de grado bancario inyectadas en cada respuesta (HSTS preload de 1 año, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy: strict-origin-when-cross-origin).
  - Repositorio GitHub sincronizado en rama `main` (`solucionestepuyvzla-nexus/nexus-landing`).
* **Backend Asíncrono & Base de Datos en Hetzner VPS (`api-condominios.tepuynexus.com`):**
  - Servidor Hetzner Cloud (Nuremberg, Alemania) con procesador ARM64 (Ampere) y Ubuntu 24.04 LTS.
  - Orquestación con `docker-compose.prod.yml` ejecutando PostgreSQL 16 (RLS), Redis 7 y FastAPI.
  - **Cloudflare Zero Trust Tunnel** (`cloudflared`) activo en estado *Buen Estado (Healthy)*: Enrutando el tráfico HTTPS hacia el contenedor `http://backend:8000` con **cero puertos públicos abiertos en el firewall del servidor**.
  - Verificado en vivo endpoint de salud: `GET https://api-condominios.tepuynexus.com/health` $\rightarrow$ `{"status":"healthy","service":"TEPUY CONDO NEXUS","version":"1.0.0-PROD","environment":"production"}`.
  - Base de datos inicializada y sembrada con `python src/seed_data.py`:
    * SuperAdmin: `admin@tepuynexus.com` / `Admin123!` (Alfredo R. Martínez).
    * Analista de Ventas: `ventas@tepuynexus.com` / `Ventas123!` (Valeria Gómez).
    * Admin de Edificio: `condo.admin@tepuynexus.com` / `Condo123!` (Ing. Roberto Méndez).
    * Residente Copropietario: `residente@tepuynexus.com` / `Residente123!` (Carlos Mendoza).

---

## 11. ROADMAP TÉCNICO Y PRÓXIMOS PASOS OPERACIONALES

Para las siguientes fases de trabajo en el repositorio, se establecen las siguientes prioridades operacionales aprobadas por Dirección:

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

4. **[PRIORIDAD 3] Prueba y Validación de la Barrera Fiduciaria HTTP 402:**
   * Simular la expiración o suspensión de la licencia de un condominio de prueba ("Condominio Plaza Mayor" `33333333-3333-3333-3333-333333333333`) en PostgreSQL.
   * Validar la respuesta HTTP 402 del backend y el despliegue del modal fiduciario bloqueante con la pasarela de reactivación tanto en el frontend web como en la app móvil del residente.

5. **[PRIORIDAD 4] Módulo de Emisión y Prorrateo de Gastos Mensuales (Alícuotas):**
   * Construir el generador y liquidador masivo de cuotas de condominio basado en alícuotas inmobiliarias.
   * Aplicar el motor multi-moneda (cálculo en USD base y desglose de pago equivalente en moneda local a la tasa oficial del día).

6. **[PRIORIDAD 5] Orquestación Multi-Contenedor Unificada (Docker Compose de Desarrollo Unificado):**
   * Consolidar la orquestación de `backend`, `frontend-admin-web`, `postgres`, `redis` y `pgbouncer` bajo un único archivo docker-compose con variables de entorno validadas y scripts de inicialización automática.



