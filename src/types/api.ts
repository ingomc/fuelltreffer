// TypeScript interfaces based on the 2k Software API response schema

export interface PlayingVenue {
  id: number;
  name: string;
  locationCity: string;
  locationPostalCode: string;
  locationStreet: string;
  isActive: boolean;
}

export interface TeamMember {
  id: number;
  displayName: string;
  currentPosition: string;
  paid: boolean;
  present: boolean;
  deregistered: boolean;
  retired: boolean;
  rankingPos: number;
}

export interface TeamSeason {
  id: number;
  playingVenue: PlayingVenue;
  name: string;
  weekTypeCdMatch: string;
  weekdayMatch: number;
  throwoffTime: string;
  teamMembers: TeamMember[];
  competitionChampionship: boolean;
}

export interface Participant {
  id: number;
  teamSeason: TeamSeason;
  displayName: string;
  currentPosition: string;
  paid: boolean;
  present: boolean;
  deregistered: boolean;
  retired: boolean;
  rankingPos: number;
}

export interface Event {
  id: number;
  datetime: string;
  statusCd: string;
  name: string;
  nameShort: string;
  hasPerformancesDefined: boolean;
  leagueLock: boolean;
  hideDataLeagueSetup: boolean;
}

export interface Round {
  id: number;
  name: string;
  index: number;
  typeCd: string;
  groupCd: string;
  matchmode: any;
  nameCd: string;
  dateFrom: string;
  dateTo: string;
  waitForLastRound: boolean;
  level: number;
}

export interface Phase {
  id: number;
  index: number;
  name: string;
  statusCd: string;
  modeCd: string;
  typeCd: string;
  writerCd: string;
  numberOfGroups: number;
  setEquation: boolean;
  lastUpdate: string;
  created: string;
  templateId: number;
  matchReportMemberSourceCd: string;
  setInputTypeCd: string;
  lineupCd: string;
  matchApproval: boolean;
}

export interface Matchmode {
  id: number;
  matchmodeCd: string;
  matchmodeInCd: string;
  matchmodeOutCd: string;
  matchmodePoints: number;
  setsBestOf: number;
  setsTotal: number;
  legsBestOf: number;
  legsTotal: number;
}

export interface Match {
  id: number;
  eventId: number;
  event: Event;
  round: Round;
  phase: Phase;
  participantHome: Participant;
  participantGuest: Participant;
  gameNr: number;
  gameNrRound: number;
  statusCd: string;
  matchmode: Matchmode;
  hasPerformances: boolean;
  active: boolean;
  byeHome: boolean;
  byeAway: boolean;
  datePlanned: string;
  matchReport: boolean;
  level: number;
  ready: boolean;
  prioritize: boolean;
}

export interface ApiResponse {
  participant: Participant;
  matches: Match[];
  participantIds: number[];
  calenderActive: boolean;
  showMemberStatusActive: boolean;
}

export interface ApiError {
  error: string;
  message: string;
}