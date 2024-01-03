import fetch from "node-fetch";
import fs from "fs/promises";
import path from "path";

/** @type {string} Base path for current script */
const basePath = path.resolve(process.cwd());

/** @type {Object} The configuration object */
const conf = JSON.parse(
  await fs.readFile(path.join(basePath, "scripts", "config.json"), "utf8"),
);

/**
 * Fetch repository details from GitHub API.
 *
 * @param {string} repo Github repository in the format "owner/repo".
 * @returns {Promise<Object>} The repository details.
 */
async function fetchRepoDetails(repo) {
  const response = await fetch(`https://api.github.com/repos/${repo}`);

  if (!response.ok) {
    throw new Error(
      `Error fetching repository ${repo}: HTTP ${response.status}`,
    );
  }

  return response.json();
}

/**
 * Generate an HTML link to a repository with its image.
 *
 * @param {Object} repoData Repository data.
 * @param {string} repoData.name Repository name.
 * @param {string} repoData.description Repository description.
 * @returns {string} Generated HTML.
 */
function renderRepoCard({ name, description }) {
  const [user, repo] = name.split("/");

  const imageUrl = `https://raw.githubusercontent.com/${user}/${user}/main/assets/${repo}.svg`;
  const repoUrl = `https://github.com/${user}/${repo}`;

  return `<a href="${repoUrl}"><img src="${imageUrl}" alt="${repo}: ${description}"></a>`;
}

/**
 * Fetch rendered section
 * @returns {Promise<string>} Rendered markdown string
 */
async function renderData() {
  const sections = [];

  for (const repo of conf.data) {
    const details = await fetchRepoDetails(repo.name);

    sections.push(renderRepoCard(details));
  }

  return sections.join("\n") + "\n";
}

(async () => {
  console.log("Writing README.md with data from", conf.data);

  const data = await renderData();

  await fs.writeFile(path.join(basePath, "README.md"), data);
})();
