# Portfolio RAG Chatbot — Setup Guide (Cloudflare-only, no separate AI account)

This adds a small chat widget to your site that answers visitor questions
using content pulled live from your own pages — powered entirely by
Cloudflare, including the AI itself. There are two parts:

- `worker.js` — runs on Cloudflare (fetches your site content, calls
  Cloudflare's built-in AI)
- `chatbot-widget.js` + `chatbot.css` — the chat bubble/panel on your site

You do **not** need an Anthropic, OpenAI, or any other AI provider
account for this version — Cloudflare Workers AI is bundled into the
same free Cloudflare account you're already creating for the Worker.

Total setup time: about 10–15 minutes, and it's free at portfolio
traffic levels (Workers AI's free allocation is 10,000 "neurons" per
day, which comfortably covers a personal site).

## 1. Create a Cloudflare Worker

1. Go to https://dash.cloudflare.com/sign-up and create a free account.
2. In the left sidebar, click **Workers & Pages** → **Create** →
   **Create Worker**.
3. Give it a name, e.g. `portfolio-chatbot`, and click **Deploy**. It
   deploys a placeholder "Hello World" Worker — that's expected.
4. Click **Edit code** to open the in-browser editor. Delete the
   placeholder code and paste in the full contents of `worker.js` from
   this folder.
5. Before saving, edit these two lines near the top of the file:

   ```js
   const SITE_URL = 'https://gnanaprakash04.github.io/Technical-Writer-Portfolio/';
   const ALLOWED_ORIGIN = 'https://gnanaprakash04.github.io';
   ```

   `SITE_URL` is the full address of your live site. `ALLOWED_ORIGIN`
   is just the domain (no trailing slash) — this stops other sites from
   using your Worker without permission.

6. Click **Save and deploy**.

## 2. Turn on Workers AI (this replaces needing an API key)

1. Go back to the Worker's main page and click the **Settings** tab.
2. Find **Bindings** (sometimes shown as "Variables and Bindings").
3. Click **Add** → look for **Workers AI** in the list → select it.
4. Set the variable name to exactly `AI` (this has to match `env.AI` in
   the code — it's already set up that way in `worker.js`).
5. Save. No key, no token, nothing else to configure — Cloudflare
   handles the authentication automatically because it's your own
   account's AI service.

## 3. Copy your Worker's URL

On the Worker's overview page, near the top, you'll see a URL like:

```
https://portfolio-chatbot.your-subdomain.workers.dev
```

Copy that — you'll need it in the next step.

## 4. Wire up the widget on your site

1. Copy `chatbot.css` and `chatbot-widget.js` into your site's repo,
   alongside `style.css` and `reveal.js`.
2. Open `chatbot-widget.js` and paste your Worker URL from step 3 into:

   ```js
   var WORKER_URL = 'https://portfolio-chatbot.your-subdomain.workers.dev';
   ```

3. In `index.html`, add these two lines:
   - In `<head>`, alongside your existing stylesheet link:
     ```html
     <link rel="stylesheet" href="chatbot.css">
     ```
   - Just before `</body>`, alongside your existing script tag:
     ```html
     <script src="chatbot-widget.js"></script>
     ```
4. Commit and push `index.html`, `chatbot.css`, and `chatbot-widget.js`
   like normal. `worker.js` doesn't go in your GitHub Pages repo at
   all — it only lives on Cloudflare.

## How it stays up to date

The Worker re-reads your live site's About/Skills/Experience/Projects/
Education sections every hour (cached in between). Whenever you update
your portfolio and push it, the chatbot picks up the changes within an
hour automatically — nothing extra to maintain.

## Testing it

Open your live site, click the 💬 button, and ask something like
"What tools does he use for documentation?" If you get a connection
error, check:

- The Worker URL in `chatbot-widget.js` matches exactly what Cloudflare
  gave you.
- `ALLOWED_ORIGIN` in `worker.js` matches your site's actual domain
  exactly (no trailing slash, correct `https://`).
- The `AI` binding is actually saved under the Worker's Settings →
  Bindings (this is the #1 thing to double check if you get a
  "temporarily unavailable" message).

## About answer quality

Llama 3.1 8B (the model this uses) is smaller and faster than models
like Claude or GPT-4, so answers may be a little less polished — but
for straightforward questions about your background and skills, it
does the job well and costs nothing. If you ever do want to switch to
Claude or another provider later for better answer quality, only
`worker.js` needs to change — the widget and your site stay exactly
the same.

## Cost expectations

$0/month at normal portfolio traffic. Workers AI's free daily
allocation is generous enough that a personal site is very unlikely to
exceed it.
