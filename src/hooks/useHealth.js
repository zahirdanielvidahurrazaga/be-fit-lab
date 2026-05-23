import { useState, useEffect, useCallback } from 'react';
import { Health as CapacitorHealth } from '@capgo/capacitor-health';
import { Capacitor } from '@capacitor/core';

const isNative = () => Capacitor.isNativePlatform();

export function useHealth() {
  const [healthData, setHealthData] = useState({
    steps: null,
    calories: null,
    heartRate: null,
  });
  const [healthPermission, setHealthPermission] = useState(false);
  const [healthLoading, setHealthLoading] = useState(false);

  // Sin dependencia en healthPermission — se controla desde los call sites
  const fetchTodayData = useCallback(async () => {
    if (!isNative()) return;
    setHealthLoading(true);

    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

      const [stepsRes, calRes, hrRes] = await Promise.allSettled([
        CapacitorHealth.queryAggregated({
          dataType: 'steps',
          startDate: startOfDay.toISOString(),
          endDate: now.toISOString(),
          bucket: 'day',
          aggregation: 'sum',
        }),
        CapacitorHealth.queryAggregated({
          dataType: 'calories',
          startDate: startOfDay.toISOString(),
          endDate: now.toISOString(),
          bucket: 'day',
          aggregation: 'sum',
        }),
        CapacitorHealth.readSamples({
          dataType: 'heartRate',
          startDate: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
          endDate: now.toISOString(),
          limit: 1,
        }),
      ]);

      setHealthData({
        steps: stepsRes.status === 'fulfilled' && stepsRes.value?.samples?.length
          ? Math.round(stepsRes.value.samples[0].value)
          : null,
        calories: calRes.status === 'fulfilled' && calRes.value?.samples?.length
          ? Math.round(calRes.value.samples[0].value)
          : null,
        heartRate: hrRes.status === 'fulfilled' && hrRes.value?.samples?.length
          ? Math.round(hrRes.value.samples[0].value)
          : null,
      });
    } catch (err) {
      console.error('Error obteniendo datos de salud:', err);
    } finally {
      setHealthLoading(false);
    }
  }, []);

  const requestPermissions = useCallback(async () => {
    if (!isNative()) return false;
    try {
      const result = await CapacitorHealth.requestAuthorization({
        read: ['steps', 'calories', 'heartRate'],
        write: ['calories'],
      });
      const granted = result?.readAuthorized?.length > 0;
      setHealthPermission(granted);
      if (granted) fetchTodayData(); // Llama directo, sin esperar el estado
      return granted;
    } catch (err) {
      console.error('Error solicitando permisos de salud:', err);
      return false;
    }
  }, [fetchTodayData]);

  const logPilatesWorkout = useCallback(async (durationMinutes = 60, caloriesBurned = 280) => {
    if (!isNative()) return;
    try {
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - durationMinutes * 60 * 1000);
      await CapacitorHealth.saveSample({
        dataType: 'calories',
        value: caloriesBurned,
        unit: 'kilocalorie',
        startDate: startTime.toISOString(),
        endDate: endTime.toISOString(),
        metadata: { workoutType: 'pilates' },
      });
    } catch (err) {
      console.error('Error registrando workout de pilates:', err);
    }
  }, []);

  useEffect(() => {
    if (!isNative()) return;
    requestPermissions();
  }, []);

  return {
    healthData,
    healthPermission,
    healthLoading,
    requestPermissions,
    fetchTodayData,
    logPilatesWorkout,
  };
}
