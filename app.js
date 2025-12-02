// config.js - Centralized configuration
const CONFIG = {
  DATA_SOURCES: {
    FULL_SEASON: 'fullseason.json',
    LAST_FIVE: 'lastfive.json',
    TEAMS: 'teams.json',
  },
  
  CACHE: {
    TTL: 5 * 60 * 1000, // 5 minutes
    MAX_SIZE: 50
  },
  
  API: {
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
    TIMEOUT: 10000,
    CIRCUIT_BREAKER_THRESHOLD: 3,
    CIRCUIT_BREAKER_WINDOW: 5 * 60 * 1000
  },
  
  UI: {
    DEBOUNCE_DELAY: 250,
    BATCH_SIZE: 10,
    ANIMATION_DURATION: 500,
    NOTIFICATION_DURATION: 3000,
    MAX_SEARCH_RESULTS: 50
  },
  
  CHART: {
    MOBILE_BREAKPOINT: 768,
    TABLET_BREAKPOINT: 1024,
    RADAR_SIZE: 450,
    COLORS: {
      PRIMARY: '#FFD700',
      SECONDARY: '#FF6B35',
      GRADIENT_STOPS: [
        { offset: 0.0, color: [26, 60, 52] },
        { offset: 0.25, color: [76, 175, 80] },
        { offset: 0.5, color: [255, 215, 0] },
        { offset: 0.75, color: [255, 107, 53] },
        { offset: 1.0, color: [255, 23, 68] }
      ]
    }
  }
};

// Column name mappings
const COLUMN_MAPPINGS = {
  'RANK': 'RANK',
  'TEAM NAME': 'TEAM',
  'TEAM': 'TEAM',
  'GAMES': 'GAMES',
  'WIN': 'WINS',
  'WINS': 'WINS',
  'W': 'WINS',
  'LOSS': 'LOSSES',
  'LOSSES': 'LOSSES',
  'L': 'LOSSES',
  'WIN %': 'WIN %',
  'WIN_PCT': 'WIN %',
  'FG%': 'FG %',
  'FG_PCT': 'FG %',
  '3P%': '3P %',
  '3PT%': '3P %',
  'FT%': 'FT %',
  'FT_PCT': 'FT %',
  'REBOUNDS': 'REBOUNDS',
  'REB': 'REBOUNDS',
  'ASSISTS': 'ASSISTS',
  'AST': 'ASSISTS',
  'TOV': 'TURNOVERS',
  'STEALS': 'STEALS',
  'STL': 'STEALS',
  'BLOCKS': 'BLOCKS',
  'BLK': 'BLOCKS',
  'TOTAL POINTS': 'TOTAL POINTS',
  'PTS': 'TOTAL POINTS',
  'POINTS': 'TOTAL POINTS',
  'Q1 POINTS': 'Q1 POINTS',
  'Q1': 'Q1 POINTS',
  'Q2 POINTS': 'Q2 POINTS',
  'Q2': 'Q2 POINTS',
  'Q3 POINTS': 'Q3 POINTS',
  'Q3': 'Q3 POINTS',
  'Q4 POINTS': 'Q4 POINTS',
  'Q4': 'Q4 POINTS'
};

Object.freeze(CONFIG);
Object.freeze(COLUMN_MAPPINGS);
// utils.js - Pure utility functions
const Utils = {
  // Safe value parsing
  parseNumeric(value, defaultValue = 0) {
    if (value == null) return defaultValue;
    const str = String(value).replace('%', '').trim();
    const num = parseFloat(str);
    return Number.isFinite(num) ? num : defaultValue;
  },

  // HTML escaping for XSS prevention
  escapeHtml(unsafe) {
    if (unsafe == null) return '';
    return String(unsafe)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  // Format numbers for display
  formatValue(value, key) {
    if (value == null || value === '') return '';
    const str = String(value);
    if (str.includes('%')) return str;
    
    const num = parseFloat(str);
    if (!Number.isFinite(num)) return str;
    
    return num % 1 === 0 ? String(num) : num.toFixed(1);
  },

  // Debounce with cancellation
  debounce(fn, delay = 250) {
    let timeoutId = null;
    
    const debounced = function(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
    
    debounced.cancel = () => clearTimeout(timeoutId);
    return debounced;
  },

  // Throttle for performance
  throttle(fn, limit = 100) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        fn.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Deep clone for immutability
  deepClone(obj) {
    if (obj == null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj);
    if (obj instanceof Array) return obj.map(item => Utils.deepClone(item));
    
    const cloned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = Utils.deepClone(obj[key]);
      }
    }
    return cloned;
  },

  // Generate unique IDs
  generateId(prefix = 'id') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },

  // Safe array access
  /**
   * Normalize incoming data into an array. This helper will handle
   * various API response formats. If the input is already an array,
   * it is returned as is. If the input has a `.data` property that
   * contains an array, that array is returned. If the input is a
   * plain object, its own enumerable property values are returned
   * as an array. Otherwise an empty array is returned. This prevents
   * render errors when API responses wrap their payload in an object
   * instead of returning a bare array.
   *
   * @param {any} value The raw data value to normalize
   * @returns {Array} The normalized array of items
   */
  safeArray(value) {
    if (Array.isArray(value)) {
      return value;
    }
    if (value && typeof value === 'object') {
      if (Array.isArray(value.data)) {
        return value.data;
      }
      // Return object values as an array if no array-like property exists
      return Object.values(value);
    }
    return [];
  },

  // Color interpolation for gradients
  interpolateColor(color1, color2, factor) {
    const result = color1.slice();
    for (let i = 0; i < 3; i++) {
      result[i] = Math.round(result[i] + factor * (color2[i] - color1[i]));
    }
    return result;
  },

  // Get gradient color at position
  getGradientColor(ratio, stops) {
    const t = Math.max(0, Math.min(1, ratio));
    
    for (let i = 0; i < stops.length - 1; i++) {
      const current = stops[i];
      const next = stops[i + 1];
      
      if (t >= current.offset && t <= next.offset) {
        const localT = (t - current.offset) / (next.offset - current.offset);
        const color = Utils.interpolateColor(current.color, next.color, localT);
        return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
      }
    }
    
    const lastColor = stops[stops.length - 1].color;
    return `rgb(${lastColor[0]}, ${lastColor[1]}, ${lastColor[2]})`;
  },

  // Viewport detection
  isMobile() {
    return window.innerWidth < CONFIG.CHART.MOBILE_BREAKPOINT;
  },

  isTablet() {
    return window.innerWidth < CONFIG.CHART.TABLET_BREAKPOINT;
  },

  // Sanitize user input
  sanitizeInput(input, maxLength = 100) {
    if (!input) return '';
    return String(input).trim().slice(0, maxLength);
  },

  // Validate search query
  isValidSearchQuery(query) {
    return /^[a-zA-Z0-9\s]*$/.test(query);
  },

  // Sanitize text with unicode handling
  sanitizeText(str) {
    if (!str) return '';
    const text = String(str).replace(/\\u[\dA-F]{4}/gi, (match) => {
      try {
        return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
      } catch {
        return match;
      }
    });
    return text;
  }
};

Object.freeze(Utils);

// Centralized state management with observer pattern
class StateManager {
  constructor() {
    this.state = {
      data: [],
      originalData: [],
      currentDataset: CONFIG.DATA_SOURCES.FULL_SEASON,
      sortConfig: null,
      searchQuery: '',
      selectedTeams: { teamA: null, teamB: null },
      mergedData: {},
      leagueStats: null,
      loading: false,
      error: null
    };
    
    this.observers = new Map();
    this.history = [];
    this.maxHistory = 10;
  }

  // Subscribe to state changes
  subscribe(key, callback) {
    if (!this.observers.has(key)) {
      this.observers.set(key, new Set());
    }
    this.observers.get(key).add(callback);
    
    return () => this.observers.get(key)?.delete(callback);
  }

  // Get current state
  getState(key) {
    return key ? this.state[key] : { ...this.state };
  }

  // Update state with notification
  setState(updates) {
    const prevState = { ...this.state };
    this.state = { ...this.state, ...updates };
    
    // Save to history
    this.history.push(prevState);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
    
    // Notify observers
    Object.keys(updates).forEach(key => {
      const observers = this.observers.get(key);
      if (observers) {
        observers.forEach(callback => {
          try {
            callback(this.state[key], prevState[key]);
          } catch (error) {
            console.error(`Observer error for ${key}:`, error);
          }
        });
      }
    });
    
    // Notify wildcard observers
    const wildcardObservers = this.observers.get('*');
    if (wildcardObservers) {
      wildcardObservers.forEach(callback => {
        try {
          callback(this.state, prevState);
        } catch (error) {
          console.error('Wildcard observer error:', error);
        }
      });
    }
  }

  // Reset to previous state
  undo() {
    if (this.history.length > 0) {
      this.state = this.history.pop();
      this.notify('*');
    }
  }

  // Clear state
  reset() {
    this.state = {
      data: [],
      originalData: [],
      currentDataset: CONFIG.DATA_SOURCES.FULL_SEASON,
      sortConfig: null,
      searchQuery: '',
      selectedTeams: { teamA: null, teamB: null },
      mergedData: {},
      leagueStats: null,
      loading: false,
      error: null
    };
    this.history = [];
    this.notify('*');
  }

  // Manually trigger notifications
  notify(key) {
    const observers = this.observers.get(key);
    if (observers) {
      observers.forEach(callback => {
        try {
          callback(this.state[key]);
        } catch (error) {
          console.error(`Manual notification error for ${key}:`, error);
        }
      });
    }
  }

  // Clean up all observers
  destroy() {
    this.observers.clear();
    this.history = [];
  }
}
// cache.js - LRU cache with TTL
class CacheManager {
  constructor(maxSize = CONFIG.CACHE.MAX_SIZE, ttl = CONFIG.CACHE.TTL) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    // LRU: move to end
    this.cache.delete(key);
    this.cache.set(key, item);
    
    return item.data;
  }

  set(key, data) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      data: Utils.deepClone(data),
      timestamp: Date.now()
    });
  }

  has(key) {
    return this.get(key) !== null;
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

// dataService.js - Robust data fetching with retry & circuit breaker
class DataService {
  constructor() {
    this.cache = new CacheManager();
    this.pendingRequests = new Map();
    this.circuitBreaker = new Map();
    this.abortControllers = new Map();
  }

  // Circuit breaker check
  isCircuitOpen(url) {
    const key = this.getCircuitKey(url);
    const failures = this.circuitBreaker.get(key);
    
    if (!failures) return false;
    
    const { count, timestamp } = failures;
    const elapsed = Date.now() - timestamp;
    
    if (elapsed > CONFIG.API.CIRCUIT_BREAKER_WINDOW) {
      this.circuitBreaker.delete(key);
      return false;
    }
    
    return count >= CONFIG.API.CIRCUIT_BREAKER_THRESHOLD;
  }

  recordFailure(url) {
    const key = this.getCircuitKey(url);
    const existing = this.circuitBreaker.get(key);
    
    if (existing) {
      existing.count++;
    } else {
      this.circuitBreaker.set(key, { count: 1, timestamp: Date.now() });
    }
  }

  recordSuccess(url) {
    const key = this.getCircuitKey(url);
    this.circuitBreaker.delete(key);
  }

  getCircuitKey(url) {
    return `${url}-${Math.floor(Date.now() / CONFIG.API.CIRCUIT_BREAKER_WINDOW)}`;
  }

  // Fetch with retry logic
  async fetchWithRetry(url, options = {}) {
    if (this.isCircuitOpen(url)) {
      throw new Error(`Circuit breaker open for ${url}`);
    }

    const maxRetries = options.retries || CONFIG.API.RETRY_ATTEMPTS;
    let lastError;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        this.abortControllers.set(url, controller);

        const timeoutId = setTimeout(
          () => controller.abort(),
          options.timeout || CONFIG.API.TIMEOUT
        );

        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        this.abortControllers.delete(url);

        if (response.ok) {
          this.recordSuccess(url);
          return response;
        }

        // Don't retry client errors
        if (response.status >= 400 && response.status < 500) {
          throw new Error(`Client error: ${response.status}`);
        }

        lastError = new Error(`Server error: ${response.status}`);
      } catch (error) {
        lastError = error;
        this.abortControllers.delete(url);

        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
        }

        if (attempt < maxRetries - 1) {
          const delay = CONFIG.API.RETRY_DELAY * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    this.recordFailure(url);
    throw lastError;
  }

  // Load data with caching and deduplication
  async loadData(url, options = {}) {
    // Check cache first
    if (!options.skipCache) {
      const cached = this.cache.get(url);
      if (cached) return cached;
    }

    // Deduplicate concurrent requests
    if (this.pendingRequests.has(url)) {
      return this.pendingRequests.get(url);
    }

    const requestPromise = (async () => {
      try {
        const response = await this.fetchWithRetry(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': options.skipCache ? 'no-cache' : 'max-age=300'
          },
          ...options
        });

        const data = await response.json();
        
        const processed = options.preserveObject ? data : Utils.safeArray(data);

        if (!options.preserveObject && Array.isArray(processed) && processed.length === 0) {
          console.warn(`No data received from ${url}`);
        }

        this.cache.set(url, processed);
        return processed;
      } finally {
        this.pendingRequests.delete(url);
      }
    })();

    this.pendingRequests.set(url, requestPromise);
    return requestPromise;
  }

  // Cancel all pending requests
  cancelAll() {
    this.abortControllers.forEach(controller => controller.abort());
    this.abortControllers.clear();
    this.pendingRequests.clear();
  }

  // Clean up
  destroy() {
    this.cancelAll();
    this.cache.clear();
    this.circuitBreaker.clear();
  }
}
// renderQueue.js - Batched rendering system
class RenderQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.frameId = null;
  }

  // Add task to queue
  enqueue(task, priority = 0) {
    this.queue.push({ task, priority, id: Utils.generateId('task') });
    this.queue.sort((a, b) => b.priority - a.priority);
    
    if (!this.isProcessing) {
      this.process();
    }
  }

  // Process queue with RAF batching
  async process() {
    if (this.isProcessing || this.queue.length === 0) return;
    
    this.isProcessing = true;

    while (this.queue.length > 0) {
      await new Promise(resolve => {
        this.frameId = requestAnimationFrame(async () => {
          const batch = this.queue.splice(0, 3); // Process 3 per frame
          
          for (const { task } of batch) {
            try {
              await task();
            } catch (error) {
              console.error('Render task error:', error);
            }
          }
          
          resolve();
        });
      });
    }

    this.isProcessing = false;
  }

  // Clear queue
  clear() {
    this.queue = [];
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
    this.isProcessing = false;
  }

  // Get queue size
  size() {
    return this.queue.length;
  }
}
// tableRenderer.js - Optimized table rendering with virtual scrolling concept
class TableRenderer {
  constructor(container, stateManager) {
    this.container = container;
    this.state = stateManager;
    this.tableHead = document.getElementById('tableHead');
    this.tableBody = document.getElementById('tableBody');
    this.lastRenderedHash = null;
  }

