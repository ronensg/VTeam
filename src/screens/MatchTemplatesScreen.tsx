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
import Slider from '@react-native-community/slider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import { useDatabase } from '../services/DatabaseContext';
import { MatchTemplate, SkillWeights } from '../types';

const MatchTemplatesScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const { templates, addTemplate, updateTemplate, deleteTemplate } = useDatabase();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MatchTemplate | null>(null);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    numberOfTeams: 2,
    playersPerTeam: undefined as number | undefined,
    skillWeights: {
      serve: 0.15,
      set: 0.15,
      block: 0.15,
      receive: 0.15,
      attack: 0.25,
      defense: 0.15,
    } as SkillWeights,
    defaultFilters: {
      teamFilter: '',
      searchQuery: '',
      availabilityFilter: 'available' as 'all' | 'available' | 'unavailable',
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      numberOfTeams: 2,
      playersPerTeam: undefined,
      skillWeights: {
        serve: 0.15,
        set: 0.15,
        block: 0.15,
        receive: 0.15,
        attack: 0.25,
        defense: 0.15,
      },
      defaultFilters: {
        teamFilter: '',
        searchQuery: '',
        availabilityFilter: 'available',
      },
    });
  };

  const handleAddTemplate = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Template name is required');
      return;
    }

    try {
      await addTemplate(formData);
      setShowAddDialog(false);
      resetForm();
    } catch (error) {
      Alert.alert('Error', 'Failed to add template');
    }
  };

  const handleEditTemplate = async () => {
    if (!editingTemplate || !formData.name.trim()) {
      Alert.alert('Error', 'Template name is required');
      return;
    }

    try {
      await updateTemplate(editingTemplate.id, formData);
      setShowEditDialog(false);
      setEditingTemplate(null);
      resetForm();
    } catch (error) {
      Alert.alert('Error', 'Failed to update template');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    Alert.alert(
      'Delete Template',
      'Are you sure you want to delete this template?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTemplate(templateId);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete template');
            }
          },
        },
      ]
    );
  };

  const handleUseTemplate = (template: MatchTemplate) => {
    // Navigate to Create Match screen with template data
    navigation.navigate('Create Match' as never);
    // In a real app, you'd pass the template data to the Create Match screen
    Alert.alert('Template Applied', 'Template settings have been applied to the Create Match screen');
  };

  const openEditDialog = (template: MatchTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      numberOfTeams: template.numberOfTeams,
      playersPerTeam: template.playersPerTeam,
      skillWeights: template.skillWeights,
      defaultFilters: template.defaultFilters,
    });
    setShowEditDialog(true);
  };

  const renderTemplateCard = ({ item: template }: { item: MatchTemplate }) => (
    <Card style={styles.templateCard}>
      <Card.Content>
        <View style={styles.templateHeader}>
          <View style={styles.templateInfo}>
            <Text variant="titleLarge" style={styles.templateName}>
              {template.name}
            </Text>
            <Text variant="bodyMedium" style={styles.templateDetails}>
              {template.numberOfTeams} teams
              {template.playersPerTeam && ` • ${template.playersPerTeam} players per team`}
            </Text>
          </View>
          <View style={styles.templateActions}>
            <Button
              mode="contained"
              onPress={() => handleUseTemplate(template)}
              icon="play"
              compact
            >
              Use
            </Button>
            <Menu
              visible={menuVisible === template.id}
              onDismiss={() => setMenuVisible(null)}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  onPress={() => setMenuVisible(template.id)}
                />
              }
            >
              <Menu.Item
                onPress={() => {
                  setMenuVisible(null);
                  openEditDialog(template);
                }}
                title="Edit"
                leadingIcon="pencil"
              />
              <Menu.Item
                onPress={() => {
                  setMenuVisible(null);
                  handleDeleteTemplate(template.id);
                }}
                title="Delete"
                leadingIcon="delete"
              />
            </Menu>
          </View>
        </View>

        <View style={styles.skillsContainer}>
          <Text variant="bodySmall" style={styles.skillsLabel}>Skill Weights:</Text>
          <View style={styles.skillsGrid}>
            {(['serve', 'set', 'block', 'receive', 'attack', 'defense'] as const).map((skill) => (
              <View key={skill} style={styles.skillItem}>
                <Text variant="bodySmall" style={styles.skillLabel}>
                  {skill.charAt(0).toUpperCase() + skill.slice(1)}
                </Text>
                <Text variant="bodySmall" style={styles.skillValue}>
                  {template.skillWeights[skill]}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {template.defaultFilters.teamFilter && (
          <View style={styles.filtersContainer}>
            <Text variant="bodySmall" style={styles.filtersLabel}>Default Filters:</Text>
            <Chip style={styles.filterChip} textStyle={styles.chipText}>
              Team: {template.defaultFilters.teamFilter}
            </Chip>
            {template.defaultFilters.availabilityFilter !== 'all' && (
              <Chip style={styles.filterChip} textStyle={styles.chipText}>
                {template.defaultFilters.availabilityFilter === 'available' ? 'Available Only' : 'Unavailable Only'}
              </Chip>
            )}
          </View>
        )}

        <Text variant="bodySmall" style={styles.createdDate}>
          Created: {new Date(template.createdAt).toLocaleDateString()}
        </Text>
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text variant="headlineMedium" style={styles.title}>Match Templates</Text>
      </View>

      {/* Templates List */}
      <View style={styles.listContainer}>
        <FlashList
          data={templates}
          renderItem={renderTemplateCard}
          estimatedItemSize={200}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      </View>

      {/* Add Template FAB */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setShowAddDialog(true)}
      />

      {/* Add Template Dialog */}
      <Portal>
        <Dialog visible={showAddDialog} onDismiss={() => setShowAddDialog(false)}>
          <Dialog.Title>Add New Template</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Template Name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              style={styles.input}
            />
            
            <View style={styles.configRow}>
              <Text variant="bodyMedium">Number of Teams:</Text>
              <SegmentedButtons
                value={formData.numberOfTeams.toString()}
                onValueChange={(value) => setFormData({ ...formData, numberOfTeams: parseInt(value) })}
                buttons={[
                  { value: '2', label: '2' },
                  { value: '3', label: '3' },
                  { value: '4', label: '4' },
                ]}
                style={styles.segmentedButtons}
              />
            </View>

            <TextInput
              label="Players per Team (optional)"
              value={formData.playersPerTeam?.toString() || ''}
              onChangeText={(text) => setFormData({ ...formData, playersPerTeam: text ? parseInt(text) : undefined })}
              placeholder="Auto-balance"
              keyboardType="numeric"
              style={styles.input}
            />

            <Text variant="bodyMedium" style={styles.sectionTitle}>Skill Weights</Text>
            {(['serve', 'set', 'block', 'receive', 'attack', 'defense'] as const).map((skill) => (
              <View key={skill} style={styles.weightInput}>
                <Text variant="bodySmall" style={styles.weightLabel}>
                  {skill.charAt(0).toUpperCase() + skill.slice(1)}: {formData.skillWeights[skill]}
                </Text>
                <Slider
                  value={formData.skillWeights[skill]}
                  onValueChange={(value) => setFormData(prev => ({
                    ...prev,
                    skillWeights: { ...prev.skillWeights, [skill]: value }
                  }))}
                  minimumValue={0}
                  maximumValue={1}
                  step={0.05}
                  style={styles.weightSlider}
                />
              </View>
            ))}

            <Text variant="bodyMedium" style={styles.totalWeight}>
              Total: {Math.round(Object.values(formData.skillWeights).reduce((sum, weight) => sum + weight, 0) * 100) / 100}
            </Text>

            <Text variant="bodyMedium" style={styles.sectionTitle}>Default Filters</Text>
            
            <SegmentedButtons
              value={formData.defaultFilters.availabilityFilter}
              onValueChange={(value) => setFormData(prev => ({
                ...prev,
                defaultFilters: { ...prev.defaultFilters, availabilityFilter: value as any }
              }))}
              buttons={[
                { value: 'all', label: 'All Players' },
                { value: 'available', label: 'Available Only' },
                { value: 'unavailable', label: 'Unavailable Only' },
              ]}
              style={styles.availabilityButtons}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onPress={handleAddTemplate}>Add Template</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Edit Template Dialog */}
      <Portal>
        <Dialog visible={showEditDialog} onDismiss={() => setShowEditDialog(false)}>
          <Dialog.Title>Edit Template</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Template Name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              style={styles.input}
            />
            
            <View style={styles.configRow}>
              <Text variant="bodyMedium">Number of Teams:</Text>
              <SegmentedButtons
                value={formData.numberOfTeams.toString()}
                onValueChange={(value) => setFormData({ ...formData, numberOfTeams: parseInt(value) })}
                buttons={[
                  { value: '2', label: '2' },
                  { value: '3', label: '3' },
                  { value: '4', label: '4' },
                ]}
                style={styles.segmentedButtons}
              />
            </View>

            <TextInput
              label="Players per Team (optional)"
              value={formData.playersPerTeam?.toString() || ''}
              onChangeText={(text) => setFormData({ ...formData, playersPerTeam: text ? parseInt(text) : undefined })}
              placeholder="Auto-balance"
              keyboardType="numeric"
              style={styles.input}
            />

            <Text variant="bodyMedium" style={styles.sectionTitle}>Skill Weights</Text>
            {(['serve', 'set', 'block', 'receive', 'attack', 'defense'] as const).map((skill) => (
              <View key={skill} style={styles.weightInput}>
                <Text variant="bodySmall" style={styles.weightLabel}>
                  {skill.charAt(0).toUpperCase() + skill.slice(1)}: {formData.skillWeights[skill]}
                </Text>
                <Slider
                  value={formData.skillWeights[skill]}
                  onValueChange={(value) => setFormData(prev => ({
                    ...prev,
                    skillWeights: { ...prev.skillWeights, [skill]: value }
                  }))}
                  minimumValue={0}
                  maximumValue={1}
                  step={0.05}
                  style={styles.weightSlider}
                />
              </View>
            ))}

            <Text variant="bodyMedium" style={styles.totalWeight}>
              Total: {Math.round(Object.values(formData.skillWeights).reduce((sum, weight) => sum + weight, 0) * 100) / 100}
            </Text>

            <Text variant="bodyMedium" style={styles.sectionTitle}>Default Filters</Text>
            
            <SegmentedButtons
              value={formData.defaultFilters.availabilityFilter}
              onValueChange={(value) => setFormData(prev => ({
                ...prev,
                defaultFilters: { ...prev.defaultFilters, availabilityFilter: value as any }
              }))}
              buttons={[
                { value: 'all', label: 'All Players' },
                { value: 'available', label: 'Available Only' },
                { value: 'unavailable', label: 'Unavailable Only' },
              ]}
              style={styles.availabilityButtons}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onPress={handleEditTemplate}>Save Changes</Button>
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
  templateCard: {
    marginBottom: 12,
    borderRadius: 12,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  templateDetails: {
    opacity: 0.7,
  },
  templateActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  skillsContainer: {
    marginBottom: 12,
  },
  skillsLabel: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  skillItem: {
    alignItems: 'center',
    minWidth: 50,
  },
  skillLabel: {
    fontSize: 10,
    opacity: 0.7,
    marginBottom: 2,
  },
  skillValue: {
    fontWeight: 'bold',
  },
  filtersContainer: {
    marginBottom: 8,
  },
  filtersLabel: {
    marginBottom: 4,
    fontWeight: 'bold',
  },
  filterChip: {
    backgroundColor: '#e8f5e8',
    marginRight: 8,
    marginBottom: 4,
  },
  chipText: {
    fontSize: 12,
  },
  createdDate: {
    opacity: 0.6,
    fontSize: 12,
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
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  segmentedButtons: {
    maxWidth: 200,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
  },
  weightInput: {
    marginBottom: 16,
  },
  weightLabel: {
    marginBottom: 8,
  },
  weightSlider: {
    width: '100%',
  },
  totalWeight: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 16,
  },
  availabilityButtons: {
    marginBottom: 16,
  },
});

export default MatchTemplatesScreen;
