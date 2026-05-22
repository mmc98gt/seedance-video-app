# Seedance Video App

App local sencilla para lanzar generaciones de video con Seedance 2.0, consultar el estado del trabajo y guardar los resultados en carpetas organizadas.

La integracion con Seedance esta encapsulada en `backend/app/seedance_client.py`. Las paginas oficiales localizadas de Volcengine/BytePlus confirman la existencia de una API de generacion de video, pero parte del detalle de endpoints y payload se renderiza con JavaScript. Por eso los endpoints son configurables por `.env` y el cliente acepta una carga flexible.

## Requisitos

- Python 3.11 o superior.
- Una API key valida del proveedor Seedance/BytePlus/Volcengine o un endpoint compatible.

## Instalacion

```powershell
cd "C:\Users\Maci\Documents\gen video"
python -m venv backend\.venv
backend\.venv\Scripts\Activate.ps1
python -m pip install -r backend\requirements.txt
```

## Configuracion

Copia `.env.example` a `.env` y rellena los valores reales:

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
```

Notas:

- `SEEDANCE_API_KEY` nunca se imprime ni se guarda en los JSON de salida.
- `SEEDANCE_API_BASE_URL` debe apuntar al host base de tu proveedor.
- Ajusta `SEEDANCE_CREATE_PATH`, `SEEDANCE_STATUS_PATH_TEMPLATE` y `SEEDANCE_DOWNLOAD_PATH_TEMPLATE` si tu documentacion oficial usa rutas distintas.
- Para comprobar almacenamiento e interfaz sin llamar a una API real, usa `MOCK_SEEDANCE=true`.

## Ejecucion

```powershell
cd "C:\Users\Maci\Documents\gen video"
backend\.venv\Scripts\Activate.ps1
python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

Abre:

```text
http://127.0.0.1:8000
```

## Uso

1. Escribe el prompt del video.
2. Revisa el modelo, duracion, resolucion, aspect ratio, seed, numero de videos y modo.
3. Sube una imagen de referencia si tu API la soporta.
4. Usa el campo de parametros avanzados JSON para valores documentados por tu proveedor, por ejemplo:

```json
{
  "negative_prompt": "low quality",
  "quality": "high"
}
```

5. Pulsa `Generar video`.
6. Consulta el estado y abre los enlaces del historial cuando el trabajo finalice.

## Estructura de carpetas de salida

Cada generacion se guarda en:

```text
outputs/
  YYYY-MM-DD/
    generation_YYYYMMDD_HHMMSS_<short_id>/
      request.json
      response.json
      status.json
      video_01.mp4
      video_02.mp4
      thumbnail.jpg
      metadata.json
```

`thumbnail.jpg` solo existira si se implementa o recibe desde la API. La version actual guarda videos detectados desde `video_url`, `videos`, `outputs`, `result` o `data`.

## API local

- `POST /api/generations`: inicia una generacion.
- `GET /api/generations/{local_id}`: consulta estado local.
- `GET /api/generations`: lista historial reciente.
- `GET /api/media/{local_id}/{filename}`: sirve videos o miniaturas guardadas.

El servidor valida inputs basicos y protege el endpoint de media contra path traversal.

## Adaptar Seedance 2.0

Si tu documentacion oficial usa campos distintos:

1. Actualiza las rutas en `.env`.
2. Ajusta `_payload_from_request` en `backend/app/generation_service.py` para mapear los campos de la UI a los nombres exactos requeridos.
3. Si la respuesta usa otros nombres para id, estado o videos, amplia `_extract_id`, `_extract_status` o `_extract_video_sources`.
4. Si la imagen de referencia requiere otro nombre de campo, cambia `reference_image` en `SeedanceClient.create_video_generation`.

## Limitaciones conocidas

- No se codifican como obligatorios endpoints o parametros no verificados en documentacion oficial accesible.
- No hay autenticacion de usuarios porque la app esta pensada para ejecucion local.
- No hay base de datos; el historial se reconstruye desde los JSON y archivos en `outputs/`.
- El modo mock genera un archivo de verificacion minimo, no un video reproducible real.

## Colaboracion

Las contribuciones se gestionan mediante pull requests. El archivo `.github/CODEOWNERS` asigna la revision del repositorio a `@mmc98gt`.