  // Get display headers from data
  getHeaders(data) {
    if (!data || !data.length) return [];
    
    const firstRow = data[0];
    return Object.keys(firstRow).map(key => ({
      key,
      label: COLUMN_MAPPINGS[key.toUpperCase()] || 
             key.replace(/_/g, ' ').toUpperCase()
    }));
  }

  // Render table headers with sort handlers
  renderHeaders(headers) {
    if (!this.tableHead) return;
    
    const html = `
      <tr role="row">
        ${headers.map(h => `
          <th 
            class="sortable" 
            data-column="${Utils.escapeHtml(h.key)}"
            role="columnheader"
            tabindex="0"
            aria-sort="none"
          >
            ${Utils.escapeHtml(h.label)}
          </th>
        `).join('')}
      </tr>
    `;
    
    this.tableHead.innerHTML = html;
    this.bindSortHandlers();
  }

  // Bind sort event handlers
  bindSortHandlers() {
    if (!this.tableHead) return;
    
    this.tableHead.querySelectorAll('th[data-column]').forEach(th => {
      const column = th.dataset.column;
      
      const handleSort = () => {
        const currentSort = this.state.getState('sortConfig');
        const direction = 
          currentSort?.column === column && currentSort.direction === 'asc' 
            ? 'desc' 
            : 'asc';
        
        this.state.setState({ 
          sortConfig: { column, direction }
        });
      };

      th.addEventListener('click', handleSort);
      th.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleSort();
        }
      });
    });
  }

  // Sort data array
  sortData(data, sortConfig) {
    if (!sortConfig || !data.length) return data;
    
    const { column, direction } = sortConfig;
    const sorted = [...data];
    
    sorted.sort((a, b) => {
      let valA = a?.[column] ?? '';
      let valB = b?.[column] ?? '';
      
      const numA = Utils.parseNumeric(valA, null);
      const numB = Utils.parseNumeric(valB, null);
      
      // Numeric comparison
      if (numA !== null && numB !== null) {
        return direction === 'asc' ? numA - numB : numB - numA;
      }
      
      // String comparison
      valA = String(valA).toLowerCase();
      valB = String(valB).toLowerCase();
      
      if (direction === 'asc') {
        return valA < valB ? -1 : valA > valB ? 1 : 0;
      }
      return valA > valB ? -1 : valA < valB ? 1 : 0;
    });
    
    return sorted;
  }

  // Filter data by search query
  filterData(data, query) {
    if (!query || !data.length) return data;
    
    const lowerQuery = query.toLowerCase();
    return data.filter(row => {
      return Object.values(row).some(val => 
        String(val).toLowerCase().includes(lowerQuery)
      );
    });
  }

  // Render table rows in batches
  async renderRows(data, headers) {
    if (!this.tableBody || !data.length) {
      if (this.tableBody) {
        this.tableBody.innerHTML = `
          <tr>
            <td colspan="${headers.length}" style="text-align:center;padding:40px;">
              No data available
            </td>
          </tr>
        `;
      }
      return;
    }

    const fragment = document.createDocumentFragment();
    const batchSize = CONFIG.UI.BATCH_SIZE;

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      batch.forEach(row => {
        const tr = this.createTableRow(row, headers);
        fragment.appendChild(tr);
      });
      
      // Yield to browser between batches
      if (i + batchSize < data.length) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    this.tableBody.innerHTML = '';
    this.tableBody.appendChild(fragment);
  }

  // Create single table row
  createTableRow(row, headers) {
    const tr = document.createElement('tr');
    tr.setAttribute('role', 'row');
    
    const teamName = row['TEAM NAME'] || row.TEAM || row.team_name || 'Unknown';
    tr.setAttribute('data-team', Utils.escapeHtml(String(teamName)));

    headers.forEach(header => {
      const td = document.createElement('td');
      const rawValue = row[header.key];
      
      if (rawValue != null && typeof rawValue === 'object') {
        console.warn('Unexpected object in cell:', header.key, rawValue);
        return;
      }
      
      td.textContent = Utils.formatValue(rawValue, header.key);
      
      // Add semantic classes
      const headerUpper = header.key.toUpperCase();
      if (['WINS', 'W'].includes(headerUpper)) {
        td.classList.add('wins-cell');
      }
      if (['LOSSES', 'L'].includes(headerUpper)) {
        td.classList.add('losses-cell');
      }
      
      tr.appendChild(td);
    });

    return tr;
  }

  // Apply gradient backgrounds to numeric columns
  applyGradients(data, headers) {
    const gradientColumns = headers
      .filter(h => ['PTS', 'Q1', 'Q2', 'Q3', 'Q4'].includes(h.key.toUpperCase()))
      .map(h => h.key);

    gradientColumns.forEach(colKey => {
      const colIndex = headers.findIndex(h => h.key === colKey);
      if (colIndex === -1) return;

      const values = data.map(row => Utils.parseNumeric(row[colKey]));
      const min = Math.min(...values);
      const max = Math.max(...values);
      
      if (max === min) return;

      const cells = this.tableBody.querySelectorAll(
        `tr:not(.league-avg) td:nth-child(${colIndex + 1})`
      );

      cells.forEach(cell => {
        const value = Utils.parseNumeric(cell.textContent);
        const ratio = (value - min) / (max - min);
        const bgColor = Utils.getGradientColor(ratio, CONFIG.CHART.COLORS.GRADIENT_STOPS);
        
        cell.style.cssText = `
          background-color: ${bgColor};
          transition: background-color 0.35s ease, color 0.2s ease;
          font-weight: 700;
        `;
        
        // Adjust text color for contrast
        const rgb = bgColor.match(/\d+/g)?.map(Number) || [0, 0, 0];
        const brightness = 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2];
        cell.style.color = brightness > 160 ? '#111' : '#fff';
        
        // Add tooltip
        const teamName = cell.parentElement?.getAttribute('data-team') || '';
        const rank = values.filter(v => v > value).length + 1;
        const percentile = Math.round(((value - min) / (max - min)) * 100);
        
        cell.title = `${teamName} · ${colKey}: ${value.toFixed(1)}\n` +
                     `Rank: ${rank}/${values.length} · Percentile: ${percentile}%`;
      });
    });

    this.addGradientLegend();
  }

  // Add gradient legend
  addGradientLegend() {
    const container = document.querySelector('.table-container');
    if (!container) return;

    const existing = container.querySelector('.table-heatmap-legend');
    if (existing) existing.remove();

    const legend = document.createElement('div');
    legend.className = 'table-heatmap-legend';
    legend.innerHTML = `
      <div style="width:160px;height:8px;border-radius:6px;
                  background:linear-gradient(90deg,#1a3c34,#4CAF50,#FFD700,#FF6B35,#FF1744);
                  box-shadow:inset 0 0 10px rgba(255,215,0,.15)"></div>
      <div style="display:flex;justify-content:space-between;margin-top:4px;">
        <span>Low</span><span>Avg</span><span>High</span>
      </div>
    `;

    container.appendChild(legend);
  }

  // Render league average row
  renderLeagueAverage(data, headers) {
    if (!this.tableBody || !data.length) return;

    const metaFields = /^(team|team name|rank)$/i;
    const numericKeys = headers
      .map(h => h.key)
      .filter(k => !metaFields.test(k));

    // Calculate averages
    const sums = {};
    let count = 0;

    data.forEach(row => {
      if (!row || typeof row !== 'object') return;
      count++;
      
      numericKeys.forEach(key => {
        const value = Utils.parseNumeric(row[key], null);
        if (value !== null) {
          sums[key] = (sums[key] || 0) + value;
        }
      });
    });

    const avgRow = document.createElement('tr');
    avgRow.className = 'league-avg';

    headers.forEach(header => {
      const td = document.createElement('td');
      const keyUpper = header.key.toUpperCase();

      if (keyUpper === 'RANK') {
        td.textContent = '';
      } else if (keyUpper === 'TEAM' || keyUpper === 'TEAM NAME') {
        td.textContent = 'League Average';
        td.style.fontWeight = '700';
      } else {
        const avg = sums[header.key] / Math.max(count, 1);
        if (Number.isFinite(avg)) {
          td.textContent = Utils.formatValue(avg, header.key);
          td.style.fontWeight = '700';
        }
      }

      avgRow.appendChild(td);
    });

    this.tableBody.appendChild(avgRow);
  }

  // Update sort indicators
  updateSortIndicators(sortConfig) {
    if (!this.tableHead) return;

    this.tableHead.querySelectorAll('th').forEach(th => {
      th.classList.remove('sort-asc', 'sort-desc');
      th.setAttribute('aria-sort', 'none');
    });

    if (sortConfig) {
      const activeHeader = this.tableHead.querySelector(
        `th[data-column="${sortConfig.column}"]`
      );
      
      if (activeHeader) {
        activeHeader.classList.add(`sort-${sortConfig.direction}`);
        activeHeader.setAttribute(
          'aria-sort',
          sortConfig.direction === 'asc' ? 'ascending' : 'descending'
        );
      }
    }
  }

  // Main render method
  async render() {
    const data = this.state.getState('data');
    const sortConfig = this.state.getState('sortConfig');
    const searchQuery = this.state.getState('searchQuery');

    if (!data || !data.length) {
      if (this.tableBody) {
        this.tableBody.innerHTML = `
          <tr>
            <td colspan="100%" style="text-align:center;padding:40px;">
              No data available
            </td>
          </tr>
        `;
      }
      return;
    }

    const headers = this.getHeaders(data);
    
    // Only re-render headers if they changed
    const headersHash = JSON.stringify(headers);
    if (headersHash !== this.lastHeadersHash) {
      this.renderHeaders(headers);
      this.lastHeadersHash = headersHash;
    }

    // Process data
    let processedData = [...data];
    
    if (searchQuery) {
      processedData = this.filterData(processedData, searchQuery);
    }
    
    if (sortConfig) {
      processedData = this.sortData(processedData, sortConfig);
    }

    // Render rows
    await this.renderRows(processedData, headers);
    
    // Apply styling
    this.applyGradients(processedData, headers);
    this.renderLeagueAverage(processedData, headers);
    this.updateSortIndicators(sortConfig);
  }
}
// chartRenderer.js - Chart.js wrapper with lifecycle management
class ChartRenderer {
  constructor(canvas, stateManager) {
    this.canvas = canvas;
    this.state = stateManager;
    this.chart = null;
    this.currentType = 'quarters';
  }

