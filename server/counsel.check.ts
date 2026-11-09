import {
  validateCounselRequest,
  buildCounselSystemPrompt,
  parseCounselResponse,
} from './counsel';
import { ARCHETYPE_CATALOGUE } from '../src/data/archetypesCatalogue';

let passedCount = 0;
let failedCount = 0;

function runTest(name: string, fn: () => boolean) {
  try {
    const passed = fn();
    if (passed) {
      console.log(`[PASS] ${name}`);
      passedCount++;
    } else {
      console.error(`[FAIL] ${name}`);
      failedCount++;
    }
  } catch (err) {
    console.error(`[FAIL] ${name} threw error:`, err);
    failedCount++;
  }
}

console.log('=== Running Counsel Server Logic Check Suite ===\n');

// 1. validateCounselRequest rejects: empty array, 31 messages, bad role, empty content, last message role 'model'
runTest('validateCounselRequest rejects: empty array, 31 messages, bad role, empty content, last message role model', () => {
  // Empty array
  const resEmpty = validateCounselRequest({ messages: [] });
  if (resEmpty.ok) return false;

  // 31 messages
  const thirtyOneMessages = Array.from({ length: 31 }, (_, i) => ({
    role: (i % 2 === 0 ? 'user' : 'model') as 'user' | 'model',
    content: `Message ${i}`,
  }));
  // Ensure last message is 'user' for 31 messages
  thirtyOneMessages[30] = { role: 'user', content: 'Last message' };
  const res31 = validateCounselRequest({ messages: thirtyOneMessages });
  if (res31.ok) return false;

  // Bad role
  const resBadRole = validateCounselRequest({
    messages: [{ role: 'system', content: 'Hello' }],
  });
  if (resBadRole.ok) return false;

  // Empty content
  const resEmptyContent = validateCounselRequest({
    messages: [{ role: 'user', content: '   ' }],
  });
  if (resEmptyContent.ok) return false;

  // Last message has role 'model'
  const resLastModel = validateCounselRequest({
    messages: [
      { role: 'user', content: 'Hello' },
      { role: 'model', content: 'Hi there' },
    ],
  });
  if (resLastModel.ok) return false;

  // Valid 2-message exchange with user ending
  const resValid = validateCounselRequest({
    messages: [
      { role: 'user', content: 'First message' },
      { role: 'model', content: 'AI reply' },
      { role: 'user', content: 'Second user message' },
    ],
  });
  if (!resValid.ok) return false;

  return true;
});

// 2. The system prompt contains all 42 creature ids
runTest('the system prompt contains all 42 creature ids', () => {
  const prompt = buildCounselSystemPrompt();
  if (ARCHETYPE_CATALOGUE.length !== 42) return false;

  for (const creature of ARCHETYPE_CATALOGUE) {
    if (!prompt.includes(creature.id)) {
      console.error(`Prompt missing creature id: ${creature.id}`);
      return false;
    }
  }
  return true;
});

// 3. parseCounselResponse: unknown creature id gives proposal null
runTest('parseCounselResponse: unknown creature id gives proposal null', () => {
  const jsonWithUnknownId = JSON.stringify({
    reply: 'I hear you.',
    crisis: false,
    proposal: {
      creatureTypeId: 'archetype-non-existent-beast',
      name: 'Fake Beast',
      problem: 'Fake problem',
      size: 5,
      distance: 5,
      ferocity: 5,
      reasoning: 'Testing non-existent creature',
    },
  });

  const parsed = parseCounselResponse(jsonWithUnknownId, 3);
  return parsed.reply === 'I hear you.' && parsed.crisis === false && parsed.proposal === null;
});

