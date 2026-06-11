# Báscula Etekcity ESF24 (Bluetooth) — notas de desarrollo

Modelo del estudio: **Etekcity Smart Fitness Scale ESF24** (báscula compartida).
Modelo de uso: **cada clienta se pesa con SU propio teléfono** (la app se conecta
por BLE a la báscula compartida; se pesan de una en una). Identidad = su cuenta.
Sexo fijo = femenino (todas son mujeres). Edad = de `birth_date`. Estatura = `height_cm`.

## Estado
- **Fase 1a — HECHA Y PROBADA:** conexión BLE + lectura de PESO en device real.
- **Fase 1b — HECHA Y VALIDADA (2026-06-11):** impedancia decodificada + 13 métricas
  calculadas (`src/lib/bodyComposition.js`, fijo MUJER). **Validado contra VeSync** con una
  pesada real (62.7 kg, imp 624 Ω): TODO cuadra (grasa 28 vs 27.7, músculo 42=42, agua
  49.4 vs 49.5, visceral 8=8, ósea 2.71=2.71, proteína 16.9=16.9, edad metabólica 24=24…).
  **Única diferencia: BMR** (nuestro 1345 vs VeSync 1401, ~4%) — VeSync usa otra fórmula de
  BMR; el resto usa `ffw*21.6+370`. Pendiente menor: afinar BMR si se quiere exacto.
- Impedancia usada = **resistencia 1** (bytes [6:8] BE); la 2 ([8:10]) se ignora (validado OK).
- Trama final con impedancia ejemplo: `100b15 187e 01 0270 0223 5e` (peso 62.70, r1=624, r2=547).

## Hallazgo clave
La librería open-source `etekcity_esf551_ble` (v0.4.2) tiene clase `ESF24Scale` pero es
**solo peso** ("No impedance measurements"). El modelo ESF551 sí trae composición (trama
de 22 bytes con impedancia en `payload[13:15]`). El ESF24 manda una trama de **11 bytes**;
Paul Banks confirmó que la trama final trae **peso + 2 valores de resistencia** (su script
imprime p.ej. `19.7 1 434 363`), pero nadie publicó el offset exacto → hay que crackearlo.

## CONFIRMADO en device (2026-06-11)
- La báscula anuncia como **`QN-Scale1`** (chipset Qingniu/Yolanda; el ESF24 lo usa).
- Servicios reales: `0000180f` (batería) + `0000fff0` con `fff1 [notify]` y
  **`fff2 [writeWithoutResponse]`**.
- ⚠️ `fff2` es **writeWithoutResponse** — usar `BleClient.writeWithoutResponse` (no `write`,
  da "Writing is not permitted"). Era el bug que dejaba la báscula en bucle de `12 0f 15`.
- Trama de negociación observada (15 bytes): `12 0f 15 9b b4 0b 44 ac 04 39 05 32 00 02 f6`
  (los últimos 2 bytes = contador+checksum que incrementa mientras espera respuesta).

## Protocolo BLE ESF24 (portado en `src/lib/esf24Scale.js`)
- Servicio `0000fff0`, notify `0000fff1`, write `0000fff2` (writeWithoutResponse).
- Notificaciones (DataView):
  - len 15, prefijo `12 0f 15` → negociación de unidad → escribir cmd KG
    `13 09 15 01 10 28 37 00 a1` (base `1309150010283700a0`, nibble bajo de [3] y [8] = 1).
  - len 11, prefijo `14 0b 15` → pide iniciar medición → escribir timestamp:
    `[0x20,0x08,0x15, ts(LE u32), checksum=sum(bytes0..6)&0xFF]`, `ts = floor(now/1000) - 946656000`.
  - len 11, prefijo `10 0b 15`, `byte[5]==1` → **peso ESTABLE (final)**: escribir
    `CMD_END = 1f 05 15 10 49`. Peso = `((byte3<<8)|byte4)/100`.
    Bytes `[6..9]` = **resistencia/impedancia sin decodificar (Fase 1b)**.
  - mismo prefijo con `byte[5]!=1` → peso en vivo (no final).

## Pendiente Fase 1b
1. Capturar varias tramas finales (`finalHex`) del ESF24 del usuario + anotar lo que VeSync
   muestra (peso, % grasa, músculo, agua, hueso, visceral, IMC, etc.) en cada pesada.
2. Correlacionar bytes `[6..9]` de la trama final con la resistencia → confirmar offset/orden.
3. Portar fórmulas BIA (femenino) usando peso + resistencia + edad + estatura. Validar vs VeSync.
4. **OJO nombres de columnas:** la UI de Evolución ya lee `muscle_pct` y `water_pct`, pero la
   migración `supabase/bascula_setup.sql` creó `skeletal_muscle_pct` / `body_water_pct` /
   `muscle_mass_kg`. Reconciliar (renombrar columnas o mapear al guardar) antes de mostrar.

## UI
- `src/components/BasculaBLE.jsx` — modal "Pesarme" (intro → escaneo → peso en vivo → guardado →
  diagnóstico copiable). Botón en `Evolucion.jsx` (estado vacío + sección con datos).
- Apple Health quedó como opción secundaria ("o importar desde Apple Salud").

## Permisos nativos (ya agregados)
- iOS: `NSBluetoothAlwaysUsageDescription` en Info.plist.
- Android: `BLUETOOTH_SCAN` (neverForLocation), `BLUETOOTH_CONNECT`, y legacy `BLUETOOTH`/
  `BLUETOOTH_ADMIN`/`ACCESS_FINE_LOCATION` (maxSdk 30).
