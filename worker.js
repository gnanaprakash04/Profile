/**
 * Portfolio RAG Chatbot — Cloudflare Worker
 * ---------------------------------------------------------------------
 * What this does, in plain terms:
 *   1. A visitor asks a question in the chat widget on your site.
 *   2. This Worker fetches your LIVE site's HTML, pulls out the text
 *      from About/Skills/Experience/Projects/Education (cached for an
 *      hour so it isn't re-fetched on every message).
 *   3. It sends that text + the visitor's question to Cloudflare's own
 *      Workers AI, with instructions to answer only from what's
 *      actually on your site.
 *   4. It returns the AI's answer to the widget.
 *
 * You never have to keep a separate copy of your resume content in
 * sync — whatever is live on your site is what the bot knows. And
 * because this uses Workers AI (built into Cloudflare), there's no
 * separate AI provider account or API key needed at all.
 *
 * SETUP — see chatbot/README.md for the full walkthrough. Quick version:
 *   1. Change SITE_URL below to your actual GitHub Pages URL.
 *   2. Change ALLOWED_ORIGIN below to that same URL (no trailing slash).
 *   3. Deploy this file to Cloudflare Workers.
 *   4. Add an "AI" binding to the Worker (Settings → Bindings → Add →
 *      Workers AI, variable name "AI"). No API key required.
 *   5. Copy the Worker's URL into chatbot-widget.js (WORKER_URL constant).
 */

// ---- Configuration — EDIT THESE TWO LINES -------------------------------
const SITE_URL = 'https://gnanaprakash04.github.io/Technical-Writer-Portfolio/';
const ALLOWED_ORIGIN = 'https://gnanaprakash04.github.io';
// ---------------------------------------------------------------------

const CONTEXT_CACHE_SECONDS = 3600; // re-fetch site content once an hour
const MODEL = '@cf/meta/llama-3.1-8b-instruct';

const SYSTEM_PROMPT_PREFIX = `You are a helpful assistant embedded on Gnanaprakash's technical writer portfolio website. You answer visitor questions about his background, skills, experience, and projects, using ONLY the information provided below from his site.

Rules:
- Answer only using the content below. If something isn't covered, say you don't have that information and suggest the visitor use the Contact section, rather than guessing or inventing details.
- Keep answers concise and conversational — a few sentences, not an essay, unless the visitor clearly wants detail.
- Speak about him in the third person ("He has 15+ years of experience...", not "I have...").
- Do not discuss anything unrelated to his professional background, this site, or how to get in touch with him.

--- SITE CONTENT ---
`;

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

async function extractSiteText(env) {
  const cache = caches.default;
  const cacheKey = new Request('https://cache-key.internal/portfolio-context');
  const cached = await cache.match(cacheKey);
  if (cached) {
    return await cached.text();
  }

  const res = await fetch(SITE_URL, { cf: { cacheTtl: 0 } });
  if (!res.ok) throw new Error('Could not fetch site content');

  const sectionIds = ['about', 'skills', 'experience', 'projects', 'awards', 'education'];
  const collected = [];
  let currentSection = null;
  let capturing = false;

  const rewriter = new HTMLRewriter()
    .on('script', { element(el) { el.remove(); } })
    .on('style', { element(el) { el.remove(); } })
    .on('section', {
      element(el) {
        const id = el.getAttribute('id');
        currentSection = sectionIds.includes(id) ? id : null;
        capturing = !!currentSection;
        if (capturing) collected.push(`\n## ${currentSection.toUpperCase()}\n`);
      },
    })
    .on('*', {
      text(text) {
        if (capturing && text.text.trim()) {
          collected.push(text.text.trim() + ' ');
        }
      },
    });

  const transformed = rewriter.transform(res);
  await transformed.text(); // drives the rewriter through the whole document

  const contextText = collected.join('').replace(/\s+/g, ' ').trim();

  await cache.put(
    cacheKey,
    new Response(contextText, {
      headers: { 'Cache-Control': `max-age=${CONTEXT_CACHE_SECONDS}` },
    })
  );

  return contextText;
}

async function handleChat(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  const question = (body.question || '').toString().trim().slice(0, 800);
  if (!question) {
    return new Response(JSON.stringify({ error: 'Question is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  let siteContext;
  try {
    siteContext = await extractSiteText(env);
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Sorry, I couldn't load the site content right now. Please try again shortly." }),
      { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
    );
  }

  let aiResult;
  try {
    aiResult = await env.AI.run(MODEL, {
      messages: [
        { role: 'system', content: SYSTEM_PROMPT_PREFIX + siteContext },
        { role: 'user', content: question },
      ],
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'The assistant is temporarily unavailable. Please try again shortly.' }),
      { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
    );
  }

  const answer = (aiResult && aiResult.response ? aiResult.response : '').trim();

  return new Response(JSON.stringify({ answer: answer || "Sorry, I couldn't come up with an answer to that." }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders() });
    }
    return handleChat(request, env);
  },
};
