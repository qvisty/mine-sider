const { Octokit } = require("@octokit/rest");
const fs = require("fs");

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function run() {
  const { data: repos } = await octokit.repos.listForAuthenticatedUser({
    visibility: "public",
    per_page: 100,
    sort: "updated"
  });

  const pagesRepos = repos.filter(repo => repo.has_pages);

  let html = `<!DOCTYPE html>
<html lang="da">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mine GitHub Pages</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #f0f2f5;
      color: #1a1a2e;
      padding: 40px 20px;
    }
    .container { max-width: 1000px; margin: 0 auto; }
    header {
      text-align: center;
      margin-bottom: 40px;
    }
    h1 {
      font-size: 2.2em;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 8px;
    }
    .subtitle {
      color: #6b7280;
      font-size: 0.95em;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 24px;
    }
    .card {
      background: #fff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04);
      transition: transform 0.2s, box-shadow 0.2s;
      text-decoration: none;
      color: inherit;
      display: block;
    }
    .card:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.08);
    }
    .card-img {
      width: 100%;
      aspect-ratio: 16/10;
      object-fit: cover;
      display: block;
      background: #e5e7eb;
    }
    .card-body {
      padding: 16px 20px;
    }
    .card-title {
      font-size: 1.1em;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .card-url {
      font-size: 0.85em;
      color: #3b82f6;
      word-break: break-all;
    }
    .card-meta {
      font-size: 0.8em;
      color: #9ca3af;
      margin-top: 8px;
    }
    footer {
      text-align: center;
      margin-top: 48px;
      color: #9ca3af;
      font-size: 0.85em;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Mine GitHub Pages</h1>
      <p class="subtitle">Oversigt over mine projekter &middot; Opdateret ${new Date().toLocaleDateString("da-DK")}</p>
    </header>
    <div class="grid">\n`;

  pagesRepos.forEach(repo => {
    const url = `https://${repo.owner.login}.github.io/${repo.name}/`;
    const thumbUrl = `https://image.thum.io/get/width/600/crop/380/${url}`;
    const updated = new Date(repo.updated_at).toLocaleDateString("da-DK");
    const description = repo.description ? repo.description : '';
    html += `      <a class="card" href="${url}" target="_blank" rel="noopener">
        <img class="card-img" src="${thumbUrl}" alt="Skærmbillede af ${repo.name}" loading="lazy">
        <div class="card-body">
          <div class="card-title">${repo.name}</div>
          ${description ? `<div style="font-size:0.9em;color:#4b5563;margin-bottom:4px">${description}</div>` : ''}
          <div class="card-url">${url}</div>
          <div class="card-meta">Sidst opdateret: ${updated}</div>
        </div>
      </a>\n`;
  });

  html += `    </div>
    <footer>Genereret automatisk fra GitHub API</footer>
  </div>
</body>\n</html>`;
  fs.writeFileSync("index.html", html);
  console.log(`Fandt ${pagesRepos.length} Pages-repos.`);
}

run();
