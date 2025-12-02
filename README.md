# WNBA Season Tracker Dashboard

A professional analytics dashboard for tracking WNBA team performance with interactive visualizations, team comparisons, and statistical analysis.

![Dashboard](https://img.shields.io/badge/Version-1.0.0-gold?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)
![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla-yellow?style=for-the-badge)

## ✨ Features

- 📊 **Interactive Data Tables** - Sortable, searchable team statistics with heatmap visualizations
- 📈 **Dynamic Charts** - Quarter-by-quarter performance and trend analysis using Chart.js
- ⚖️ **Team Comparison** - Side-by-side analytics with radar charts and advanced metrics
- 🎯 **Advanced Analytics** - Offensive/defensive ratings, momentum tracking, and insights
- 📱 **Responsive Design** - Optimized for desktop, tablet, and mobile devices
- 🎨 **Modern UI** - Dark theme with gold accents and smooth animations
- 💾 **Data Export** - Export tables as CSV or PNG images
- 🔍 **Real-time Search** - Instant filtering of team statistics

## 🚀 Quick Start

### Prerequisites

- A modern web browser (Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+)
- A local web server (Python, Node.js, or any HTTP server)

### Installation

1. **Download or clone this repository**
   ```bash
   git clone https://github.com/yourusername/wnba-dashboard.git
   cd wnba-dashboard
   ```

2. **Ensure you have the required files**
   ```
   dashboard/
   ├── index.html
   ├── app.js
   ├── style.css
   ├── fullseason.json
   ├── lastfive.json
   ├── teams.json
   └── logo.png (optional)
   ```

3. **Start a local server**

   **Option A - Python 3:**
   ```bash
   python -m http.server 8000
   ```

   **Option B - Node.js:**
   ```bash
   npx http-server -p 8000
   ```

   **Option C - PHP:**
   ```bash
   php -S localhost:8000
   ```

4. **Open your browser**
   ```
   http://localhost:8000
   ```

## 📊 Data Format

Your JSON files should follow these formats:

### fullseason.json & lastfive.json
```json
[
  {
    "RANK": 1,
    "TEAM NAME": "Team Name",
    "GAMES": 40,
    "WINS": 34,
    "LOSSES": 6,
    "WIN %": 85.0,
    "FG%": 46.5,
    "3P%": 36.2,
    "FT%": 82.1,
    "REBOUNDS": 35.8,
    "ASSISTS": 21.4,
    "TURNOVERS": 12.3,
    "STEALS": 8.1,
    "BLOCKS": 4.2,
    "TOTAL POINTS": 91.5,
    "Q1 POINTS": 22.8,
    "Q2 POINTS": 23.1,
    "Q3 POINTS": 23.5,
    "Q4 POINTS": 22.1
  }
]
```

### teams.json (Optional - for advanced analytics)
```json
[
  {
    "name": "Team Name",
    "stats": {
      "off_rtg": 112.5,
      "def_rtg": 98.2,
      "net_rtg": 14.3,
      "ast_pct": 64.2,
      "reb_pct": 52.1,
      "tov_pct": 12.8,
      "efg_pct": 52.3,
      "opp_pts": 85.4
    },
    "notes": {
      "strengths": "Elite offensive efficiency. Strong defense.",
      "weaknesses": "Inconsistent three-point shooting."
    }
  }
]
```

## 🎮 Usage

### Main Dashboard
- **Sort Data**: Click any column header to sort
- **Search Teams**: Use the search bar to filter teams
- **Switch Datasets**: Toggle between full season and last 5 games data
- **Export Data**: Click "Export CSV" or "Export PNG" buttons

### Team Comparison
1. Select two teams from the dropdowns
2. Click "Compare Teams"
3. View detailed analytics including:
   - Overall ratings
   - Radar chart comparison
   - Statistical advantages
   - Strengths and weaknesses
   - Momentum analysis
   - Strategic insights

### Charts
- **Quarter Performance**: Stacked bar chart showing scoring by quarter
- **Performance Trends**: Scatter plot of win percentage vs points
- Switch between chart types using the buttons above the chart

## ⚙️ Configuration

You can customize the dashboard by editing the `CONFIG` object in `app.js`:

```javascript
const CONFIG = {
  DATA_SOURCES: {
    FULL_SEASON: 'fullseason.json',    // Your full season data file
    LAST_FIVE: 'lastfive.json',        // Your recent games data file
    TEAMS: 'teams.json',               // Advanced analytics (optional)
  },
  
  CACHE: {
    TTL: 5 * 60 * 1000,  // Cache duration (5 minutes)
    MAX_SIZE: 50         // Max cached items
  },
  
  UI: {
    DEBOUNCE_DELAY: 250,        // Search input delay (ms)
    ANIMATION_DURATION: 500,     // Chart animation speed (ms)
    NOTIFICATION_DURATION: 3000  // Toast message duration (ms)
  },
  
  CHART: {
    MOBILE_BREAKPOINT: 768,   // Mobile screen width (px)
    TABLET_BREAKPOINT: 1024,  // Tablet screen width (px)
  }
};
```

### Customizing Colors

Edit CSS variables in `style.css`:

```css
:root {
  --primary-gold: #FFD700;      /* Primary accent color */
  --secondary-gold: #FFA500;    /* Secondary accent color */
  --accent-orange: #FF6B35;     /* Tertiary accent color */
  --bg-primary: #0a0a0a;        /* Main background */
  --bg-secondary: #1a1a1a;      /* Card backgrounds */
}
```

## 🏗️ Project Structure

```
wnba-dashboard/
├── index.html          # Main HTML structure
├── app.js             # Core JavaScript logic
├── style.css          # Styles and responsive design
├── fullseason.json    # Full season statistics
├── lastfive.json      # Recent games statistics
├── teams.json         # Advanced team analytics (optional)
├── logo.png           # Your logo (optional)
├── README.md          # This file
├── LICENSE            # MIT License
├── CONTRIBUTING.md    # Contribution guidelines
└── .gitignore        # Git ignore rules
```

## 🛠️ Technologies Used

- **Vanilla JavaScript** - No frameworks, pure ES6+
- **Chart.js** - Interactive and responsive charts
- **html2canvas** - Screenshot/export functionality
- **CSS3** - Modern styling with Grid and Flexbox
- **Font Awesome 6** - Icon library
- **Google Fonts** - Rajdhani and Inter fonts

## 🌐 Browser Support

| Browser | Version |
|---------|---------|
| Chrome  | 90+     |
| Firefox | 88+     |
| Safari  | 14+     |
| Edge    | 90+     |

## 📱 Mobile Support

The dashboard is fully responsive and optimized for:
- Desktop (1920x1080+)
- Laptop (1366x768+)
- Tablet (768x1024)
- Mobile (320x568+)

Special features for mobile:
- Splash screen animation
- Touch-optimized controls
- Horizontal table scrolling
- Collapsible sections

## 🤝 Contributing

Contributions are welcome! Please check out the [CONTRIBUTING.md](CONTRIBUTING.md) file for guidelines.

### Quick Contribution Steps
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Known Issues

- Large datasets (1000+ rows) may experience slower sorting
- Safari on iOS may have minor CSS differences
- PDF export requires the html2canvas library to be loaded via CDN


## 📧 Support
- 📧 Email: degenhoops@gmail.com

## 🙏 Acknowledgments

- **Chart.js** - For the excellent charting library
- **Font Awesome** - For the comprehensive icon set
- **html2canvas** - For making image exports possible
- **WNBA** - For inspiring this project
- All contributors who help improve this project

## ⚠️ Disclaimer

This dashboard is for educational and analytical purposes only. All statistics should be verified with official WNBA sources. This is not an official WNBA product.

---

**Built with ❤️ for basketball analytics enthusiasts**

**Star ⭐ this repo if you find it useful!**