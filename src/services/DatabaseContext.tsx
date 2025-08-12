import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Player, Team, Match, MatchTemplate } from '../types';

// Mock database using AsyncStorage for development
type MockDatabase = {
  players: Player[];
  teams: Team[];
  matches: Match[];
  templates: MatchTemplate[];
};

interface DatabaseContextType {
  db: MockDatabase | null;
  players: Player[];
  teams: Team[];
  matches: Match[];
  templates: MatchTemplate[];
  addPlayer: (player: Omit<Player, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updatePlayer: (id: string, updates: Partial<Player>) => Promise<void>;
  deletePlayer: (id: string) => Promise<void>;
  addTeam: (team: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateTeam: (id: string, updates: Partial<Team>) => Promise<void>;
  deleteTeam: (id: string) => Promise<void>;
  addMatch: (match: Omit<Match, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateMatch: (id: string, updates: Partial<Match>) => Promise<void>;
  deleteMatch: (id: string) => Promise<void>;
  addTemplate: (template: Omit<MatchTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateTemplate: (id: string, updates: Partial<MatchTemplate>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  importPlayersFromCSV: (csvData: string) => Promise<{ success: number; errors: string[] }>;
  exportData: () => Promise<string>;
  importData: (jsonData: string) => Promise<{ success: number; errors: string[] }>;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<MockDatabase | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [templates, setTemplates] = useState<MatchTemplate[]>([]);

  useEffect(() => {
    initializeDatabase();
  }, []);

  const initializeDatabase = async () => {
    try {
      // Initialize mock database with AsyncStorage
      const mockDb: MockDatabase = {
        players: [],
        teams: [],
        matches: [],
        templates: []
      };
      
      // Load existing data from AsyncStorage
      const storedPlayers = await AsyncStorage.getItem('players');
      const storedTeams = await AsyncStorage.getItem('teams');
      const storedMatches = await AsyncStorage.getItem('matches');
      const storedTemplates = await AsyncStorage.getItem('templates');
      
      if (storedPlayers) {
        mockDb.players = JSON.parse(storedPlayers);
        setPlayers(mockDb.players);
      }
      
      if (storedTeams) {
        mockDb.teams = JSON.parse(storedTeams);
        setTeams(mockDb.teams);
      }
      
      if (storedMatches) {
        mockDb.matches = JSON.parse(storedMatches);
        setMatches(mockDb.matches);
      }
      
      if (storedTemplates) {
        mockDb.templates = JSON.parse(storedTemplates);
        setTemplates(mockDb.templates);
      }
      
      setDb(mockDb);
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  };

  const addPlayer = async (player: Omit<Player, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    if (!db) throw new Error('Database not initialized');
    
    const id = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const newPlayer: Player = { ...player, id, createdAt: new Date(now), updatedAt: new Date(now) };
    setPlayers(prev => [...prev, newPlayer]);
    await AsyncStorage.setItem('players', JSON.stringify(players)); // Update AsyncStorage
    
    return id;
  };

  const updatePlayer = async (id: string, updates: Partial<Player>): Promise<void> => {
    if (!db) throw new Error('Database not initialized');
    
    const now = new Date().toISOString();
    const fields = Object.keys(updates).filter(key => key !== 'id' && key !== 'createdAt' && key !== 'updatedAt');
    
    if (fields.length === 0) return;
    
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => {
      const value = updates[field as keyof Player];
      if (field === 'teams') return JSON.stringify(value);
      return value;
    });
    
    setPlayers(prev => prev.map(player => 
      player.id === id 
        ? { ...player, ...updates, updatedAt: new Date(now) }
        : player
    ));
    await AsyncStorage.setItem('players', JSON.stringify(players)); // Update AsyncStorage
  };

  const deletePlayer = async (id: string): Promise<void> => {
    if (!db) throw new Error('Database not initialized');
    
    setPlayers(prev => prev.filter(player => player.id !== id));
    await AsyncStorage.setItem('players', JSON.stringify(players)); // Update AsyncStorage
  };

  const addTeam = async (team: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    if (!db) throw new Error('Database not initialized');
    
    const id = `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const newTeam: Team = { ...team, id, createdAt: new Date(now), updatedAt: new Date(now) };
    setTeams(prev => [...prev, newTeam]);
    await AsyncStorage.setItem('teams', JSON.stringify(teams)); // Update AsyncStorage
    
    return id;
  };

  const updateTeam = async (id: string, updates: Partial<Team>): Promise<void> => {
    if (!db) throw new Error('Database not initialized');
    
    const now = new Date().toISOString();
    const fields = Object.keys(updates).filter(key => key !== 'id' && key !== 'createdAt' && key !== 'updatedAt');
    
    if (fields.length === 0) return;
    
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => {
      const value = updates[field as keyof Team];
      if (field === 'playingDays') return JSON.stringify(value);
      return value;
    });
    
    setTeams(prev => prev.map(team => 
      team.id === id 
        ? { ...team, ...updates, updatedAt: new Date(now) }
        : team
    ));
    await AsyncStorage.setItem('teams', JSON.stringify(teams)); // Update AsyncStorage
  };

  const deleteTeam = async (id: string): Promise<void> => {
    if (!db) throw new Error('Database not initialized');
    
    setTeams(prev => prev.filter(team => team.id !== id));
    await AsyncStorage.setItem('teams', JSON.stringify(teams)); // Update AsyncStorage
  };

  const addMatch = async (match: Omit<Match, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    if (!db) throw new Error('Database not initialized');
    
    const id = `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const newMatch: Match = { ...match, id, createdAt: new Date(now), updatedAt: new Date(now) };
    setMatches(prev => [newMatch, ...prev]);
    await AsyncStorage.setItem('matches', JSON.stringify(matches)); // Update AsyncStorage
    
    return id;
  };

  const updateMatch = async (id: string, updates: Partial<Match>): Promise<void> => {
    if (!db) throw new Error('Database not initialized');
    
    const now = new Date().toISOString();
    const fields = Object.keys(updates).filter(key => key !== 'id' && key !== 'createdAt' && key !== 'updatedAt');
    
    if (fields.length === 0) return;
    
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => {
      const value = updates[field as keyof Match];
      if (['skillWeights', 'filters', 'teams'].includes(field)) return JSON.stringify(value);
      return value;
    });
    
    setMatches(prev => prev.map(match => 
      match.id === id 
        ? { ...match, ...updates, updatedAt: new Date(now) }
        : match
    ));
    await AsyncStorage.setItem('matches', JSON.stringify(matches)); // Update AsyncStorage
  };

  const deleteMatch = async (id: string): Promise<void> => {
    if (!db) throw new Error('Database not initialized');
    
    setMatches(prev => prev.filter(match => match.id !== id));
    await AsyncStorage.setItem('matches', JSON.stringify(matches)); // Update AsyncStorage
  };

  const addTemplate = async (template: Omit<MatchTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    if (!db) throw new Error('Database not initialized');
    
    const id = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const newTemplate: MatchTemplate = { ...template, id, createdAt: new Date(now), updatedAt: new Date(now) };
    setTemplates(prev => [...prev, newTemplate]);
    await AsyncStorage.setItem('templates', JSON.stringify(templates)); // Update AsyncStorage
    
    return id;
  };

  const updateTemplate = async (id: string, updates: Partial<MatchTemplate>): Promise<void> => {
    if (!db) throw new Error('Database not initialized');
    
    const now = new Date().toISOString();
    const fields = Object.keys(updates).filter(key => key !== 'id' && key !== 'createdAt' && key !== 'updatedAt');
    
    if (fields.length === 0) return;
    
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => {
      const value = updates[field as keyof MatchTemplate];
      if (['skillWeights', 'defaultFilters'].includes(field)) return JSON.stringify(value);
      return value;
    });
    
    setTemplates(prev => prev.map(template => 
      template.id === id 
        ? { ...template, ...updates, updatedAt: new Date(now) }
        : template
    ));
    await AsyncStorage.setItem('templates', JSON.stringify(templates)); // Update AsyncStorage
  };

  const deleteTemplate = async (id: string): Promise<void> => {
    if (!db) throw new Error('Database not initialized');
    
    setTemplates(prev => prev.filter(template => template.id !== id));
    await AsyncStorage.setItem('templates', JSON.stringify(templates)); // Update AsyncStorage
  };

  const importPlayersFromCSV = async (csvData: string): Promise<{ success: number; errors: string[] }> => {
    if (!db) throw new Error('Database not initialized');
    
    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const dataLines = lines.slice(1);
    
    let success = 0;
    const errors: string[] = [];
    
    for (let i = 0; i < dataLines.length; i++) {
      try {
        const values = dataLines[i].split(',').map(v => v.trim());
        const playerData: any = {};
        
        headers.forEach((header, index) => {
          playerData[header] = values[index] || '';
        });
        
        // Validate required fields
        if (!playerData.Name) {
          errors.push(`Row ${i + 2}: Missing name`);
          continue;
        }
        
        // Parse and validate skill values
        const skills = ['Serve', 'Set', 'Block', 'Receive', 'Attack', 'Defense'];
        const parsedSkills: any = {};
        
        skills.forEach(skill => {
          const value = parseInt(playerData[skill]) || 0;
          parsedSkills[skill.toLowerCase()] = Math.max(0, Math.min(10, value));
        });
        
        // Parse teams
        const teams = playerData.Teams ? playerData.Teams.split(',').map((t: string) => t.trim()).filter(Boolean) : [];
        
        // Create player
        await addPlayer({
          name: playerData.Name,
          ...parsedSkills,
          teams,
          notes: playerData.Notes || undefined,
          availability: (playerData.Availability || 'available').toLowerCase() === 'available' ? 'available' : 'unavailable',
        });
        
        success++;
      } catch (error) {
        errors.push(`Row ${i + 2}: ${error}`);
      }
    }
    
    return { success, errors };
  };

  const exportData = async (): Promise<string> => {
    if (!db) throw new Error('Database not initialized');
    
    const exportData = {
      players,
      teams,
      matches,
      templates,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };
    
    return JSON.stringify(exportData, null, 2);
  };

  const importData = async (jsonData: string): Promise<{ success: number; errors: string[] }> => {
    if (!db) throw new Error('Database not initialized');
    
    try {
      const data = JSON.parse(jsonData);
      let success = 0;
      const errors: string[] = [];
      
      // Import teams first (to handle dependencies)
      if (data.teams) {
        for (const team of data.teams) {
          try {
            await addTeam({
              name: team.name,
              logo: team.logo,
              playingDays: team.playingDays || [],
              playingTime: team.playingTime,
            });
            success++;
          } catch (error) {
            errors.push(`Team ${team.name}: ${error}`);
          }
        }
      }
      
      // Import players
      if (data.players) {
        for (const player of data.players) {
          try {
            await addPlayer({
              name: player.name,
              serve: player.serve,
              set: player.set,
              block: player.block,
              receive: player.receive,
              attack: player.attack,
              defense: player.defense,
              teams: player.teams || [],
              photo: player.photo,
              notes: player.notes,
              availability: player.availability || 'available',
            });
            success++;
          } catch (error) {
            errors.push(`Player ${player.name}: ${error}`);
          }
        }
      }
      
      return { success, errors };
    } catch (error) {
      throw new Error(`Invalid JSON data: ${error}`);
    }
  };

  const value: DatabaseContextType = {
    db,
    players,
    teams,
    matches,
    templates,
    addPlayer,
    updatePlayer,
    deletePlayer,
    addTeam,
    updateTeam,
    deleteTeam,
    addMatch,
    updateMatch,
    deleteMatch,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    importPlayersFromCSV,
    exportData,
    importData,
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
};
