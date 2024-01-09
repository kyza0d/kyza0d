/*
  Adapted version of b0o's readme update script
  https://github.com/b0o/b0o/blob/main/scripts/update.js

  Original Author: b0o
  GitHub Repository: https://github.com/b0o/b0o
*/

import fetch from "node-fetch";
import { promises as fs } from "fs";
import path from "path";

// Meta information for directory paths
const importMeta = import.meta;
const scriptsDir = path.dirname(importMeta.url.replace("file://", ""));
const baseDir = path.dirname(scriptsDir);

// Read configuration from file
import config from "./config.js";

// Cache for storing image URLs
const imgCache = new Map();

/**
 * Renders a cached image based on the provided details.
 * @param {Object} param0 - The details for rendering the image.
 * @returns {string} - The HTML string for the image.
 */
function renderCachedImage({ key, url, alt, fragment }) {
  imgCache.set(key, url);
  const cacheUrl = `https://raw.githubusercontent.com/${config.repo.base}/${config.repo.branch}/${config.imgDir}/${key}`;
  return `<img src="${cacheUrl}${
    fragment ? "#" + fragment : ""
  }" alt="${alt}">`;
}

/**
 * Renders a repository card.
 * @param {Object} param0 - Details of the repository.
 * @returns {string} - The HTML string for the repo card.
 */
function renderRepoCard({ user, repo, description, style }) {
  const search = new URLSearchParams({
    username: user,
    repo,
    show_owner: false,
    ...config.styles[style],
  });
  return `<a href="https://github.com/${user}/${repo}#gh-${style}-mode-only">${renderCachedImage(
    {
      key: `${user}-${repo}-${style}.svg`,
      url: `${config.api}/pin/?${search}`,
      alt: `${repo}: ${description}`,
      fragment: `gh-${style}-mode-only`,
    },
  )}</a>`;
}

/**
 * Renders a card for each style (light and dark).
 * @param {function} render - The render function.
 * @param {Object} details - The details for the card.
 * @returns {string} - The combined HTML string for both styles.
 */
function renderCardStyles(render, details) {
  return ["dark", "light"]
    .map((style) => render({ ...details, style }))
    .join("\n");
}

/**
 * Renders a section with given title and cards.
 * @param {Object} param0 - Details of the section.
 * @returns {string} - The HTML string for the section.
 */
function renderSection({ title, cards }) {
  const rowDivs = cards
    .reduce((rows, card, i) => {
      if (i % 2 === 0) rows.push([]);
      rows[rows.length - 1].push(renderNode(card));
      return rows;
    }, [])
    .map((row) => `<div float="left">${row.join("\n")}&nbsp;</div>`);

  return `${title ? `### ${title}\n\n` : ""}${rowDivs.join("\n")}\n`;
}

/**
 * Renders a node based on its kind.
 * @param {Object} param0 - The details of the node.
 * @returns {string} - The HTML string for the node.
 */
function renderNode({ kind, ...rest }) {
  switch (kind) {
    case "repo":
      return renderCardStyles(renderRepoCard, rest);
    case "section":
      return renderSection(rest);
    default:
      throw new Error(`Unknown card kind: ${kind}`);
  }
}

// Main process to generate content and handle images
async function main() {
  const content = config.data.map(renderNode).join("\n");

  for (const [key, url] of imgCache.entries()) {
    const imgPath = path.join(baseDir, config.imgDir, key);
    await fs.mkdir(path.dirname(imgPath), { recursive: true });

    console.log(`Fetching ${url}`);
    const img = await fetch(url);
    const buffer = await img.arrayBuffer();

    console.log(`Writing ${imgPath}`);
    await fs.writeFile(imgPath, Buffer.from(buffer));
  }

  console.log(`Writing README.md`);
  await fs.writeFile(path.join(baseDir, "README.md"), content);
}

main();
