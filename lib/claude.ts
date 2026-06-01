import Anthropic from '@anthropic-ai/sdk';
import { FREQUENCY_PROFILES, MENTAL_STATE_META } from './brainwave-science';
import type { MentalState, Duration, Intensity } from '@/types';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Ask Claude to generate a session title and science explainer.
 * Audio is generated in-browser via Web Audio API — no music API needed.
 */
export async function buildSessionContent(
  mentalState: MentalState,
  duration: Duration,
  intensity: Intensity
): Promise<{ title: string; scienceExplainer: string }> {
  const profile = FREQUENCY_PROFILES[mentalState];
  const meta = MENTAL_STATE_META[mentalState];

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system:
      'You are BrainWave, a neuroscience-informed wellness app. Write evocative session titles and friendly science explainers.',
    messages: [
      {
        role: 'user',
        content: `Create a session title and science explainer for:

Mental State: ${meta.label} — "${meta.description}"
Duration: ${duration} minutes
Intensity: ${intensity}
Frequency Profile:
- ${profile.name}: ${profile.hz} Hz ${profile.wavetype}
- ${profile.bpm} BPM, ${profile.musicalKey}
- Instruments: ${profile.instruments.join(', ')}
- Science: ${profile.scienceNote}

Return JSON:
{
  "title": "evocative 3-5 word session name",
  "scienceExplainer": "3-4 friendly sentences explaining why these binaural frequencies and soundscapes work for ${meta.label}. Mention the Hz values and brain state. Written for a curious non-scientist."
}`,
      },
    ],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Claude returned invalid JSON');
  return JSON.parse(match[0]);
}

/**
 * Ask Claude to map free-text user input to a mental state.
 */
export async function getRecommendation(userInput: string): Promise<{
  mentalState: MentalState;
  reasoning: string;
}> {
  const states = Object.keys(FREQUENCY_PROFILES).join(', ');

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 200,
    system:
      'You are a neuroscience-informed wellness assistant. Map user descriptions to the best mental state category.',
    messages: [
      {
        role: 'user',
        content: `The user says: "${userInput}"

Available states: ${states}

Return JSON: { "mentalState": "<one of the states above>", "reasoning": "<one sentence why>" }`,
      },
    ],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Could not parse recommendation');
  return JSON.parse(match[0]);
}
