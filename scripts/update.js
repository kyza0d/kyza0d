/*
  Adapted version of b0o's readme update script
  https://github.com/b0o/b0o/blob/main/scripts/update.js

  Original Author: b0o
  GitHub Repository: https://github.com/b0o/b0o
*/

import fetch from "node-fetch";
import { promises as fs } from "fs";
import path from "path";

const importMeta = import.meta;
const scriptsDir = path.dirname(importMeta.url.replace("file://", ""));
const baseDir = path.dirname(scriptsDir);

/**
 * Configuration settings for the script.
 * @type {{
 *   repo: { base: string, branch: string },
 *   imgDir: string,
 *   api: string,
 *   styles: { light: {}, dark: {} }
 * }}
 */
const conf = {
  repo: { base: "kyza0d/kyza0d", branch: "master" },
  imgDir: "images",
  api: "https://github-readme-stats-smoky-three-21.vercel.app/api",
  styles: {
    light: {},
    dark: {
      title_color: "58a6ff",
      text_color: "adbac7",
      bg_color: "00000000",
      border_color: "444c56",
    },
  },
};

/**
 * Data to be rendered in the README file.
 * @type {Array<{ kind: string, title?: string, cards: Array<any> }>}
 */
const data = [
  {
    kind: "section",
    title: "Test",
    cards: [
      { kind: "repo", user: "kyza0d", repo: "indexr", description: "test" },
      {
        kind: "repo",
        user: "kyza0d",
        repo: "class-scraper",
        description: "test",
      },
    ],
  },
];

/**
 * Map to cache rendered images.
 * @type {Map<string, string>}
 */
const imgCache = new Map();

/**
 * Render a cached image and update the cache.
 * @param {{ key: string, url: string, alt: string, fragment: string }} param0
 * @returns {string}
 */
function renderCachedImage({ key, url, alt, fragment }) {
  imgCache.set(key, url);
  const cacheUrl = `https://raw.githubusercontent.com/${conf.repo.base}/${conf.repo.branch}/${conf.imgDir}/${key}`;
  return `<img src="${cacheUrl}${
    fragment ? "#" + fragment : ""
  }" alt="${alt}">`;
}

/**
 * Render a repository card with different styles.
 * @param {{ user: string, repo: string, description: string, style: string }} param0
 * @returns {string}
 */
function renderRepoCard({ user, repo, description, style }) {
  const search = new URLSearchParams({
    username: user,
    repo,
    show_owner: true,
    ...conf.styles[style],
  });
  return [
    `<a href="https://github.com/${user}/${repo}#gh-${style}-mode-only">`,
    renderCachedImage({
      key: `${user}-${repo}-${style}.svg`,
      url: `${conf.api}/pin/?${search}`,
      alt: `${repo}: ${description}`,
      fragment: `gh-${style}-mode-only`,
    }),
    `</a>`,
  ].join("");
}

/**
 * Render a user card with different styles.
 * @param {{ user: string, description: string, style: string }} param0
 * @returns {string}
 */
function renderUserCardStyle({ user, description, style }) {
  const search = new URLSearchParams({
    username: user,
    show_icons: true,
    include_all_commits: true,
    ...conf.styles[style],
  });
  return [
    `<a href="https://github.com/${user}#gh-${style}-mode-only">`,
    renderCachedImage({
      key: `${user}-${style}.svg`,
      url: `${conf.api}/?${search}`,
      alt: `${user}: ${description}`,
      fragment: `gh-${style}-mode-only`,
    }),
    `</a>`,
  ].join("");
}

/**
 * Render card styles for both light and dark modes.
 * @param {Function} render
 * @param {{ user: string, repo: string, description: string }} param0
 * @returns {string}
 */
function renderCardStyles(render, { user, repo, description }) {
  return [
    render({ user, repo, description, style: "dark" }),
    render({ user, repo, description, style: "light" }),
  ].join("\n");
}

/**
 * Render a section with cards.
 * @param {{ title?: string, cards: Array<any> }} param0
 * @returns {string}
 */
function renderSection({ title, cards }) {
  const rows = cards.reduce((rows, card, i) => {
    if (i % 2 === 0) rows.push([]);
    rows[rows.length - 1].push(renderNode(card));
    return rows;
  }, []);

  const rowDivs = rows.map((row) =>
    [`<div float="left">`, ...row, `&nbsp;</div>`].join("\n"),
  );
  return [title ? `### ${title}\n\n` : "", ...rowDivs, "\n"].join("");
}

/**
 * Render a node based on its kind.
 * @param {{ kind: string }} param0
 * @returns {string}
 */
function renderNode({ kind, ...rest }) {
  switch (kind) {
    case "repo":
      return renderCardStyles(renderRepoCard, rest);
    case "user":
      return renderCardStyles(renderUserCardStyle, rest);
    case "separator":
      return "---\n";
    case "section":
      return renderSection(rest);
    default:
      throw new Error(`Unknown card kind: ${kind}`);
  }
}

/**
 * Generate the content to be written to the README file.
 * @type {string}
 */
const content = data.map(renderNode).join("\n");

/**
 * Process and write images to the cache.
 */
for (const [key, url] of imgCache.entries()) {
  const imgPath = path.join(baseDir, conf.imgDir, key);
  const imgDir = path.dirname(imgPath);
  await fs.mkdir(imgDir, { recursive: true });

  console.log(`Fetching ${url}`);

  const img = await fetch(url);
  const buffer = await img.arrayBuffer();

  console.log(`Writing ${imgPath}`);

  await fs.writeFile(imgPath, Buffer.from(buffer));
}

console.log(`Writing README.md`);
await fs.writeFile(path.join(baseDir, "README.md"), content);