// 4. parseCounselResponse: dial 0, 11 and 4.6 become 1, 10 and 5
runTest('parseCounselResponse: dial 0, 11 and 4.6 become 1, 10 and 5', () => {
  const jsonWithClampedDials = JSON.stringify({
    reply: 'This mirrors a familiar dragon.',
    crisis: false,
    proposal: {
      creatureTypeId: 'archetype-dragon',
      name: 'The Avoidance Wyrm',
      problem: 'Procrastinating on important tax filing',
      size: 0,
      distance: 11,
      ferocity: 4.6,
      reasoning: 'Testing dial rounding and clamping',
      dialReasons: { size: 'big', distance: 'far', ferocity: 'mild' },
    },
  });

  const parsed = parseCounselResponse(jsonWithClampedDials, 2);
  if (!parsed.proposal) return false;

  return (
    parsed.proposal.size === 1 &&
    parsed.proposal.distance === 10 &&
    parsed.proposal.ferocity === 5
  );
});

// 5. parseCounselResponse: fewer than 2 user messages gives proposal null
runTest('parseCounselResponse: fewer than 2 user messages gives proposal null', () => {
  const validProposalJson = JSON.stringify({
    reply: 'Tell me more about what is weighing on you.',
    crisis: false,
    proposal: {
      creatureTypeId: 'archetype-hydra',
      name: 'Hydra of Commitments',
      problem: 'Saying yes to everything',
      size: 6,
      distance: 4,
      ferocity: 6,
      reasoning: 'Multiplies when treated improperly',
    },
  });

  // Only 1 user message
  const parsed1 = parseCounselResponse(validProposalJson, 1);
  // 0 user messages
  const parsed0 = parseCounselResponse(validProposalJson, 0);

  return parsed1.proposal === null && parsed0.proposal === null;
});

// 6. parseCounselResponse: crisis true gives proposal null
runTest('parseCounselResponse: crisis true gives proposal null', () => {
  const crisisJson = JSON.stringify({
    reply: 'I am so glad you reached out. Please talk to a trusted friend or crisis hotline.',
    crisis: true,
    proposal: {
      creatureTypeId: 'archetype-dragon',
      name: 'Crisis Monster',
      problem: 'Harm',
      size: 10,
      distance: 1,
      ferocity: 10,
    },
  });

  const parsed = parseCounselResponse(crisisJson, 4);
  return parsed.crisis === true && parsed.proposal === null;
});

// 7. parseCounselResponse: invalid JSON gives the fallback reply
runTest('parseCounselResponse: invalid JSON gives the fallback reply', () => {
  const brokenJson = 'Not a json string at all { broken';
  const parsed = parseCounselResponse(brokenJson, 3);

  return (
    parsed.reply === 'I lost the thread for a moment. Could you say that again?' &&
    parsed.crisis === false &&
    parsed.proposal === null
  );
});

// 8. parseCounselResponse: a valid response passes through
runTest('parseCounselResponse: a valid response passes through', () => {
  const validJson = JSON.stringify({
    reply: 'This reminds me of an ancient dragon of inertia.',
    crisis: false,
    proposal: {
      creatureTypeId: 'archetype-dragon',
      name: 'The Inertia Wyrm',
      problem: 'Inability to initiate critical project work',
      size: 8,
      distance: 3,
      ferocity: 7,
      reasoning: 'Grows heavier each day it is neglected.',
      dialReasons: {
        size: 'Significantly impacts daily focus',
        distance: 'Feels immediate and looming',
        ferocity: 'Consequences will compound if unaddressed',
      },
    },
  });

  const parsed = parseCounselResponse(validJson, 2);
  if (!parsed.proposal) return false;

  return (
    parsed.reply === 'This reminds me of an ancient dragon of inertia.' &&
    parsed.crisis === false &&
    parsed.proposal.creatureTypeId === 'archetype-dragon' &&
    parsed.proposal.name === 'The Inertia Wyrm' &&
    parsed.proposal.problem === 'Inability to initiate critical project work' &&
    parsed.proposal.size === 8 &&
    parsed.proposal.distance === 3 &&
    parsed.proposal.ferocity === 7 &&
    parsed.proposal.reasoning === 'Grows heavier each day it is neglected.' &&
    parsed.proposal.dialReasons.size === 'Significantly impacts daily focus'
  );
});

console.log(`\nResults: ${passedCount} passed, ${failedCount} failed.`);

if (failedCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
