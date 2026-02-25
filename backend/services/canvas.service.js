const { query } = require('../config/database');

const BMC_SECTIONS = [
  'customer-segments',
  'value-propositions',
  'channels',
  'customer-relationships',
  'revenue-streams',
  'key-resources',
  'key-activities',
  'key-partnerships',
  'cost-structure'
];

const LMC_SECTIONS = [
  'problem',
  'solution',
  'unique-value-proposition',
  'unfair-advantage',
  'customer-segments',
  'key-metrics',
  'channels',
  'cost-structure',
  'revenue-streams'
];

const ALL_SECTIONS = [...new Set([...BMC_SECTIONS, ...LMC_SECTIONS])];

const BMC_SECTION_NAMES = {
  'customer-segments': 'Customer Segments',
  'value-propositions': 'Value Propositions',
  'channels': 'Channels',
  'customer-relationships': 'Customer Relationships',
  'revenue-streams': 'Revenue Streams',
  'key-resources': 'Key Resources',
  'key-activities': 'Key Activities',
  'key-partnerships': 'Key Partnerships',
  'cost-structure': 'Cost Structure'
};

const LMC_SECTION_NAMES = {
  'problem': 'Problem',
  'solution': 'Solution',
  'unique-value-proposition': 'Unique Value Proposition',
  'unfair-advantage': 'Unfair Advantage',
  'customer-segments': 'Customer Segments',
  'key-metrics': 'Key Metrics',
  'channels': 'Channels',
  'cost-structure': 'Cost Structure',
  'revenue-streams': 'Revenue Streams'
};

function detectCanvasType(sections) {
  const used = Object.keys(sections).filter(s => sections[s]?.length > 0);
  const lmcOnly = ['problem', 'solution', 'unique-value-proposition', 'unfair-advantage', 'key-metrics'];
  const bmcOnly = ['value-propositions', 'customer-relationships', 'key-resources', 'key-activities', 'key-partnerships'];

  if (used.some(s => lmcOnly.includes(s))) return 'lmc';
  if (used.some(s => bmcOnly.includes(s))) return 'bmc';

  const bmcScore = used.filter(s => BMC_SECTIONS.includes(s)).length;
  const lmcScore = used.filter(s => LMC_SECTIONS.includes(s)).length;
  return lmcScore > bmcScore ? 'lmc' : 'bmc';
}

function parseMarkdown(code) {
  const lines = code.split('\n');
  const result = { title: '', description: '', sections: {} };
  ALL_SECTIONS.forEach(s => { result.sections[s] = []; });

  let currentSection = null;
  let isInCanvas = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    if (trimmed === 'bmc' || trimmed === 'lmc') {
      isInCanvas = true;
      continue;
    }
    if (!isInCanvas) continue;

    if (trimmed.startsWith('title:')) {
      result.title = trimmed.substring(6).trim();
      continue;
    }
    if (trimmed.startsWith('description:')) {
      result.description = trimmed.substring(12).trim();
      continue;
    }
    if (trimmed.endsWith(':') && ALL_SECTIONS.includes(trimmed.slice(0, -1))) {
      currentSection = trimmed.slice(0, -1);
      continue;
    }
    if (currentSection && (trimmed.startsWith('- ') || trimmed.startsWith('* '))) {
      const item = trimmed.substring(2).trim();
      if (item) result.sections[currentSection].push(item);
    }
  }

  result.canvasType = detectCanvasType(result.sections);
  return result;
}

function validateMarkdown(code) {
  try {
    const data = parseMarkdown(code);
    const errors = [];
    const hasContent = ALL_SECTIONS.some(s => data.sections[s]?.length > 0);
    if (!hasContent) errors.push('At least one section must have content');
    return { valid: errors.length === 0, errors, data };
  } catch (err) {
    return { valid: false, errors: [err.message], data: null };
  }
}

function formatMarkdown(code) {
  const data = parseMarkdown(code);
  const type = data.canvasType || 'bmc';
  const orderedSections = type === 'lmc' ? LMC_SECTIONS : BMC_SECTIONS;

  let out = `${type}\n`;
  if (data.title) out += `title: ${data.title}\n`;
  if (data.description) out += `description: ${data.description}\n`;
  out += '\n';

  for (const section of orderedSections) {
    if (data.sections[section]?.length > 0) {
      out += `${section}:\n`;
      data.sections[section].forEach(item => { out += `  - ${item}\n`; });
      out += '\n';
    }
  }
  return out.trimEnd() + '\n';
}

function getTemplate(type = 'bmc') {
  if (type === 'lmc') {
    return `lmc
title: My Lean Model
description: Brief description

problem:
  - Problem 1

solution:
  - Solution 1

unique-value-proposition:
  - Unique value proposition

unfair-advantage:
  - Competitive advantage 1

customer-segments:
  - Customer segment 1

key-metrics:
  - Key metric 1

channels:
  - Channel 1

cost-structure:
  - Cost 1

revenue-streams:
  - Revenue stream 1
`;
  }
  return `bmc
title: My Business Model
description: Brief description

customer-segments:
  - Customer segment 1

value-propositions:
  - Value proposition 1

channels:
  - Channel 1

customer-relationships:
  - Relationship type 1

revenue-streams:
  - Revenue stream 1

key-resources:
  - Key resource 1

key-activities:
  - Key activity 1

key-partnerships:
  - Key partnership 1

cost-structure:
  - Cost 1
`;
}

