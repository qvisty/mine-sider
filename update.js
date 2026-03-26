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
  <title>Mine GitHub Pages</title>
  <style>
    body { font-family: sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
    h1 { border-bottom: 2px solid #333; padding-bottom: 10px; }
    .project { margin-bottom: 15px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
    .project strong { display: block; margin-bottom: 4px; }
    a { color: #0066cc; }
    .updated { font-size: 0.85em; color: #666; margin-top: 4px; }
  </style>
</head>
<body>
  <h1>Mine GitHub Pages</h1>
  <p>Sidst opdateret: ${new Date().toLocaleDateString("da-DK")}</p>\n`;

  pagesRepos.forEach(repo => {
    const url = `https://${repo.owner.login}.github.io/${repo.name}/`;
    const updated = new Date(repo.updated_at).toLocaleDateString("da-DK");
    html += `  <div class="project">
    <strong>${repo.name}</strong>
    <a href="${url}">${url}</a>
    <div class="updated">Sidst opdateret: ${updated}</div>
  </div>\n`;
  });

  html += `</body>\n</html>`;
  fs.writeFileSync("index.html", html);
  console.log(`Fandt ${pagesRepos.length} Pages-repos.`);
}

run();
