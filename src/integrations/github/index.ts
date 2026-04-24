// GitHub integration for IMOS
// Handles OAuth, webhook processing, and API interactions with GitHub

export type GitHubConfig = {
  clientId: string;
  clientSecret: string;
  webhookSecret: string;
  redirectUri: string;
};

export type GitHubUser = {
  id: string;
  login: string;
  name: string | null;
  email: string | null;
  avatarUrl: string;
};

export type PullRequest = {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: "open" | "closed" | "merged";
  author: GitHubUser;
  createdAt: string;
  updatedAt: string;
  baseBranch: string;
  headBranch: string;
  repository: string;
  url: string;
};

export type ReviewComment = {
  id: string;
  body: string;
  author: GitHubUser;
  createdAt: string;
  path: string;
  line: number | null;
};

export type GitHubIntegration = {
  getAuthUrl: (state: string) => string;
  exchangeCodeForToken: (code: string) => Promise<string>;
  getUser: (token: string) => Promise<GitHubUser>;
  listPullRequests: (token: string, owner: string, repo: string) => Promise<PullRequest[]>;
  getPullRequestComments: (token: string, owner: string, repo: string, prNumber: number) => Promise<ReviewComment[]>;
  createWebhook: (token: string, owner: string, repo: string, webhookUrl: string) => Promise<void>;
};

export function createGitHubIntegration(config: GitHubConfig): GitHubIntegration {
  return {
    getAuthUrl: (state: string) => {
      const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        scope: "repo:read read:user",
        state,
      });
      return `https://github.com/login/oauth/authorize?${params}`;
    },

    exchangeCodeForToken: async (code: string) => {
      const res = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          code,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error_description);
      return data.access_token;
    },

    getUser: async (token: string) => {
      const res = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      return res.json();
    },

    listPullRequests: async (token: string, owner: string, repo: string) => {
      const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls?state=open&sort=updated`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );
      return res.json();
    },

    getPullRequestComments: async (token: string, owner: string, repo: string, prNumber: number) => {
      const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/comments`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );
      return res.json();
    },

    createWebhook: async (token: string, owner: string, repo: string, webhookUrl: string) => {
      await fetch(`https://api.github.com/repos/${owner}/${repo}/hooks`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/vnd.github.v3+json",
        },
        body: JSON.stringify({
          name: "web",
          active: true,
          events: ["pull_request", "pull_request_review_comment"],
          config: {
            url: webhookUrl,
            content_type: "json",
            secret: config.webhookSecret,
          },
        }),
      });
    },
  };
}
