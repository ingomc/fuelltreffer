export type LeagueTeam = {
  id: string;
  name: string;
  shortName: string;
};

/**
 * Zentrale Angaben für das Fülltreffer-Dashboard.
 * Für einen Saisonwechsel müssen die Werte in dieser Datei angepasst werden.
 */
export const CURRENT_LEAGUE = {
  name: 'Liga B2',
  season: '2026-1',
  eventId: 24970,
  phaseId: 42062,
  tableRoundIndex: 0,
  defaultParticipantId: '633505',
  api: {
    twokSoftwareBaseUrl: 'https://backend4.3k-darts.com/2k-backend4/api/v1/frontend',
    leagueTableBaseUrl: 'http://localhost:3001'
  },
  teams: [
    { id: '633505', name: 'SCO-Darts Team Fülltreffer', shortName: 'Fülltreffer' },
    { id: '632085', name: '1. DC DownFillCreek 3', shortName: 'DownFillCreek 3' },
    { id: '632082', name: 'Cowtails Eisfeld 1', shortName: 'Cowtails' },
    { id: '632077', name: 'DC Condor Lautertal 2', shortName: 'Condor Lautertal 2' },
    { id: '632081', name: 'DC Teutonia Hasslach', shortName: 'Teutonia Hasslach' },
    { id: '632086', name: 'DC Unantastbar 2', shortName: 'Unantastbar 2' },
    { id: '632080', name: 'Drächer Bull´s Eichen', shortName: 'Drächer Bull´s' },
    { id: '632076', name: 'SDC Cafe Q', shortName: 'Cafe Q' },
    { id: '632075', name: 'TSG 2005 Bamberg 2', shortName: 'Bamberg 2' },
    { id: '632079', name: 'VFB Einberg 1', shortName: 'Einberg 1' }
  ] satisfies readonly LeagueTeam[]
} as const;

export const CURRENT_LEAGUE_TITLE = `${CURRENT_LEAGUE.name} • Saison ${CURRENT_LEAGUE.season}`;
