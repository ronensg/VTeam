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
    'success': '✅'
  };
  
  const icon = iconMap[name] || '?';
  return (
    <Text style={{ fontSize: size, color, textAlign: 'center', lineHeight: size }}>
      {icon}
    </Text>
  );
};

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
      // Check if we're on mobile web browser
      const isMobileWeb = Platform.OS === 'web' && (
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        window.innerWidth <= 768
      );

      if (Platform.OS === 'web') {
        // Create a file input element for web compatibility
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.csv,text/csv';
        fileInput.style.display = 'none';
        
        // Add mobile-specific attributes for better compatibility
        if (isMobileWeb) {
          fileInput.setAttribute('capture', 'filesystem');
          fileInput.setAttribute('webkitdirectory', 'false');
          // Additional mobile attributes
          fileInput.setAttribute('accept', '.csv,text/csv,application/csv');
          fileInput.setAttribute('multiple', 'false');
        }
        
        fileInput.onchange = async (event) => {
          const target = event.target as HTMLInputElement;
          const file = target.files?.[0];
          
          if (!file) {
            Alert.alert('No File Selected', 'Please select a CSV file to import.');
            return;
          }
          
          // Debug info
          console.log('File selected:', file.name, 'Size:', file.size, 'Type:', file.type);
          
          try {
            // Use FileReader for better mobile compatibility
            const reader = new FileReader();
            
            reader.onload = async (e) => {
              try {
                const csvContent = e.target?.result as string;
                console.log('CSV content length:', csvContent.length);
                
                const importResult = await importPlayersFromCSV(csvContent);
                
                Alert.alert(
                  'Import Complete',
                  `Successfully imported ${importResult.success} players.\n${importResult.errors.length > 0 ? `\nErrors: ${importResult.errors.join(', ')}` : ''}`
                );
                
                setShowImportDialog(false);
              } catch (error) {
                console.error('CSV processing error:', error);
                Alert.alert('Error', `Failed to process CSV file: ${error}`);
              }
            };
            
            reader.onerror = (error) => {
              console.error('FileReader error:', error);
              Alert.alert('Error', 'Failed to read CSV file. Please try again.');
            };
            
            reader.readAsText(file);
          } catch (error) {
            console.error('File handling error:', error);
            Alert.alert('Error', `Failed to handle file: ${error}`);
          }
          
          // Clean up
          document.body.removeChild(fileInput);
        };
        
        // Add to DOM and trigger click
        document.body.appendChild(fileInput);
        
        // Try to trigger file selection
        try {
          fileInput.click();
        } catch (error) {
          console.error('File input click failed:', error);
          // Fallback: show manual instructions
          Alert.alert(
            'File Selection Issue',
            'Please manually select your CSV file. If you continue to have issues, try:\n\n1. Refreshing the page\n2. Using a different browser\n3. Checking file permissions',
            [
              { text: 'OK', style: 'default' },
              { text: 'Try Again', onPress: () => fileInput.click() }
            ]
          );
        }
      } else {
        // Native mobile app handling
        const result = await DocumentPicker.getDocumentAsync({
          type: 'text/csv',
          copyToCacheDirectory: true,
        });

        if (result.canceled || !result.assets[0]) return;

        const fileUri = result.assets[0].uri;
        const csvContent = await FileSystem.readAsStringAsync(fileUri);
        
        const importResult = await importPlayersFromCSV(csvContent);
        
        Alert.alert(
          'Import Complete',
          `Successfully imported ${importResult.success} players.\n${importResult.errors.length > 0 ? `\nErrors: ${importResult.errors.join(', ')}` : ''}`
        );
        
        setShowImportDialog(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to import CSV file');
    }
  };

  const downloadCSVTemplate = () => {
    const template = `Name,Serve,Set,Block,Receive,Attack,Defense,Teams,Notes,Availability
John Doe,7,8,6,7,9,8,Team A,Great attacker,available
Jane Smith,6,9,7,8,7,9,Team B,Excellent setter,available`;
    
    if (Platform.OS === 'web') {
      // Create downloadable CSV for web browsers
      const blob = new Blob([template], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'volleyball-players-template.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } else {
      // For native apps, show in alert
      Alert.alert('CSV Template', 'Copy this template:\n\n' + template);
    }
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
                  icon={() => <TextIcon name="more-vert" size={24} color={theme.colors.onSurface} />}
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
                leadingIcon={() => <TextIcon name="edit" size={20} color={theme.colors.onSurface} />}
              />
              <Menu.Item
                onPress={() => {
                  setMenuVisible(null);
                  handleDeletePlayer(player.id);
                }}
                title="Delete"
                leadingIcon={() => <TextIcon name="delete" size={20} color={theme.colors.onSurface} />}
              />
            </Menu>
          </View>
        </View>

        <View style={styles.skillsContainer}>
          <View style={styles.skillRow}>
            <Text variant="bodySmall" style={styles.skillLabel}>Serve:</Text>
            <View style={[styles.skillBar, { backgroundColor: theme.colors.outline }]}>
              <View style={[styles.skillFill, { width: `${player.serve * 10}%`, backgroundColor: theme.colors.primary }]} />
            </View>
            <Text variant="bodySmall" style={styles.skillValue}>{player.serve}</Text>
          </View>
          <View style={styles.skillRow}>
            <Text variant="bodySmall" style={styles.skillLabel}>Set:</Text>
            <View style={[styles.skillBar, { backgroundColor: theme.colors.outline }]}>
              <View style={[styles.skillFill, { width: `${player.set * 10}%`, backgroundColor: theme.colors.primary }]} />
            </View>
            <Text variant="bodySmall" style={styles.skillValue}>{player.set}</Text>
          </View>
          <View style={styles.skillRow}>
            <Text variant="bodySmall" style={styles.skillLabel}>Block:</Text>
            <View style={[styles.skillBar, { backgroundColor: theme.colors.outline }]}>
              <View style={[styles.skillFill, { width: `${player.block * 10}%`, backgroundColor: theme.colors.primary }]} />
            </View>
            <Text variant="bodySmall" style={styles.skillValue}>{player.block}</Text>
          </View>
          <View style={styles.skillRow}>
            <Text variant="bodySmall" style={styles.skillLabel}>Receive:</Text>
            <View style={[styles.skillBar, { backgroundColor: theme.colors.outline }]}>
              <View style={[styles.skillFill, { width: `${player.receive * 10}%`, backgroundColor: theme.colors.primary }]} />
            </View>
            <Text variant="bodySmall" style={styles.skillValue}>{player.receive}</Text>
          </View>
          <View style={styles.skillRow}>
            <Text variant="bodySmall" style={styles.skillLabel}>Attack:</Text>
            <View style={[styles.skillBar, { backgroundColor: theme.colors.outline }]}>
              <View style={[styles.skillFill, { width: `${player.attack * 10}%`, backgroundColor: theme.colors.primary }]} />
            </View>
            <Text variant="bodySmall" style={styles.skillValue}>{player.attack}</Text>
          </View>
          <View style={styles.skillRow}>
            <Text variant="bodySmall" style={styles.skillLabel}>Defense:</Text>
            <View style={[styles.skillBar, { backgroundColor: theme.colors.outline }]}>
              <View style={[styles.skillFill, { width: `${player.defense * 10}%`, backgroundColor: theme.colors.primary }]} />
            </View>
            <Text variant="bodySmall" style={styles.skillValue}>{player.defense}</Text>
          </View>
        </View>

        {player.teams.length > 0 && (
          <View style={styles.teamsContainer}>
            <Text variant="bodySmall" style={styles.teamsLabel}>Teams:</Text>
            <View style={styles.chipsContainer}>
              {player.teams.map((team, index) => (
                <Chip key={index} style={styles.teamChip} textStyle={styles.teamChipText}>
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
                            icon={() => <TextIcon name="upload" size={20} color={theme.colors.primary} />}
          >
            Import CSV
          </Button>
          <Button
            mode="outlined"
            onPress={downloadCSVTemplate}
                            icon={() => <TextIcon name="download" size={20} color={theme.colors.primary} />}
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
        icon={() => <TextIcon name="add" size={24} color="white" />}
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

            <Text variant="bodyMedium" style={styles.skillSectionTitle}>Teams</Text>
            <View style={styles.teamsContainer}>
              {teams.map((team) => (
                <Chip
                  key={team.id}
                  selected={formData.teams.includes(team.name)}
                  onPress={() => {
                    const newTeams = formData.teams.includes(team.name)
                      ? formData.teams.filter(t => t !== team.name)
                      : [...formData.teams, team.name];
                    setFormData({ ...formData, teams: newTeams });
                  }}
                  style={styles.teamChip}
                  textStyle={styles.teamChipText}
                >
                  {team.name}
                </Chip>
              ))}
              {teams.length === 0 && (
                <Text variant="bodySmall" style={styles.noTeamsText}>
                  No teams available. Create teams in the Teams screen first.
                </Text>
              )}
            </View>

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
            <Button onPress={() => setShowAddDialog(false)} icon={() => <TextIcon name="close" size={20} color={theme.colors.onSurface} />}>Cancel</Button>
            <Button onPress={handleAddPlayer} icon={() => <TextIcon name="add" size={20} color={theme.colors.primary} />}>Add Player</Button>
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

            <Text variant="bodyMedium" style={styles.skillSectionTitle}>Teams</Text>
            <View style={styles.teamsContainer}>
              {teams.map((team) => (
                <Chip
                  key={team.id}
                  selected={formData.teams.includes(team.name)}
                  onPress={() => {
                    const newTeams = formData.teams.includes(team.name)
                      ? formData.teams.filter(t => t !== team.name)
                      : [...formData.teams, team.name];
                    setFormData({ ...formData, teams: newTeams });
                  }}
                  style={styles.teamChip}
                  textStyle={styles.teamChipText}
                >
                  {team.name}
                </Chip>
              ))}
              {teams.length === 0 && (
                <Text variant="bodySmall" style={styles.noTeamsText}>
                  No teams available. Create teams in the Teams screen first.
                </Text>
              )}
            </View>

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
          <Dialog.Title>
            Import Players from CSV
            <View style={styles.downloadButtonContainer}>
              <Button 
                mode="outlined" 
                onPress={downloadCSVTemplate}
                icon={() => <TextIcon name="download" size={16} color={theme.colors.primary} />}
                style={styles.downloadTemplateButton}
                compact
              >
                Template
              </Button>
            </View>
          </Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ marginBottom: 16 }}>
              Select a CSV file with player data. The file should have columns for:
              Name, Serve, Set, Block, Receive, Attack, Defense, Teams, Notes, Availability
            </Text>
            
            {Platform.OS === 'web' && (
              <Text variant="bodySmall" style={{ color: theme.colors.primary, marginBottom: 16 }}>
                💡 Tip: On mobile, tap the Import button to open file selection
              </Text>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowImportDialog(false)}>Cancel</Button>
            <Button onPress={handleImportCSV} mode="contained">
              {Platform.OS === 'web' ? 'Select CSV File' : 'Import CSV'}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
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
    borderBottomWidth: 1,
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
    borderRadius: 4,
    marginRight: 8,
  },
  skillFill: {
    height: '100%',
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
    // Theme colors will be applied automatically
  },
  teamChipText: {
    fontSize: 12,
  },
  noTeamsText: {
    opacity: 0.7,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
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
  downloadButtonContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
  },
  downloadTemplateButton: {
    minWidth: 80,
    height: 32,
  },
});

export default PlayersScreen;
