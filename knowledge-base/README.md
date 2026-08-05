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

   - `type` is one of "pdf", "doc", "video", or "link" — it controls the
     icon shown, and for video, whether it plays inline.
   - `url` is either a relative path to a file in files/, or a full
     https:// link.
   - `dateAdded` controls sort order (newest first). Format: YYYY-MM-DD.

## Adding a PDF

Exactly like the example above: drop the PDF in `knowledge-base/files/`,
set `"type": "pdf"`, and point `url` at it. Clicking the card opens/downloads
it — browsers show PDFs inline by default, so most visitors will just read
it in a new tab.

## Adding a video

Video needs a different approach because of file size — GitHub hard-caps
individual files at 100MB (and *strongly* discourages anything over ~25MB,
since every clone of the repo downloads it). Two options:

**Option A — host it on YouTube/Vimeo (recommended for anything more than
a couple of minutes long).** Upload it there (can be unlisted if you don't
want it public outside your site), then add an entry like:

   {
     "title": "How I Structure a User Guide",
     "description": "A short walkthrough of my documentation planning process.",
     "type": "video",
     "tags": ["Process", "Walkthrough"],
     "url": "https://www.youtube.com/watch?v=XXXXXXXXXXX",
     "dateAdded": "2026-08-05"
   }

   This shows a "▶ Watch video" button that opens YouTube in a new tab.

**Option B — self-host a short clip directly in the repo.** Only for small
files (a minute or two, ideally under 20–30MB). Export as .mp4, drop it in
`knowledge-base/files/`, and reference it the same way as a PDF:

   {
     "title": "Quick Demo: Screen Recording a Feature",
     "description": "A 90-second example of a walkthrough clip for a release note.",
     "type": "video",
     "tags": ["Camtasia", "Demo"],
     "url": "knowledge-base/files/quick-demo.mp4",
     "dateAdded": "2026-08-05"
   }

   Because the URL ends in .mp4 (also works with .webm/.mov/.ogv), the
   page detects it's a real video file and plays it right there in the
   card with native controls — no click-through needed.

3. Commit and push (`git add`, `git commit`, `git push`) like normal.
   GitHub Pages redeploys automatically and the new item appears for everyone.

That's it — no rebuild step, no dashboard, no backend to maintain.

Note: this only works once the site is actually served over http(s)
(GitHub Pages, or a local dev server). Opening index.html directly as a
file:// URL will show the "still setting up" message, because browsers
block fetch() for local files as a security measure.
