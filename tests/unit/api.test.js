// All features require unit + integration tests before a task is marked complete.
import { jest } from '@jest/globals';

const mockGet = jest.fn();
jest.unstable_mockModule('axios', () => ({ default: { get: mockGet, post: jest.fn() } }));
jest.unstable_mockModule('../../src/auth.js', () => ({
  refreshIfNeeded: jest.fn().mockResolvedValue({ access_token: 'test-token' }),
}));

const { getSteps, getHeartRate, getSleep, getActivity } = await import('../../src/api.js');

describe('getSteps', () => {
  it('parses activity summary into steps shape', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        summary: {
          steps: 8432,
          floors: 12,
          fairlyActiveMinutes: 20,
          veryActiveMinutes: 10,
          distances: [{ activity: 'total', distance: 6.5 }],
        },
      },
    });
    const result = await getSteps('charles', '2026-04-24');
    expect(result.steps).toBe(8432);
    expect(result.active_minutes).toBe(30);
    expect(result.distance_km).toBe(6.5);
  });
});

describe('getHeartRate', () => {
  it('parses resting HR and zones', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        'activities-heart': [
          {
            value: {
              restingHeartRate: 58,
              heartRateZones: [
                { name: 'Fat Burn', minutes: 25 },
                { name: 'Cardio', minutes: 10 },
                { name: 'Peak', minutes: 2 },
              ],
            },
          },
        ],
      },
    });
    const result = await getHeartRate('charles', '2026-04-24');
    expect(result.resting_hr).toBe(58);
    expect(result.zones.fat_burn).toBe(25);
  });
});

describe('getSleep', () => {
  it('parses sleep summary', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        summary: {
          totalMinutesAsleep: 420,
          totalTimeInBed: 460,
          stages: { deep: 80, light: 220, rem: 90, wake: 30 },
        },
        sleep: [{ efficiency: 91 }],
      },
    });
    const result = await getSleep('charles', '2026-04-24');
    expect(result.total_minutes).toBe(420);
    expect(result.efficiency).toBe(91);
    expect(result.stages.deep).toBe(80);
  });
});

describe('getActivity', () => {
  it('parses calorie and exercise data', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        summary: {
          caloriesOut: 2450,
          activityCalories: 650,
          fairlyActiveMinutes: 15,
          veryActiveMinutes: 20,
          steps: 9000,
          floors: 8,
          distances: [],
        },
      },
    });
    const result = await getActivity('charles', '2026-04-24');
    expect(result.calories_total).toBe(2450);
    expect(result.exercise_minutes).toBe(35);
  });
});
