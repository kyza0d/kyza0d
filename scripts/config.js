export default {
  repo: {
    base: "kyza0d/kyza0d",
    branch: "master",
  },
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
  data: [
    {
      kind: "section",
      title: "Web Development",
      cards: [
        {
          kind: "repo",
          user: "kyza0d",
          repo: "portfolio",
          description: "",
        },
      ],
    },
    {
      kind: "section",
      title: "Neovim Plugins",
      cards: [
        {
          kind: "repo",
          user: "kyza0d",
          repo: "abstract.nvim",
          description: "",
        },
      ],
    },
  ],
};
