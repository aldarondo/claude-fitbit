// End-to-end MCP integration tests — wires the real createServer() to a Client
// over InMemoryTransport. Mocks axios and memory.storeMemory at the module
// boundary so no network I/O occurs.

import { jest } from '@jest/globals';

const mockAxiosGet = jest.fn();
const mockStoreMemory = jest.fn();

jest.unstable_mockModule('axios', () => ({
  default: { get: mockAxiosGet, post: jest.fn() },
}));

jest.unstable_mockModule('../../src/auth.js', () => ({
  refreshIfNeeded: jest.fn().mockResolvedValue({ access_token: 'test-token' }),
}));

jest.unstable_mockModule('../../src/memory.js', () => ({
  storeMemory: mockStoreMemory,
}));

const { createServer } = await import('../../src/server.js');
const { Client } = await import('@modelcontextprotocol/sdk/client/index.js');
const { InMemoryTransport } = await import('@modelcontextprotocol/sdk/inMemory.js');

async function setupServer() {
  const server = createServer();
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'test', version: '1.0.0' }, { capabilities: {} });
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  return { client, server };
}

function activitySummary(overrides = {}) {
  return {
    data: {
      summary: {
        steps: 8000,
        floors: 10,
        fairlyActiveMinutes: 15,
        veryActiveMinutes: 5,
        caloriesOut: 2400,
        activityCalories: 600,
        distances: [{ activity: 'total', distance: 6.0 }],
        ...overrides,
      },
    },
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockStoreMemory.mockResolvedValue({ id: 'mem-1' });
});

describe('MCP tool: get_steps', () => {
  test('returns steps payload from Fitbit activity endpoint', async () => {
    mockAxiosGet.mockResolvedValueOnce(
      activitySummary({ steps: 9001, floors: 14, fairlyActiveMinutes: 20, veryActiveMinutes: 10 })
    );

    const { client } = await setupServer();
    const result = await client.callTool({
      name: 'get_steps',
      arguments: { user: 'charles', date: '2026-04-24' },
    });

    expect(result.isError).toBeFalsy();
    const payload = JSON.parse(result.content[0].text);
    expect(payload).toMatchObject({
      date: '2026-04-24',
      steps: 9001,
      floors: 14,
      active_minutes: 30,
      distance_km: 6.0,
    });
    expect(mockAxiosGet).toHaveBeenCalledWith(
      'https://api.fitbit.com/1/user/-/activities/date/2026-04-24.json',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
      })
    );
  });

  test('falls back to FITBIT_DEFAULT_USER and today when args omitted', async () => {
    process.env.FITBIT_DEFAULT_USER = 'jack';
    mockAxiosGet.mockResolvedValueOnce(activitySummary());

    const { client } = await setupServer();
    const result = await client.callTool({ name: 'get_steps', arguments: {} });

    expect(result.isError).toBeFalsy();
    const payload = JSON.parse(result.content[0].text);
    const today = new Date().toISOString().slice(0, 10);
    expect(payload.date).toBe(today);

    delete process.env.FITBIT_DEFAULT_USER;
  });
});

describe('MCP tool: get_heart_rate', () => {
  test('returns resting HR and zone breakdown', async () => {
    mockAxiosGet.mockResolvedValueOnce({
      data: {
        'activities-heart': [
          {
            value: {
              restingHeartRate: 60,
              heartRateZones: [
                { name: 'Out of Range', minutes: 800 },
                { name: 'Fat Burn', minutes: 30 },
                { name: 'Cardio', minutes: 12 },
                { name: 'Peak', minutes: 4 },
              ],
            },
          },
        ],
      },
    });

    const { client } = await setupServer();
    const result = await client.callTool({
      name: 'get_heart_rate',
      arguments: { user: 'charles', date: '2026-04-24' },
    });

    const payload = JSON.parse(result.content[0].text);
    expect(payload.resting_hr).toBe(60);
    expect(payload.zones.fat_burn).toBe(30);
    expect(payload.zones.cardio).toBe(12);
    expect(payload.zones.peak).toBe(4);
  });
});

