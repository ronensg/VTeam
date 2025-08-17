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
  const { players, teams, addMatch, updatePlayer } = useDatabase();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [teamFilter, setTeamFilter] = useState<string>('');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'unavailable'>('all');
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
  const [localPlayers, setLocalPlayers] = useState(players);

  // Sync localPlayers with players when they change
  useEffect(() => {
    setLocalPlayers(players);
  }, [players]);

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
    return localPlayers.filter(player => {
      const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTeam = !teamFilter || player.teams.includes(teamFilter);
      const matchesAvailability = availabilityFilter === 'all' || player.availability === availabilityFilter;
      
      return matchesSearch && matchesTeam && matchesAvailability;
    });
  }, [localPlayers, searchQuery, teamFilter, availabilityFilter]);

  // Available players for selection (only those marked as available)
  const availablePlayers = filteredPlayers.filter(p => p.availability === 'available');
  
  // All players that should be displayed (including unavailable ones)
  const displayPlayers = filteredPlayers;

  const handleSelectAll = () => {
    const allPlayerIds = new Set(availablePlayers.map(p => p.id));
    setSelectedPlayers(allPlayerIds);
  };

  const handleDeselectAll = () => {
    setSelectedPlayers(new Set());
  };

  const handlePlayerToggle = (playerId: string) => {
    console.log('=== PLAYER TOGGLE DEBUG ===');
    console.log('Toggling player selection:', playerId);
    console.log('Current selected players:', Array.from(selectedPlayers));
    console.log('Player exists in current selection:', selectedPlayers.has(playerId));
    
    // Check if player is available for selection
    const player = localPlayers.find(p => p.id === playerId);
    if (!player) {
      console.log('❌ Player not found:', playerId);
      return;
    }
    
    if (player.availability === 'unavailable') {
      console.log('❌ Player is unavailable, cannot select:', playerId);
      return;
    }
    
    const newSelected = new Set(selectedPlayers);
    if (newSelected.has(playerId)) {
      newSelected.delete(playerId);
      console.log('✅ Removed player from selection:', playerId);
    } else {
      newSelected.add(playerId);
      console.log('✅ Added player to selection:', playerId);
    }
    
    console.log('New selection set:', Array.from(newSelected));
    setSelectedPlayers(newSelected);
    
    // Force a re-render to ensure state update
    setTimeout(() => {
      console.log('State after update - selectedPlayers:', Array.from(selectedPlayers));
    }, 100);
  };

  const handleAvailabilityToggle = async (playerId: string, event: any) => {
    // Prevent the event from bubbling up to the card's onPress
    event.stopPropagation();
    
    try {
      const player = localPlayers.find(p => p.id === playerId);
      if (player) {
        const newAvailability = player.availability === 'available' ? 'unavailable' : 'available';
        console.log('Toggling availability for player:', playerId, 'from', player.availability, 'to:', newAvailability);
        
        // Update the database first (this will update the global state)
        await updatePlayer(playerId, { availability: newAvailability as 'available' | 'unavailable' });
        
        // Update the local state to show the change immediately
        const updatedPlayers = localPlayers.map(p => 
          p.id === playerId ? { ...p, availability: newAvailability as 'available' | 'unavailable' } : p
        );
        setLocalPlayers(updatedPlayers);
        
        console.log('Availability updated for player:', playerId, 'to:', newAvailability);
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

  const renderPlayerCard = ({ item: player }: { item: Player }) => {
    const isSelected = selectedPlayers.has(player.id);
    const isAvailable = player.availability === 'available';
    console.log(`Rendering player ${player.name} (${player.id}) - Selected: ${isSelected}, Available: ${isAvailable}`);
    
    return (
      <Card 
        style={[
          styles.playerCard, 
          { 
            opacity: isAvailable ? 1 : 0.6,
            borderColor: isSelected ? '#4CAF50' : 'transparent',
            borderWidth: isSelected ? 3 : 0,
            backgroundColor: isSelected ? '#E8F5E8' : theme.colors.surface,
          }
        ]}
        onPress={() => isAvailable ? handlePlayerToggle(player.id) : null}
      >
      <Card.Content>
                 {/* Player Name */}
         <Text variant="titleMedium" style={[
           styles.playerName,
           { color: isSelected ? '#2E7D32' : theme.colors.onSurface }
         ]}>
           {player.name}
         </Text>

        {/* Availability Toggle Button */}
        <View style={styles.availabilityToggleContainer}>
          <Button
            mode="contained"
            compact
            onPress={(event) => handleAvailabilityToggle(player.id, event)}
            style={[
              styles.availabilityToggleButton,
              { 
                backgroundColor: player.availability === 'available' ? '#4CAF50' : '#9E9E9E',
                borderColor: player.availability === 'available' ? '#4CAF50' : '#9E9E9E'
              }
            ]}
            textColor="white"
          >
            {player.availability === 'available' ? 'Available' : 'Unavailable'}
          </Button>
        </View>

        {/* Teams Indicator */}
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

                 {/* Selection Status Indicator */}
         <View style={styles.selectionStatusContainer}>
           <Text variant="bodySmall" style={[
             styles.selectionStatusText,
             { color: isSelected ? '#2E7D32' : !isAvailable ? '#9E9E9E' : theme.colors.onSurface }
           ]}>
             {!isAvailable ? '❌ Unavailable' : isSelected ? '✓ Selected for Match' : 'Tap to Select'}
           </Text>
         </View>
       </Card.Content>
     </Card>
     );
   };

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
                 Selected: {Array.from(selectedPlayers).map(id => localPlayers.find(p => p.id === id)?.name).join(', ')}
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
           <Text variant="titleMedium" style={styles.playersSectionTitle}>All Players</Text>
           <FlashList
             data={displayPlayers}
             renderItem={renderPlayerCard}
             estimatedItemSize={150}
             keyExtractor={(item) => item.id}
             numColumns={3} // Display 3 players per row
             contentContainerStyle={styles.listContent}
             extraData={selectedPlayers.size} // Force re-render when selection changes
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
  availabilityToggleContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  availabilityToggleButton: {
    minWidth: 100,
    height: 32,
  },
  selectionStatusContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  selectionStatusText: {
    fontWeight: 'bold',
    textAlign: 'center',
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
    marginHorizontal: 4,
    borderRadius: 12,
    flex: 1,
    minWidth: 120,
    padding: 8,
  },
  playerName: {
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 16,
    textAlign: 'center',
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
