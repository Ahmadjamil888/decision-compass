// Microsoft Teams integration for IMOS
// Handles OAuth and API interactions with Microsoft Teams

export type TeamsConfig = {
  clientId: string;
  clientSecret: string;
  tenantId: string;
  redirectUri: string;
};

export type TeamsUser = {
  id: string;
  displayName: string;
  email: string;
  userPrincipalName: string;
};

export type TeamsChannel = {
  id: string;
  displayName: string;
  description: string;
};

export type TeamsMessage = {
  id: string;
  body: { content: string };
  from: { user: TeamsUser };
  createdDateTime: string;
  subject?: string;
};

export type TeamsChat = {
  id: string;
  topic?: string;
  createdDateTime: string;
  lastUpdatedDateTime: string;
};

export type TeamsIntegration = {
  getAuthUrl: (state: string) => string;
  exchangeCodeForToken: (code: string) => Promise<{ accessToken: string; expiresIn: number }>;
  getUser: (token: string) => Promise<TeamsUser>;
  getChats: (token: string) => Promise<TeamsChat[]>;
  getChatMessages: (token: string, chatId: string) => Promise<TeamsMessage[]>;
  sendMessage: (token: string, chatId: string, content: string) => Promise<void>;
};

export function createTeamsIntegration(config: TeamsConfig): TeamsIntegration {
  const getTokenUrl = () =>
    `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`;

  return {
    getAuthUrl: (state: string) => {
      const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        scope: "Chat.Read Chat.ReadWrite User.Read",
        response_type: "code",
        state,
      });
      return `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/authorize?${params}`;
    },

    exchangeCodeForToken: async (code: string) => {
      const res = await fetch(getTokenUrl(), {
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
      if (data.error) throw new Error(data.error_description);
      return {
        accessToken: data.access_token,
        expiresIn: data.expires_in,
      };
    },

    getUser: async (token: string) => {
      const res = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },

    getChats: async (token: string) => {
      const res = await fetch("https://graph.microsoft.com/v1.0/me/chats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      return data.value || [];
    },

    getChatMessages: async (token: string, chatId: string) => {
      const res = await fetch(
        `https://graph.microsoft.com/v1.0/me/chats/${chatId}/messages`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      return data.value || [];
    },

    sendMessage: async (token: string, chatId: string, content: string) => {
      await fetch(`https://graph.microsoft.com/v1.0/me/chats/${chatId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ body: { content } }),
      });
    },
  };
}
