# 🏐 Volleyball Team Matcher

A React Native mobile app for creating balanced volleyball teams based on player skill levels. The app uses an intelligent algorithm to generate teams that minimize skill differences while providing manual controls for fine-tuning.

## ✨ Features

### 🏠 Home Screen
- Dashboard with key statistics
- Quick access to all main functions
- Recent match history
- Helpful tips and guidance

### 👥 Players Management
- **Add/Edit/Delete** players with detailed skill ratings
- **6 Skill Categories**: Serve, Set, Block, Receive, Attack, Defense (0-10 scale)
- **Availability Toggle**: Mark players as available/unavailable
- **Team Assignment**: Assign players to multiple teams
- **CSV Import/Export**: Bulk import player data with validation
- **Search & Filters**: Find players by name, team, or availability
- **Notes**: Add personal notes for each player

### 🏆 Team Management
- **Create/Edit/Delete** teams
- **Playing Schedule**: Set playing days and times
- **Auto-creation**: Teams are automatically created when importing players

### 🎮 Match Creation
- **Smart Team Generation**: AI-powered algorithm for balanced teams
- **Flexible Configuration**: 2-4 teams, optional players per team
- **Customizable Skill Weights**: Adjust importance of different skills
- **Player Selection**: Filter and select available players
- **Manual Controls**: Lock players to teams, swap between teams
- **Undo/Redo**: Up to 20 actions with undo functionality
- **Real-time Scoring**: Live updates as you modify teams

### 📋 Match Templates
- **Save Presets**: Store common match configurations
- **Reusable Settings**: Number of teams, skill weights, filters
- **Quick Apply**: Use templates to speed up match creation

## 🧠 Team Balancing Algorithm

The app uses a sophisticated algorithm to create balanced teams:

1. **Skill Scoring**: Each player gets a weighted total score based on their skills
2. **Snake Draft**: Initial team assignment using snake draft pattern
3. **Local Search Optimization**: Iterative improvement through player swaps
4. **Performance Limits**: 200 iterations max or 200ms time limit
5. **Special Handling**: Teams with 7+ players automatically use best 6-player subsets

### Default Skill Weights
- **Attack**: 25% (highest priority)
- **Serve, Set, Block, Receive, Defense**: 15% each

## 🛠 Technical Stack

- **Frontend**: React Native + Expo
- **Database**: SQLite (expo-sqlite)
- **UI Components**: React Native Paper
- **Navigation**: React Navigation
- **Lists**: FlashList for performance
- **Charts**: Victory Native for data visualization
- **State Management**: React Context + Hooks

## 📱 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- Android Studio / Xcode (for device testing)

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd volleyball-team-matcher
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Run on device/emulator**
   - Scan QR code with Expo Go app
   - Press 'a' for Android
   - Press 'i' for iOS

## 📊 Data Structure

### Player Schema
```typescript
interface Player {
  id: string;
  name: string;
  serve: number;        // 0-10
  set: number;          // 0-10
  block: number;        // 0-10
  receive: number;      // 0-10
  attack: number;       // 0-10
  defense: number;      // 0-10
  teams: string[];      // Team names
  photo?: string;       // Base64 or file path
  notes?: string;       // Free text
  availability: 'available' | 'unavailable';
  createdAt: Date;
  updatedAt: Date;
}
```

### Team Schema
```typescript
interface Team {
  id: string;
  name: string;
  logo?: string;        // Base64 or file path
  playingDays: string[]; // ['sun', 'mon', 'tue', etc.]
  playingTime?: string;  // "HH:MM" format
  createdAt: Date;
  updatedAt: Date;
}
```

## 📁 CSV Import Format

The app supports importing players from CSV files with the following columns:

```csv
Name,Serve,Set,Block,Receive,Attack,Defense,Teams,Notes,Availability
John Doe,7,8,6,7,9,8,Team A,Great attacker,available
Jane Smith,6,9,7,8,7,9,Team B,Excellent setter,available
```

### CSV Rules
- **Required**: Name (must be unique)
- **Skills**: 0-10 scale (invalid values default to 0)
- **Teams**: Comma-separated, unknown teams auto-created
- **Availability**: Defaults to 'available' if missing
- **Validation**: Rows without names are rejected

## 🎯 Usage Workflow

1. **Setup Players**
   - Add players individually or import from CSV
   - Rate skills on 0-10 scale
   - Set availability status

2. **Create Teams** (Optional)
   - Define team names and schedules
   - Teams auto-created during CSV import

3. **Generate Match**
   - Select number of teams (2-4)
   - Choose players and apply filters
   - Adjust skill weights if needed
   - Generate balanced teams

4. **Fine-tune** (Optional)
   - Lock specific players to teams
   - Swap players between teams
   - Use undo/redo for changes

5. **Save & Share**
   - Save match with custom name
   - Export as image or PDF
   - Create templates for future use

## 🔧 Configuration

### Skill Weights
Customize the importance of each skill in team balancing:
- Total weights must equal 1.0
- Higher weights = more important for balance
- Default prioritizes attack (25%) for competitive play

### Team Generation Settings
- **Number of Teams**: 2, 3, or 4
- **Players per Team**: Auto-balance or fixed number
- **Filters**: Team, availability, search query
- **Random Seed**: Ensures reproducible results

## 📱 Platform Support

- **iOS**: 13.0+
- **Android**: 6.0+ (API level 23)
- **Web**: Limited support (basic functionality)

## 🚀 Performance Features

- **FlashList**: High-performance list rendering
- **SQLite**: Fast local database operations
- **Optimized Algorithm**: 200ms generation time limit
- **Lazy Loading**: Efficient data management

## 🔒 Data Privacy

- **Local Storage**: All data stored locally on device
- **No Cloud Sync**: Data remains private
- **Export/Import**: Backup and restore functionality
- **Offline First**: Works without internet connection

## 🐛 Troubleshooting

### Common Issues

1. **App won't start**
   - Clear Metro cache: `npx expo start --clear`
   - Check Node.js version compatibility

2. **Database errors**
   - Delete app and reinstall
   - Check device storage space

3. **Performance issues**
   - Reduce number of players
   - Close other apps
   - Restart device

### Debug Mode
Enable debug logging in development:
```typescript
// In DatabaseContext.tsx
console.log('Database operation:', operation);
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- React Native community
- Expo team for excellent tooling
- React Native Paper for UI components
- Victory Native for charts

## 📞 Support

For questions or issues:
- Create GitHub issue
- Check documentation
- Review troubleshooting guide

---

**Made with ❤️ for volleyball enthusiasts everywhere!**