describe('MCP tool: get_sleep', () => {
  test('returns sleep totals plus stage breakdown', async () => {
    mockAxiosGet.mockResolvedValueOnce({
      data: {
        summary: {
          totalMinutesAsleep: 410,
          totalTimeInBed: 450,
          stages: { deep: 75, light: 215, rem: 95, wake: 25 },
        },
        sleep: [{ efficiency: 92 }],
      },
    });

    const { client } = await setupServer();
    const result = await client.callTool({
      name: 'get_sleep',
      arguments: { user: 'charles', date: '2026-04-24' },
    });

    const payload = JSON.parse(result.content[0].text);
    expect(payload.total_minutes).toBe(410);
    expect(payload.efficiency).toBe(92);
    expect(payload.stages).toEqual({ deep: 75, light: 215, rem: 95, wake: 25 });
  });
});

describe('MCP tool: get_activity', () => {
  test('returns calorie totals and active minutes', async () => {
    mockAxiosGet.mockResolvedValueOnce(
      activitySummary({ caloriesOut: 2510, activityCalories: 720, fairlyActiveMinutes: 18, veryActiveMinutes: 22 })
    );

    const { client } = await setupServer();
    const result = await client.callTool({
      name: 'get_activity',
      arguments: { user: 'charles', date: '2026-04-24' },
    });

    const payload = JSON.parse(result.content[0].text);
    expect(payload.calories_total).toBe(2510);
    expect(payload.calories_active).toBe(720);
    expect(payload.exercise_minutes).toBe(40);
  });
});

describe('MCP tool: trend_summary', () => {
  test('aggregates N days and writes a summary to brian-mem', async () => {
    // 3 days × 4 endpoints = 12 axios.get calls
    mockAxiosGet.mockImplementation((url) => {
      if (url.includes('/activities/heart/')) {
        return Promise.resolve({
          data: {
            'activities-heart': [{ value: { restingHeartRate: 62, heartRateZones: [] } }],
          },
        });
      }
      if (url.includes('/sleep/')) {
        return Promise.resolve({
          data: { summary: { totalMinutesAsleep: 400, totalTimeInBed: 440, stages: {} }, sleep: [{ efficiency: 90 }] },
        });
      }
      // /activities/date/ — used by both get_steps and get_activity
      return Promise.resolve(activitySummary());
    });

    const { client } = await setupServer();
    const result = await client.callTool({
      name: 'trend_summary',
      arguments: { user: 'charles', days: 3 },
    });

    expect(result.isError).toBeFalsy();
    const payload = JSON.parse(result.content[0].text);
    expect(payload.user).toBe('charles');
    expect(payload.period_days).toBe(3);
    expect(payload.data).toHaveLength(3);
    expect(payload.data[0]).toHaveProperty('date');
    expect(payload.data[0].steps).toMatchObject({ steps: 8000 });
    expect(payload.data[0].hr).toMatchObject({ resting_hr: 62 });

    expect(mockStoreMemory).toHaveBeenCalledTimes(1);
    const [content, tags] = mockStoreMemory.mock.calls[0];
    expect(content).toContain('Fitbit 3-day summary for charles');
    expect(tags).toEqual(expect.arrayContaining(['fitbit.summary', 'user:charles', 'period:3d']));
  });

  test('survives per-day endpoint failures and still returns a summary', async () => {
    mockAxiosGet.mockRejectedValue(new Error('Fitbit API down'));

    const { client } = await setupServer();
    const result = await client.callTool({
      name: 'trend_summary',
      arguments: { user: 'charles', days: 2 },
    });

    expect(result.isError).toBeFalsy();
    const payload = JSON.parse(result.content[0].text);
    expect(payload.data).toHaveLength(2);
    // Each day should have null for every metric since all calls failed
    for (const day of payload.data) {
      expect(day.steps).toBeNull();
      expect(day.hr).toBeNull();
      expect(day.sleep).toBeNull();
      expect(day.activity).toBeNull();
    }
    // Memory write should still happen with the (mostly empty) summary
    expect(mockStoreMemory).toHaveBeenCalledTimes(1);
  });
});

describe('MCP server: tool registration', () => {
  test('exposes all five Fitbit tools', async () => {
    const { client } = await setupServer();
    const { tools } = await client.listTools();
    const names = tools.map((t) => t.name).sort();
    expect(names).toEqual(['get_activity', 'get_heart_rate', 'get_sleep', 'get_steps', 'trend_summary']);
  });
});
