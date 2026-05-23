import { useState, useCallback, useRef } from 'react';
import { BleClient } from '@capacitor-community/bluetooth-le';
import { Capacitor } from '@capacitor/core';
import { supabase } from '../lib/supabase';

const isNative = () => Capacitor.isNativePlatform();

// ─────────────────────────────────────────────────────────────────
// PARSER PLACEHOLDER — se reemplaza mañana con el parser específico
// del modelo de báscula confirmado.
//
// Cada marca usa UUIDs de servicios y formatos de paquete distintos.
// Estructura que DEBE devolver el parser:
// {
//   weight_kg, bmi, body_fat_pct, muscle_mass_kg, muscle_pct,
//   water_pct, bone_mass_kg, visceral_fat, metabolic_age, bmr
// }
// ─────────────────────────────────────────────────────────────────
import { parseScaleData, SCALE_SERVICE_UUID, SCALE_CHAR_UUID } from './scaleParser';

export const SCAN_TIMEOUT_MS = 15000;

export function useBluetoothScale(userId) {
  const [scanning, setScanning] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [measurement, setMeasurement] = useState(null);
  const [error, setError] = useState(null);
  const [deviceId, setDeviceId] = useState(null);

  const stopScanRef = useRef(null);

  const requestPermissions = useCallback(async () => {
    if (!isNative()) return false;
    try {
      await BleClient.initialize({ androidNeverForLocation: false });
      return true;
    } catch (err) {
      setError('Bluetooth no disponible en este dispositivo.');
      return false;
    }
  }, []);

  // Escanea, se conecta a la báscula y espera un resultado
  const startMeasurement = useCallback(async () => {
    if (!isNative() || !userId) return;
    setError(null);
    setMeasurement(null);

    const ready = await requestPermissions();
    if (!ready) return;

    setScanning(true);

    const timeout = setTimeout(() => {
      BleClient.stopLEScan().catch(() => {});
      setScanning(false);
      setError('No se encontró ninguna báscula cerca. Asegúrate de que esté encendida.');
    }, SCAN_TIMEOUT_MS);

    stopScanRef.current = () => {
      clearTimeout(timeout);
      BleClient.stopLEScan().catch(() => {});
      setScanning(false);
    };

    try {
      await BleClient.requestLEScan(
        { services: [SCALE_SERVICE_UUID] },
        async (result) => {
          // Encontró la báscula — detener el scan e intentar leer datos
          stopScanRef.current?.();
          setConnecting(true);

          try {
            await BleClient.connect(result.device.deviceId, () => {
              // Callback de desconexión inesperada
              setConnecting(false);
            });

            setDeviceId(result.device.deviceId);

            await BleClient.startNotifications(
              result.device.deviceId,
              SCALE_SERVICE_UUID,
              SCALE_CHAR_UUID,
              async (rawData) => {
                const parsed = parseScaleData(rawData);
                if (!parsed || !parsed.weight_kg) return;

                // Solo guardar medición completa (algunas básculas mandan
                // datos intermedios mientras el usuario se sube)
                if (!parsed.isStable) return;

                setMeasurement(parsed);
                await saveMeasurement(parsed, userId);

                // Desconectar después de recibir medición estable
                await BleClient.stopNotifications(
                  result.device.deviceId,
                  SCALE_SERVICE_UUID,
                  SCALE_CHAR_UUID
                );
                await BleClient.disconnect(result.device.deviceId);
                setConnecting(false);
              }
            );
          } catch (err) {
            console.error('Error conectando a báscula:', err);
            setError('No se pudo conectar a la báscula. Intenta de nuevo.');
            setConnecting(false);
          }
        }
      );
    } catch (err) {
      clearTimeout(timeout);
      setScanning(false);
      setError('Error iniciando escaneo Bluetooth: ' + err.message);
    }
  }, [userId, requestPermissions]);

  const stopMeasurement = useCallback(async () => {
    stopScanRef.current?.();
    if (deviceId) {
      await BleClient.disconnect(deviceId).catch(() => {});
      setDeviceId(null);
    }
    setConnecting(false);
  }, [deviceId]);

  return {
    scanning,
    connecting,
    measurement,
    error,
    startMeasurement,
    stopMeasurement,
  };
}

// Guarda la medición en Supabase
async function saveMeasurement(data, userId) {
  try {
    const { error } = await supabase.from('body_measurements').insert({
      user_id: userId,
      weight_kg: data.weight_kg ?? null,
      bmi: data.bmi ?? null,
      body_fat_pct: data.body_fat_pct ?? null,
      muscle_mass_kg: data.muscle_mass_kg ?? null,
      muscle_pct: data.muscle_pct ?? null,
      water_pct: data.water_pct ?? null,
      bone_mass_kg: data.bone_mass_kg ?? null,
      visceral_fat: data.visceral_fat ?? null,
      metabolic_age: data.metabolic_age ?? null,
      bmr: data.bmr ?? null,
    });
    if (error) console.error('Error guardando medición:', error);
  } catch (err) {
    console.error('Error guardando medición:', err);
  }
}