function listSections(type = 'bmc') {
  const sections = type === 'lmc' ? LMC_SECTIONS : BMC_SECTIONS;
  const names = type === 'lmc' ? LMC_SECTION_NAMES : BMC_SECTION_NAMES;
  return sections.map(s => ({ key: s, name: names[s] || s }));
}

function getSyntaxReference() {
  return {
    description: 'BLMCGen uses a custom DSL (Domain Specific Language) inspired by markdown, similar to how Mermaid defines diagram types. The first line declares the canvas type, followed by metadata and named sections with bulleted items.',
    structure: [
      'Line 1: canvas type — "bmc" or "lmc"',
      'title: <canvas title>',
      'description: <brief description>',
      '<section-name>: followed by items as "  - <item>"',
      'Comments with # are ignored, blank lines are ignored'
    ],
    bmcSections: BMC_SECTIONS,
    lmcSections: LMC_SECTIONS,
    exampleBmc: getTemplate('bmc'),
    exampleLmc: getTemplate('lmc')
  };
}

// --- DB operations ---

async function create(userId, { title, content, canvasType, isPublic = false }) {
  const result = await query(
    'INSERT INTO canvas (user_id, title, content, canvas_type, is_public) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [userId, title, content, canvasType, isPublic]
  );
  return result.rows[0];
}

async function update(canvasId, userId, fields) {
  const existing = await query(
    'SELECT id FROM canvas WHERE id = $1 AND user_id = $2',
    [canvasId, userId]
  );
  if (existing.rows.length === 0) return null;

  const updates = [];
  const params = [];
  let i = 0;
  for (const [key, val] of Object.entries(fields)) {
    if (val === undefined) continue;
    const col = key === 'isPublic' ? 'is_public' : key;
    updates.push(`${col} = $${++i}`);
    params.push(val);
  }
  if (updates.length === 0) return null;

  updates.push('updated_at = CURRENT_TIMESTAMP');
  params.push(canvasId);

  const result = await query(
    `UPDATE canvas SET ${updates.join(', ')} WHERE id = $${++i} RETURNING *`,
    params
  );
  return result.rows[0];
}

async function remove(canvasId, userId) {
  const result = await query(
    'DELETE FROM canvas WHERE id = $1 AND user_id = $2 RETURNING id',
    [canvasId, userId]
  );
  return result.rows.length > 0;
}

async function findById(canvasId, userId) {
  let whereClause = 'WHERE c.id = $1';
  const params = [canvasId];

  if (userId) {
    whereClause += ' AND (c.user_id = $2 OR c.is_public = TRUE)';
    params.push(userId);
  } else {
    whereClause += ' AND c.is_public = TRUE';
  }

  const result = await query(
    `SELECT c.*, u.name as author_name FROM canvas c LEFT JOIN users u ON c.user_id = u.id ${whereClause}`,
    params
  );
  if (result.rows.length === 0) return null;

  if (userId && result.rows[0].user_id === userId) {
    await query('UPDATE canvas SET last_accessed = CURRENT_TIMESTAMP WHERE id = $1', [canvasId]);
  }
  return result.rows[0];
}

async function listByUser(userId, { page = 1, limit = 20, type } = {}) {
  const offset = (page - 1) * limit;
  let where = 'WHERE user_id = $1';
  const params = [userId];
  let i = 1;

  if (type && ['bmc', 'lmc'].includes(type)) {
    where += ` AND canvas_type = $${++i}`;
    params.push(type);
  }

  const [rows, count] = await Promise.all([
    query(
      `SELECT id, title, canvas_type, is_public, created_at, updated_at, last_accessed FROM canvas ${where} ORDER BY updated_at DESC LIMIT $${++i} OFFSET $${++i}`,
      [...params, limit, offset]
    ),
    query(`SELECT COUNT(*) FROM canvas ${where}`, params)
  ]);

  return {
    canvas: rows.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: parseInt(count.rows[0].count),
      pages: Math.ceil(count.rows[0].count / limit)
    }
  };
}

async function listPublic({ page = 1, limit = 20, type } = {}) {
  const offset = (page - 1) * limit;
  let where = 'WHERE is_public = TRUE';
  const params = [];
  let i = 0;

  if (type && ['bmc', 'lmc'].includes(type)) {
    where += ` AND canvas_type = $${++i}`;
    params.push(type);
  }

  const [rows, count] = await Promise.all([
    query(
      `SELECT c.id, c.title, c.canvas_type, c.created_at, u.name as author_name FROM canvas c JOIN users u ON c.user_id = u.id ${where} ORDER BY c.created_at DESC LIMIT $${++i} OFFSET $${++i}`,
      [...params, limit, offset]
    ),
    query(`SELECT COUNT(*) FROM canvas ${where}`, params)
  ]);

  return {
    canvas: rows.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: parseInt(count.rows[0].count),
      pages: Math.ceil(count.rows[0].count / limit)
    }
  };
}

module.exports = {
  BMC_SECTIONS,
  LMC_SECTIONS,
  ALL_SECTIONS,
  parseMarkdown,
  validateMarkdown,
  formatMarkdown,
  getTemplate,
  listSections,
  getSyntaxReference,
  detectCanvasType,
  create,
  update,
  remove,
  findById,
  listByUser,
  listPublic
};
