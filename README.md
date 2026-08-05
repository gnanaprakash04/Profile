# Knowledge Base — how to add a resource

This folder powers the "Knowledge Base" section on your portfolio. There's no
server involved — the page just reads `manifest.json` and lists whatever is
in it, so adding a resource is a 3-step, no-code process:

1. Put the actual file (PDF, DOCX, etc.) in `knowledge-base/files/`.
   OR, if you just want to link to something online (an article, a doc site,
   a YouTube video), skip this step — you'll use its URL directly.

2. Open `knowledge-base/manifest.json` and add a new entry to the array,
   for example:

   {
     "title": "DITA Best Practices Guide",
     "description": "Notes and best practices I refer back to for structuring DITA topics and maps.",
     "type": "pdf",
     "tags": ["DITA", "Structured Authoring"],
     "url": "knowledge-base/files/dita-best-practices.pdf",
     "dateAdded": "2026-08-05"
   }

   - `type` is one of "pdf", "doc", or "link" — it just controls which icon shows.
   - `url` is either a relative path to a file in files/, or a full https:// link.
   - `dateAdded` controls sort order (newest first). Format: YYYY-MM-DD.

3. Commit and push (`git add`, `git commit`, `git push`) like normal.
   GitHub Pages redeploys automatically and the new item appears for everyone.

That's it — no rebuild step, no dashboard, no backend to maintain.

Note: this only works once the site is actually served over http(s)
(GitHub Pages, or a local dev server). Opening index.html directly as a
file:// URL will show the "still setting up" message, because browsers
block fetch() for local files as a security measure.
