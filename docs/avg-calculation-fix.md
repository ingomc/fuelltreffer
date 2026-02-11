# Player Overall AVG Calculation - Fix Documentation

## Problem Description

In der Tabelle eines einzelnen Spiels wurde der Gesamt-AVG (Durchschnitt) eines Spielers teilweise falsch berechnet.

**English:** In the table of a single game, the overall AVG (average) of a player was sometimes calculated incorrectly.

## Root Cause Analysis

### The Bug
The player statistics were retrieved from `playerStatsMap` without filtering by the games the player actually participated in.

**Location:** `src/pages/match/[eventId]/[matchId]/report.astro`

**Issue:**
1. The `playerStatsMap` contains ALL statistics for a player across ALL games in the match
2. When building `homePlayerStats` and `awayPlayerStats` (lines 470-480 and 489-499), the code retrieved all stats for a player by their ID
3. However, it didn't filter these stats to only include the games where that specific player participated
4. This meant that if a player's ID appeared in stats from multiple games, all those stats would be included in the average calculation, even for games they didn't play in

**Example Scenario:**
- Player "Max Mustermann" with ID `123` plays in games A, B, and C
- The `playerStatsMap` might contain stats for player ID `123` from games A, B, C, D, and E
- Without filtering, the overall AVG would incorrectly include stats from games D and E
- This results in an incorrect (usually inflated) average

### Data Flow
```
1. Games are loaded → reportData[]
2. Statistics are fetched per game → gameStatsMap (Map<gameId, stats[]>)
3. Each stat gets gameId added: { ...stat, gameId }
4. All stats are flattened → allMatchStats[]
5. Stats are grouped by player → playerStatsMap (Map<playerId, stats[]>)
6. Player participation is tracked → allHomeParticipants/allAwayParticipants
   - Each entry has: { id, name, games: [gameIds] }
7. Player stats are built → homePlayerStats/awayPlayerStats
   ❌ OLD: Retrieved all stats for player from playerStatsMap
   ✅ NEW: Filter stats to only games in playerInfo.games
```

## Solution Implemented

### Code Changes

#### Before (Buggy Code)
```javascript
const stats = playerStatsMap.get(playerInfo.id) || 
             playerStatsMap.get(playerName) || 
             [];

homePlayerStats.set(playerName, {
  stats: stats,
  gamesPlayed: playerInfo.games.length,
  gameIds: playerInfo.games
});
```

#### After (Fixed Code)
```javascript
// Get all stats for this player (by ID or name)
const allPlayerStats = playerStatsMap.get(playerInfo.id) || 
                       playerStatsMap.get(playerName) || 
                       [];

// Filter stats to only include games this player actually participated in
// This ensures the overall AVG is calculated only from the player's actual games
const stats = allPlayerStats.filter(stat => playerInfo.games.includes(stat.gameId));

homePlayerStats.set(playerName, {
  stats: stats,
  gamesPlayed: playerInfo.games.length,
  gameIds: playerInfo.games
});
```

### Changes Applied To
1. **Home Team Stats** (lines 470-480)
2. **Away Team Stats** (lines 489-499)

## AVG Calculation Formula Documentation

### Overall AVG Calculation Method

The overall AVG is calculated as the **simple arithmetic mean of individual game averages**.

### The Formula
```
Overall AVG = (sum of all game averages) / (number of games)
```

### Why This Method?
This method treats each game equally, regardless of how many darts were thrown. It calculates the average of the already-shown individual game averages.

### Example Calculation
**Scenario:** A player plays 2 games

**Game 1:**
- 180 points with 9 darts
- Game AVG = (180 / 9) × 3 = 60.00

**Game 2:**
- 60 points with 6 darts
- Game AVG = (60 / 6) × 3 = 30.00

**Overall AVG:**
```
Overall AVG = (60.00 + 30.00) / 2 = 45.00
```

### Alternative Method (NOT Used)
The weighted average method would be:
```
Weighted AVG = (total score / total darts) × 3
             = (240 / 15) × 3 = 48.00
```

The simple average method (45.00) treats each game equally, while the weighted method (48.00) gives more weight to games with more darts thrown.

### Implementation
The calculation is performed in the `calculateAverage()` function:

```javascript
/**
 * Calculate the 3-dart average for darts
 * 
 * @param {number} scoreTotal - Total points scored
 * @param {number} dartsTotal - Total number of darts thrown
 * @returns {string|number} - The 3-dart average as a string with 2 decimal places, or 0 if no darts thrown
 * 
 * Formula: (scoreTotal / dartsTotal) * 3
 */
function calculateAverage(scoreTotal, dartsTotal) {
  if (!dartsTotal || dartsTotal === 0) return 0;
  return (scoreTotal / dartsTotal * 3).toFixed(2);
}
```

### Overall AVG Calculation
For each player, the overall average is calculated by:
1. Calculate the average for each individual game
2. Sum all the game averages
3. Divide by the number of games

```javascript
// Calculate overall stats for this player
// Overall AVG is calculated as the average of individual game averages
// (not weighted by darts - simple arithmetic mean of game AVGs)
let overallAvg = '-';
if (playerGames.length > 0) {
  // Calculate average for each game, then average those averages
  const gameAverages = playerGames.map(g => {
    const avg = calculateAverage(g.scoreTotal, g.dartsTotal);
    return parseFloat(avg);
  });
  const sumOfAverages = gameAverages.reduce((sum, avg) => sum + avg, 0);
  overallAvg = (sumOfAverages / gameAverages.length).toFixed(2);
}
```

## Testing

### Build & Lint
✅ Linter passed with no errors
✅ Build completed successfully
✅ No TypeScript errors introduced

### Manual Testing Recommended
To fully verify the fix, perform the following tests:

1. **Test Case 1: Normal scenario**
   - View a match report where players played multiple games
   - Verify that the overall AVG matches the weighted average of individual game AVGs

2. **Test Case 2: Player in subset of games**
   - Find a match where a player didn't play in all games
   - Verify their overall AVG only includes stats from games they played

3. **Test Case 3: Multiple players**
   - Verify that each player's overall AVG is calculated independently
   - Ensure no cross-contamination of stats between players

## Security Summary
✅ No security vulnerabilities introduced
- Changes are purely computational/logic fixes
- No external input processing added
- No new dependencies added
- CodeQL analysis: No issues detected

## Files Modified
1. `src/pages/match/[eventId]/[matchId]/report.astro`
   - Fixed stats filtering for home team (lines 470-480)
   - Fixed stats filtering for away team (lines 489-499)
   - Added JSDoc documentation for `calculateAverage()` function
   - Added inline comments explaining overall AVG calculation

## Impact
✅ **Positive Impact:**
- Correct overall AVG calculation for all players
- Better code documentation for future maintenance
- No breaking changes to existing functionality

⚠️ **Potential Impact:**
- Players who previously had inflated AVG values will now show correct (possibly lower) values
- This is the correct behavior and reflects accurate statistics

## Conclusion
The fix ensures that player overall AVG values are calculated correctly by filtering statistics to only include games where the player actually participated. Comprehensive documentation has been added to explain the calculation logic for future maintainers.
