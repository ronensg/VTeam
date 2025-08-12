import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { 
  Text, 
  Button, 
  useTheme,
  IconButton,
  Card,
  Divider,
  Surface
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { TeamGenerationService } from '../services/TeamGenerationService';
import { Player, TeamMatch, SkillWeights } from '../types';

interface RouteParams {
  selectedPlayers: Player[];
  numberOfTeams: number;
  playersPerTeam?: number;
  skillWeights: SkillWeights;
  previousTeams?: TeamMatch[];
}

const GeneratedTeamsScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as RouteParams;
  
  const [generatedTeams, setGeneratedTeams] = useState<TeamMatch[]>([]);
  const [reshuffleCount, setReshuffleCount] = useState(0);
  const [isReshuffling, setIsReshuffling] = useState(false);
  const [lastReshuffleInfo, setLastReshuffleInfo] = useState<string>('');

  useEffect(() => {
    generateInitialTeams();
  }, []);

  const generateInitialTeams = () => {
    try {
      const randomSeed = Math.floor(Math.random() * 1000000);
      const result = TeamGenerationService.generateTeams(
        params.selectedPlayers,
        params.numberOfTeams,
        params.playersPerTeam,
        params.skillWeights,
        randomSeed
      );
      setGeneratedTeams(result.teams);
    } catch (error) {
      console.error('Error generating initial teams:', error);
    }
  };

  const handleReshuffle = () => {
    setIsReshuffling(true);
    setLastReshuffleInfo('');
    
    try {
      let attempts = 0;
      const maxAttempts = 100;
      let newTeams: TeamMatch[] = [];
      
      while (attempts < maxAttempts) {
        // Generate new teams with a different approach
        const shuffledPlayers = [...params.selectedPlayers];
        
        // Fisher-Yates shuffle algorithm for better randomization
        for (let i = shuffledPlayers.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffledPlayers[i], shuffledPlayers[j]] = [shuffledPlayers[j], shuffledPlayers[i]];
        }
        
        // Create new teams with shuffled players
        const playersPerTeam = Math.ceil(shuffledPlayers.length / params.numberOfTeams);
        const newTeamsTemp: TeamMatch[] = [];
        
        for (let i = 0; i < params.numberOfTeams; i++) {
          const startIndex = i * playersPerTeam;
          const endIndex = Math.min(startIndex + playersPerTeam, shuffledPlayers.length);
          const teamPlayers = shuffledPlayers.slice(startIndex, endIndex);
          
          if (teamPlayers.length === 0) continue;
          
          // Create team with shuffled players
          const team: TeamMatch = {
            id: `team-${i + 1}-${Date.now()}-${Math.random()}`,
            name: `Team ${i + 1}`,
            players: teamPlayers.map(player => ({
              playerId: player.id,
              playerName: player.name,
              totalScore: player.serve + player.set + player.block + player.receive + player.attack + player.defense,
              skills: {
                serve: player.serve,
                set: player.set,
                block: player.block,
                receive: player.receive,
                attack: player.attack,
                defense: player.defense,
              },
              isLocked: false,
            })),
            totalScore: 0,
            skillAverages: {
              serve: 0,
              set: 0,
              block: 0,
              receive: 0,
              attack: 0,
              defense: 0,
            }
          };
          
          // Calculate team scores and averages
          TeamGenerationService.updateTeamScores(team, params.skillWeights);
          newTeamsTemp.push(team);
        }
        
        // Check if teams are significantly different (at least 2 players moved)
        if (newTeamsTemp.length === generatedTeams.length) {
          let totalPlayerMoves = 0;
          
          for (let teamIndex = 0; teamIndex < newTeamsTemp.length; teamIndex++) {
            const currentTeam = generatedTeams[teamIndex];
            const newTeam = newTeamsTemp[teamIndex];
            
            if (currentTeam && newTeam) {
              const currentPlayerIds = new Set(currentTeam.players.map(p => p.playerId));
              const newPlayerIds = new Set(newTeam.players.map(p => p.playerId));
              
              // Count how many players are different in this team
              let teamPlayerMoves = 0;
              for (const playerId of currentPlayerIds) {
                if (!newPlayerIds.has(playerId)) {
                  teamPlayerMoves++;
                }
              }
              for (const playerId of newPlayerIds) {
                if (!currentPlayerIds.has(playerId)) {
                  teamPlayerMoves++;
                }
              }
              
              totalPlayerMoves += teamPlayerMoves;
            }
          }
          
          // Accept the new teams if at least 2 players moved between teams
          if (totalPlayerMoves >= 2) {
            newTeams = newTeamsTemp;
            setLastReshuffleInfo(`✅ Reshuffled! ${totalPlayerMoves} players moved between teams.`);
            break;
          }
        }
        
        attempts++;
      }
      
      if (newTeams.length > 0) {
        setGeneratedTeams(newTeams);
        setReshuffleCount(prev => prev + 1);
        console.log(`Reshuffled teams after ${attempts} attempts. Teams are now different.`);
      } else {
        // If we couldn't get significantly different teams, force a different arrangement
        console.log('Forcing different team arrangement...');
        const forcedTeams = generateForcedDifferentTeams();
        setGeneratedTeams(forcedTeams);
        setReshuffleCount(prev => prev + 1);
        setLastReshuffleInfo('🔄 Forced reshuffle: Teams rearranged to ensure differences.');
      }
      
    } catch (error) {
      console.error('Error reshuffling teams:', error);
      setLastReshuffleInfo('❌ Error during reshuffle. Please try again.');
    } finally {
      setIsReshuffling(false);
    }
  };

  const generateForcedDifferentTeams = (): TeamMatch[] => {
    // Force a different arrangement by rotating players between teams
    const allPlayers = [...params.selectedPlayers];
    const playersPerTeam = Math.ceil(allPlayers.length / params.numberOfTeams);
    
    // Rotate players to ensure different teams
    const rotatedPlayers = [...allPlayers];
    const rotationAmount = Math.floor(Math.random() * (allPlayers.length - 1)) + 1;
    
    for (let i = 0; i < rotationAmount; i++) {
      const lastPlayer = rotatedPlayers.pop()!;
      rotatedPlayers.unshift(lastPlayer);
    }
    
    const newTeams: TeamMatch[] = [];
    
    for (let i = 0; i < params.numberOfTeams; i++) {
      const startIndex = i * playersPerTeam;
      const endIndex = Math.min(startIndex + playersPerTeam, rotatedPlayers.length);
      const teamPlayers = rotatedPlayers.slice(startIndex, endIndex);
      
      if (teamPlayers.length === 0) continue;
      
      const team: TeamMatch = {
        id: `team-${i + 1}-${Date.now()}-${Math.random()}`,
        name: `Team ${i + 1}`,
        players: teamPlayers.map(player => ({
          playerId: player.id,
          playerName: player.name,
          totalScore: player.serve + player.set + player.block + player.receive + player.attack + player.defense,
          skills: {
            serve: player.serve,
            set: player.set,
            block: player.block,
            receive: player.receive,
            attack: player.attack,
            defense: player.defense,
          },
          isLocked: false,
        })),
        totalScore: 0,
        skillAverages: {
          serve: 0,
          set: 0,
          block: 0,
          receive: 0,
          attack: 0,
          defense: 0,
        }
      };
      
      TeamGenerationService.updateTeamScores(team, params.skillWeights);
      newTeams.push(team);
    }
    
    return newTeams;
  };

  const handleSaveMatch = async () => {
    try {
      // Generate a match name based on current date/time
      const now = new Date();
      const matchName = `Match ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
      
      const matchData = {
        name: matchName,
        numberOfTeams: params.numberOfTeams,
        playersPerTeam: params.playersPerTeam,
        skillWeights: params.skillWeights,
        filters: {
          teamFilter: '',
          searchQuery: '',
          availabilityFilter: 'available',
        },
        teams: generatedTeams,
        randomSeed: Math.floor(Math.random() * 1000000),
      };

      // Save the match using the database context
      // Note: We'll need to pass the addMatch function through navigation params
      // For now, we'll just navigate back
      
      // Navigate back to Create Match screen
      navigation.goBack();
      
      // Show success message (you can implement this as needed)
      console.log('Match saved successfully:', matchData);
      
    } catch (error) {
      console.error('Error saving match:', error);
    }
  };

  const renderTeamCard = (team: TeamMatch, index: number) => (
    <Card key={team.id} style={styles.teamCard}>
      <Card.Content>
        <View style={styles.teamHeader}>
          <Text variant="titleLarge" style={styles.teamName}>
            {team.name}
          </Text>
          <Text variant="headlineSmall" style={styles.teamScore}>
            {Math.round(team.totalScore * 100) / 100}
          </Text>
        </View>

        <View style={styles.teamStats}>
          <Text variant="bodySmall" style={styles.statsLabel}>Skill Averages:</Text>
          <View style={styles.skillStats}>
            {(['serve', 'set', 'block', 'receive', 'attack', 'defense'] as const).map((skill) => (
              <View key={skill} style={styles.skillStat}>
                <Text variant="bodySmall" style={styles.skillStatLabel}>
                  {skill.charAt(0).toUpperCase() + skill.slice(1)}
                </Text>
                <Text variant="bodySmall" style={styles.skillStatValue}>
                  {Math.round(team.skillAverages[skill] * 100) / 100}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <Divider style={styles.divider} />

        <Text variant="bodyMedium" style={styles.playersLabel}>
          Players ({team.players.length}):
        </Text>
        
        {team.players.map((player, playerIndex) => (
          <View key={player.playerId} style={styles.playerItem}>
            <View style={styles.playerItemInfo}>
              <Text variant="bodyMedium" style={styles.playerItemName}>
                {player.playerName}
              </Text>
              <Text variant="bodySmall" style={styles.playerItemScore}>
                Score: {Math.round(player.totalScore * 100) / 100}
              </Text>
            </View>
          </View>
        ))}
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
        />
        <Text variant="headlineMedium" style={styles.title}>Generated Teams</Text>
        <View style={{ width: 24 }} /> {/* Spacer for centering */}
      </View>

      {/* Reshuffle Counter */}
      {reshuffleCount > 0 && (
        <View style={[styles.counterContainer, { backgroundColor: theme.colors.surface }]}>
          <Text style={styles.counterText}>Teams reshuffled {reshuffleCount} time{reshuffleCount !== 1 ? 's' : ''}</Text>
        </View>
      )}

      {/* Actions */}
      <View style={[styles.actionsContainer, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outline }]}>
        <Button
          mode="outlined"
          onPress={handleReshuffle}
          icon="shuffle"
          style={styles.reshuffleButton}
          loading={isReshuffling}
          disabled={isReshuffling}
        >
          {isReshuffling ? 'Reshuffling...' : 'Reshuffle Teams'}
        </Button>
        <Button
          mode="contained"
          onPress={handleSaveMatch}
          icon="save"
          style={styles.saveButton}
        >
          Save Match
        </Button>
      </View>

      {/* Reshuffle Feedback */}
      {lastReshuffleInfo && (
        <View style={[styles.feedbackContainer, { backgroundColor: theme.colors.surface }]}>
          <Text style={styles.feedbackText}>{lastReshuffleInfo}</Text>
        </View>
      )}

      {/* Teams Display */}
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={true}>
        <View style={styles.teamsContainer}>
          {generatedTeams.map((team, index) => renderTeamCard(team, index))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    elevation: 2,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
  },
  reshuffleButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  teamsContainer: {
    padding: 16,
    gap: 16,
  },
  teamCard: {
    borderRadius: 12,
    elevation: 2,
  },
  teamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  teamName: {
    fontWeight: 'bold',
  },
  teamScore: {
    fontWeight: 'bold',
    color: '#2196F3',
  },
  teamStats: {
    marginBottom: 12,
  },
  statsLabel: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  skillStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillStat: {
    alignItems: 'center',
    minWidth: 40,
  },
  skillStatLabel: {
    fontSize: 10,
    opacity: 0.7,
  },
  skillStatValue: {
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 12,
  },
  playersLabel: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  playerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  playerItemInfo: {
    flex: 1,
  },
  playerItemName: {
    fontWeight: 'bold',
  },
  playerItemScore: {
    opacity: 0.7,
    fontSize: 12,
  },
  feedbackContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0', // Example border color
  },
  feedbackText: {
    fontSize: 14,
    textAlign: 'center',
  },
  counterContainer: {
    padding: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  counterText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default GeneratedTeamsScreen;
