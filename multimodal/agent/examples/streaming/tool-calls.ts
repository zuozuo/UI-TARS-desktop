/*
 * Copyright (c) 2025 Bytedance, Inc. and its affiliates.
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * An example of a streaming tool call
 */

import { Agent, AgentRunNonStreamingOptions, AgentRunStreamingOptions, Tool, z } from '../../src';

const locationTool = new Tool({
  id: 'getCurrentLocation',
  description: "Get user's current location",
  parameters: z.object({}),
  function: async () => {
    return { location: 'Boston' };
  },
});

const weatherTool = new Tool({
  id: 'getWeather',
  description: 'Get weather information for a specified location',
  parameters: z.object({
    location: z.string().describe('Location name, such as city name'),
  }),
  function: async (input) => {
    const { location } = input;
    return {
      location,
      temperature: '70°F (21°C)',
      condition: 'Sunny',
      precipitation: '10%',
      humidity: '45%',
      wind: '5 mph',
    };
  },
});

export const agent = new Agent({
  model: {
    provider: 'volcengine',
    id: 'ep-20250510145437-5sxhs',
    apiKey: process.env.ARK_API_KEY,
  },
  tools: [locationTool, weatherTool],
  toolCallEngine: 'native',
});

export const runOptions: AgentRunStreamingOptions = {
  input: "How's the weather today?",
  stream: true,
};

// For snapshot testing, export a non-streaming version as well
export const nonStreamingRunOptions: AgentRunNonStreamingOptions = {
  input: "How's the weather today?",
};

async function main() {
  const response = await agent.run(runOptions);
  for await (const chunk of response) {
    console.log(chunk);
  }
}

if (require.main === module) {
  main();
}
