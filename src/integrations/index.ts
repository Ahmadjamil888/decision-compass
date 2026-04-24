// IMOS Integration Registry
// Pre-setup integrations for apps, messages, chats, meetings, and GitHub

export { createGitHubIntegration, type GitHubConfig, type GitHubUser, type PullRequest, type ReviewComment } from "./github";
export { createSlackIntegration, type SlackConfig, type SlackUser, type SlackChannel, type SlackMessage } from "./slack";
export { createTeamsIntegration, type TeamsConfig, type TeamsUser, type TeamsChannel, type TeamsMessage, type TeamsChat } from "./teams";
export { createDiscordIntegration, type DiscordConfig, type DiscordUser, type DiscordGuild, type DiscordChannel, type DiscordMessage } from "./discord";
export { createZoomIntegration, type ZoomConfig, type ZoomUser, type ZoomMeeting, type ZoomRecording, type ZoomTranscript } from "./zoom";

export type IntegrationSource = "github" | "slack" | "teams" | "discord" | "zoom";

export type IntegrationMessage = {
  source: IntegrationSource;
  sourceId: string;
  content: string;
  author: string;
  timestamp: string;
  channel?: string;
  threadId?: string;
  raw?: unknown;
};

export type IntegrationConfig = {
  github?: {
    clientId: string;
    clientSecret: string;
    webhookSecret: string;
    redirectUri: string;
  };
  slack?: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
  teams?: {
    clientId: string;
    clientSecret: string;
    tenantId: string;
    redirectUri: string;
  };
  discord?: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
  zoom?: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
};
