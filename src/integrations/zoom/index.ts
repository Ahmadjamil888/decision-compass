// Zoom integration for IMOS
// Handles OAuth and API interactions with Zoom Meetings

export type ZoomConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

export type ZoomUser = {
  id: string;
  email: string;
  displayName: string;
  firstName: string;
  lastName: string;
  accountId: string;
};

export type ZoomMeeting = {
  id: string;
  topic: string;
  startTime: string;
  duration: number;
  joinUrl: string;
  hostEmail: string;
  type: 1 | 2 | 3 | 8;
};

export type ZoomRecording = {
  id: string;
  meetingId: string;
  recordingStart: string;
  recordingEnd: string;
  fileType: string;
  fileSize: number;
  downloadUrl: string;
};

export type ZoomTranscript = {
  id: string;
  meetingId: string;
  duration: number;
  transcriptContent: string;
};

export type ZoomIntegration = {
  getAuthUrl: (state: string) => string;
  exchangeCodeForToken: (code: string) => Promise<{ accessToken: string; expiresIn: number }>;
  getUser: (token: string, userId?: string) => Promise<ZoomUser>;
  listMeetings: (token: string, userId?: string) => Promise<ZoomMeeting[]>;
  getMeetingRecordings: (token: string, meetingId: string) => Promise<ZoomRecording[]>;
  getMeetingTranscripts: (token: string, meetingId: string) => Promise<ZoomTranscript[]>;
  getMeetingParticipants: (token: string, meetingId: string) => Promise<{ participants: { name: string; email: string }[] }>;
};

export function createZoomIntegration(config: ZoomConfig): ZoomIntegration {
  const getTokenUrl = () =>
    `https://zoom.us/oauth/token`;

  return {
    getAuthUrl: (state: string) => {
      const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        response_type: "code",
        state,
      });
      return `https://zoom.us/oauth/authorize?${params}`;
    },

    exchangeCodeForToken: async (code: string) => {
      const res = await fetch(getTokenUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${btoa(`${config.clientId}:${config.clientSecret}`)}`,
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: config.redirectUri,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error_description);
      return {
        accessToken: data.access_token,
        expiresIn: data.expires_in,
      };
    },

    getUser: async (token: string, userId: string = "me") => {
      const res = await fetch(`https://api.zoom.us/v2/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },

    listMeetings: async (token: string, userId: string = "me") => {
      const res = await fetch(`https://api.zoom.us/v2/users/${userId}/meetings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      return data.meetings || [];
    },

    getMeetingRecordings: async (token: string, meetingId: string) => {
      const res = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}/recordings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },

    getMeetingTranscripts: async (token: string, meetingId: string) => {
      const res = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}/recordings/transcription`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },

    getMeetingParticipants: async (token: string, meetingId: string) => {
      const res = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}/participants`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
  };
}
