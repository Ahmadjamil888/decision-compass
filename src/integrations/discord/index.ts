// Discord integration for IMOS
// Handles OAuth and API interactions with Discord

export type DiscordConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

export type DiscordUser = {
  id: string;
  username: string;
  discriminator: string;
  globalName: string | null;
  email: string | null;
  avatarUrl: string | null;
};

export type DiscordGuild = {
  id: string;
  name: string;
  icon: string | null;
};

export type DiscordChannel = {
  id: string;
  guildId: string;
  name: string;
  type: number;
};

export type DiscordMessage = {
  id: string;
  content: string;
  author: DiscordUser;
  timestamp: string;
  channelId: string;
  guildId: string | null;
};

export type DiscordIntegration = {
  getAuthUrl: (state: string) => string;
  exchangeCodeForToken: (code: string) => Promise<string>;
  getUser: (token: string) => Promise<DiscordUser>;
  getGuilds: (token: string) => Promise<DiscordGuild[]>;
  getChannels: (token: string, guildId: string) => Promise<DiscordChannel[]>;
  getChannelMessages: (token: string, channelId: string, options?: { limit?: number; before?: string }) => Promise<DiscordMessage[]>;
};

export function createDiscordIntegration(config: DiscordConfig): DiscordIntegration {
  return {
    getAuthUrl: (state: string) => {
      const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        scope: "identify guilds.read",
        state,
      });
      return `https://discord.com/oauth2/authorize?${params}`;
    },

    exchangeCodeForToken: async (code: string) => {
      const res = await fetch("https://discord.com/api/oauth2/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          code,
          redirect_uri: config.redirectUri,
          grant_type: "authorization_code",
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data.access_token;
    },

    getUser: async (token: string) => {
      const res = await fetch("https://discord.com/api/users/@me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },

    getGuilds: async (token: string) => {
      const res = await fetch("https://discord.com/api/users/@me/guilds", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },

    getChannels: async (token: string, guildId: string) => {
      const res = await fetch(`https://discord.com/api/guilds/${guildId}/channels`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },

    getChannelMessages: async (token: string, channelId: string, options?: { limit?: number; before?: string }) => {
      const params = new URLSearchParams();
      if (options?.limit) params.set("limit", String(options.limit));
      if (options?.before) params.set("before", options.before);
      const res = await fetch(`https://discord.com/api/channels/${channelId}/messages?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
  };
}
