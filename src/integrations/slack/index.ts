// Slack integration for IMOS
// Handles OAuth, message streaming, and API interactions with Slack

export type SlackConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  botToken?: string;
};

export type SlackUser = {
  id: string;
  name: string;
  realName: string | null;
  email: string | null;
  avatarUrl: string;
};

export type SlackChannel = {
  id: string;
  name: string;
  isPrivate: boolean;
};

export type SlackMessage = {
  ts: string;
  text: string;
  user: string;
  threadTs?: string;
  replyCount?: number;
};

export type SlackIntegration = {
  getAuthUrl: (state: string) => string;
  exchangeCodeForToken: (code: string) => Promise<{ accessToken: string; teamId: string }>;
  getUser: (token: string, userId?: string) => Promise<SlackUser>;
  getChannels: (token: string) => Promise<SlackChannel[]>;
  getChannelMessages: (token: string, channelId: string, options?: { oldest?: string; latest?: string; limit?: number }) => Promise<SlackMessage[]>;
  getThreadMessages: (token: string, channelId: string, threadTs: string) => Promise<SlackMessage[]>;
  searchMessages: (token: string, query: string, options?: { count?: number }) => Promise<{ messages: SlackMessage[] }>;
};

export function createSlackIntegration(config: SlackConfig): SlackIntegration {
  return {
    getAuthUrl: (state: string) => {
      const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        scope: "channels:read groups:read users:read chat:write searches:read",
        state,
      });
      return `https://slack.com/oauth/v2/authorize?${params}`;
    },

    exchangeCodeForToken: async (code: string) => {
      const res = await fetch("https://slack.com/api/oauth.v2.access", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          code,
          redirect_uri: config.redirectUri,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "OAuth exchange failed");
      return {
        accessToken: data.access_token,
        teamId: data.team.id,
      };
    },

    getUser: async (token: string, userId?: string) => {
      const endpoint = userId ? "users.info" : "auth.test";
      const res = await fetch(`https://slack.com/api/${endpoint}?${userId ? `user=${userId}` : ""}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      const user = userId ? data.user : data;
      return {
        id: user.id,
        name: user.name,
        realName: user.real_name,
        email: user.profile?.email,
        avatarUrl: user.profile?.image_192,
      };
    },

    getChannels: async (token: string) => {
      const res = await fetch("https://slack.com/api/conversations.list", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      return data.channels.map((ch: { id: string; name: string; is_private: boolean }) => ({
        id: ch.id,
        name: ch.name,
        isPrivate: ch.is_private,
      }));
    },

    getChannelMessages: async (token: string, channelId: string, options?: { oldest?: string; latest?: string; limit?: number }) => {
      const params = new URLSearchParams({ channel: channelId, ...Object.fromEntries(Object.entries(options || {}).filter(([,v]) => v !== undefined)) });
      const res = await fetch(`https://slack.com/api/conversations.history?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      return data.messages;
    },

    getThreadMessages: async (token: string, channelId: string, threadTs: string) => {
      const params = new URLSearchParams({ channel: channelId, thread_ts: threadTs });
      const res = await fetch(`https://slack.com/api/conversations.replies?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      return data.messages;
    },

    searchMessages: async (token: string, query: string, options?: { count?: number }) => {
      const res = await fetch("https://slack.com/api/search.messages", {
        headers: { Authorization: `Bearer ${token}` },
        body: new URLSearchParams({ query, count: String(options?.count || 100) }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      return data;
    },
  };
}
