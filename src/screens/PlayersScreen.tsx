import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { 
  Text, 
  Card, 
  Button, 
  FAB, 
  Searchbar, 
  Chip, 
  Switch, 
  Dialog, 
  Portal, 
  TextInput,
  SegmentedButtons,
  useTheme,
  IconButton,
  Menu,
  Divider
} from 'react-native-paper';
import Slider from '@react-native-community/slider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useDatabase } from '../services/DatabaseContext';
import { Player, SkillWeights } from '../types';

const PlayersScreen: React.FC = () => {
  const theme = useTheme();
  const { players, teams, addPlayer, updatePlayer, deletePlayer, importPlayersFromCSV } = useDatabase();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [teamFilter, setTeamFilter] = useState<string>('');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'unavailable'>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    serve: 5,
    set: 5,
    block: 5,
    receive: 5,
    attack: 5,
    defense: 5,
    teams: [] as string[],
    notes: '',
    availability: 'available' as 'available' | 'unavailable',
  });

  // Filtered players
  const filteredPlayers = players.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         player.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTeam = !teamFilter || player.teams.includes(teamFilter);
    const matchesAvailability = availabilityFilter === 'all' || player.availability === availabilityFilter;
    
    return matchesSearch && matchesTeam && matchesAvailability;
  });

  const resetForm = () => {
    setFormData({
      name: '',
      serve: 5,
      set: 5,
      block: 5,
      receive: 5,
      attack: 5,
      defense: 5,
      teams: [],
      notes: '',
      availability: 'available',
    });
  };

  const handleAddPlayer = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Player name is required');
      return;
    }

    try {
      await addPlayer(formData);
      setShowAddDialog(false);
      resetForm();
    } catch (error) {
      Alert.alert('Error', 'Failed to add player');
    }
  };

  const handleEditPlayer = async () => {
    if (!editingPlayer || !formData.name.trim()) {
      Alert.alert('Error', 'Player name is required');
      return;
    }

    try {
      await updatePlayer(editingPlayer.id, formData);
      setShowEditDialog(false);
      setEditingPlayer(null);
      resetForm();
    } catch (error) {
      Alert.alert('Error', 'Failed to update player');
    }
  };

  const handleDeletePlayer = async (playerId: string) => {
    Alert.alert(
      'Delete Player',
      'Are you sure you want to delete this player?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePlayer(playerId);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete player');
            }
          },
        },
      ]
    );
  };

  const handleImportCSV = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/csv',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets[0]) return;

      const fileUri = result.assets[0].uri;
      const csvContent = Platform.OS === 'web'
        ? await (await fetch(fileUri)).text()
        : await FileSystem.readAsStringAsync(fileUri);
      
      const importResult = await importPlayersFromCSV(csvContent);
      
      Alert.alert(
        'Import Complete',
        `Successfully imported ${importResult.success} players.\n${importResult.errors.length > 0 ? `\nErrors: ${importResult.errors.join(', ')}` : ''}`
      );
      
      setShowImportDialog(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to import CSV file');
    }
  };

  const downloadCSVTemplate = () => {
    const template = `Name,Serve,Set,Block,Receive,Attack,Defense,Teams,Notes,Availability
John Doe,7,8,6,7,9,8,Team A,Great attacker,available
Jane Smith,6,9,7,8,7,9,Team B,Excellent setter,available`;
    
    // In a real app, you'd use a file download library
    Alert.alert('CSV Template', 'Copy this template:\n\n' + template);
  };

  const openEditDialog = (player: Player) => {
    setEditingPlayer(player);
    setFormData({
      name: player.name,
      serve: player.serve,
      set: player.set,
      block: player.block,
      receive: player.receive,
      attack: player.attack,
      defense: player.defense,
      teams: player.teams,
      notes: player.notes || '',
      availability: player.availability,
    });
    setShowEditDialog(true);
  };

  const renderPlayerCard = ({ item: player }: { item: Player }) => (
    <Card style={[styles.playerCard, { opacity: player.availability === 'unavailable' ? 0.6 : 1 }]}>
      <Card.Content>
        <View style={styles.playerHeader}>
          <View style={styles.playerInfo}>
            <Text variant="titleMedium" style={styles.playerName}>
              {player.name}
            </Text>
            <Text variant="bodySmall" style={styles.playerScore}>
              Total Score: {Math.round((player.serve + player.set + player.block + player.receive + player.attack + player.defense) * 100) / 100}
            </Text>
          </View>
          <View style={styles.playerActions}>
            <Switch
              value={player.availability === 'available'}
              onValueChange={(value) => 
                updatePlayer(player.id, { availability: value ? 'available' : 'unavailable' })
              }
            />
            <Menu
              visible={menuVisible === player.id}
              onDismiss={() => setMenuVisible(null)}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  onPress={() => setMenuVisible(player.id)}
                />
              }
            >
              <Menu.Item
                onPress={() => {
                  setMenuVisible(null);
                  openEditDialog(player);
                }}
                title="Edit"
                leadingIcon="pencil"
              />
              <Menu.Item
                onPress={() => {
                  setMenuVisible(null);
                  handleDeletePlayer(player.id);
                }}
                title="Delete"
                leadingIcon="delete"
              />
            </Menu>
          </View>
        </View>

        <View style={styles.skillsContainer}>
          <View style={styles.skillRow}>
            <Text variant="bodySmall" style={styles.skillLabel}>Serve:</Text>
            <View style={styles.skillBar}>
              <View style={[styles.skillFill, { width: `${player.serve * 10}%` }]} />
            </View>
            <Text variant="bodySmall" style={styles.skillValue}>{player.serve}</Text>
          </View>
          <View style={styles.skillRow}>
            <Text variant="bodySmall" style={styles.skillLabel}>Set:</Text>
            <View style={styles.skillBar}>
              <View style={[styles.skillFill, { width: `${player.set * 10}%` }]} />
            </View>
            <Text variant="bodySmall" style={styles.skillValue}>{player.set}</Text>
          </View>
          <View style={styles.skillRow}>
            <Text variant="bodySmall" style={styles.skillLabel}>Block:</Text>
            <View style={styles.skillBar}>
              <View style={[styles.skillFill, { width: `${player.block * 10}%` }]} />
            </View>
            <Text variant="bodySmall" style={styles.skillValue}>{player.block}</Text>
          </View>
          <View style={styles.skillRow}>
            <Text variant="bodySmall" style={styles.skillLabel}>Receive:</Text>
            <View style={styles.skillBar}>
              <View style={[styles.skillFill, { width: `${player.receive * 10}%` }]} />
            </View>
            <Text variant="bodySmall" style={styles.skillValue}>{player.receive}</Text>
          </View>
          <View style={styles.skillRow}>
            <Text variant="bodySmall" style={styles.skillLabel}>Attack:</Text>
            <View style={styles.skillBar}>
              <View style={[styles.skillFill, { width: `${player.attack * 10}%` }]} />
            </View>
            <Text variant="bodySmall" style={styles.skillValue}>{player.attack}</Text>
          </View>
          <View style={styles.skillRow}>
            <Text variant="bodySmall" style={styles.skillLabel}>Defense:</Text>
            <View style={styles.skillBar}>
              <View style={[styles.skillFill, { width: `${player.defense * 10}%` }]} />
            </View>
            <Text variant="bodySmall" style={styles.skillValue}>{player.defense}</Text>
          </View>
        </View>

        {player.teams.length > 0 && (
          <View style={styles.teamsContainer}>
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

        {player.notes && (
          <Text variant="bodySmall" style={styles.notes}>
            {player.notes}
          </Text>
        )}
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text variant="headlineMedium" style={styles.title}>Players</Text>
        <View style={styles.headerActions}>
          <Button
            mode="outlined"
            onPress={() => setShowImportDialog(true)}
            icon="upload"
          >
            Import CSV
          </Button>
          <Button
            mode="outlined"
            onPress={downloadCSVTemplate}
            icon="download"
          >
            Template
          </Button>
        </View>
      </View>

      {/* Filters */}
      <View style={[styles.filtersContainer, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outline }]}>
        <Searchbar
          placeholder="Search players..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
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
      </View>

      {/* Players List */}
      <View style={styles.listContainer}>
        <FlashList
          data={filteredPlayers}
          renderItem={renderPlayerCard}
          estimatedItemSize={200}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      </View>

      {/* Add Player FAB */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setShowAddDialog(true)}
      />

      {/* Add Player Dialog */}
      <Portal>
        <Dialog visible={showAddDialog} onDismiss={() => setShowAddDialog(false)}>
          <Dialog.Title>Add New Player</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              style={styles.input}
            />
            
            <Text variant="bodyMedium" style={styles.skillSectionTitle}>Skill Ratings (0-10)</Text>
            
            {(['serve', 'set', 'block', 'receive', 'attack', 'defense'] as const).map((skill) => (
              <View key={skill} style={styles.skillInput}>
                <Text variant="bodySmall" style={styles.skillLabel}>
                  {skill.charAt(0).toUpperCase() + skill.slice(1)}: {formData[skill]}
                </Text>
                <Slider
                  value={formData[skill]}
                  onValueChange={(value) => setFormData({ ...formData, [skill]: value })}
                  minimumValue={0}
                  maximumValue={10}
                  step={1}
                  style={styles.slider}
                />
              </View>
            ))}

            <TextInput
              label="Notes"
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              multiline
              style={styles.input}
            />

            <SegmentedButtons
              value={formData.availability}
              onValueChange={(value) => setFormData({ ...formData, availability: value as any })}
              buttons={[
                { value: 'available', label: 'Available' },
                { value: 'unavailable', label: 'Unavailable' },
              ]}
              style={styles.availabilityButtons}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onPress={handleAddPlayer}>Add Player</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Edit Player Dialog */}
      <Portal>
        <Dialog visible={showEditDialog} onDismiss={() => setShowEditDialog(false)}>
          <Dialog.Title>Edit Player</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              style={styles.input}
            />
            
            <Text variant="bodyMedium" style={styles.skillSectionTitle}>Skill Ratings (0-10)</Text>
            
            {(['serve', 'set', 'block', 'receive', 'attack', 'defense'] as const).map((skill) => (
              <View key={skill} style={styles.skillInput}>
                <Text variant="bodySmall" style={styles.skillLabel}>
                  {skill.charAt(0).toUpperCase() + skill.slice(1)}: {formData[skill]}
                </Text>
                <Slider
                  value={formData[skill]}
                  onValueChange={(value) => setFormData({ ...formData, [skill]: value })}
                  minimumValue={0}
                  maximumValue={10}
                  step={1}
                  style={styles.slider}
                />
              </View>
            ))}

            <TextInput
              label="Notes"
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              multiline
              style={styles.input}
            />

            <SegmentedButtons
              value={formData.availability}
              onValueChange={(value) => setFormData({ ...formData, availability: value as any })}
              buttons={[
                { value: 'available', label: 'Available' },
                { value: 'unavailable', label: 'Unavailable' },
              ]}
              style={styles.availabilityButtons}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onPress={handleEditPlayer}>Save Changes</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Import Dialog */}
      <Portal>
        <Dialog visible={showImportDialog} onDismiss={() => setShowImportDialog(false)}>
          <Dialog.Title>Import Players from CSV</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Select a CSV file with player data. The file should have columns for:
              Name, Serve, Set, Block, Receive, Attack, Defense, Teams, Notes, Availability
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowImportDialog(false)}>Cancel</Button>
            <Button onPress={handleImportCSV}>Import</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    elevation: 2,
  },
  title: {
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  filtersContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchBar: {
    marginBottom: 12,
  },
  filterRow: {
    gap: 12,
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  teamFilter: {
    gap: 8,
  },
  teamSegmentedButtons: {
    flexWrap: 'wrap',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  playerCard: {
    marginBottom: 12,
    borderRadius: 12,
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  playerScore: {
    opacity: 0.7,
  },
  playerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skillsContainer: {
    marginBottom: 12,
  },
  skillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  skillLabel: {
    width: 60,
    marginRight: 8,
  },
  skillBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginRight: 8,
  },
  skillFill: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 4,
  },
  skillValue: {
    width: 20,
    textAlign: 'center',
  },
  teamsContainer: {
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
  notes: {
    fontStyle: 'italic',
    opacity: 0.7,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  input: {
    marginBottom: 16,
  },
  skillSectionTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
  },
  skillInput: {
    marginBottom: 16,
  },
  slider: {
    width: '100%',
  },
  availabilityButtons: {
    marginTop: 8,
  },
});

export default PlayersScreen;
