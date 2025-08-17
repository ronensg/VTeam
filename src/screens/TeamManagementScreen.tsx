import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { 
  Text, 
  Card, 
  Button, 
  FAB, 
  Dialog, 
  Portal, 
  TextInput,
  SegmentedButtons,
  useTheme,
  IconButton,
  Menu,
  Chip
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useDatabase } from '../services/DatabaseContext';
import { Team } from '../types';

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

const TeamManagementScreen: React.FC = () => {
  const theme = useTheme();
  const { teams, addTeam, updateTeam, deleteTeam } = useDatabase();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    playingDays: [] as string[],
    playingTime: '',
  });

  const daysOfWeek = [
    { value: 'sun', label: 'Sun' },
    { value: 'mon', label: 'Mon' },
    { value: 'tue', label: 'Tue' },
    { value: 'wed', label: 'Wed' },
    { value: 'thu', label: 'Thu' },
    { value: 'fri', label: 'Fri' },
    { value: 'sat', label: 'Sat' },
  ];

  const resetForm = () => {
    setFormData({
      name: '',
      playingDays: [],
      playingTime: '',
    });
  };

  const handleAddTeam = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Team name is required');
      return;
    }

    try {
      await addTeam(formData);
      setShowAddDialog(false);
      resetForm();
    } catch (error) {
      Alert.alert('Error', 'Failed to add team');
    }
  };

  const handleEditTeam = async () => {
    if (!editingTeam || !formData.name.trim()) {
      Alert.alert('Error', 'Team name is required');
      return;
    }

    try {
      await updateTeam(editingTeam.id, formData);
      setShowEditDialog(false);
      setEditingTeam(null);
      resetForm();
    } catch (error) {
      Alert.alert('Error', 'Failed to update team');
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    Alert.alert(
      'Delete Team',
      'Are you sure you want to delete this team?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTeam(teamId);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete team');
            }
          },
        },
      ]
    );
  };

  const openEditDialog = (team: Team) => {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      playingDays: team.playingDays,
      playingTime: team.playingTime || '',
    });
    setShowEditDialog(true);
  };

  const togglePlayingDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      playingDays: prev.playingDays.includes(day)
        ? prev.playingDays.filter(d => d !== day)
        : [...prev.playingDays, day],
    }));
  };

  const renderTeamCard = ({ item: team }: { item: Team }) => (
    <Card style={styles.teamCard}>
      <Card.Content>
        <View style={styles.teamHeader}>
          <View style={styles.teamInfo}>
            <Text variant="titleLarge" style={styles.teamName}>
              {team.name}
            </Text>
            {team.playingDays.length > 0 && (
              <View style={styles.playingDaysContainer}>
                <Text variant="bodySmall" style={styles.playingDaysLabel}>Playing Days:</Text>
                <View style={styles.daysChips}>
                  {team.playingDays.map((day) => (
                    <Chip key={day} style={styles.dayChip} textStyle={styles.chipText}>
                      {daysOfWeek.find(d => d.value === day)?.label}
                    </Chip>
                  ))}
                </View>
              </View>
            )}
            {team.playingTime && (
              <Text variant="bodySmall" style={styles.playingTime}>
                Playing Time: {team.playingTime}
              </Text>
            )}
          </View>
          <View style={styles.teamActions}>
            <Menu
              visible={menuVisible === team.id}
              onDismiss={() => setMenuVisible(null)}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  onPress={() => setMenuVisible(team.id)}
                />
              }
            >
              <Menu.Item
                onPress={() => {
                  setMenuVisible(null);
                  openEditDialog(team);
                }}
                title="Edit"
                leadingIcon="pencil"
              />
              <Menu.Item
                onPress={() => {
                  setMenuVisible(null);
                  handleDeleteTeam(team.id);
                }}
                title="Delete"
                leadingIcon="delete"
              />
            </Menu>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text variant="headlineMedium" style={styles.title}>Team Management</Text>
      </View>

      {/* Teams List */}
      <View style={styles.listContainer}>
        <FlashList
          data={teams}
          renderItem={renderTeamCard}
          estimatedItemSize={120}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      </View>

      {/* Add Team FAB */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setShowAddDialog(true)}
      />

      {/* Add Team Dialog */}
      <Portal>
        <Dialog visible={showAddDialog} onDismiss={() => setShowAddDialog(false)}>
          <Dialog.Title>Add New Team</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Team Name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              style={styles.input}
            />
            
            <Text variant="bodyMedium" style={styles.sectionTitle}>Playing Days</Text>
            <View style={styles.daysGrid}>
              {daysOfWeek.map((day) => (
                <Button
                  key={day.value}
                  mode={formData.playingDays.includes(day.value) ? 'contained' : 'outlined'}
                  onPress={() => togglePlayingDay(day.value)}
                  style={styles.dayButton}
                  compact
                >
                  {day.label}
                </Button>
              ))}
            </View>

            <TextInput
              label="Playing Time (optional)"
              value={formData.playingTime}
              onChangeText={(text) => setFormData({ ...formData, playingTime: text })}
              placeholder="e.g., 19:00"
              style={styles.input}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowAddDialog(false)} icon={() => <TextIcon name="close" size={20} color={theme.colors.onSurface} />}>Cancel</Button>
            <Button onPress={handleAddTeam} icon={() => <TextIcon name="add" size={20} color={theme.colors.primary} />}>Add Team</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Edit Team Dialog */}
      <Portal>
        <Dialog visible={showEditDialog} onDismiss={() => setShowEditDialog(false)}>
          <Dialog.Title>Edit Team</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Team Name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              style={styles.input}
            />
            
            <Text variant="bodyMedium" style={styles.sectionTitle}>Playing Days</Text>
            <View style={styles.daysGrid}>
              {daysOfWeek.map((day) => (
                <Button
                  key={day.value}
                  mode={formData.playingDays.includes(day.value) ? 'contained' : 'outlined'}
                  onPress={() => togglePlayingDay(day.value)}
                  style={styles.dayButton}
                  compact
                >
                  {day.label}
                </Button>
              ))}
            </View>

            <TextInput
              label="Playing Time (optional)"
              value={formData.playingTime}
              onChangeText={(text) => setFormData({ ...formData, playingTime: text })}
              placeholder="e.g., 19:00"
              style={styles.input}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onPress={handleEditTeam}>Save Changes</Button>
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
    padding: 16,
    elevation: 2,
  },
  title: {
    fontWeight: 'bold',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  teamCard: {
    marginBottom: 12,
    borderRadius: 12,
  },
  teamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  playingDaysContainer: {
    marginBottom: 8,
  },
  playingDaysLabel: {
    marginBottom: 4,
    opacity: 0.7,
  },
  daysChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  dayChip: {
    backgroundColor: '#e8f5e8',
  },
  chipText: {
    fontSize: 12,
  },
  playingTime: {
    opacity: 0.7,
  },
  teamActions: {
    marginLeft: 8,
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
  sectionTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  dayButton: {
    minWidth: 50,
  },
});

export default TeamManagementScreen;
