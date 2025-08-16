import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, useTheme, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useDatabase } from '../services/DatabaseContext';

const HomeScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const { players, teams, matches } = useDatabase();

  const stats = [
    { label: 'Total Players', value: players.length, color: '#2196F3' },
    { label: 'Available Players', value: players.filter(p => p.availability === 'available').length, color: '#4CAF50' },
    { label: 'Teams', value: teams.length, color: '#FF9800' },
    { label: 'Matches Created', value: matches.length, color: '#9C27B0' },
  ];

  const quickActions = [
    {
      title: 'Create Match',
      description: 'Generate balanced teams for a new match',
      icon: '🏐',
      action: () => navigation.navigate('Create Match' as never),
      color: '#E91E63',
    },
    {
      title: 'Manage Players',
      description: 'Add, edit, or import player profiles',
      icon: '👥',
      action: () => navigation.navigate('Players' as never),
      color: '#2196F3',
    },
    {
      title: 'Team Management',
      description: 'Organize teams and playing schedules',
      icon: '🏆',
      action: () => navigation.navigate('Teams' as never),
      color: '#4CAF50',
    },

  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="displaySmall" style={styles.title}>
            🏐 Volleyball Team Matcher
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Create balanced teams based on skill levels
          </Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <Surface key={index} style={[styles.statCard, { 
              backgroundColor: theme.colors.surface,
              borderLeftColor: theme.colors.primary 
            }]}>
              <Text variant="headlineMedium" style={[styles.statValue, { color: theme.colors.primary }]}>
                {stat.value}
              </Text>
              <Text variant="bodyMedium" style={styles.statLabel}>
                {stat.label}
              </Text>
            </Surface>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Text variant="headlineSmall" style={styles.sectionTitle}>
            Quick Actions
          </Text>
          {quickActions.map((action, index) => (
            <Card
              key={index}
              style={[styles.actionCard, { 
                backgroundColor: theme.colors.surface,
                borderLeftColor: theme.colors.primary 
              }]}
              onPress={action.action}
            >
              <Card.Content style={styles.actionContent}>
                <Text variant="headlineLarge" style={styles.actionIcon}>
                  {action.icon}
                </Text>
                <View style={styles.actionText}>
                  <Text variant="titleLarge" style={styles.actionTitle}>
                    {action.title}
                  </Text>
                  <Text variant="bodyMedium" style={styles.actionDescription}>
                    {action.description}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>

        {/* Recent Activity */}
        {matches.length > 0 && (
          <View style={styles.recentContainer}>
            <Text variant="headlineSmall" style={styles.sectionTitle}>
              Recent Matches
            </Text>
            {matches.slice(0, 3).map((match, index) => (
              <Card key={index} style={[styles.recentCard, { backgroundColor: theme.colors.surface }]}>
                <Card.Content>
                  <Text variant="titleMedium">{match.name}</Text>
                  <Text variant="bodyMedium">
                    {match.numberOfTeams} teams • {match.teams.reduce((sum, team) => sum + team.players.length, 0)} players
                  </Text>
                  <Text variant="bodySmall" style={styles.recentDate}>
                    {new Date(match.createdAt).toLocaleDateString()}
                  </Text>
                </Card.Content>
              </Card>
            ))}
          </View>
        )}

        {/* Tips */}
        <View style={styles.tipsContainer}>
          <Text variant="headlineSmall" style={styles.sectionTitle}>
            💡 Tips
          </Text>
          <Card style={[styles.tipCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text variant="bodyMedium">
                • Use skill weights to prioritize different volleyball skills
              </Text>
              <Text variant="bodyMedium">
                • Lock players to specific teams before generation
              </Text>
              <Text variant="bodyMedium">
                • Import players from CSV for quick roster setup
              </Text>
              <Text variant="bodyMedium">
                • Teams with 7+ players automatically use best 6-player subsets
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* Version Info */}
        <View style={styles.versionContainer}>
          <Text variant="bodySmall" style={styles.versionText}>
            Ver. 1.0.2
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.7,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    borderLeftWidth: 4,
  },
  statValue: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    textAlign: 'center',
    opacity: 0.7,
  },
  actionsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  actionCard: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    borderLeftWidth: 4,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  actionIcon: {
    marginRight: 16,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  actionDescription: {
    opacity: 0.7,
  },
  recentContainer: {
    marginBottom: 24,
  },
  recentCard: {
    marginBottom: 8,
    borderRadius: 8,
  },
  recentDate: {
    opacity: 0.6,
    marginTop: 4,
  },
  tipsContainer: {
    marginBottom: 24,
  },
  tipCard: {
    borderRadius: 8,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  versionText: {
    opacity: 0.6,
    fontStyle: 'italic',
  },
});

export default HomeScreen;
