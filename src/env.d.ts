/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  readonly LIVEKIT_URL: string;
  readonly LIVEKIT_API_KEY: string;
  readonly LIVEKIT_API_SECRET: string;
  readonly LIVEKIT_ROOM: string;
  readonly LIVEKIT_PARTICIPANT_PREFIX: string;
}
/// <reference types="astro/client" />