# Seedance Studio

AI Video Studio local para generar vídeos con Seedance/Zidans desde una interfaz web moderna. El frontend está migrado a React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Radix UI, React Hook Form, Zod, TanStack Query y Zustand. El backend FastAPI actúa como proxy seguro hacia la API real y evita exponer claves privadas en el navegador.

## Stack

- Frontend: Vite, React, TypeScript, Tailwind CSS, shadcn/ui, Radix UI, Lucide React.
- Formularios y validación: React Hook Form + Zod.
- Estado remoto: TanStack Query con polling controlado.
- Estado local: Zustand con persistencia para tema e historial.
- Backend/proxy: FastAPI.
- Almacenamiento local: carpeta `outputs/`.

## Instalación

```powershell
cd "C:\Users\Maci\Documents\gen video"
python -m venv backend\.venv
backend\.venv\Scripts\Activate.ps1
python -m pip install -r backend\requirements.txt

cd frontend
npm install
```

## Variables de Entorno

Copia `.env.example` a `.env` en la raíz del proyecto:

```env
SEEDANCE_API_KEY=
SEEDANCE_API_BASE_URL=
OUTPUT_DIR=outputs
POLL_INTERVAL_SECONDS=5
POLL_TIMEOUT_SECONDS=600
SEEDANCE_CREATE_PATH=/v1/video/generations
SEEDANCE_STATUS_PATH_TEMPLATE=/v1/video/generations/{id}
SEEDANCE_DOWNLOAD_PATH_TEMPLATE=/v1/video/generations/{id}/content
MOCK_SEEDANCE=false
VITE_API_BASE_URL=/api
```

No pongas API keys privadas en variables `VITE_`: todo lo que empieza por `VITE_` se expone al cliente. Las claves de Seedance/Zidans deben vivir solo en el backend/proxy.

## Scripts

Para arrancar toda la app desde la raíz del proyecto:

```powershell
python start_app.py
```

El script crea `backend/.venv` si falta, instala dependencias de backend y frontend cuando sea necesario, copia `.env.example` a `.env` si no existe, y arranca FastAPI + Vite. Para omitir instalación de dependencias:

```powershell
python start_app.py --skip-install
```

```powershell
cd frontend
npm run dev
npm run build
npm run preview
npm run lint
```

Para el backend:

```powershell
cd "C:\Users\Maci\Documents\gen video"
backend\.venv\Scripts\Activate.ps1
python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

En desarrollo usa Vite en `http://127.0.0.1:5173`; el proxy de Vite redirige `/api` a `http://127.0.0.1:8000`. En producción ejecuta `npm run build`; FastAPI servirá `frontend/dist` si existe.

## Arquitectura

```text
frontend/
  src/
    app/                 Providers y rutas
    components/layout/   Shell, header, tema
    components/studio/   Formulario, preview, historial y estados
    components/ui/       Componentes shadcn/ui locales
    config/              Modelos y presets centralizados
    hooks/               Theme, generación, historial y debounce
    lib/                 API client, errores, storage, validadores
    schemas/             Zod schemas
    services/            video.service.ts
    stores/              Zustand stores
    types/               Tipos de generación y API
```

## Flujo de Generación

1. El usuario completa prompt, modo, modelo, duración, resolución, aspect ratio y ajustes avanzados.
2. Zod valida el formulario. En `image-to-video`, la imagen de referencia es obligatoria.
3. `buildEnhancedPrompt()` combina prompt base con estilo, cámara, iluminación, atmósfera y movimiento.
4. `useVideoGeneration()` crea el job mediante `video.service.ts`.
5. TanStack Query consulta el estado cada 3 segundos.
6. El polling se detiene en `completed`, `failed` o `cancelled`.
7. Al completar, el vídeo se muestra en preview y se guarda en historial local.

## Backend/Proxy

El servicio frontend está preparado para estos endpoints:

- `POST /api/video/generate`
- `GET /api/video/jobs/:jobId`
- `POST /api/upload`

También conserva compatibilidad con el backend actual:

- `POST /api/generations`
- `GET /api/generations/:localId`
- `GET /api/generations`
- `GET /api/media/:localId/:filename`

La API real de Seedance/Zidans debe consumirse desde el backend, nunca desde React.

## Modelos y Presets

Los modelos se configuran en:

```text
frontend/src/config/models.ts
```

Para añadir un modelo, agrega una entrada con `id`, `label`, `modes`, `durations`, `resolutions` y `aspectRatios`.

Los presets visuales viven en:

```text
frontend/src/config/generation-presets.ts
```

Puedes personalizar estilos, cámara, iluminación, atmósfera y movimiento sin tocar los componentes.

## Historial

El historial se persiste en `localStorage` mediante Zustand y guarda hasta 50 generaciones recientes. No almacena archivos grandes ni imágenes base64; solo metadata, URLs y configuración reutilizable.

## Seguridad

- No hay claves privadas en el frontend.
- El backend valida inputs básicos y protege media paths.
- Usa `MOCK_SEEDANCE=true` para probar sin llamar al proveedor.
- Revisa `_payload_from_request` en `backend/app/generation_service.py` si tu proveedor requiere nombres de campos distintos.