  // Destroy existing chart safely
  destroyChart() {
    if (this.chart) {
      try {
        this.chart.destroy();
      } catch (error) {
        console.warn('Chart cleanup warning:', error);
      }
      this.chart = null;
    }

    // Clear canvas
    const ctx = this.canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  // Get responsive font sizes
  getFontSizes() {
    const isMobile = Utils.isMobile();
    const isTablet = Utils.isTablet();

    return {
      title: isMobile ? 18 : 24,
      legend: isMobile ? 12 : 14,
      tooltip: isMobile ? 12 : 14,
      tooltipBody: isMobile ? 11 : 13,
      axis: isMobile ? 12 : 14,
      tick: isMobile ? 10 : 12
    };
  }

  // Render quarter performance chart
  renderQuarterChart(data) {
    if (!data || !data.length) return;

    const firstRow = data[0];
    const teamNameField = this.findTeamNameField(firstRow);
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'].filter(q => q in firstRow);

    if (!quarters.length) {
      console.warn('No quarter data available');
      return;
    }

    const teamNames = data.map(t => 
      String(t?.[teamNameField] || 'Unknown')
    );

    const colors = ['#FF6B35', '#F7931E', '#FFD700', '#FFA500'];
    const datasets = quarters.map((q, i) => ({
      label: q,
      data: data.map(t => Utils.parseNumeric(t?.[q])),
      backgroundColor: colors[i] || '#FFD700',
      borderRadius: 6,
      borderSkipped: false
    }));

    const fonts = this.getFontSizes();

    this.chart = new Chart(this.canvas, {
      type: 'bar',
      data: { labels: teamNames, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: CONFIG.UI.ANIMATION_DURATION },
        plugins: {
          title: {
            display: true,
            text: 'Quarter Performance Breakdown',
            font: {
              size: fonts.title,
              family: 'Rajdhani, sans-serif',
              weight: '700'
            },
            padding: { top: 20, bottom: 20 },
            color: CONFIG.CHART.COLORS.PRIMARY
          },
          legend: {
            position: 'top',
            labels: {
              font: {
                size: fonts.legend,
                family: 'Rajdhani, sans-serif',
                weight: '600'
              },
              color: CONFIG.CHART.COLORS.PRIMARY,
              usePointStyle: true,
              pointStyle: 'circle',
              padding: Utils.isMobile() ? 15 : 20
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(0,0,0,0.9)',
            titleFont: {
              family: 'Rajdhani, sans-serif',
              size: fonts.tooltip,
              weight: '600'
            },
            bodyFont: {
              family: 'Rajdhani, sans-serif',
              size: fonts.tooltipBody
            },
            cornerRadius: 12,
            padding: Utils.isMobile() ? 8 : 12
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        },
        scales: {
          y: {
            beginAtZero: false,
            min: 13,
            max: 26,
            ticks: {
              stepSize: 1,
              font: {
                size: fonts.tick,
                family: 'Rajdhani, sans-serif',
                weight: '500'
              },
              callback: (value) => Number(value).toFixed(1),
              color: CONFIG.CHART.COLORS.PRIMARY
            },
            grid: {
              color: (ctx) => 
                ctx.tick.value % 5 === 0 
                  ? 'rgba(255,200,0,0.35)' 
                  : 'rgba(255,150,0,0.15)',
              borderDash: [2, 2],
              drawBorder: false
            },
            title: {
              display: true,
              text: 'Points per Quarter',
              font: {
                size: fonts.axis,
                family: 'Rajdhani, sans-serif',
                weight: '600'
              },
              color: CONFIG.CHART.COLORS.PRIMARY
            }
          },
          x: {
            ticks: {
              font: {
                size: fonts.tick - 1,
                weight: '500',
                family: 'Rajdhani, sans-serif'
              },
              color: CONFIG.CHART.COLORS.PRIMARY,
              maxRotation: Utils.isMobile() ? 90 : 45
            },
            grid: { display: false },
            title: {
              display: true,
              text: 'Teams',
              font: {
                size: fonts.axis,
                family: 'Rajdhani, sans-serif',
                weight: '600'
              },
              color: CONFIG.CHART.COLORS.PRIMARY
            }
          }
        }
      }
    });
  }

  // Render scatter plot for trends
  renderTrendChart(data) {
    if (!data || !data.length) return;

    const firstRow = data[0];
    const teamNameField = this.findTeamNameField(firstRow);
    const winPctField = this.findWinPctField(firstRow);
    const ptsField = this.findPtsField(firstRow);

    const names = data.map(t => String(t?.[teamNameField] || 'Unknown'));
    
    let winPct = data.map(t => {
      const val = Utils.parseNumeric(t?.[winPctField]);
      return val;
    });

    // Normalize win percentage to 0-100 scale
    const maxWinPct = Math.max(...winPct);
    if (maxWinPct <= 1 && maxWinPct > 0) {
      winPct = winPct.map(p => p * 100);
    }

    const points = data.map(t => Utils.parseNumeric(t?.[ptsField]));
    const fonts = this.getFontSizes();

    this.chart = new Chart(this.canvas, {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Team Performance',
          data: names.map((name, i) => ({
            x: winPct[i],
            y: points[i],
            team: name
          })),
          backgroundColor: 'rgba(255, 215, 0, 0.7)',
          borderColor: CONFIG.CHART.COLORS.PRIMARY,
          pointRadius: Utils.isMobile() ? 6 : 8,
          pointHoverRadius: Utils.isMobile() ? 8 : 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: CONFIG.UI.ANIMATION_DURATION },
        plugins: {
          title: {
            display: true,
            text: 'Win Percentage vs Points Scored',
            font: {
              size: fonts.title - 4,
              family: 'Rajdhani',
              weight: '700'
            },
            color: CONFIG.CHART.COLORS.PRIMARY
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const point = ctx.raw;
                return `${point.team}: ${point.x.toFixed(1)}% wins, ${point.y.toFixed(1)} pts`;
              }
            }
          },
          legend: { display: false }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Win Percentage (%)',
              color: CONFIG.CHART.COLORS.PRIMARY,
              font: { size: fonts.axis }
            },
            ticks: {
              color: CONFIG.CHART.COLORS.PRIMARY,
              font: { size: fonts.tick }
            }
          },
          y: {
            title: {
              display: true,
              text: 'Points Per Game',
              color: CONFIG.CHART.COLORS.PRIMARY,
              font: { size: fonts.axis }
            },
            ticks: {
              color: CONFIG.CHART.COLORS.PRIMARY,
              font: { size: fonts.tick }
            }
          }
        }
      }
    });
  }

  // Helper to find team name field
  findTeamNameField(row) {
    const keys = Object.keys(row);
    return keys.find(k => 
      k.toLowerCase().includes('team') && k.toLowerCase().includes('name')
    ) || keys.find(k => k.toLowerCase() === 'team') || keys[1] || 'team';
  }

  // Helper to find win percentage field
  findWinPctField(row) {
    const keys = Object.keys(row);
    return keys.find(k => 
      k.toLowerCase().includes('win') && k.toLowerCase().includes('%')
    ) || 'WIN %';
  }

  // Helper to find points field
  findPtsField(row) {
    const keys = Object.keys(row);
    return keys.find(k => 
      k.toLowerCase() === 'pts' || k.toLowerCase() === 'points'
    ) || 'PTS';
  }

  // Switch chart type
  switchType(type) {
    this.currentType = type;
    this.render();
  }

  // Main render method
  render() {
    this.destroyChart();

    const data = this.state.getState('data');
    if (!data || !data.length) return;

    try {
      switch (this.currentType) {
        case 'quarters':
          this.renderQuarterChart(data);
          break;
        case 'trends':
          this.renderTrendChart(data);
          break;
        default:
          console.warn(`Unknown chart type: ${this.currentType}`);
      }
    } catch (error) {
      console.error('Chart rendering failed:', error);
    }
  }

  // Clean up
  destroy() {
    this.destroyChart();
  }
}
// comparisonEngine.js - Team comparison analytics and insights
class ComparisonEngine {
  constructor(stateManager) {
    this.state = stateManager;
  }

  // Main comparison method
  compareTeams(teamAName, teamBName) {
    const mergedData = this.state.getState('mergedData');
    
    if (mergedData && mergedData[teamAName] && mergedData[teamBName]) {
      return this.enhancedComparison(teamAName, teamBName, mergedData);
    }
    
    return this.basicComparison(teamAName, teamBName);
  }

  // Enhanced comparison with full analytics
  enhancedComparison(teamAName, teamBName, mergedData) {
    const teamAData = mergedData[teamAName];
    const teamBData = mergedData[teamBName];

    const ratingA = this.buildTeamProfile(teamAData, teamAName);
    const ratingB = this.buildTeamProfile(teamBData, teamBName);
    
    return {
      teamA: ratingA,
      teamB: ratingB,
      advantages: this.findAdvantages(teamAData, teamBData, teamAName, teamBName),
      insights: this.generateInsights(teamAData, teamBData, teamAName, teamBName, ratingA, ratingB),
      bettingInsights: this.generateBettingInsights(teamAData, teamBData, teamAName, teamBName, ratingA, ratingB),
      confidenceLevel: this.calculateConfidence(ratingA, ratingB)
    };
  }

  // Basic comparison fallback
  basicComparison(teamAName, teamBName) {
    const data = this.state.getState('data');
    const teamA = data.find(t => (t['TEAM NAME'] || t.TEAM) === teamAName) || {};
    const teamB = data.find(t => (t['TEAM NAME'] || t.TEAM) === teamBName) || {};

    const ratingA = this.calculateBasicRating(teamA);
    const ratingB = this.calculateBasicRating(teamB);

    return {
      teamA: { overallRating: ratingA, strengths: ['Basic analysis'], weaknesses: [] },
      teamB: { overallRating: ratingB, strengths: ['Basic analysis'], weaknesses: [] },
      advantages: { 
        teamA: ['Enhanced analytics require full dataset'], 
        teamB: ['Enhanced analytics require full dataset'] 
      },
      insights: ['Limited data - upgrade for detailed insights'],
      bettingInsights: ['Betting analysis unavailable in basic mode'],
      confidenceLevel: { level: 'Low', score: 0, factors: ['Limited data'] }
    };
  }

  // Build comprehensive team profile
  buildTeamProfile(teamData, teamName) {
    const adv = teamData.advanced || {};
    const fs = teamData.fullseason || {};
    const lf = teamData.lastfive || {};
    const notes = teamData.notes || {};

    return {
      overallRating: this.calculateOverallRating(teamData, teamName),
      offensiveRating: this.calculateOffensiveRating(adv, fs),
      defensiveRating: this.calculateDefensiveRating(adv, fs),
      recentForm: `${Utils.parseNumeric(lf['WIN %'])}%`,
      strengths: this.extractStrengths(notes, adv, fs),
      weaknesses: this.extractWeaknesses(notes, adv, fs),
      styleProfile: this.analyzeStyle(adv, fs)
    };
  }

  // Calculate overall team rating
  calculateOverallRating(teamData, teamName) {
    const adv = teamData.advanced || {};
    const fs = teamData.fullseason || {};
    const lf = teamData.lastfive || {};

    const netRtg = Utils.parseNumeric(adv.net_rtg, 0);
    const winPct = Utils.parseNumeric(fs['WIN %'], 50);
    const rank = parseInt(fs['RANK'] || '7');
    const offRtg = Utils.parseNumeric(adv.off_rtg, 100);
    const defRtg = Utils.parseNumeric(adv.def_rtg, 105);
    const efgPct = Utils.parseNumeric(adv.efg_pct, 45);

    const recentWin = Utils.parseNumeric(lf['WIN %'], winPct);
    const momentum = (recentWin - winPct) * 0.15;

    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'].map(q => Utils.parseNumeric(fs[q]));
    const qAvg = quarters.reduce((a, b) => a + b, 0) / 4;
    const qVariance = quarters.reduce((sum, q) => sum + Math.pow(q - qAvg, 2), 0) / 4;
    const consistencyBonus = Math.max(-2, Math.min(3, 3 - Math.sqrt(qVariance) * 0.5));

    const netScore = 75 + (netRtg * 1.33);
    const winScore = 50 + (winPct * 0.5);
    const rankScore = 98 - (rank * 3);
    const offScore = 20 + (offRtg * 0.75);
    const defScore = 170 - (defRtg * 0.75);
    const efgScore = 25 + (efgPct * 1.33);

    const overall = (
      (netScore * 0.30) +
      (winScore * 0.25) +
      (rankScore * 0.15) +
      (offScore * 0.12) +
      (defScore * 0.12) +
      (efgScore * 0.06) +
      momentum +
      consistencyBonus
    );

    return Math.round(Math.max(60, Math.min(95, overall)));
  }

  // Calculate offensive rating
  calculateOffensiveRating(adv, fs) {
    const offRtg = Utils.parseNumeric(adv.off_rtg, 100);
    const efgPct = Utils.parseNumeric(adv.efg_pct, 45);
    const astPct = Utils.parseNumeric(adv.ast_pct, 60);
    const tovPct = Utils.parseNumeric(adv.tov_pct, 15);
    const fgPct = Utils.parseNumeric(fs['FG%'], 42);

    const rating = Math.round(
      ((offRtg - 90) * 0.8) +
      ((efgPct - 40) * 1.2) +
      ((astPct - 50) * 0.6) +
      ((18 - tovPct) * 1.0) +
      ((fgPct - 38) * 0.8)
    );

    return Math.max(30, Math.min(90, rating + 50));
  }

  // Calculate defensive rating
  calculateDefensiveRating(adv, fs) {
    const defRtg = Utils.parseNumeric(adv.def_rtg, 105);
    const oppPts = Utils.parseNumeric(adv.opp_pts, 85);
    const stl = Utils.parseNumeric(fs.STL, 6);

    const rating = Math.round(
      ((115 - defRtg) * 0.9) +
      ((90 - oppPts) * 0.7) +
      ((stl - 5) * 2.0)
    );

    return Math.max(30, Math.min(90, rating + 50));
  }

