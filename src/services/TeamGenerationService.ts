import { Player, TeamMatch, PlayerMatch, SkillWeights, TeamGenerationResult } from '../types';

export class TeamGenerationService {
  private static readonly DEFAULT_WEIGHTS: SkillWeights = {
    serve: 0.15,
    set: 0.15,
    block: 0.15,
    receive: 0.15,
    attack: 0.25,
    defense: 0.15,
  };

  private static readonly MAX_ITERATIONS = 200;
  private static readonly TIME_LIMIT_MS = 200;

  static generateTeams(
    players: Player[],
    numberOfTeams: number,
    playersPerTeam?: number,
    skillWeights?: SkillWeights,
    randomSeed?: number
  ): TeamGenerationResult {
    const startTime = Date.now();
    const weights = skillWeights || this.DEFAULT_WEIGHTS;
    
    // Note: Algorithm is deterministic given the sorted players; random seed placeholder retained for future use

    // Filter available players
    const availablePlayers = players.filter(p => p.availability === 'available');
    
    if (availablePlayers.length === 0) {
      throw new Error('No available players found');
    }

    // Calculate total skill scores
    const playersWithScores = availablePlayers.map(player => ({
      ...player,
      totalScore: this.calculatePlayerScore(player, weights),
    }));

    // Sort by total score (descending)
    playersWithScores.sort((a, b) => b.totalScore - a.totalScore);

    // Initialize teams
    const teams: TeamMatch[] = Array.from({ length: numberOfTeams }, (_, i) => ({
      id: `team_${i + 1}`,
      name: `Team ${i + 1}`,
      players: [],
      totalScore: 0,
      skillAverages: this.getEmptySkillAverages(),
    }));

    // Snake draft assignment
    this.assignPlayersSnakeDraft(playersWithScores, teams, playersPerTeam);

    // Calculate initial team scores
    teams.forEach(team => {
      this.updateTeamScores(team, weights);
    });

    // Local search optimization
    const optimizationResult = this.optimizeTeamBalance(teams, weights, startTime);

    // Calculate final metrics
    const totalScoreDifference = this.calculateTotalScoreDifference(teams);
    const skillBalanceScore = this.calculateSkillBalanceScore(teams, weights);

    return {
      teams,
      totalScoreDifference,
      skillBalanceScore,
      iterations: optimizationResult.iterations,
      executionTime: Date.now() - startTime,
    };
  }

  private static calculatePlayerScore(player: Player, weights: SkillWeights): number {
    return (
      player.serve * weights.serve +
      player.set * weights.set +
      player.block * weights.block +
      player.receive * weights.receive +
      player.attack * weights.attack +
      player.defense * weights.defense
    );
  }

  private static assignPlayersSnakeDraft(
    players: (Player & { totalScore: number })[],
    teams: TeamMatch[],
    playersPerTeam?: number
  ) {
    const targetPlayersPerTeam = playersPerTeam || Math.ceil(players.length / teams.length);
    
    let playerIndex = 0;
    let forward = true;

    while (playerIndex < players.length) {
      if (forward) {
        // Forward pass
        for (let teamIndex = 0; teamIndex < teams.length && playerIndex < players.length; teamIndex++) {
          if (teams[teamIndex].players.length < targetPlayersPerTeam) {
            const player = players[playerIndex];
            teams[teamIndex].players.push({
              playerId: player.id,
              playerName: player.name,
              totalScore: player.totalScore,
              skills: {
                serve: player.serve,
                set: player.set,
                block: player.block,
                receive: player.receive,
                attack: player.attack,
                defense: player.defense,
              },
              isLocked: false,
              photo: player.photo,
            });
            playerIndex++;
          }
        }
        forward = false;
      } else {
        // Reverse pass
        for (let teamIndex = teams.length - 1; teamIndex >= 0 && playerIndex < players.length; teamIndex--) {
          if (teams[teamIndex].players.length < targetPlayersPerTeam) {
            const player = players[playerIndex];
            teams[teamIndex].players.push({
              playerId: player.id,
              playerName: player.name,
              totalScore: player.totalScore,
              skills: {
                serve: player.serve,
                set: player.set,
                block: player.block,
                receive: player.receive,
                attack: player.attack,
                defense: player.defense,
              },
              isLocked: false,
              photo: player.photo,
            });
            playerIndex++;
          }
        }
        forward = true;
      }
    }
  }

