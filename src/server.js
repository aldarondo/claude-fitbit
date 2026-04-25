import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getSteps, getHeartRate, getSleep, getActivity } from './api.js';
import { storeMemory } from './memory.js';

function today() {
  return new Date().toISOString().slice(0, 10);
}

function nDaysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export function createServer() {
  const server = new McpServer({ name: 'claude-fitbit', version: '0.1.0' });
  const defaultUser = () => process.env.FITBIT_DEFAULT_USER ?? 'charles';

  server.tool(
    'get_steps',
    'Get daily step count, floors, active minutes, and distance from Fitbit',
    { user: z.string().optional(), date: z.string().optional() },
    async ({ user, date }) => {
      const result = await getSteps(user ?? defaultUser(), date ?? today());
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    'get_heart_rate',
    'Get resting heart rate and zone minutes from Fitbit',
    { user: z.string().optional(), date: z.string().optional() },
    async ({ user, date }) => {
      const result = await getHeartRate(user ?? defaultUser(), date ?? today());
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    'get_sleep',
    'Get sleep duration, efficiency, and stage breakdown from Fitbit',
    { user: z.string().optional(), date: z.string().optional() },
    async ({ user, date }) => {
      const result = await getSleep(user ?? defaultUser(), date ?? today());
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    'get_activity',
    'Get calories burned and exercise minutes from Fitbit',
    { user: z.string().optional(), date: z.string().optional() },
    async ({ user, date }) => {
      const result = await getActivity(user ?? defaultUser(), date ?? today());
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    'trend_summary',
    'Aggregate Fitbit metrics over the past N days and write summary to brian-mem',
    { user: z.string().optional(), days: z.number().int().min(1).max(30).optional() },
    async ({ user, days = 7 }) => {
      const u = user ?? defaultUser();
      const results = [];
      for (let i = 0; i < days; i++) {
        const date = nDaysAgo(i);
        const [steps, hr, sleep, activity] = await Promise.all([
          getSteps(u, date).catch(() => null),
          getHeartRate(u, date).catch(() => null),
          getSleep(u, date).catch(() => null),
          getActivity(u, date).catch(() => null),
        ]);
        results.push({ date, steps, hr, sleep, activity });
      }

      const summary = {
        user: u,
        period_days: days,
        generated: today(),
        data: results,
      };

      await storeMemory(
        `Fitbit ${days}-day summary for ${u}: ${JSON.stringify(summary)}`,
        [`fitbit.summary`, `user:${u}`, `period:${days}d`]
      );

      return { content: [{ type: 'text', text: JSON.stringify(summary, null, 2) }] };
    }
  );

  return server;
}