  // Calculate basic rating (fallback)
  calculateBasicRating(team) {
    const pts = Utils.parseNumeric(team.PTS);
    const fg = Utils.parseNumeric(team['FG%']);
    const threePt = Utils.parseNumeric(team['3P%']);
    const reb = Utils.parseNumeric(team.REB);
    const ast = Utils.parseNumeric(team.AST);
    const stl = Utils.parseNumeric(team.STL);
    const tov = Utils.parseNumeric(team.TOV);
    const wins = Utils.parseNumeric(team['WIN %']);

    const offRating = (pts * 0.3) + (fg * 0.4) + (threePt * 0.2) + (ast * 0.1);
    const defRating = (stl * 0.4) + (reb * 0.3) + ((20 - tov) * 0.3);
    const winBonus = wins * 0.2;

    return Math.round(((offRating + defRating) / 2) + winBonus);
  }

  // Analyze team style
  analyzeStyle(adv, fs) {
    const astPct = Utils.parseNumeric(adv.ast_pct, 60);
    const offRtg = Utils.parseNumeric(adv.off_rtg, 100);
    const defRtg = Utils.parseNumeric(adv.def_rtg, 105);
    const efgPct = Utils.parseNumeric(adv.efg_pct, 45);
    const rebPct = Utils.parseNumeric(adv.reb_pct, 50);
    const tovPct = Utils.parseNumeric(adv.tov_pct, 15);

    const style = {
      pace: astPct > 70 ? 'fast' : astPct < 55 ? 'slow' : 'moderate',
      offense: offRtg > 108 && efgPct > 50 ? 'elite' : offRtg > 105 ? 'good' : offRtg < 98 ? 'poor' : 'balanced',
      defense: defRtg < 98 ? 'elite' : defRtg < 102 ? 'good' : defRtg > 110 ? 'poor' : 'average',
      versatility: Math.round(
        (astPct - 45) * 0.5 +
        (rebPct - 45) * 0.8 +
        (20 - tovPct) * 1.2 +
        (efgPct - 40) * 0.6 + 50
      )
    };

    style.versatility = Math.max(25, Math.min(85, style.versatility));
    return style;
  }

  // Extract strengths
  extractStrengths(notes, adv, fs) {
    const strengths = [];

    if (notes.strengths) {
      strengths.push(...String(notes.strengths).split('.').map(s => s.trim()).filter(Boolean).slice(0, 2));
    }

    const offRtg = Utils.parseNumeric(adv.off_rtg, 100);
    const defRtg = Utils.parseNumeric(adv.def_rtg, 105);
    const efgPct = Utils.parseNumeric(adv.efg_pct, 45);
    const rebPct = Utils.parseNumeric(adv.reb_pct, 50);
    const astPct = Utils.parseNumeric(adv.ast_pct, 60);

    if (offRtg > 108) strengths.push('Elite offensive efficiency');
    if (defRtg < 100) strengths.push('Lockdown defense');
    if (efgPct > 52) strengths.push('High-quality shot creation');
    if (rebPct > 53) strengths.push('Rebounding dominance');
    if (astPct > 72) strengths.push('Exceptional ball movement');

    return strengths.slice(0, 3);
  }

  // Extract weaknesses
  extractWeaknesses(notes, adv, fs) {
    const weaknesses = [];

    if (notes.weaknesses) {
      weaknesses.push(...String(notes.weaknesses).split('.').map(s => s.trim()).filter(Boolean).slice(0, 2));
    }

    const offRtg = Utils.parseNumeric(adv.off_rtg, 100);
    const defRtg = Utils.parseNumeric(adv.def_rtg, 105);
    const tovPct = Utils.parseNumeric(adv.tov_pct, 15);
    const rebPct = Utils.parseNumeric(adv.reb_pct, 50);

    if (offRtg < 95) weaknesses.push('Offensive struggles');
    if (defRtg > 112) weaknesses.push('Defensive lapses');
    if (tovPct > 18) weaknesses.push('Ball security issues');
    if (rebPct < 47) weaknesses.push('Rebounding disadvantage');

    return weaknesses.slice(0, 3);
  }

  // Find matchup advantages
  findAdvantages(teamAData, teamBData, teamAName, teamBName) {
    const advantages = { teamA: [], teamB: [] };
    
    const aAdv = teamAData.advanced || {};
    const bAdv = teamBData.advanced || {};
    const aFS = teamAData.fullseason || {};
    const bFS = teamBData.fullseason || {};

    const aOffRtg = Utils.parseNumeric(aAdv.off_rtg, 100);
    const bDefRtg = Utils.parseNumeric(bAdv.def_rtg, 105);
    const bOffRtg = Utils.parseNumeric(bAdv.off_rtg, 100);
    const aDefRtg = Utils.parseNumeric(aAdv.def_rtg, 105);

    if (aOffRtg - bDefRtg > 4) {
      advantages.teamA.push(`Offensive efficiency edge (${aOffRtg.toFixed(1)} vs ${bDefRtg.toFixed(1)})`);
    }
    if (bOffRtg - aDefRtg > 4) {
      advantages.teamB.push(`Offensive efficiency edge (${bOffRtg.toFixed(1)} vs ${aDefRtg.toFixed(1)})`);
    }

    const aFG = Utils.parseNumeric(aFS['FG%']);
    const bFG = Utils.parseNumeric(bFS['FG%']);
    if (aFG - bFG > 2.5) {
      advantages.teamA.push(`Field goal efficiency (${aFG.toFixed(1)}% vs ${bFG.toFixed(1)}%)`);
    } else if (bFG - aFG > 2.5) {
      advantages.teamB.push(`Field goal efficiency (${bFG.toFixed(1)}% vs ${aFG.toFixed(1)}%)`);
    }

    const a3P = Utils.parseNumeric(aFS['3P%']);
    const b3P = Utils.parseNumeric(bFS['3P%']);
    if (a3P - b3P > 3) {
      advantages.teamA.push(`Three-point shooting (${a3P.toFixed(1)}% vs ${b3P.toFixed(1)}%)`);
    } else if (b3P - a3P > 3) {
      advantages.teamB.push(`Three-point shooting (${b3P.toFixed(1)}% vs ${a3P.toFixed(1)}%)`);
    }

    const aReb = Utils.parseNumeric(aFS.REB);
    const bReb = Utils.parseNumeric(bFS.REB);
    if (aReb - bReb > 2) {
      advantages.teamA.push(`Rebounding advantage (${aReb.toFixed(1)} vs ${bReb.toFixed(1)})`);
    } else if (bReb - aReb > 2) {
      advantages.teamB.push(`Rebounding advantage (${bReb.toFixed(1)} vs ${aReb.toFixed(1)})`);
    }

    return advantages;
  }

  // Generate strategic insights
  generateInsights(teamAData, teamBData, teamAName, teamBName, ratingA, ratingB) {
    const insights = [];
    
    const ratingDiff = Math.abs(ratingA.overallRating - ratingB.overallRating);
    
    if (ratingDiff > 8) {
      const stronger = ratingA.overallRating > ratingB.overallRating ? teamAName : teamBName;
      insights.push(`<strong>${stronger}</strong> holds a decisive advantage (${ratingDiff} point rating gap).`);
    } else if (ratingDiff > 4) {
      const stronger = ratingA.overallRating > ratingB.overallRating ? teamAName : teamBName;
      insights.push(`<strong>${stronger}</strong> has a slight edge in this competitive matchup.`);
    } else {
      insights.push('Teams are evenly matched - expect a tight contest decided by execution.');
    }

    const aAdv = teamAData.advanced || {};
    const bAdv = teamBData.advanced || {};
    const aNet = Utils.parseNumeric(aAdv.net_rtg);
    const bNet = Utils.parseNumeric(bAdv.net_rtg);
    const netDiff = Math.abs(aNet - bNet);

    if (netDiff > 6) {
      const better = aNet > bNet ? teamAName : teamBName;
      insights.push(`<strong>${better}</strong> shows superior net rating (${Math.max(aNet, bNet).toFixed(1)} vs ${Math.min(aNet, bNet).toFixed(1)}).`);
    }

    return insights;
  }

  // Generate betting insights
  generateBettingInsights(teamAData, teamBData, teamAName, teamBName, ratingA, ratingB) {
    const insights = [];
    
    const ratingDiff = ratingA.overallRating - ratingB.overallRating;
    
    if (Math.abs(ratingDiff) > 12) {
      const favorite = ratingDiff > 0 ? teamAName : teamBName;
      const dog = ratingDiff > 0 ? teamBName : teamAName;
      insights.push(`<strong>Spread:</strong> ${favorite} favored by 4-7 points. Value may exist on ${dog} if line inflated.`);
    } else if (Math.abs(ratingDiff) > 6) {
      const favorite = ratingDiff > 0 ? teamAName : teamBName;
      insights.push(`<strong>Spread:</strong> ${favorite} slight favorite (2-4 point range). Competitive game expected.`);
    } else {
      insights.push(`<strong>Spread:</strong> Pick'em game - bet situational factors over power ratings.`);
    }

    const aAdv = teamAData.advanced || {};
    const bAdv = teamBData.advanced || {};
    const avgDefRtg = (Utils.parseNumeric(aAdv.def_rtg, 105) + Utils.parseNumeric(bAdv.def_rtg, 105)) / 2;
    const avgOffRtg = (Utils.parseNumeric(aAdv.off_rtg, 100) + Utils.parseNumeric(bAdv.off_rtg, 100)) / 2;

    if (avgDefRtg < 98 && avgOffRtg < 105) {
      insights.push(`<strong>Total:</strong> LEAN UNDER - Both teams feature strong defensive systems.`);
    } else if (avgDefRtg > 108 && avgOffRtg > 108) {
      insights.push(`<strong>Total:</strong> LEAN OVER - Offensive-minded teams with defensive vulnerabilities.`);
    } else {
      insights.push(`<strong>Total:</strong> Standard range expected - look for derivative markets.`);
    }

    return insights;
  }

  // Calculate confidence level
  calculateConfidence(ratingA, ratingB) {
    const ratingDiff = Math.abs(ratingA.overallRating - ratingB.overallRating);
    
    let level = 'Medium';
    let score = ratingDiff;
    
    if (score > 18) level = 'Very High';
    else if (score > 12) level = 'High';
    else if (score < 5) level = 'Low';
    
    return {
      level,
      score: Math.round(score),
      factors: [
        `Rating differential: ${ratingDiff.toFixed(1)}`,
        'Style matchup analyzed',
        'Recent form considered'
      ]
    };
  }
}

// Main application controller
class WNBADashboard {
  constructor() {
    this.state = new StateManager();
    this.dataService = new DataService();
    this.renderQueue = new RenderQueue();
    this.comparison = new ComparisonEngine(this.state);
    
    this.tableRenderer = null;
    this.chartRenderer = null;
    this.radarRenderer = null;
    this._radarCharts = {}; // Track Chart.js instances
    
    this.eventHandlers = new Map();
    this.cleanupTasks = [];
    this.isInitialized = false;
    
    this.init();
  }

  // Initialize application
  async init() {
    try {
      this.updateStatus('Initializing...', 'loading');
      
      // Initialize renderers
      this.initializeRenderers();
      
      // Bind all events
      this.bindEvents();
      
      // Setup keyboard shortcuts
      this.setupKeyboardShortcuts();
      
      // Setup intersection observer for animations
      this.setupIntersectionObserver();
      
      // Load all data in parallel
      const results = await Promise.allSettled([
        this.loadMainData(),
        this.loadMergedData()
      ]);
      
      // Check for failures
      const failures = results.filter(r => r.status === 'rejected');
      
      if (failures.length === results.length) {
        throw new Error('All data sources failed to load');
      }
      
      if (failures.length > 0) {
        console.warn('Some data sources failed:', failures);
        this.updateStatus('Dashboard loaded with limited features', 'warning');
      } else {
        this.updateStatus('Dashboard ready', 'success');
      }
      
      this.isInitialized = true;
      
    } catch (error) {
      console.error('Initialization failed:', error);
      this.updateStatus('Failed to initialize dashboard', 'error');
      this.handleError(error, 'Initialization');
    }
  }