  static updateTeamScores(team: TeamMatch, weights: SkillWeights): void {
    if (team.players.length === 0) {
      team.totalScore = 0;
      team.skillAverages = this.getEmptySkillAverages();
      return;
    }

    // For teams with 7+ players, use best 6-player subset
    const effectivePlayers = team.players.length >= 7 
      ? this.getBest6PlayerSubset(team.players, weights)
      : team.players;

    // Calculate total score
    team.totalScore = effectivePlayers.reduce((sum, player) => sum + player.totalScore, 0);

    // Calculate skill averages
    const skillSums = effectivePlayers.reduce((sums, player) => ({
      serve: sums.serve + player.skills.serve,
      set: sums.set + player.skills.set,
      block: sums.block + player.skills.block,
      receive: sums.receive + player.skills.receive,
      attack: sums.attack + player.skills.attack,
      defense: sums.defense + player.skills.defense,
    }), this.getEmptySkillAverages());

    team.skillAverages = {
      serve: skillSums.serve / effectivePlayers.length,
      set: skillSums.set / effectivePlayers.length,
      block: skillSums.block / effectivePlayers.length,
      receive: skillSums.receive / effectivePlayers.length,
      attack: skillSums.attack / effectivePlayers.length,
      defense: skillSums.defense / effectivePlayers.length,
    };
  }

  private static getBest6PlayerSubset(players: PlayerMatch[], weights: SkillWeights): PlayerMatch[] {
    if (players.length <= 6) return players;

    // Try different combinations to find the best 6-player subset
    let bestSubset = players.slice(0, 6);
    let bestScore = this.calculateSubsetScore(bestSubset, weights);

    // Simple heuristic: try removing players with lowest scores
    const sortedPlayers = [...players].sort((a, b) => a.totalScore - b.totalScore);
    
    for (let i = 0; i < players.length - 6; i++) {
      const subset = sortedPlayers.slice(i, i + 6);
      const score = this.calculateSubsetScore(subset, weights);
      
      if (score > bestScore) {
        bestScore = score;
        bestSubset = subset;
      }
    }

    return bestSubset;
  }

  private static calculateSubsetScore(players: PlayerMatch[], weights: SkillWeights): number {
    if (players.length === 0) return 0;

    const skillSums = players.reduce((sums, player) => ({
      serve: sums.serve + player.skills.serve,
      set: sums.set + player.skills.set,
      block: sums.block + player.skills.block,
      receive: sums.receive + player.skills.receive,
      attack: sums.attack + player.skills.attack,
      defense: sums.defense + player.skills.defense,
    }), this.getEmptySkillAverages());

    const skillAverages = {
      serve: skillSums.serve / players.length,
      set: skillSums.set / players.length,
      block: skillSums.block / players.length,
      receive: skillSums.receive / players.length,
      attack: skillSums.attack / players.length,
      defense: skillSums.defense / players.length,
    };

    return (
      skillAverages.serve * weights.serve +
      skillAverages.set * weights.set +
      skillAverages.block * weights.block +
      skillAverages.receive * weights.receive +
      skillAverages.attack * weights.attack +
      skillAverages.defense * weights.defense
    ) * players.length;
  }

