import axios from 'axios';
import { refreshIfNeeded } from './auth.js';

const BASE = 'https://api.fitbit.com';

async function fitbitGet(user, path) {
  const token = await refreshIfNeeded(user);
  const { data } = await axios.get(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  return data;
}

export async function getSteps(user, date) {
  const data = await fitbitGet(user, `/1/user/-/activities/date/${date}.json`);
  const s = data.summary;
  return {
    date,
    steps: s.steps,
    floors: s.floors,
    active_minutes: s.fairlyActiveMinutes + s.veryActiveMinutes,
    distance_km: s.distances?.find(d => d.activity === 'total')?.distance ?? 0,
  };
}

export async function getHeartRate(user, date) {
  const data = await fitbitGet(user, `/1/user/-/activities/heart/date/${date}/1d.json`);
  const day = data['activities-heart']?.[0]?.value ?? {};
  const zones = (day.heartRateZones ?? []).reduce((acc, z) => {
    acc[z.name.toLowerCase().replace(' ', '_')] = z.minutes;
    return acc;
  }, {});
  return {
    date,
    resting_hr: day.restingHeartRate ?? null,
    zones,
  };
}

export async function getSleep(user, date) {
  const data = await fitbitGet(user, `/1.2/user/-/sleep/date/${date}.json`);
  const summary = data.summary ?? {};
  const stages = summary.stages ?? {};
  return {
    date,
    total_minutes: summary.totalMinutesAsleep ?? 0,
    time_in_bed: summary.totalTimeInBed ?? 0,
    efficiency: data.sleep?.[0]?.efficiency ?? null,
    stages: {
      deep: stages.deep ?? 0,
      light: stages.light ?? 0,
      rem: stages.rem ?? 0,
      wake: stages.wake ?? 0,
    },
  };
}

export async function getActivity(user, date) {
  const data = await fitbitGet(user, `/1/user/-/activities/date/${date}.json`);
  const s = data.summary;
  return {
    date,
    calories_total: s.caloriesOut,
    calories_active: s.activityCalories,
    exercise_minutes: s.fairlyActiveMinutes + s.veryActiveMinutes,
  };
}