  // Initialize all renderers
initializeRenderers() {
  const canvas = document.getElementById('mainChart');
  const tableContainer = document.querySelector('.table-container');
  const comparisonContainer = document.getElementById('comparisonResults');
  
  // Initialize chart renderer
  if (canvas) {
    this.chartRenderer = new ChartRenderer(canvas, this.state);
    this.cleanupTasks.push(() => this.chartRenderer?.destroy());
  }
  
  // Initialize table renderer
  if (tableContainer) {
    this.tableRenderer = new TableRenderer(tableContainer, this.state);
  }
  
  // Initialize comparison renderer
  if (comparisonContainer) {
    this.comparisonRenderer = new ComparisonRenderer(
      comparisonContainer,
      this.state,
      this.comparison
    );
    this.cleanupTasks.push(() => this.comparisonRenderer?.cleanup());
  }
  
  // Subscribe to state changes for automatic re-rendering
  this.state.subscribe('data', () => this.handleDataChange());
  this.state.subscribe('sortConfig', () => this.handleSortChange());
  this.state.subscribe('searchQuery', () => this.handleSearchChange());
  this.state.subscribe('currentDataset', () => this.handleDatasetChange());
  
  // Subscribe to team selection changes for comparison
  this.state.subscribe('selectedTeams', (newTeams, oldTeams) => {
    if (newTeams.teamA && newTeams.teamB && newTeams.teamA !== newTeams.teamB) {
      // Auto-render comparison when both teams are selected
      if (this.comparisonRenderer) {
        this.comparisonRenderer.render(newTeams.teamA, newTeams.teamB);
      }
    }
  });
}

// Load main dataset
async loadMainData() {
  const currentDataset = this.state.getState('currentDataset');
  
  try {
    this.state.setState({ loading: true, error: null });
    
    const data = await this.dataService.loadData(currentDataset);
    
    // Validate data before setting state
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Invalid or empty dataset received');
    }
    
    this.state.setState({
      data: data,
      originalData: Utils.deepClone(data),
      loading: false
    });
    
    return data;
    
  } catch (error) {
    this.state.setState({ 
      loading: false, 
      error: error.message,
      data: [],
      originalData: []
    });
    throw error;
  }
}