  private static optimizeTeamBalance(
    teams: TeamMatch[],
    weights: SkillWeights,
    startTime: number
  ): { iterations: number } {
    let iterations = 0;
    let bestScoreDifference = this.calculateTotalScoreDifference(teams);
    let improved = true;

    while (improved && iterations < this.MAX_ITERATIONS) {
      const currentTime = Date.now();
      if (currentTime - startTime > this.TIME_LIMIT_MS) {
        break;
      }

      improved = false;
      iterations++;

      // Try swapping players between teams
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          for (let playerIndex1 = 0; playerIndex1 < teams[i].players.length; playerIndex1++) {
            for (let playerIndex2 = 0; playerIndex2 < teams[j].players.length; playerIndex2++) {
              const player1 = teams[i].players[playerIndex1];
              const player2 = teams[j].players[playerIndex2];

              // Skip if players are locked
              if (player1.isLocked || player2.isLocked) continue;

              // Try swap
              [teams[i].players[playerIndex1], teams[j].players[playerIndex2]] = 
                [teams[j].players[playerIndex2], teams[i].players[playerIndex1]];

              // Update team scores
              this.updateTeamScores(teams[i], weights);
              this.updateTeamScores(teams[j], weights);

              const newScoreDifference = this.calculateTotalScoreDifference(teams);

              if (newScoreDifference < bestScoreDifference) {
                bestScoreDifference = newScoreDifference;
                improved = true;
              } else {
                // Revert swap
                [teams[i].players[playerIndex1], teams[j].players[playerIndex2]] = 
                  [teams[j].players[playerIndex2], teams[i].players[playerIndex1]];
                
                // Restore team scores
                this.updateTeamScores(teams[i], weights);
                this.updateTeamScores(teams[j], weights);
              }
            }
          }
        }
      }
    }

    return { iterations };
  }

  private static calculateTotalScoreDifference(teams: TeamMatch[]): number {
    if (teams.length < 2) return 0;

    const scores = teams.map(team => team.totalScore);
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);

    return maxScore - minScore;
  }

  private static calculateSkillBalanceScore(teams: TeamMatch[], weights: SkillWeights): number {
    if (teams.length < 2) return 0;

    const skillNames: (keyof SkillWeights)[] = ['serve', 'set', 'block', 'receive', 'attack', 'defense'];
    let totalVariance = 0;

    skillNames.forEach(skill => {
      const skillValues = teams.map(team => team.skillAverages[skill]);
      const mean = skillValues.reduce((sum, val) => sum + val, 0) / skillValues.length;
      const variance = skillValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / skillValues.length;
      totalVariance += variance * weights[skill];
    });

    return totalVariance;
  }

  private static getEmptySkillAverages() {
    return {
      serve: 0,
      set: 0,
      block: 0,
      receive: 0,
      attack: 0,
      defense: 0,
    };
  }

  static swapPlayers(
    teams: TeamMatch[],
    playerId: string,
    fromTeamIndex: number,
    toTeamIndex: number,
    weights: SkillWeights
  ): boolean {
    if (fromTeamIndex === toTeamIndex) return false;
    if (fromTeamIndex < 0 || fromTeamIndex >= teams.length) return false;
    if (toTeamIndex < 0 || toTeamIndex >= teams.length) return false;

    const fromTeam = teams[fromTeamIndex];
    const toTeam = teams[toTeamIndex];

    const playerIndex = fromTeam.players.findIndex(p => p.playerId === playerId);
    if (playerIndex === -1) return false;

    const player = fromTeam.players[playerIndex];
    if (player.isLocked) return false;

    // Remove from source team
    fromTeam.players.splice(playerIndex, 1);

    // Add to destination team
    toTeam.players.push(player);

    // Update team scores
    this.updateTeamScores(fromTeam, weights);
    this.updateTeamScores(toTeam, weights);

    return true;
  }

  static lockPlayer(teams: TeamMatch[], playerId: string, isLocked: boolean): boolean {
    for (const team of teams) {
      const player = team.players.find(p => p.playerId === playerId);
      if (player) {
        player.isLocked = isLocked;
        return true;
      }
    }
    return false;
  }
}
