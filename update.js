const { Octokit } = require("@octokit/rest");
const fs = require("fs");

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const shouldSyncWebsite = process.env.SYNC_REPO_WEBSITE !== "false";

async function getPublishedUrl(repo) {
  const fallbackUrl = `https://${repo.owner.login}.github.io/${repo.name}/`;

  try {
    const { data: pages } = await octokit.repos.getPages({
      owner: repo.owner.login,
      repo: repo.name
    });
    return pages.html_url || fallbackUrl;
  } catch (error) {
    console.warn(`Kunne ikke hente Pages-URL for ${repo.full_name}: ${error.message}`);
    return fallbackUrl;
  }
}

async function syncRepoWebsiteField(repo, publishedUrl) {
  const currentWebsite = (repo.homepage || "").trim();

  if (!shouldSyncWebsite) {
    return;
  }

  if (currentWebsite === publishedUrl) {
    return;
  }

  await octokit.repos.update({
    owner: repo.owner.login,
    repo: repo.name,
    homepage: publishedUrl
  });

  console.log(`Opdaterede Website-feltet for ${repo.full_name} -> ${publishedUrl}`);
}

async function run() {
  const { data: currentUser } = await octokit.users.getAuthenticated();
  const { data: repos } = await octokit.repos.listForAuthenticatedUser({
    visibility: "public",
    affiliation: "owner",
    per_page: 100,
    sort: "updated"
  });

  const pagesRepos = repos.filter(
    repo => repo.has_pages && repo.owner.login === currentUser.login
  );

  const publishedUrls = new Map();
  for (const repo of pagesRepos) {
    const publishedUrl = await getPublishedUrl(repo);
    publishedUrls.set(repo.full_name, publishedUrl);
    await syncRepoWebsiteField(repo, publishedUrl);
  }

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
      position: relative;
    }
    .card:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.08);
    }
    .card-link {
      text-decoration: none;
      color: inherit;
      display: block;
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
    .repo-link {
      position: absolute;
      top: 10px;
      right: 10px;
      width: 34px;
      height: 34px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 999px;
      background: rgba(17, 24, 39, 0.86);
      color: #fff;
      box-shadow: 0 2px 10px rgba(0,0,0,0.18);
      z-index: 2;
      transition: background 0.2s, transform 0.2s;
    }
    .repo-link:hover {
      background: rgba(17, 24, 39, 1);
      transform: scale(1.05);
    }
    .repo-link svg {
      width: 18px;
      height: 18px;
      fill: currentColor;
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
    const url = publishedUrls.get(repo.full_name) || `https://${repo.owner.login}.github.io/${repo.name}/`;
    const thumbUrl = `https://image.thum.io/get/width/600/crop/380/${url}`;
    const repoUrl = repo.html_url;
    const updated = new Date(repo.updated_at).toLocaleDateString("da-DK");
    const description = repo.description ? repo.description : '';
    html += `      <div class="card">
        <a class="repo-link" href="${repoUrl}" target="_blank" rel="noopener" aria-label="Åbn ${repo.name} på GitHub">
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0C3.58 0 0 3.67 0 8.2c0 3.63 2.29 6.71 5.47 7.8.4.08.55-.18.55-.4 0-.2-.01-.87-.01-1.58-2.01.38-2.53-.51-2.69-.98-.09-.24-.48-.98-.82-1.18-.28-.16-.68-.56-.01-.57.63-.01 1.08.59 1.23.83.72 1.24 1.87.89 2.33.67.07-.54.28-.89.5-1.09-1.78-.2-3.64-.92-3.64-4.1 0-.91.31-1.65.82-2.24-.08-.2-.36-1.03.08-2.14 0 0 .67-.22 2.2.85A7.38 7.38 0 0 1 8 3.28c.68 0 1.37.09 2.01.27 1.53-1.07 2.2-.85 2.2-.85.44 1.11.16 1.94.08 2.14.51.59.82 1.33.82 2.24 0 3.19-1.87 3.9-3.65 4.1.29.26.54.77.54 1.56 0 1.13-.01 2.04-.01 2.32 0 .22.14.49.55.4A8.18 8.18 0 0 0 16 8.2C16 3.67 12.42 0 8 0Z"></path></svg>
        </a>
        <a class="card-link" href="${url}" target="_blank" rel="noopener">
          <img class="card-img" src="${thumbUrl}" alt="Skærmbillede af ${repo.name}" loading="lazy">
          <div class="card-body">
            <div class="card-title">${repo.name}</div>
            ${description ? `<div style="font-size:0.9em;color:#4b5563;margin-bottom:4px">${description}</div>` : ''}
            <div class="card-url">${url}</div>
            <div class="card-meta">Sidst opdateret: ${updated}</div>
          </div>
        </a>
      </div>\n`;
  });

  html += `    </div>\n`;

  // Eksterne sider fra JSON-fil
  const externalPath = "external-sites.json";
  if (fs.existsSync(externalPath)) {
    const externalSites = JSON.parse(fs.readFileSync(externalPath, "utf8"));
    if (externalSites.length > 0) {
      html += `    <h2 style="margin-top:48px;margin-bottom:24px;font-size:1.6em;font-weight:700;color:#1a1a2e">Mine eksterne sider</h2>
    <div class="grid">\n`;
      externalSites.forEach(site => {
        const thumbUrl = `https://image.thum.io/get/width/600/crop/380/${site.url}`;
        html += `      <div class="card">
        <a class="card-link" href="${site.url}" target="_blank" rel="noopener">
          <img class="card-img" src="${thumbUrl}" alt="Skærmbillede af ${site.name}" loading="lazy">
          <div class="card-body">
            <div class="card-title">${site.name}</div>
            ${site.description ? `<div style="font-size:0.9em;color:#4b5563;margin-bottom:4px">${site.description}</div>` : ''}
            <div class="card-url">${site.url}</div>
          </div>
        </a>
      </div>\n`;
      });
      html += `    </div>\n`;
      console.log(`Fandt ${externalSites.length} eksterne sider.`);
    }
  }

  html += `    <footer>Genereret automatisk fra GitHub API</footer>
  </div>
</body>\n</html>`;
  fs.writeFileSync("index.html", html);
  console.log(`Fandt ${pagesRepos.length} Pages-repos.`);
  if (!shouldSyncWebsite) {
    console.log("Website-felt synkronisering er slået fra (SYNC_REPO_WEBSITE=false).");
  }
}

run();