// Load merged comparison data
  async loadMergedData() {
    try {
      const [fullSeason, lastFive, teams] = await Promise.all([
        this.dataService.loadData(CONFIG.DATA_SOURCES.FULL_SEASON),
        this.dataService.loadData(CONFIG.DATA_SOURCES.LAST_FIVE),
        this.dataService.loadData(CONFIG.DATA_SOURCES.TEAMS)
      ]);
      
      const mergedData = this.buildMergedData(fullSeason, lastFive, teams);
      const leagueStats = this.calculateLeagueStats(mergedData);
      
      this.state.setState({ mergedData, leagueStats });
      
      console.log('Enhanced comparison data loaded successfully');
      
    } catch (error) {
      console.warn('Enhanced comparison data unavailable:', error);
      this.state.setState({ 
        mergedData: {}, 
        leagueStats: null 
      });
    }
  }

  // Build merged data structure
  buildMergedData(fullSeason, lastFive, teams) {
    const merged = {};
    
    const fsByName = new Map(
      fullSeason.map(t => [String(t['TEAM NAME'] || t.TEAM || '').trim(), t])
    );
    const lfByName = new Map(
      lastFive.map(t => [String(t['TEAM NAME'] || t.TEAM || '').trim(), t])
    );
    
    teams.forEach(team => {
      if (!team || typeof team !== 'object') return;
      
      const name = String(team.name || '').trim();
      if (!name) return;
      
      merged[name] = {
        advanced: team.stats || {},
        notes: team.notes || { strengths: '', weaknesses: '' },
        fullseason: fsByName.get(name) || {},
        lastfive: lfByName.get(name) || {}
      };
    });
    
    return merged;
  }

  // Calculate league-wide statistics
  calculateLeagueStats(mergedData) {
    const metrics = [
      'PTS', 'FG%', '3P%', 'REB', 'AST', 'STL', 'TOV',
      'off_rtg', 'def_rtg', 'net_rtg', 'ast_pct', 'reb_pct', 
      'tov_pct', 'opp_pts', 'efg_pct', 'WIN %'
    ];
    
    const minStats = {};
    const maxStats = {};
    
    metrics.forEach(m => {
      minStats[m] = Infinity;
      maxStats[m] = -Infinity;
    });
    
    Object.values(mergedData).forEach(team => {
      if (!team || typeof team !== 'object') return;
      
      const fs = team.fullseason || {};
      const adv = team.advanced || {};
      
      metrics.forEach(m => {
        let val = Utils.parseNumeric(fs[m], null);
        if (val === null) val = Utils.parseNumeric(adv[m], null);
        
        if (val !== null) {
          if (val < minStats[m]) minStats[m] = val;
          if (val > maxStats[m]) maxStats[m] = val;
        }
      });
    });
    
    return { minStats, maxStats };
  }

  // Handle data change
  handleDataChange() {
    this.renderQueue.enqueue(() => this.tableRenderer?.render(), 10);
    this.renderQueue.enqueue(() => this.chartRenderer?.render(), 8);
    this.renderQueue.enqueue(() => this.populateTeamSelectors(), 5);
  }

  // Handle sort change
  handleSortChange() {
    this.renderQueue.enqueue(() => this.tableRenderer?.render(), 10);
  }

  // Handle search change
  handleSearchChange() {
    this.renderQueue.enqueue(() => this.tableRenderer?.render(), 10);
  }

  // Handle dataset toggle
  async handleDatasetChange() {
    await this.loadMainData();
    this.updateDatasetLabel();
  }

  // Populate team selectors
  populateTeamSelectors() {
    const teamA = document.getElementById('teamA');
    const teamB = document.getElementById('teamB');
    
    if (!teamA || !teamB) return;
    
    const data = this.state.getState('data');
    if (!data || !data.length) return;
    
    const firstRow = data[0];
    const teamNameField = Object.keys(firstRow).find(k =>
      k.toLowerCase().includes('team') && k.toLowerCase().includes('name')
    ) || Object.keys(firstRow).find(k => k.toLowerCase() === 'team');
    
    const teams = [...new Set(
      data.map(t => t?.[teamNameField]).filter(Boolean)
    )].sort();
    
    [teamA, teamB].forEach(select => {
      const current = select.value;
      select.innerHTML = '<option value="">Select Team</option>';
      
      teams.forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        if (name === current) opt.selected = true;
        select.appendChild(opt);
      });
    });
  }

  // Bind all event handlers
  bindEvents() {
    // Search input
    this.bindEvent('searchInput', 'input', 
      Utils.debounce((e) => this.handleSearch(e), CONFIG.UI.DEBOUNCE_DELAY)
    );
    
    // Export buttons
    this.bindEvent('exportCsvBtn', 'click', () => this.exportData('csv'));
    this.bindEvent('exportImageBtn', 'click', () => this.exportData('image'));
    
    // Chart type buttons
    document.querySelectorAll('[data-chart]').forEach(btn => {
      this.bindEvent(btn, 'click', (e) => {
        const chartType = e.currentTarget.dataset.chart;
        this.switchChart(chartType);
      });
    });
    
    // Dataset toggle
    this.bindEvent('datasetToggle', 'click', () => this.toggleDataset());
    
    // Share modal
    this.bindEvent('shareBtn', 'click', () => this.openShareModal());
    this.bindEvent('shareModal', 'click', (e) => {
      if (e.target.id === 'shareModal') this.closeShareModal();
    });
    
    const modalClose = document.querySelector('#shareModal .modal-close');
    if (modalClose) {
      this.bindEvent(modalClose, 'click', (e) => {
        e.preventDefault();
        this.closeShareModal();
      });
    }
    
    // Share actions
    this.bindEvent('copyUrlBtn', 'click', (e) => {
      e.preventDefault();
      this.copyShareUrl();
    });
    this.bindEvent('shareTwitterBtn', 'click', (e) => {
      e.preventDefault();
      this.shareToSocial('twitter');
    });
    this.bindEvent('shareFacebookBtn', 'click', (e) => {
      e.preventDefault();
      this.shareToSocial('facebook');
    });
    
    // Team comparison
    this.bindEvent('teamA', 'change', () => this.updateComparison());
    this.bindEvent('teamB', 'change', () => this.updateComparison());
    this.bindEvent('compareBtn', 'click', () => this.compareTeams());
  }

  // Bind single event with cleanup tracking
  bindEvent(elementOrId, eventName, handler) {
    const element = typeof elementOrId === 'string' 
      ? document.getElementById(elementOrId) 
      : elementOrId;
    
    if (!element) return;
    
    element.addEventListener(eventName, handler);
    
    // Track for cleanup
    const key = Utils.generateId('event');
    this.eventHandlers.set(key, { element, eventName, handler });
    this.cleanupTasks.push(() => element.removeEventListener(eventName, handler));
  }

  // Setup keyboard shortcuts
  setupKeyboardShortcuts() {
    const handler = (e) => {
      if (e.ctrlKey || e.metaKey) {
        const shortcuts = {
          's': () => this.exportData('csv'),
          'i': () => this.exportData('image'),
          '/': () => document.getElementById('searchInput')?.focus(),
          'k': () => this.openShareModal()
        };
        
        const action = shortcuts[e.key.toLowerCase()];
        if (action) {
          e.preventDefault();
          action();
        }
      }
      
      if (e.key === 'Escape') {
        this.closeShareModal();
        document.getElementById('searchInput')?.blur();
      }
    };
    
    document.addEventListener('keydown', handler);
    this.cleanupTasks.push(() => document.removeEventListener('keydown', handler));
  }

  // Setup intersection observer for animations
  setupIntersectionObserver() {
    if (!('IntersectionObserver' in window)) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );
    
    document.querySelectorAll('.trend-card, .comparison-section, .chart-section')
      .forEach(el => observer.observe(el));
    
    this.cleanupTasks.push(() => observer.disconnect());
  }

  // Handle search input
  handleSearch(event) {
    const input = event.target;
    let query = Utils.sanitizeInput(input.value);
    
    if (query.length > 100) {
      query = query.slice(0, 100);
      input.value = query;
    }
    
    if (query && !Utils.isValidSearchQuery(query)) {
      input.style.borderColor = 'var(--error-color)';
      return;
    }
    
    input.style.borderColor = query ? 'var(--success-color)' : 'var(--border-color)';
    this.state.setState({ searchQuery: query });
  }

  // Switch chart type
  switchChart(type) {
    document.querySelectorAll('[data-chart]').forEach(btn => 
      btn.classList.remove('active')
    );
    
    const activeBtn = document.querySelector(`[data-chart="${type}"]`);
    if (activeBtn) activeBtn.classList.add('active');
    
    if (this.chartRenderer) {
      this.chartRenderer.switchType(type);
    }
  }

  // Toggle dataset
  async toggleDataset() {
    const current = this.state.getState('currentDataset');
    const next = current === CONFIG.DATA_SOURCES.FULL_SEASON 
      ? CONFIG.DATA_SOURCES.LAST_FIVE 
      : CONFIG.DATA_SOURCES.FULL_SEASON;
    
    this.state.setState({ currentDataset: next });
  }

  // Update dataset label
  updateDatasetLabel() {
    const label = document.getElementById('datasetLabel');
    if (!label) return;
    
    const current = this.state.getState('currentDataset');
    label.textContent = current === CONFIG.DATA_SOURCES.FULL_SEASON 
      ? 'Full Season' 
      : 'Last 5 Games';
  }

  // Export data
  async exportData(format) {
    const data = this.state.getState('data');
    if (!data || !data.length) return;
    
    if (format === 'csv') {
      this.exportCSV(data);
    } else if (format === 'image') {
      await this.exportImage();
    }
  }

  // Export as CSV
  exportCSV(data) {
    const headers = Object.keys(data[0]);
    let csv = headers.join(',') + '\n';
    
    data.forEach(row => {
      csv += headers.map(h => {
        const val = row[h] ?? '';
        const str = String(val);
        return str.includes(',') ? `"${str.replace(/"/g, '""')}"` : str;
      }).join(',') + '\n';
    });
    
    csv += `\n# Export Date: ${new Date().toISOString()}\n`;
    csv += `# Dataset: ${this.state.getState('currentDataset')}\n`;
    csv += `# Records: ${data.length}`;
    
    this.downloadFile('wnba_stats.csv', csv, 'text/csv');
    this.showNotification('CSV exported successfully', 'success');
  }

  // Export as image
  async exportImage() {
    const table = document.getElementById('dataTable');
    const button = document.getElementById('exportImageBtn');
    
    if (!table || !button) return;
    
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Exporting...';
    button.disabled = true;
    
    try {
      if (typeof html2canvas === 'undefined') {
        throw new Error('html2canvas library not loaded');
      }
      
      const canvas = await html2canvas(table, {
        backgroundColor: '#1a1a1a',
        scale: window.devicePixelRatio || 2,
        useCORS: true,
        allowTaint: true
      });
      
      const link = document.createElement('a');
      link.download = `wnba_table_${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      this.showNotification('Image exported successfully', 'success');
      
    } catch (error) {
      console.error('Export failed:', error);
      this.showNotification('Export failed', 'error');
    } finally {
      button.innerHTML = originalText;
      button.disabled = false;
    }
  }

  // Download file helper
  downloadFile(filename, content, type = 'text/plain') {
    const blob = new Blob([content], { type: `${type};charset=utf-8` });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }

  // Update comparison
  updateComparison() {
    const teamAName = document.getElementById('teamA')?.value;
    const teamBName = document.getElementById('teamB')?.value;
    
    if (!teamAName || !teamBName || teamAName === teamBName) return;
    
    this.state.setState({
      selectedTeams: { teamA: teamAName, teamB: teamBName }
    });
  }

  // Compare teams
  compareTeams() {
    const { teamA, teamB } = this.state.getState('selectedTeams');
    
    if (!teamA || !teamB) {
      this.showNotification('Please select two teams to compare', 'warning');
      return;
    }
    
    // Trigger comparison render
    if (this.comparisonRenderer) {
      this.comparisonRenderer.render(teamA, teamB);
    }
  }

  // Share modal handlers
  openShareModal() {
    const modal = document.getElementById('shareModal');
    if (!modal) return;
    
    modal.classList.add('show');
    const shareUrlInput = document.getElementById('shareUrl');
    if (shareUrlInput) {
      shareUrlInput.value = window.location.href;
    }
  }

  closeShareModal() {
    document.querySelectorAll('.modal.show').forEach(m => 
      m.classList.remove('show')
    );
  }

  async copyShareUrl() {
    const input = document.getElementById('shareUrl');
    if (!input) return;
    
    try {
      await navigator.clipboard.writeText(input.value);
      this.showNotification('URL copied to clipboard', 'success');
    } catch {
      input.select();
      document.execCommand('copy');
      this.showNotification('URL copied to clipboard', 'success');
    }
  }

  shareToSocial(platform) {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent('Check out this WNBA Season Tracker!');
    
    const urls = {
      twitter: `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`
    };
    
    const shareUrl = urls[platform];
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
      this.closeShareModal();
    }
  }

  // UI helpers
  updateStatus(message, type = 'info') {
    const status = document.getElementById('status');
    if (!status) return;
    
    const text = status.querySelector('span');
    const icon = status.querySelector('i');
    
    if (text) text.textContent = message;
    
    if (icon) {
      const icons = {
        loading: 'fa-sync-alt fa-spin',
        success: 'fa-check-circle',
        error: 'fa-exclamation-triangle',
        warning: 'fa-exclamation-circle',
        info: 'fa-info-circle'
      };
      icon.className = `fas ${icons[type] || icons.info}`;
    }
    
    status.className = `status ${type}`;
  }

  showNotification(message, type = 'success', duration = CONFIG.UI.NOTIFICATION_DURATION) {
    const notification = document.getElementById('notification');
    const text = document.getElementById('notificationText');
    
    if (!notification || !text) return;
    
    text.textContent = message;
    notification.className = `notification ${type} show`;
    
    setTimeout(() => {
      notification.classList.remove('show');
    }, duration);
  }

  // Error handler
  handleError(error, context = '') {
    console.error(`Error in ${context}:`, error);
    
    if (typeof gtag === 'function') {
      gtag('event', 'exception', {
        description: `${context}: ${error.message || error}`,
        fatal: false
      });
    }
  }

  // Cleanup and destroy
  destroy() {
    console.log('Cleaning up dashboard...');
    
    // Run all cleanup tasks
    this.cleanupTasks.forEach(task => {
      try {
        task();
      } catch (error) {
        console.warn('Cleanup task failed:', error);
      }
    });
    
    // Destroy modules
    this.dataService?.destroy();
    this.chartRenderer?.destroy();
    this.state?.destroy();
    this.renderQueue?.clear();
    
    // Clear references
    this.eventHandlers.clear();
    this.cleanupTasks = [];
    this.isInitialized = false;
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.wnbaDashboard = new WNBADashboard();
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (window.wnbaDashboard) {
      window.wnbaDashboard.destroy();
    }
  });
});

// Team comparison UI and visualization
class ComparisonRenderer {
  constructor(container, stateManager, comparisonEngine) {
    this.container = container;
    this.state = stateManager;
    this.engine = comparisonEngine;
    this.currentRadarId = null;
    this.cleanupTasks = [];
  }

  // Main render method
  render(teamAName, teamBName) {
    if (!teamAName || !teamBName || teamAName === teamBName) {
      this.renderEmptyState();
      return;
    }

    const data = this.state.getState('data');
    const teamA = data.find(t => (t['TEAM NAME'] || t.TEAM) === teamAName);
    const teamB = data.find(t => (t['TEAM NAME'] || t.TEAM) === teamBName);

    if (!teamA || !teamB) {
      this.renderError('Teams not found');
      return;
    }

    const analytics = this.engine.compareTeams(teamAName, teamBName);
    this.renderComparison(teamAName, teamBName, teamA, teamB, analytics);
  }

  // Render empty state
  renderEmptyState() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div style="text-align:center;padding:60px 20px;color:#666;">
        <i class="fas fa-chart-bar" style="font-size:48px;margin-bottom:20px;color:#FFD700;"></i>
        <p style="font-size:18px;">Select two teams to compare</p>
      </div>
    `;
  }

  // Render error state
  renderError(message) {
    if (!this.container) return;
    this.container.innerHTML = `
      <div style="text-align:center;padding:60px 20px;color:#ff6b6b;">
        <i class="fas fa-exclamation-triangle" style="font-size:48px;margin-bottom:20px;"></i>
        <p style="font-size:18px;">${Utils.escapeHtml(message)}</p>
      </div>
    `;
  }

  // Render full comparison
  renderComparison(teamAName, teamBName, teamA, teamB, analytics) {
    if (!this.container) return;

    this.cleanup();
    this.container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'comparison-content';

    // Build all sections
    wrapper.appendChild(this.buildHeader(teamAName, teamBName, analytics));
    wrapper.appendChild(this.buildStrengthsSection(teamAName, teamBName, analytics));
    wrapper.appendChild(this.buildStatsSection(teamAName, teamBName, teamA, teamB));
    wrapper.appendChild(this.buildRadarSection(teamAName, teamBName, teamA, teamB));
    wrapper.appendChild(this.buildXFactorsSection(teamAName, teamBName, teamA, teamB));
    wrapper.appendChild(this.buildMomentumSection(teamAName, teamBName));
    wrapper.appendChild(this.buildBettingSection(analytics));

    this.container.appendChild(wrapper);

    // Add interaction effects
    this.addInteractionEffects();

    // Render radar chart after DOM update
    setTimeout(() => {
      this.renderRadarChart(teamAName, teamBName, teamA, teamB);
    }, 100);
  }

  // Build header with ratings
  buildHeader(teamAName, teamBName, analytics) {
    const header = document.createElement('div');
    header.className = 'comparison-header';
    
    header.innerHTML = `
      <div class="team-info">
        <h3 style="color:#FFD700;margin-bottom:8px;font-size:20px;">
          ${Utils.escapeHtml(teamAName)}
        </h3>
        <div style="font-size:2.5em;font-weight:900;color:#FFA500;
                    text-shadow:0 0 10px rgba(255,165,0,0.3);">
          ${analytics.teamA.overallRating}/99
        </div>
      </div>
      
      <div class="vs-section">
        <div style="font-size:1.8em;font-weight:700;color:#FF6B35;margin-bottom:8px;">
          VS
        </div>
        <div style="background:${this.getConfidenceColor(analytics.confidenceLevel.level)};
                    color:#000;padding:4px 12px;border-radius:20px;
                    font-size:11px;font-weight:700;text-transform:uppercase;">
          ${analytics.confidenceLevel.level} Confidence
        </div>
      </div>
      
      <div class="team-info">
        <h3 style="color:#FF6B35;margin-bottom:8px;font-size:20px;">
          ${Utils.escapeHtml(teamBName)}
        </h3>
        <div style="font-size:2.5em;font-weight:900;color:#FF6B35;
                    text-shadow:0 0 10px rgba(255,107,53,0.3);">
          ${analytics.teamB.overallRating}/99
        </div>
      </div>
    `;
    
    return header;
  }

  // Build strengths section
  buildStrengthsSection(teamAName, teamBName, analytics) {
    const section = document.createElement('div');
    section.className = 'advantages-section';
    section.style.margin = '25px 0';

    const title = document.createElement('h4');
    title.textContent = 'Key Advantages & Strengths';
    title.style.cssText = `
      text-align:center;color:#FFD700;margin-bottom:20px;
      font-size:18px;text-transform:uppercase;letter-spacing:1px;
    `;
    section.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'advantages-grid';

    // Team A strengths
    const teamACard = this.createStrengthCard(
      teamAName,
      analytics.teamA.strengths || [],
      '#FFD700',
      'rgba(255,215,0,0.08)',
      'rgba(255,215,0,0.25)'
    );

    // Team B strengths
    const teamBCard = this.createStrengthCard(
      teamBName,
      analytics.teamB.strengths || [],
      '#FF6B35',
      'rgba(255,107,53,0.08)',
      'rgba(255,107,53,0.25)'
    );

    grid.appendChild(teamACard);
    grid.appendChild(teamBCard);
    section.appendChild(grid);

    return section;
  }

  // Create strength card
createStrengthCard(teamName, strengths, color, bgColor, borderColor) {
  const card = document.createElement('div');
  
  // Determine team class based on color
  const isTeamA = color === '#FFD700';
  const teamClass = isTeamA ? 'team-a' : 'team-b';
  const strengthClass = isTeamA ? 'team-a-strength' : 'team-b-strength';
  
  card.className = `advantage-card ${teamClass}`;
  card.style.cssText = `
    background:${bgColor};
    border:2px solid ${borderColor};
    border-radius:12px;
    padding:20px;
    transition:all 0.3s ease;
  `;

  const title = document.createElement('div');
  title.className = 'advantages-title';
  title.textContent = `${teamName} Strengths`;
  title.style.cssText = `
    font-weight:700;
    color:${color};
    margin-bottom:15px;
    font-size:16px;
  `;
  card.appendChild(title);

  strengths.slice(0, 3).forEach(strength => {
    const item = document.createElement('div');
    item.className = `strength-item ${strengthClass}`;
    item.style.cssText = `
      color:${color};
      margin-bottom:8px;
      padding:8px 12px;
      padding-left:28px;
      background:rgba(255,255,255,0.05);
      border-radius:6px;
      font-weight:500;
      font-size:14px;
      position:relative;
    `;
    item.textContent = strength;
    card.appendChild(item);
  });

  return card;
}

  // Build statistical edge section
  buildStatsSection(teamAName, teamBName, teamA, teamB) {
    const section = document.createElement('div');
    section.style.cssText = `
      margin:25px 0;
      background:rgba(26,26,26,0.6);
      border-radius:12px;
      padding:20px;
      border:1px solid rgba(255,215,0,0.2);
    `;

    const title = document.createElement('h4');
    title.innerHTML = '📊 STATISTICAL EDGE FINDER';
    title.style.cssText = `
      color:#FFD700;
      margin-bottom:15px;
      font-size:18px;
      text-transform:uppercase;
      letter-spacing:1px;
    `;
    section.appendChild(title);

    const grid = document.createElement('div');
    grid.style.cssText = `
      display:grid;
      grid-template-columns:repeat(auto-fit,minmax(200px,1fr));
      gap:12px;
      font-family:'Courier New',monospace;
      font-size:14px;
    `;

    const stats = [
      { label: 'Shooting', keyA: 'FG%', keyB: 'FG%' },
      { label: '3-Pointers', keyA: '3P%', keyB: '3P%' },
      { label: 'Turnovers', keyA: 'TOV', keyB: 'TOV', inverse: true },
      { label: 'Q4 Scoring', keyA: 'Q4', keyB: 'Q4' },
      { label: 'Steals', keyA: 'STL', keyB: 'STL' },
      { label: 'Rebounds', keyA: 'REB', keyB: 'REB' }
    ];

    stats.forEach(stat => {
      const valA = Utils.parseNumeric(teamA[stat.keyA]);
      const valB = Utils.parseNumeric(teamB[stat.keyB]);
      const edge = this.getEdgeIndicator(valA, valB, stat.inverse);

      const statDiv = document.createElement('div');
      statDiv.style.cssText = `
        color:#FFA500;
        padding:10px;
        background:rgba(255,165,0,0.05);
        border-radius:6px;
      `;
      statDiv.innerHTML = `
        <strong>${stat.label}:</strong> 
        ${valA.toFixed(1)} vs ${valB.toFixed(1)} ${edge}
      `;
      grid.appendChild(statDiv);
    });

    section.appendChild(grid);

    // Add verdict
    const verdict = this.generateVerdict(teamAName, teamBName, teamA, teamB);
    const verdictDiv = document.createElement('div');
    verdictDiv.style.cssText = `
      margin-top:15px;
      padding:12px;
      background:rgba(255,107,53,0.1);
      border-left:3px solid #FF6B35;
      border-radius:4px;
      color:#FFD700;
      font-weight:600;
      font-size:13px;
    `;
    verdictDiv.innerHTML = verdict;
    section.appendChild(verdictDiv);

    return section;
  }

  // Get edge indicator
  getEdgeIndicator(valA, valB, inverse = false) {
    const diff = inverse ? valB - valA : valA - valB;
    if (Math.abs(diff) < 0.5) return '⚖️';
    return diff > 0 ? '✓' : '⚠️';
  }

  // Generate verdict
  generateVerdict(teamAName, teamBName, teamA, teamB) {
    const tovA = Utils.parseNumeric(teamA.TOV);
    const tovB = Utils.parseNumeric(teamB.TOV);
    const q4A = Utils.parseNumeric(teamA.Q4);
    const q4B = Utils.parseNumeric(teamB.Q4);

    const tovDiff = Math.abs(tovA - tovB);
    const q4Diff = Math.abs(q4A - q4B);

    let verdict = '<strong>VERDICT:</strong> ';

    if (tovDiff > 1.0) {
      const better = tovA < tovB ? teamAName : teamBName;
      verdict += `${better}'s ball security edge creates extra possessions. `;
    }

    if (q4Diff > 1.5) {
      const stronger = q4A > q4B ? teamAName : teamBName;
      verdict += `${stronger}'s Q4 execution is a major advantage in close games.`;
    } else if (tovDiff < 1.0) {
      verdict += 'Teams are statistically balanced - execution decides the winner.';
    }

    return verdict;
  }

  // Build radar section
  buildRadarSection(teamAName, teamBName, teamA, teamB) {
    const section = document.createElement('div');
    section.className = 'radar-section';
    section.style.cssText = `
      margin: 30px 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    `;

    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
      max-width: 500px;
    `;

    const radarId = `radar-${Utils.generateId()}`;
    this.currentRadarId = radarId;

    const canvas = document.createElement('canvas');
    canvas.id = radarId;
    canvas.width = 400;
    canvas.height = 400;
    canvas.style.cssText = 'max-width:400px;max-height:400px;margin:0 auto;display:block;';
    wrapper.appendChild(canvas);
    section.appendChild(wrapper);

    return section;
  }

  // Render D3 radar chart
  renderRadarChart(teamAName, teamBName, teamA, teamB) {
    if (!this.currentRadarId) return;

    const mergedData = this.state.getState('mergedData');
    const leagueStats = this.state.getState('leagueStats');

    if (mergedData?.[teamAName] && mergedData?.[teamBName] && leagueStats) {
      this.renderComparisonRadar(this.currentRadarId, teamA, teamB);
    } else {
      this.renderComparisonRadar(this.currentRadarId, teamA, teamB);
    }
  }

  // Render enhanced radar with advanced metrics
  renderEnhancedRadar(teamAName, teamBName, mergedData, leagueStats) {
    const teamAData = mergedData[teamAName];
    const teamBData = mergedData[teamBName];

    const metrics = ['off_rtg', 'def_rtg', 'net_rtg', '3P%', 'reb_pct', 'tov_pct', 'ast_pct'];
    const labels = ['OFF RTG', 'DEF RTG', 'NET RTG', '3P%', 'REB%', 'TOV%', 'AST%'];
    const invertMetrics = new Set(['def_rtg', 'tov_pct']);

    const { minStats, maxStats } = leagueStats;

    const normalize = (val, metric) => {
      const min = minStats[metric];
      const max = maxStats[metric];
      if (!Number.isFinite(min) || !Number.isFinite(max) || max === min) return 50;

      let pct = (val - min) / (max - min);
      pct = Math.max(0, Math.min(1, pct));
      return Math.round((invertMetrics.has(metric) ? 1 - pct : pct) * 100);
    };

    const getValue = (team, metric) => {
      const fs = team.fullseason || {};
      const adv = team.advanced || {};
      return Utils.parseNumeric(fs[metric] ?? adv[metric]);
    };

    const valuesA = metrics.map(m => normalize(getValue(teamAData, m), m));
    const valuesB = metrics.map(m => normalize(getValue(teamBData, m), m));
    const origA = metrics.map(m => getValue(teamAData, m));
    const origB = metrics.map(m => getValue(teamBData, m));

    this.renderComparisonRadar(this.currentRadarId, teamA, teamB);
  }

  // Render basic radar with standard stats
  renderBasicRadar(teamAName, teamBName, teamA, teamB) {
    const data = this.state.getState('data');
    const metrics = ['PTS', 'FG%', '3P%', 'REB', 'AST', 'STL', 'TOV'];
    const labels = metrics.map(m => m.replace('%', ' %').toUpperCase());
    const invertMetrics = new Set(['TOV']);

    const mins = {};
    const maxs = {};

    metrics.forEach(m => {
      mins[m] = Infinity;
      maxs[m] = -Infinity;
    });

    data.forEach(row => {
      metrics.forEach(m => {
        const val = Utils.parseNumeric(row[m]);
        if (val < mins[m]) mins[m] = val;
        if (val > maxs[m]) maxs[m] = val;
      });
    });

    const normalize = (val, metric) => {
      const min = mins[metric];
      const max = maxs[metric];
      if (max === min) return 50;

      let pct = (val - min) / (max - min);
      if (invertMetrics.has(metric)) pct = 1 - pct;
      return Math.round(Math.max(0, Math.min(1, pct)) * 100);
    };

    const valuesA = metrics.map(m => normalize(Utils.parseNumeric(teamA[m]), m));
    const valuesB = metrics.map(m => normalize(Utils.parseNumeric(teamB[m]), m));
    const origA = metrics.map(m => Utils.parseNumeric(teamA[m]));
    const origB = metrics.map(m => Utils.parseNumeric(teamB[m]));

    this.renderComparisonRadar(this.currentRadarId, teamA, teamB);
  }


  // ============================================================================
  // CHART.JS RADAR IMPLEMENTATION (FIXED - WORKING VERSION)
  // ============================================================================
  
  renderComparisonRadar(canvasId, teamA, teamB) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.error('Radar canvas not found:', canvasId);
      return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Define metrics for comparison
    const metrics = ['PTS', 'FG%', '3P%', 'REB', 'AST', 'STL', 'TOV'];
    const invert = new Set(['TOV']); // Lower is better for turnovers
    
    // Calculate min/max for normalization
    const mins = {};
    const maxs = {};
    metrics.forEach((m) => {
      mins[m] = Number.POSITIVE_INFINITY;
      maxs[m] = Number.NEGATIVE_INFINITY;
    });
    
    // Get all data for proper scaling
    const allData = this.state.getState('data') || [];
    allData.forEach((row) => {
      metrics.forEach((m) => {
        const raw = row[m];
        const num = raw == null ? 0 : parseFloat(String(raw).replace('%', ''));
        if (!isNaN(num)) {
          if (num < mins[m]) mins[m] = num;
          if (num > maxs[m]) maxs[m] = num;
        }
      });
    });
    
    // Normalization function (0-100 scale)
    const normalise = (val, min, max, invertMetric) => {
      if (!isFinite(min) || !isFinite(max) || max === min) return 50;
      let pct = (val - min) / (max - min);
      if (invertMetric) pct = 1 - pct;
      return Math.round(Math.max(0, Math.min(1, pct)) * 100);
    };
    
    // Convert team data to normalized values
    const toValues = (team) => {
      return metrics.map((m) => {
        const raw = team[m];
        const val = raw == null ? 0 : parseFloat(String(raw).replace('%', ''));
        return normalise(val || 0, mins[m], maxs[m], invert.has(m));
      });
    };
    
    const valuesA = toValues(teamA);
    const valuesB = toValues(teamB);
    
    // Get team names
    const teamAName = teamA['TEAM NAME'] || teamA['TEAM'] || teamA.name || 'Team A';
    const teamBName = teamB['TEAM NAME'] || teamB['TEAM'] || teamB.name || 'Team B';
    
    // Destroy existing chart instance
    if (!this._radarCharts) this._radarCharts = {};
    const existing = this._radarCharts[canvasId];
    if (existing) {
      existing.destroy();
    }
    
    // Chart.js color configurations
    const colorA = 'rgba(255,215,0,'; // Gold for Team A
    const colorB = 'rgba(255,107,53,'; // Orange for Team B
    
    // Create new Chart.js radar chart
    this._radarCharts[canvasId] = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: metrics,
        datasets: [
          {
            label: teamAName,
            data: valuesA,
            backgroundColor: colorA + '0.15)',
            borderColor: colorA + '0.9)',
            borderWidth: 2,
            pointBackgroundColor: colorA + '1)',
            pointBorderColor: '#0a0a0a',
            pointRadius: 3,
            pointHoverRadius: 5
          },
          {
            label: teamBName,
            data: valuesB,
            backgroundColor: colorB + '0.15)',
            borderColor: colorB + '0.9)',
            borderWidth: 2,
            pointBackgroundColor: colorB + '1)',
            pointBorderColor: '#0a0a0a',
            pointRadius: 3,
            pointHoverRadius: 5
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: '#FFD700',
              font: { 
                family: 'Rajdhani, sans-serif', 
                size: 12, 
                weight: '600' 
              }
            }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const metric = metrics[ctx.dataIndex];
                const team = ctx.dataset.label === teamAName ? teamA : teamB;
                const raw = team[metric] ?? '';
                return `${ctx.dataset.label}: ${raw} (Score: ${ctx.raw})`;
              }
            },
            backgroundColor: 'rgba(0,0,0,0.8)',
            titleColor: '#FFD700',
            bodyColor: '#FFFFFF',
            bodyFont: { 
              family: 'Inter, sans-serif', 
              weight: '600', 
              size: 11 
            },
            titleFont: { 
              family: 'Rajdhani, sans-serif', 
              weight: '700', 
              size: 12 
            }
          }
        },
        scales: {
          r: {
            beginAtZero: true,
            min: 0,
            max: 100,
            ticks: {
              stepSize: 20,
              showLabelBackdrop: false,
              color: 'rgba(255,215,0,0.7)',
              font: { 
                family: 'Inter, sans-serif', 
                size: 10 
              }
            },
            grid: {
              color: 'rgba(255,215,0,0.15)'
            },
            angleLines: {
              color: 'rgba(255,215,0,0.25)'
            },
            // ⭐ THIS IS THE KEY FIX - pointLabels configuration for visible labels
            pointLabels: {
              color: '#FFD700',
              font: { 
                family: 'Rajdhani, sans-serif', 
                weight: '700', 
                size: 12 
              }
            }
          }
        }
      }
    });
  }


  // NOTE: D3 radar methods below are deprecated in favor of Chart.js
    // Core D3 radar rendering
  renderD3Radar(labels, normA, normB, origA, origB, teamAName, teamBName) {
    if (typeof d3 === 'undefined') {
      console.error('D3.js not loaded');
      return;
    }

    const containerId = this.currentRadarId;
    const container = d3.select(`#${containerId}`);
    container.selectAll('*').remove();

    const containerNode = container.node();
    if (!containerNode) return;

    const width = containerNode.clientWidth || 450;
    const height = containerNode.clientHeight || 450;
    const size = Math.min(width, height, 450);
    const isMobile = size < 350;

    const padding = 70;
    const svg = container.append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `${-padding} ${-padding} ${size + padding * 2} ${size + padding * 2}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .style('max-width', '500px')
      .style('margin', '0 auto')
      .style('display', 'block');

    const g = svg.append('g')
      .attr('transform', `translate(${size / 2}, ${size / 2})`);

    const radius = size / 2 * 0.65;
    const angleSlice = (Math.PI * 2) / labels.length;
    const levels = 5;
    const fontSize = isMobile ? 9 : 13;

    // Grid
    for (let level = 1; level <= levels; level++) {
      const r = radius * (level / levels);
      g.append('circle')
        .attr('r', r)
        .attr('fill', 'none')
        .attr('stroke', level === levels ? 'rgba(255,215,0,0.4)' : `rgba(255,215,0,${0.15 + level * 0.05})`)
        .attr('stroke-width', level === levels ? 2 : 1);
    }

    // Draw axis lines
    labels.forEach((label, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const lineEnd = {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius
      };

      g.append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', lineEnd.x)
        .attr('y2', lineEnd.y)
        .attr('stroke', 'rgba(255,215,0,0.3)')
        .attr('stroke-width', 1.5);
    });


    // Gradients
    const defs = svg.append('defs');
    
    const gradA = defs.append('radialGradient')
      .attr('id', `grad-a-${containerId}`);
    gradA.append('stop').attr('offset', '0%').attr('stop-color', '#FFD700').attr('stop-opacity', 0.4);
    gradA.append('stop').attr('offset', '100%').attr('stop-color', '#FF8C00').attr('stop-opacity', 0.1);

    const gradB = defs.append('radialGradient')
      .attr('id', `grad-b-${containerId}`);
    gradB.append('stop').attr('offset', '0%').attr('stop-color', '#FF6B35').attr('stop-opacity', 0.4);
    gradB.append('stop').attr('offset', '100%').attr('stop-color', '#DC143C').attr('stop-opacity', 0.1);

    // Radar line generator
    const radarLine = d3.lineRadial()
      .curve(d3.curveCardinalClosed.tension(0.4))
      .radius(d => (d.norm / 100) * radius)
      .angle((d, i) => i * angleSlice);

    const dataA = normA.map((n, i) => ({ norm: n, orig: origA[i], label: labels[i] }));
    const dataB = normB.map((n, i) => ({ norm: n, orig: origB[i], label: labels[i] }));

    // Draw areas
    g.append('path')
      .datum(dataA)
      .attr('fill', `url(#grad-a-${containerId})`)
      .attr('stroke', '#FFD700')
      .attr('stroke-width', 3)
      .attr('opacity', 0.8)
      .attr('d', radarLine);

    g.append('path')
      .datum(dataB)
      .attr('fill', `url(#grad-b-${containerId})`)
      .attr('stroke', '#FF6B35')
      .attr('stroke-width', 2.5)
      .attr('opacity', 0.8)
      .attr('d', radarLine);


    // Draw labels LAST with background boxes for visibility
    labels.forEach((label, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const labelDistance = radius * 1.5;
      const labelPos = {
        x: Math.cos(angle) * labelDistance,
        y: Math.sin(angle) * labelDistance
      };

      const displayLabel = label.length > 8 && isMobile ? label.slice(0, 6) + '...' : label;

      // Calculate box dimensions
      const boxPadding = 6;
      const textWidth = displayLabel.length * (fontSize * 0.7);
      const textHeight = fontSize * 1.3;

      // Draw background box CENTERED on labelPos
      g.append('rect')
        .attr('x', labelPos.x - textWidth / 2 - boxPadding)
        .attr('y', labelPos.y - textHeight / 2 - boxPadding)
        .attr('width', textWidth + boxPadding * 2)
        .attr('height', textHeight + boxPadding * 2)
        .attr('fill', 'rgba(0,0,0,0.9)')
        .attr('stroke', 'rgba(255,215,0,0.3)')
        .attr('stroke-width', 1)
        .attr('rx', 4);

      // Draw text CENTERED on labelPos
      g.append('text')
        .attr('x', labelPos.x)
        .attr('y', labelPos.y)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .attr('fill', '#FFD700')
        .attr('font-size', fontSize + 'px')
        .attr('font-weight', 700)
        .attr('font-family', 'Rajdhani, sans-serif')
        .text(displayLabel);
    });


    // Add points with tooltips
    this.addRadarPoints(g, dataA, dataB, angleSlice, radius, teamAName, teamBName, containerId);
    
    // Add legend
    this.addRadarLegend(containerId, teamAName, teamBName);
  }

  // Add radar chart points with tooltips
  addRadarPoints(g, dataA, dataB, angleSlice, radius, teamAName, teamBName, containerId) {
    const tooltip = d3.select('body').append('div')
      .attr('class', 'radar-tooltip')
      .style('opacity', 0)
      .style('position', 'fixed')
      .style('z-index', '999999')
      .style('pointer-events', 'none')
      .style('background', 'rgba(10,10,10,0.95)')
      .style('padding', '10px 14px')
      .style('border-radius', '8px')
      .style('border', '1px solid rgba(255,215,0,0.3)')
      .style('color', '#fff')
      .style('font-family', 'Rajdhani, sans-serif')
      .style('font-size', '13px')
      .style('font-weight', '600')
      .style('box-shadow', '0 4px 12px rgba(0,0,0,0.5)')
      .style('backdrop-filter', 'blur(10px)')
      .style('white-space', 'nowrap');

    this.cleanupTasks.push(() => tooltip.remove());

    const showTooltip = (event, d, teamName, color) => {
      // Get viewport dimensions for smart positioning
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Calculate tooltip dimensions (approximate)
      const tooltipWidth = 180;
      const tooltipHeight = 70;
      
      // Calculate position using clientX/Y for fixed positioning
      let left = event.clientX + 15;
      let top = event.clientY - 28;
      
      // Adjust if tooltip would go off screen
      if (left + tooltipWidth > viewportWidth) {
        left = event.clientX - tooltipWidth - 15;
      }
      if (top < 0) {
        top = event.clientY + 15;
      }
      if (top + tooltipHeight > viewportHeight) {
        top = viewportHeight - tooltipHeight - 10;
      }
      
      tooltip.transition()
        .duration(150)
        .style('opacity', 1);
      
      tooltip.html(`
        <div style="margin-bottom: 4px;">
          <strong style="color:${color}; font-size: 14px;">${teamName}</strong>
        </div>
        <div style="color: #FFA500;">
          ${d.label}: <span style="color: #FFD700; font-weight: 700;">${d.orig.toFixed(1)}</span>
        </div>
      `)
        .style('left', left + 'px')
        .style('top', top + 'px');
    };

    const hideTooltip = () => {
      tooltip.transition().duration(200).style('opacity', 0);
    };

    [
      { data: dataA, color: '#FFD700', team: teamAName },
      { data: dataB, color: '#FF6B35', team: teamBName }
    ].forEach(({ data, color, team }) => {
      data.forEach((d, i) => {
        const angle = angleSlice * i - Math.PI / 2;
        const r = (d.norm / 100) * radius;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;

        g.append('circle')
          .attr('class', `${team.replace(/\s+/g, '-').toLowerCase()}-point`)
          .attr('cx', x)
          .attr('cy', y)
          .attr('r', 5)
          .attr('fill', color)
          .attr('stroke', '#0a0a0a')
          .attr('stroke-width', 2)
          .style('cursor', 'pointer')
          .style('transition', 'all 0.3s ease')
          .on('mouseover', function(event) {
            d3.select(this)
              .transition()
              .duration(200)
              .attr('r', 7)
              .attr('stroke-width', 3);
            showTooltip(event, d, team, color);
          })
          .on('mouseout', function() {
            d3.select(this)
              .transition()
              .duration(200)
              .attr('r', 5)
              .attr('stroke-width', 2);
            hideTooltip();
          });
      });
    });
  }

  // Add radar legend
  addRadarLegend(containerId, teamAName, teamBName) {
    const radarContainerElem = document.getElementById(containerId);
    const parentWrapper = radarContainerElem.parentElement;

    const existingLegend = parentWrapper.querySelector('.radar-legend');
    if (existingLegend) existingLegend.remove();

    const legendDiv = document.createElement('div');
    legendDiv.className = 'radar-legend';
    legendDiv.style.cssText = `
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 40px;
      margin-bottom: 20px;
      width: 100%;
      font-family: Rajdhani, sans-serif;
    `;

    const createLegendItem = (teamName, color) => {
      const leg = document.createElement('div');
      leg.style.cssText = 'display: flex; align-items: center; gap: 8px;';
      leg.innerHTML = `<div style="width: 12px; height: 12px; background: ${color}; border-radius: 2px;"></div>
                       <span style="color: ${color}; font-weight: 600; font-size: 14px;">${teamName}</span>`;
      return leg;
    };

    legendDiv.appendChild(createLegendItem(teamAName, '#FFD700'));
    legendDiv.appendChild(createLegendItem(teamBName, '#FF6B35'));

    parentWrapper.insertBefore(legendDiv, radarContainerElem);
  }

  // Build X-factors section
  buildXFactorsSection(teamAName, teamBName, teamA, teamB) {
    const section = document.createElement('div');
    section.style.cssText = `
      margin:25px 0;
      background:rgba(26,26,26,0.6);
      border-radius:12px;
      padding:20px;
      border:1px solid rgba(255,215,0,0.2);
    `;

    const title = document.createElement('h4');
    title.innerHTML = '🔥 GAME-DECIDING X-FACTORS';
    title.style.cssText = `
      color:#FFD700;
      margin-bottom:15px;
      font-size:18px;
      text-transform:uppercase;
      letter-spacing:1px;
    `;
    section.appendChild(title);

    const factors = this.generateXFactors(teamAName, teamBName, teamA, teamB);
    
    const list = document.createElement('div');
    list.style.cssText = 'color:#FFA500;line-height:1.8;font-size:14px;';
    
    factors.forEach((factor, i) => {
      const item = document.createElement('div');
      item.style.marginBottom = '10px';
      item.innerHTML = `${i + 1}. ${factor}`;
      list.appendChild(item);
    });

    section.appendChild(list);
    return section;
  }

  // Generate X-factors
  generateXFactors(teamAName, teamBName, teamA, teamB) {
    const factors = [];
    
    const q4A = Utils.parseNumeric(teamA.Q4);
    const q4B = Utils.parseNumeric(teamB.Q4);
    const tovA = Utils.parseNumeric(teamA.TOV);
    const tovB = Utils.parseNumeric(teamB.TOV);

    if (Math.abs(q4A - q4B) > 1.5) {
      const leader = q4A > q4B ? teamAName : teamBName;
      factors.push(`<strong>${leader}'s 4th Quarter Dominance</strong> - proven closer in crunch time`);
    }

    if (Math.abs(tovA - tovB) > 1.0) {
      const better = tovA < tovB ? teamAName : teamBName;
      factors.push(`<strong>${better}'s Ball Security</strong> - creates extra possessions`);
    }

    const tpA = Utils.parseNumeric(teamA['3P%']);
    const tpB = Utils.parseNumeric(teamB['3P%']);
    const avgThree = (tpA + tpB) / 2;

    if (avgThree > 32) {
      factors.push(`<strong>Three-Point Variance</strong> - hot shooting determines outcome`);
    }

    if (factors.length === 0) {
      factors.push(`<strong>Balanced Matchup</strong> - execution decides the winner`);
    }

    return factors;
  }

  // Build momentum section
  buildMomentumSection(teamAName, teamBName) {
    const mergedData = this.state.getState('mergedData');
    
    if (!mergedData?.[teamAName] || !mergedData?.[teamBName]) {
      return document.createElement('div');
    }

    const section = document.createElement('div');
    section.style.cssText = `
      margin:25px 0;
      background:rgba(26,26,26,0.6);
      border-radius:12px;
      padding:20px;
      border:1px solid rgba(255,215,0,0.2);
    `;

    const title = document.createElement('h4');
    title.innerHTML = '🔄 MOMENTUM CHECK';
    title.style.cssText = `
      color:#FFD700;
      margin-bottom:15px;
      font-size:18px;
      text-transform:uppercase;
      letter-spacing:1px;
    `;
    section.appendChild(title);

    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:15px;';

    [
      { name: teamAName, color: '#FFD700', borderColor: '#FFD700' },
      { name: teamBName, color: '#FF6B35', borderColor: '#FF6B35' }
    ].forEach(({ name, color, borderColor }) => {
      const teamData = mergedData[name];
      const fs = teamData.fullseason || {};
      const lf = teamData.lastfive || {};

      const recentPts = Utils.parseNumeric(lf.PTS);
      const seasonPts = Utils.parseNumeric(fs.PTS);
      const trend = recentPts - seasonPts;

      const card = document.createElement('div');
      card.style.cssText = `
        padding:12px;
        background:rgba(255,255,255,0.03);
        border-radius:8px;
        border-left:3px solid ${borderColor};
      `;

      card.innerHTML = `
        <div style="color:${color};font-weight:700;margin-bottom:8px;">${Utils.escapeHtml(name)} (Last 5)</div>
        <div style="color:#FFA500;font-size:13px;line-height:1.6;">
          ${recentPts > 0 ? `Scoring: ${recentPts.toFixed(1)} PPG (${trend >= 0 ? '+' : ''}${trend.toFixed(1)})` : 'Limited data'}
        </div>
      `;

      grid.appendChild(card);
    });

    section.appendChild(grid);
    return section;
  }

  // Build betting section
  buildBettingSection(analytics) {
    const section = document.createElement('div');
    section.style.cssText = `
      margin:25px 0 10px;
      background:linear-gradient(135deg,rgba(26,26,26,0.9),rgba(40,40,40,0.8));
      border-radius:12px;
      padding:20px;
      border:2px solid rgba(255,107,53,0.3);
      box-shadow:0 4px 15px rgba(0,0,0,0.3);
    `;

    const title = document.createElement('h4');
    title.innerHTML = '💰 BETTING ANGLES';
    title.style.cssText = `
      color:#FF6B35;
      margin-bottom:15px;
      font-size:18px;
      text-transform:uppercase;
      letter-spacing:1px;
      text-align:center;
    `;
    section.appendChild(title);

    const content = document.createElement('div');
    content.style.cssText = 'color:#FFD700;line-height:1.8;font-size:14px;font-weight:500;';
    
    const insights = analytics.bettingInsights || [
      'Betting analysis requires full dataset'
    ];
    
    content.innerHTML = insights.join('<br><br>');
    section.appendChild(content);

    return section;
  }

  // Get confidence color
  getConfidenceColor(level) {
    const colors = {
      'Very High': 'linear-gradient(135deg,#4CAF50,#8BC34A)',
      'High': 'linear-gradient(135deg,#4CAF50,#8BC34A)',
      'Medium': 'linear-gradient(135deg,#FF9800,#FFC107)',
      'Low': 'linear-gradient(135deg,#757575,#9E9E9E)'
    };
    return colors[level] || colors['Medium'];
  }

  // Add interaction effects
  addInteractionEffects() {
    setTimeout(() => {
      const cards = this.container.querySelectorAll('.advantage-card');
      cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
          this.style.transform = 'translateY(-2px)';
          this.style.boxShadow = '0 8px 25px rgba(255,215,0,0.15)';
        });
        
        card.addEventListener('mouseleave', function() {
          this.style.transform = 'translateY(0)';
          this.style.boxShadow = 'none';
        });
      });
    }, 100);
  }

  // Cleanup
  cleanup() {
    this.cleanupTasks.forEach(task => {
      try {
        task();
      } catch (error) {
        console.warn('Cleanup task failed:', error);
      }
    });
    this.cleanupTasks = [];
    this.currentRadarId = null;

    // Destroy Chart.js instances
    if (this._radarCharts) {
      Object.values(this._radarCharts).forEach(chart => {
        if (chart && typeof chart.destroy === 'function') {
          chart.destroy();
        }
      });
      this._radarCharts = {};
    }
    
    // Remove any lingering D3 tooltips (if D3 is still used elsewhere)
    if (typeof d3 !== 'undefined') {
      d3.selectAll('[class^="radar-tooltip-"]').remove();
    }
  }
}