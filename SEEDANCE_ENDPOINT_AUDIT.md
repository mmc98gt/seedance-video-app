# Auditoría de configuración de endpoints Seedance

Fecha: 2026-05-25

## Resultado corto
La app **no** está configurada para los 6 endpoints de Seedance 2.0 (normal + fast para text/image/reference).

Actualmente solo maneja:
- 2 modos funcionales en frontend: `text-to-video`, `image-to-video`.
- 2 modelos (`seedance-pro`, `seedance-lite`) sin desglose explícito por endpoint de familia `reference-to-video` y sus variantes fast.
- 3 rutas backend genéricas (create/status/download), no 6 rutas de producto separadas.

## Evidencia en código

### Frontend
- Modos permitidos: `"text-to-video" | "image-to-video"`.
- Falta `reference-to-video`.

Archivos:
- `frontend/src/types/generation.types.ts`
- `frontend/src/schemas/generation.schema.ts`
- `frontend/src/components/studio/GenerationForm.tsx`
- `frontend/src/config/models.ts`

### Backend
- Configuración de paths Seedance:
  - `SEEDANCE_CREATE_PATH` (default `/v1/video/generations`)
  - `SEEDANCE_STATUS_PATH_TEMPLATE` (default `/v1/video/generations/{id}`)
  - `SEEDANCE_DOWNLOAD_PATH_TEMPLATE` (default `/v1/video/generations/{id}/content`)
- Cliente usa esas 3 rutas para todo.

Archivos:
- `backend/app/config.py`
- `backend/app/seedance_client.py`

## Gap contra “6 endpoints live”
Según la referencia visual, deberían existir 6 ofertas:
1. Seedance 2.0 Text-to-Video
2. Seedance 2.0 Image-to-Video
3. Seedance 2.0 Reference-to-Video
4. Seedance 2.0 Fast Text-to-Video
5. Seedance 2.0 Fast Image-to-Video
6. Seedance 2.0 Fast Reference-to-Video

La implementación actual no expone explícitamente esas 6 opciones.

## Recomendación
1. Extender tipo `GenerationMode` para incluir `reference-to-video`.
2. Agregar modelos/IDs explícitos para las 6 variantes (o mapear internamente a un único endpoint con `model` correcto por variante).
3. Ajustar formulario + validación para entradas de referencia (imagen/video/audio) cuando aplique.
4. Añadir tests de mapeo request->modelo para cubrir las 6 variantes.
