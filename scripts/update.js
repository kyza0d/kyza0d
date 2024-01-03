import fetch from "node-fetch";
import fs from "node:fs/promises";
import path from "node:path";

const importMeta = import.meta;
const scriptsDir = path.dirname(importMeta.url.replace("file://", ""));
const baseDir = path.dirname(scriptsDir);

const conf = {
  repo: {
    base: "kyza0d/kyza0d",
    branch: "master",
  },
  imgDir: "images",
  api: "https://github-readme-stats-2fx07k9xc-evan-leigh.vercel.app/api",
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

const data = [
  {
    kind: "section",
    title: "Test",
    cards: [
      {
        kind: "repo",
        user: "kyza0d",
        repo: "indexr",
        description: "test",
      },
      {
        kind: "repo",
        user: "kyza0d",
        repo: "class-scraper",
        description: "test",
      },
    ],
  },
];

const imgCache = new Map();

function renderCachedImage({ key, url, alt, fragment }) {
  imgCache.set(key, url);
  const cacheUrl = `https://raw.githubusercontent.com/${conf.repo.base}/${conf.repo.branch}/${conf.imgDir}/${key}`;
  return `<img src="${cacheUrl}${
    fragment ? "#" + fragment : ""
  }" alt="${alt}">`;
}

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

function renderCardStyles(render, { user, repo, description }) {
  return [
    render({ user, repo, description, style: "dark" }),
    render({ user, repo, description, style: "light" }),
  ].join("\n");
}

function renderSection({ title, cards }) {
  const rows = cards.reduce((rows, card, i) => {
    if (i % 2 === 0) {
      rows.push([]);
    }
    rows[rows.length - 1].push(renderNode(card));
    return rows;
  }, []);
  const rowDivs = rows.map((row) => {
    return [
      `<div float="left">`,
      `${row.join("\n&nbsp;\n")}`,
      `&nbsp;`,
      `</div>`,
    ].join("\n");
  });
  return [title ? `### ${title}\n\n` : "", ...rowDivs, "\n"].join("");
}

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

const content = data.map(renderNode).join("\n");

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
