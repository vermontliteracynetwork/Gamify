const fs = require('fs');
const path = require('path');

const PROMPT_PATHS = Object.freeze({
  ceo_agent: ['executive', 'ceo-agent', 'PROMPT.md'],
  cfo_agent: ['finance', 'cfo-agent', 'PROMPT.md'],
  hermes: ['operations', 'hermes', 'PROMPT.md'],
  cto_agent: ['technology', 'cto-agent', 'PROMPT.md'],
  cmo_agent: ['marketing', 'cmo-agent', 'PROMPT.md'],
  chro_agent: ['people', 'chro-agent', 'PROMPT.md'],
  clo_agent: ['legal', 'clo-agent', 'PROMPT.md'],
});

function substitutePlaceholders(template, values) {
  return template.replace(/\{\{([A-Z_]+)\}\}/g, (match, key) => (
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match
  ));
}

// Gamify (owner, 2026-11-24): every agent also advises. Appended to every
// prompt, built-in and custom.
const GAMIFY_ADVISOR = `

## Advisor standpoint (Gamify)
You are an advisor to {{PRINCIPAL_NAME}}, not only a doer. In every answer, help
her think critically about what she wants Gamify the business to look like:
name the assumption under the request, the trade-off, and how it fits or pulls
against her goals (paid subscriptions, a brand schools trust, a business she
can run). Base advice on research or established practice and name it briefly;
never invent numbers. End with one sharp question for her to decide. Her
decision wins once she has heard the challenge.
Consult, never assume (owner, 2026-11-26): on her business plan and any decision
about what she wants Gamify to be, ask her before writing it down. Bring
options, your recommendation and the research, then wait for her answer; a
guess is never written into her plan as if she chose it.`;

function loadAgentPrompt(args) {
  return gamifyLoadAgentPrompt(args) + substitutePlaceholders(GAMIFY_ADVISOR, { PRINCIPAL_NAME: (args.config && args.config.principalName) || 'the Principal' });
}

function gamifyLoadAgentPrompt({ root, config, agent }) {
  const agentId = agent && agent.id ? agent.id : 'ceo_agent';

  const values = {
    AGENT_NAME: agentId === 'ceo_agent'
      ? (config.agentName || 'CEO Agent')
      : (agent && (agent.name || agent.title)) || agentId,
    CEO_AGENT_NAME: config.agentName || 'CEO Agent',
    PRINCIPAL_NAME: config.principalName || 'the Principal',
    BUSINESS_CONTEXT: config.businessContext || 'the configured business',
    AGENT_TITLE: agent && agent.title ? agent.title : 'Chief Intelligence & Orchestration Agent',
  };

  // Custom (user-added) agents carry their prompt inline in config, never as a
  // departments/ file — never attempt a file read for them.
  if (agent && agent.custom && typeof agent.prompt === 'string') {
    return substitutePlaceholders(agent.prompt, values);
  }

  const promptParts = PROMPT_PATHS[agentId] || PROMPT_PATHS.ceo_agent;
  const promptPath = path.join(root, 'departments-subagents', ...promptParts);
  const template = fs.readFileSync(promptPath, 'utf8');
  return substitutePlaceholders(template, values);
}

module.exports = { loadAgentPrompt, substitutePlaceholders, PROMPT_PATHS };
