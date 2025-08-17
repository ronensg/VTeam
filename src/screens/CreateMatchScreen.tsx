import React, { useState, useMemo, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { 
  Text, 
  Card, 
  Button, 
  Searchbar, 
  Chip, 
  Switch, 
  Dialog, 
  Portal, 
  TextInput,
  SegmentedButtons,
  useTheme,
} from 'react-native-paper';


import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import { useDatabase } from '../services/DatabaseContext';
import { TeamGenerationService } from '../services/TeamGenerationService';
import { Player, SkillWeights } from '../types';

// Simple text-based icons that work without fonts
const TextIcon: React.FC<{ name: string; size?: number; color?: string }> = ({ name, size = 20, color = 'black' }) => {
  const iconMap: { [key: string]: string } = {
    'more-vert': '⋮',
    'edit': '✏️',
    'delete': '🗑️',
    'upload': '📤',
    'download': '📥',
    'add': '➕',
    'close': '❌',
    'check': '✅',
    'arrow-back': '⬅️',
    'arrow-forward': '➡️',
    'menu': '☰',
    'search': '🔍',
    'filter-list': '🔧',
    'sort': '📊',
    'refresh': '🔄',
    'settings': '⚙️',
    'help': '❓',
    'info': 'ℹ️',
    'warning': '⚠️',
    'error': '❌',
    'success': '✅',
    'tune': '⚙️',
    'play': '▶️',
    'shuffle': '🔀'
  };
  
  const icon = iconMap[name] || '?';
  return (
    <Text style={{ fontSize: size, color, textAlign: 'center', lineHeight: size }}>
      {icon}
    </Text>
  );
};

const CreateMatchScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const { players, teams, addMatch } = useDatabase();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [teamFilter, setTeamFilter] = useState<string>('');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'unavailable'>('available');
  const [numberOfTeams, setNumberOfTeams] = useState(2);
  const [playersPerTeam, setPlayersPerTeam] = useState<number | undefined>(undefined);
  const [skillWeights, setSkillWeights] = useState<SkillWeights>({
    serve: 0.15,
    set: 0.15,
    block: 0.15,
    receive: 0.15,
    attack: 0.25,
    defense: 0.15,
  });
  
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());
  const [showWeightsDialog, setShowWeightsDialog] = useState(false);

  // Check for navigation params when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Check if we're returning from GeneratedTeamsScreen with teams to save
      // This will be handled in the navigation params
    });

    return unsubscribe;
  }, [navigation]);

  // Filtered and available players
  const filteredPlayers = useMemo(() => {
    return players.filter(player => {
      const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTeam = !teamFilter || player.teams.includes(teamFilter);
      const matchesAvailability = availabilityFilter === 'all' || player.availability === availabilityFilter;
      
      return matchesSearch && matchesTeam && matchesAvailability;
    });
  }, [players, searchQuery, teamFilter, availabilityFilter]);

  const availablePlayers = filteredPlayers.filter(p => p.availability === 'available');

  const handleSelectAll = () => {
    const allPlayerIds = new Set(availablePlayers.map(p => p.id));
    setSelectedPlayers(allPlayerIds);
  };

  const handleDeselectAll = () => {
    setSelectedPlayers(new Set());
  };

  const handlePlayerToggle = (playerId: string) => {
    console.log('Toggling player:', playerId, 'Current selected:', Array.from(selectedPlayers));
    const newSelected = new Set(selectedPlayers);
    if (newSelected.has(playerId)) {
      newSelected.delete(playerId);
      console.log('Removed player:', playerId);
    } else {
      newSelected.add(playerId);
      console.log('Added player:', playerId);
    }
    setSelectedPlayers(newSelected);
    console.log('New selected set:', Array.from(newSelected));
  };

  const handleAvailabilityToggle = async (playerId: string) => {
    try {
      const player = players.find(p => p.id === playerId);
      if (player) {
        const newAvailability = player.availability === 'available' ? 'unavailable' : 'available';
        // Update the player's availability in the database
        // This would require adding an updatePlayer function to your database context
        console.log('Toggling availability for player:', playerId, 'to:', newAvailability);
        // For now, we'll just log it - you'll need to implement the actual update
      }
    } catch (error) {
      console.error('Error toggling availability:', error);
    }
  };

  const handleGenerateTeams = () => {
    if (selectedPlayers.size < numberOfTeams) {
      Alert.alert('Error', 'Not enough players selected for the number of teams');
      return;
    }

    try {
      const selectedPlayerObjects = availablePlayers.filter(p => selectedPlayers.has(p.id));
      
      // Navigate to GeneratedTeamsScreen with the selected data
      (navigation as any).navigate('GeneratedTeams', {
        selectedPlayers: selectedPlayerObjects,
        numberOfTeams,
        playersPerTeam,
        skillWeights,
      });
      
    } catch (error) {
      console.error('Error preparing to generate teams:', error);
      Alert.alert('Error', 'Failed to prepare team generation');
    }
  };

  const renderPlayerCard = ({ item: player }: { item: Player }) => (
    <Card 
      style={[
        styles.playerCard, 
        { 
          opacity: player.availability === 'unavailable' ? 0.6 : 1,
          borderColor: selectedPlayers.has(player.id) ? theme.colors.primary : 'transparent',
          borderWidth: selectedPlayers.has(player.id) ? 3 : 0,
          backgroundColor: selectedPlayers.has(player.id) ? theme.colors.primaryContainer : theme.colors.surface,
        }
      ]}
      onPress={() => handlePlayerToggle(player.id)}
    >
      <Card.Content>
        <View style={styles.playerHeader}>
          <View style={styles.playerInfo}>
            <Text variant="titleMedium" style={[
              styles.playerName,
              { color: selectedPlayers.has(player.id) ? theme.colors.onPrimaryContainer : theme.colors.onSurface }
            ]}>
              {player.name}
            </Text>
            <Text variant="bodySmall" style={[
              styles.playerScore,
              { color: selectedPlayers.has(player.id) ? theme.colors.onPrimaryContainer : theme.colors.onSurface }
            ]}>
              Total Score: {Math.round((player.serve + player.set + player.block + player.receive + player.attack + player.defense) * 100) / 100}
            </Text>
            <Text variant="bodySmall" style={[
              styles.playerAvailability,
              { color: selectedPlayers.has(player.id) ? theme.colors.onPrimaryContainer : theme.colors.onSurface }
            ]}>
              Availability: {player.availability === 'available' ? '✅ Available' : '❌ Unavailable'}
            </Text>
          </View>
          
          {/* Selection Switch */}
          <View style={styles.selectionControls}>
            <Text variant="bodySmall" style={[
              styles.selectionLabel,
              { color: selectedPlayers.has(player.id) ? theme.colors.onPrimaryContainer : theme.colors.onSurface }
            ]}>
              {selectedPlayers.has(player.id) ? 'Selected' : 'Select'}
            </Text>
            <Switch
              value={selectedPlayers.has(player.id)}
              onValueChange={() => handlePlayerToggle(player.id)}
              trackColor={{ false: theme.colors.outline, true: theme.colors.primary }}
              thumbColor={selectedPlayers.has(player.id) ? theme.colors.onPrimary : theme.colors.outline}
            />
          </View>
        </View>

        {/* Availability Toggle */}
        <View style={styles.availabilityContainer}>
          <Text variant="bodySmall" style={styles.availabilityLabel}>Change Availability:</Text>
          <Button
            mode="outlined"
            compact
            onPress={() => handleAvailabilityToggle(player.id)}
            style={[
              styles.availabilityButton,
              { 
                backgroundColor: player.availability === 'available' ? theme.colors.primaryContainer : theme.colors.errorContainer,
                borderColor: player.availability === 'available' ? theme.colors.primary : theme.colors.error
              }
            ]}
            textColor={player.availability === 'available' ? theme.colors.onPrimaryContainer : theme.colors.onErrorContainer}
          >
            {player.availability === 'available' ? 'Mark Unavailable' : 'Mark Available'}
          </Button>
        </View>

        {player.teams.length > 0 && (
          <View style={styles.playerTeamsContainer}>
            <Text variant="bodySmall" style={styles.teamsLabel}>Teams:</Text>
            <View style={styles.chipsContainer}>
              {player.teams.map((team, index) => (
                <Chip key={index} style={styles.teamChip} textStyle={styles.chipText}>
                  {team}
                </Chip>
              ))}
            </View>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text variant="headlineMedium" style={styles.title}>Create Match</Text>
      </View>

      {/* Main Scrollable Content */}
      <ScrollView style={styles.mainScrollContainer} showsVerticalScrollIndicator={true}>
        {/* Filters */}
        <View style={[styles.filtersContainer, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outline }]}>
          <Searchbar
            placeholder="Search players..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
            icon={() => <TextIcon name="search" size={20} color={theme.colors.onSurface} />}
          />
          
          <View style={styles.filterRow}>
            <SegmentedButtons
              value={availabilityFilter}
              onValueChange={(value) => setAvailabilityFilter(value as any)}
              buttons={[
                { value: 'all', label: 'All' },
                { value: 'available', label: 'Available' },
                { value: 'unavailable', label: 'Unavailable' },
              ]}
              style={styles.segmentedButtons}
            />
            
            <View style={styles.teamFilter}>
              <Text variant="bodySmall">Team:</Text>
              <SegmentedButtons
                value={teamFilter}
                onValueChange={setTeamFilter}
                buttons={[
                  { value: '', label: 'All' },
                  ...teams.map(team => ({ value: team.name, label: team.name })),
                ]}
                style={styles.teamSegmentedButtons}
              />
            </View>
          </View>

          <View style={styles.selectionControls}>
            <Button onPress={handleSelectAll} mode="outlined">Select All</Button>
            <Button onPress={handleDeselectAll} mode="outlined">Deselect All</Button>
            <Text variant="bodyMedium" style={styles.selectionCount}>
              Selected: {selectedPlayers.size} / {availablePlayers.length} available
            </Text>
            {selectedPlayers.size > 0 && (
              <Text variant="bodySmall" style={styles.selectedPlayersList}>
                Selected: {Array.from(selectedPlayers).map(id => players.find(p => p.id === id)?.name).join(', ')}
              </Text>
            )}
          </View>
        </View>

        {/* Configuration */}
        <View style={[styles.configContainer, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outline }]}>
          <View style={styles.configRow}>
            <Text variant="bodyMedium">Number of Teams:</Text>
            <SegmentedButtons
              value={numberOfTeams.toString()}
              onValueChange={(value) => setNumberOfTeams(parseInt(value))}
              buttons={[
                { value: '2', label: '2' },
                { value: '3', label: '3' },
                { value: '4', label: '4' },
              ]}
              style={styles.segmentedButtons}
            />
          </View>

          <View style={styles.configRow}>
            <Text variant="bodyMedium">Players per Team:</Text>
            <TextInput
              value={playersPerTeam?.toString() || ''}
              onChangeText={(text) => setPlayersPerTeam(text ? parseInt(text) : undefined)}
              placeholder="Auto"
              keyboardType="numeric"
              style={styles.playersInput}
              dense
            />
          </View>

          <View style={styles.configActions}>
            <Button
              mode="outlined"
              onPress={() => setShowWeightsDialog(true)}
              icon={() => <TextIcon name="tune" size={20} color={theme.colors.primary} />}
            >
              Adjust Skill Weights
            </Button>

            {selectedPlayers.size > 0 && (
              <Button
                mode="contained"
                onPress={handleGenerateTeams}
                icon={() => <TextIcon name="play" size={20} color="white" />}
                style={styles.generateButton}
              >
                Generate Teams ({selectedPlayers.size} selected)
              </Button>
            )}
          </View>
        </View>

        {/* Players List */}
        <View style={styles.listContainer}>
          <Text variant="titleMedium" style={styles.playersSectionTitle}>Available Players</Text>
          <FlashList
            data={filteredPlayers}
            renderItem={renderPlayerCard}
            estimatedItemSize={150}
            keyExtractor={(item) => item.id}
            numColumns={3} // Display 3 players per row
            contentContainerStyle={styles.listContent}
          />
        </View>
      </ScrollView>

      {/* Skill Weights Dialog */}
      <Portal>
        <Dialog visible={showWeightsDialog} onDismiss={() => setShowWeightsDialog(false)}>
          <Dialog.Title>Adjust Skill Weights</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={styles.weightsNote}>
              Adjust the importance of each skill in team balancing. Total should equal 1.0
            </Text>
            
            {(['serve', 'set', 'block', 'receive', 'attack', 'defense'] as const).map((skill) => (
              <View key={skill} style={styles.weightInput}>
                <Text variant="bodySmall" style={styles.weightLabel}>
                  {skill.charAt(0).toUpperCase() + skill.slice(1)}: {skillWeights[skill]}
                </Text>
                <View style={styles.sliderContainer}>
                  <View style={styles.sliderTrack}>
                    <View 
                      style={[
                        styles.sliderFill, 
                        { width: `${skillWeights[skill] * 100}%` }
                      ]} 
                    />
                  </View>
                  <View style={styles.sliderThumb} />
                </View>
                <View style={styles.sliderButtons}>
                  <Button
                    mode="outlined"
                    compact
                    onPress={() => setSkillWeights(prev => ({ 
                      ...prev, 
                      [skill]: Math.max(0, prev[skill] - 0.05) 
                    }))}
                    disabled={skillWeights[skill] <= 0}
                  >
                    -
                  </Button>
                  <Button
                    mode="outlined"
                    compact
                    onPress={() => setSkillWeights(prev => ({ 
                      ...prev, 
                      [skill]: Math.min(1, prev[skill] + 0.05) 
                    }))}
                    disabled={skillWeights[skill] >= 1}
                  >
                    +
                  </Button>
                </View>
              </View>
            ))}

            <Text variant="bodyMedium" style={styles.totalWeight}>
              Total: {Math.round(Object.values(skillWeights).reduce((sum, weight) => sum + weight, 0) * 100) / 100}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowWeightsDialog(false)}>Done</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    padding: 16,
    elevation: 2,
  },
  title: {
    fontWeight: 'bold',
  },
  configContainer: {
    padding: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  segmentedButtons: {
    maxWidth: 200,
  },
  playersInput: {
    width: 80,
  },
  filtersContainer: {
    padding: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  searchBar: {
    marginBottom: 8,
  },
  filterRow: {
    gap: 12,
  },
  teamFilter: {
    gap: 8,
  },
  teamSegmentedButtons: {
    flexWrap: 'wrap',
  },
  selectionControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  selectionLabel: {
    marginRight: 8,
    fontWeight: 'bold',
  },
  availabilityContainer: {
    marginTop: 12,
    alignItems: 'center',
    gap: 8,
  },
  availabilityLabel: {
    marginBottom: 4,
    opacity: 0.7,
  },
  availabilityButton: {
    minWidth: 120,
  },
  selectionCount: {
    fontWeight: 'bold',
    color: '#1976d2',
  },
  selectedPlayersList: {
    marginTop: 4,
    opacity: 0.8,
    fontStyle: 'italic',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  playerCard: {
    marginBottom: 8,
    marginHorizontal: 4, // Add horizontal margin for grid spacing
    borderRadius: 12,
    flex: 1, // Allow cards to grow to fill available space
    minWidth: 100, // Ensure minimum width for readability
  },
  playerHeader: {
    flexDirection: 'column', // Stack vertically for compact grid layout
    alignItems: 'center', // Center align for grid layout
    marginBottom: 8, // Reduced from 12
    gap: 4, // Add gap between elements
  },
  playerInfo: {
    flex: 1,
    alignItems: 'center', // Center align text
  },
  playerName: {
    fontWeight: 'bold',
    marginBottom: 2, // Reduced from 4
    fontSize: 14, // Smaller font size for compact layout
    textAlign: 'center', // Center align text
  },
  playerScore: {
    opacity: 0.7,
    fontSize: 11, // Smaller font size for compact layout
    textAlign: 'center', // Center align text
  },
  playerAvailability: {
    marginTop: 2, // Reduced from 4
    opacity: 0.7,
    fontSize: 10, // Smaller font size for compact layout
    textAlign: 'center', // Center align text
  },
  playerTeamsContainer: {
    marginBottom: 8,
  },
  teamsLabel: {
    marginBottom: 4,
    opacity: 0.7,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  teamChip: {
    backgroundColor: '#e3f2fd',
  },
  chipText: {
    fontSize: 12,
  },
  generateButton: {
    flex: 1,
    marginLeft: 8,
  },
  configActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 8,
  },
  mainScrollContainer: {
    flex: 1,
  },
  playersSectionTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  weightsNote: {
    marginBottom: 16,
    opacity: 0.7,
  },
  weightInput: {
    marginBottom: 16,
  },
  weightLabel: {
    marginBottom: 8,
  },
  totalWeight: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginTop: 8,
  },
  sliderContainer: {
    marginBottom: 8,
  },
  sliderTrack: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 8,
    position: 'relative',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 4,
  },
  sliderThumb: {
    position: 'absolute',
    right: 0,
    top: -2,
    width: 12,
    height: 12,
    backgroundColor: '#2196F3',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'white',
  },
  sliderButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
});

export default CreateMatchScreen;
