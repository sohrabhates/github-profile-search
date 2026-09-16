/**
 * DevFinder - GitHub Profile Search & Repository Explorer
 * Modular, vanilla JavaScript implementation with GitHub REST API integration.
 */

// =============================================================================
// Constants & Configuration
// =============================================================================
const GITHUB_API_BASE = 'https://api.github.com/users';
const STORAGE_THEME_KEY = 'devfinder_theme';

// GitHub Primary Programming Language Colors Mapping
const LANGUAGE_COLORS = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Java: '#b07219',
  'C++': '#f34b7d',
  'C#': '#178600',
  C: '#555555',
  Go: '#00ADD8',
  Rust: '#dea584',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  HTML: '#e34c26',
  CSS: '#563d7c',
  SCSS: '#c6538c',
  Vue: '#41b883',
  Shell: '#89e051',
  JupyterNotebook: '#DA5B0B',
  R: '#198CE7',
  Default: '#8b949e'
};

// =============================================================================
// DOM Elements
// =============================================================================
const dom = {
  // Theme Toggle
  htmlRoot: document.documentElement,
  themeToggleBtn: document.getElementById('themeToggleBtn'),
  themeLabel: document.getElementById('themeLabel'),

  // Search Controls
  searchForm: document.getElementById('searchForm'),
  usernameInput: document.getElementById('usernameInput'),
  clearInputBtn: document.getElementById('clearInputBtn'),
  searchBtn: document.getElementById('searchBtn'),
  suggestionChips: document.querySelectorAll('.chip'),

  // View States
  initialState: document.getElementById('initialState'),
  loadingState: document.getElementById('loadingState'),
  errorState: document.getElementById('errorState'),
  resultState: document.getElementById('resultState'),

  // Error Card Elements
  errorTitle: document.getElementById('errorTitle'),
  errorMessage: document.getElementById('errorMessage'),
  errorRetryBtn: document.getElementById('errorRetryBtn'),

  // Profile Card Elements
  userAvatar: document.getElementById('userAvatar'),
  userName: document.getElementById('userName'),
  userLogin: document.getElementById('userLogin'),
  userLoginLink: document.getElementById('userLoginLink'),
  userJoined: document.getElementById('userJoined'),
  userBio: document.getElementById('userBio'),
  userReposCount: document.getElementById('userReposCount'),
  userFollowersCount: document.getElementById('userFollowersCount'),
  userFollowingCount: document.getElementById('userFollowingCount'),
  userLocation: document.getElementById('userLocation'),
  metaLocation: document.getElementById('metaLocation'),
  userBlog: document.getElementById('userBlog'),
  metaBlog: document.getElementById('metaBlog'),
  userTwitter: document.getElementById('userTwitter'),
  metaTwitter: document.getElementById('metaTwitter'),
  userCompany: document.getElementById('userCompany'),
  metaCompany: document.getElementById('metaCompany'),
  userGitHubBtn: document.getElementById('userGitHubBtn'),

  // Repositories Section Elements
  tabTopRepos: document.getElementById('tabTopRepos'),
  tabAllRepos: document.getElementById('tabAllRepos'),
  allReposCount: document.getElementById('allReposCount'),
  repoToolbar: document.getElementById('repoToolbar'),
  repoSearchInput: document.getElementById('repoSearchInput'),
  clearRepoSearchBtn: document.getElementById('clearRepoSearchBtn'),
  repoLangFilter: document.getElementById('repoLangFilter'),
  repoSortSelect: document.getElementById('repoSortSelect'),
  reposGrid: document.getElementById('reposGrid'),
  repoCountDisplay: document.getElementById('repoCountDisplay'),
  loadMoreContainer: document.getElementById('loadMoreContainer'),
  loadMoreBtn: document.getElementById('loadMoreBtn'),
  noMatchingReposMessage: document.getElementById('noMatchingReposMessage'),
  noMatchingReposText: document.getElementById('noMatchingReposText'),
  resetRepoFiltersBtn: document.getElementById('resetRepoFiltersBtn'),
  noReposMessage: document.getElementById('noReposMessage')
};

// =============================================================================
// Application State
// =============================================================================
const repoState = {
  rawRepos: [],
  totalPublicRepos: 0,
  viewMode: 'top4', // 'top4' | 'all'
  searchQuery: '',
  selectedLanguage: 'all',
  selectedSort: 'popular', // 'popular' | 'stars' | 'forks' | 'updated' | 'name'
  displayLimit: 8
};

// =============================================================================
// Helper Utilities
// =============================================================================

/**
 * Safely escape HTML characters to prevent XSS.
 * @param {string} str - Raw string
 * @returns {string} Escaped HTML string
 */
function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Format numbers with compact notation (e.g. 1.2k, 4.5M).
 * @param {number} num - Raw number
 * @returns {string} Formatted number string
 */
function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(num);
}

/**
 * Format ISO date string into readable format (e.g., "24 May 2011").
 * @param {string} isoString - Date in ISO format
 * @returns {string} Formatted date
 */
function formatDate(isoString) {
  if (!isoString) return 'Not available';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return 'Not available';
  
  const options = { day: 'numeric', month: 'short', year: 'numeric' };
  return date.toLocaleDateString('en-GB', options);
}

/**
 * Clean URLs for display and safe external hrefs.
 * @param {string} url - Blog or website URL
 * @returns {string} Normalized URL
 */
function normalizeUrl(url) {
  if (!url) return '';
  let trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }
  return trimmed;
}

// =============================================================================
// Theme Management
// =============================================================================

/**
 * Apply the selected theme to the DOM and persist in localStorage.
 * @param {'dark' | 'light'} theme
 */
function applyTheme(theme) {
  dom.htmlRoot.setAttribute('data-theme', theme);
  if (dom.themeLabel) {
    dom.themeLabel.textContent = theme === 'dark' ? 'Dark' : 'Light';
  }
  localStorage.setItem(STORAGE_THEME_KEY, theme);
}

/**
 * Initialize theme based on localStorage or system preferences.
 */
function initTheme() {
  const savedTheme = localStorage.getItem(STORAGE_THEME_KEY);
  if (savedTheme === 'dark' || savedTheme === 'light') {
    applyTheme(savedTheme);
  } else {
    // System color scheme detection
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? 'dark' : 'light');
  }
}

/**
 * Toggle between light and dark modes.
 */
function toggleTheme() {
  const currentTheme = dom.htmlRoot.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
}

// =============================================================================
// State Management
// =============================================================================

/**
 * Show a specific state view while hiding others.
 * @param {'initial' | 'loading' | 'error' | 'result'} activeState
 */
function setActiveState(activeState) {
  dom.initialState.classList.add('hidden');
  dom.loadingState.classList.add('hidden');
  dom.errorState.classList.add('hidden');
  dom.resultState.classList.add('hidden');

  switch (activeState) {
    case 'initial':
      dom.initialState.classList.remove('hidden');
      break;
    case 'loading':
      dom.loadingState.classList.remove('hidden');
      break;
    case 'error':
      dom.errorState.classList.remove('hidden');
      break;
    case 'result':
      dom.resultState.classList.remove('hidden');
      break;
  }
}

/**
 * Display a structured, friendly error state.
 * @param {string} title - Error heading
 * @param {string} message - Descriptive error message
 */
function showErrorState(title, message) {
  dom.errorTitle.textContent = title;
  dom.errorMessage.textContent = message;
  setActiveState('error');
}

// =============================================================================
// Repository Ranking Algorithm
// =============================================================================

/**
 * Calculate popularity and rank user repositories.
 * Formula: Combined popularity score = (Stars * 2) + Forks
 * Tie breakers: Stargazers count, Forks count, Most recently updated.
 * 
 * @param {Array<Object>} repos - Array of raw repository objects from GitHub API
 * @returns {Array<Object>} Top 4 ranked repositories
 */
function rankRepositories(repos) {
  if (!Array.isArray(repos) || repos.length === 0) {
    return [];
  }

  // Sort descending by calculated popularity score
  const sortedRepos = [...repos].sort((a, b) => {
    const starsA = Number(a.stargazers_count) || 0;
    const forksA = Number(a.forks_count) || 0;
    const scoreA = (starsA * 2) + forksA;

    const starsB = Number(b.stargazers_count) || 0;
    const forksB = Number(b.forks_count) || 0;
    const scoreB = (starsB * 2) + forksB;

    // Primary ranking: Popularity score
    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }

    // Tie-breaker 1: Highest star count
    if (starsB !== starsA) {
      return starsB - starsA;
    }

    // Tie-breaker 2: Highest fork count
    if (forksB !== forksA) {
      return forksB - forksA;
    }

    // Tie-breaker 3: Most recently updated repository
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  // Extract top 4
  return sortedRepos.slice(0, 4);
}

// =============================================================================
// Repository Search, Filter & Sort Processing
// =============================================================================

/**
 * Populate the language filter select dropdown based on loaded repositories.
 * @param {Array<Object>} repos
 */
function populateLanguageFilter(repos) {
  const languageCounts = {};
  
  repos.forEach((repo) => {
    const lang = repo.language || 'Plain Text';
    languageCounts[lang] = (languageCounts[lang] || 0) + 1;
  });

  const sortedLanguages = Object.keys(languageCounts).sort((a, b) => a.localeCompare(b));

  dom.repoLangFilter.innerHTML = '<option value="all">All Languages</option>';
  sortedLanguages.forEach((lang) => {
    const option = document.createElement('option');
    option.value = lang.toLowerCase();
    option.textContent = `${lang} (${languageCounts[lang]})`;
    dom.repoLangFilter.appendChild(option);
  });

  dom.repoLangFilter.value = repoState.selectedLanguage;
}

/**
 * Filter and sort repositories according to current state.
 * @returns {Array<Object>} Filtered and sorted repositories
 */
function getFilteredAndSortedRepos() {
  let list = [...repoState.rawRepos];

  // 1. In-profile Search Query Filter
  if (repoState.searchQuery) {
    const query = repoState.searchQuery.toLowerCase();
    list = list.filter((repo) => {
      const nameMatch = (repo.name || '').toLowerCase().includes(query);
      const descMatch = (repo.description || '').toLowerCase().includes(query);
      const langMatch = (repo.language || '').toLowerCase().includes(query);
      const topicsMatch = Array.isArray(repo.topics) && repo.topics.some(t => t.toLowerCase().includes(query));
      return nameMatch || descMatch || langMatch || topicsMatch;
    });
  }

  // 2. Language Filter
  if (repoState.selectedLanguage && repoState.selectedLanguage !== 'all') {
    list = list.filter((repo) => {
      const lang = (repo.language || 'Plain Text').toLowerCase();
      return lang === repoState.selectedLanguage.toLowerCase();
    });
  }

  // 3. Sorting
  list.sort((a, b) => {
    const starsA = Number(a.stargazers_count) || 0;
    const starsB = Number(b.stargazers_count) || 0;
    const forksA = Number(a.forks_count) || 0;
    const forksB = Number(b.forks_count) || 0;

    switch (repoState.selectedSort) {
      case 'stars':
        return starsB !== starsA ? starsB - starsA : forksB - forksA;

      case 'forks':
        return forksB !== forksA ? forksB - forksA : starsB - starsA;

      case 'updated':
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();

      case 'name':
        return (a.name || '').localeCompare(b.name || '');

      case 'popular':
      default: {
        const scoreA = (starsA * 2) + forksA;
        const scoreB = (starsB * 2) + forksB;
        if (scoreB !== scoreA) return scoreB - scoreA;
        if (starsB !== starsA) return starsB - starsA;
        if (forksB !== forksA) return forksB - forksA;
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    }
  });

  return list;
}

// =============================================================================
// DOM Rendering
// =============================================================================

/**
 * Render user profile data into the profile card.
 * @param {Object} user - GitHub user data object
 */
function renderProfile(user) {
  // Avatar
  dom.userAvatar.src = user.avatar_url || 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png';
  dom.userAvatar.alt = `${user.name || user.login}'s avatar`;

  // Name & Username
  dom.userName.textContent = user.name || user.login;
  dom.userLogin.textContent = user.login;
  dom.userLoginLink.href = user.html_url;
  dom.userGitHubBtn.href = user.html_url;

  // Joined Date
  dom.userJoined.textContent = formatDate(user.created_at);

  // Bio
  if (user.bio && user.bio.trim() !== '') {
    dom.userBio.textContent = user.bio;
    dom.userBio.classList.remove('disabled');
  } else {
    dom.userBio.textContent = 'This profile has no bio description.';
  }

  // Numerical Statistics
  dom.userReposCount.textContent = formatNumber(user.public_repos);
  dom.userFollowersCount.textContent = formatNumber(user.followers);
  dom.userFollowingCount.textContent = formatNumber(user.following);

  // Location
  if (user.location && user.location.trim() !== '') {
    dom.userLocation.textContent = user.location;
    dom.metaLocation.classList.remove('disabled');
  } else {
    dom.userLocation.textContent = 'Not Available';
    dom.metaLocation.classList.add('disabled');
  }

  // Blog / Website
  if (user.blog && user.blog.trim() !== '') {
    const cleanUrl = normalizeUrl(user.blog);
    dom.userBlog.textContent = user.blog.replace(/^https?:\/\//i, '');
    dom.userBlog.href = cleanUrl;
    dom.userBlog.classList.remove('disabled');
    dom.metaBlog.classList.remove('disabled');
  } else {
    dom.userBlog.textContent = 'Not Available';
    dom.userBlog.removeAttribute('href');
    dom.metaBlog.classList.add('disabled');
  }

  // Twitter / X
  if (user.twitter_username && user.twitter_username.trim() !== '') {
    const handle = user.twitter_username.replace(/^@/, '');
    dom.userTwitter.textContent = `@${handle}`;
    dom.userTwitter.href = `https://twitter.com/${handle}`;
    dom.userTwitter.classList.remove('disabled');
    dom.metaTwitter.classList.remove('disabled');
  } else {
    dom.userTwitter.textContent = 'Not Available';
    dom.userTwitter.removeAttribute('href');
    dom.metaTwitter.classList.add('disabled');
  }

  // Company
  if (user.company && user.company.trim() !== '') {
    dom.userCompany.textContent = user.company;
    dom.metaCompany.classList.remove('disabled');
  } else {
    dom.userCompany.textContent = 'Not Available';
    dom.metaCompany.classList.add('disabled');
  }
}

/**
 * Render repositories section with active search, filter, sort, and pagination.
 */
function renderRepositories() {
  dom.reposGrid.innerHTML = '';

  // Zero public repositories case
  if (!repoState.rawRepos || repoState.rawRepos.length === 0) {
    dom.reposGrid.classList.add('hidden');
    dom.repoToolbar.classList.add('hidden');
    dom.loadMoreContainer.classList.add('hidden');
    dom.noMatchingReposMessage.classList.add('hidden');
    dom.noReposMessage.classList.remove('hidden');
    dom.repoCountDisplay.textContent = '0 Repos';
    dom.allReposCount.textContent = '0';
    return;
  }

  dom.noReposMessage.classList.add('hidden');
  dom.repoToolbar.classList.remove('hidden');
  dom.allReposCount.textContent = String(repoState.rawRepos.length);

  // Update tabs active state
  if (repoState.viewMode === 'top4' && !repoState.searchQuery && repoState.selectedLanguage === 'all') {
    dom.tabTopRepos.classList.add('active');
    dom.tabTopRepos.setAttribute('aria-selected', 'true');
    dom.tabAllRepos.classList.remove('active');
    dom.tabAllRepos.setAttribute('aria-selected', 'false');
  } else {
    dom.tabTopRepos.classList.remove('active');
    dom.tabTopRepos.setAttribute('aria-selected', 'false');
    dom.tabAllRepos.classList.add('active');
    dom.tabAllRepos.setAttribute('aria-selected', 'true');
  }

  const filtered = getFilteredAndSortedRepos();

  // No search / filter match case
  if (filtered.length === 0) {
    dom.reposGrid.classList.add('hidden');
    dom.loadMoreContainer.classList.add('hidden');
    dom.noMatchingReposMessage.classList.remove('hidden');
    if (repoState.searchQuery) {
      dom.noMatchingReposText.textContent = `No repositories found matching "${repoState.searchQuery}".`;
    } else {
      dom.noMatchingReposText.textContent = 'No repositories match the selected filters.';
    }
    dom.repoCountDisplay.textContent = '0 Matches';
    return;
  }

  dom.noMatchingReposMessage.classList.add('hidden');
  dom.reposGrid.classList.remove('hidden');

  // Determine items to display
  let displayedRepos = [];
  const isTop4Mode = repoState.viewMode === 'top4' && !repoState.searchQuery && repoState.selectedLanguage === 'all';

  if (isTop4Mode) {
    displayedRepos = filtered.slice(0, 4);
    dom.loadMoreContainer.classList.add('hidden');
    dom.repoCountDisplay.textContent = `Top ${displayedRepos.length} of ${repoState.totalPublicRepos}`;
  } else {
    displayedRepos = filtered.slice(0, repoState.displayLimit);
    
    // Manage Load More button
    if (filtered.length > repoState.displayLimit) {
      dom.loadMoreContainer.classList.remove('hidden');
      dom.loadMoreBtn.querySelector('span').textContent = `Show More (${filtered.length - displayedRepos.length} remaining)`;
    } else {
      dom.loadMoreContainer.classList.add('hidden');
    }

    if (repoState.searchQuery || repoState.selectedLanguage !== 'all') {
      dom.repoCountDisplay.textContent = `Showing ${displayedRepos.length} of ${filtered.length} matches`;
    } else {
      dom.repoCountDisplay.textContent = `Showing ${displayedRepos.length} of ${filtered.length} Repos`;
    }
  }

  // Build repository cards
  const cardsHTML = displayedRepos.map((repo, index) => {
    const lang = repo.language || 'Plain Text';
    const langColor = LANGUAGE_COLORS[repo.language] || LANGUAGE_COLORS.Default;
    const description = repo.description 
      ? escapeHTML(repo.description) 
      : '<em>No description provided for this repository.</em>';
    const name = escapeHTML(repo.name);
    const repoUrl = repo.html_url;
    const stars = formatNumber(repo.stargazers_count || 0);
    const forks = formatNumber(repo.forks_count || 0);
    const rankPill = isTop4Mode ? `<span class="repo-rank-pill">#${index + 1}</span>` : '';

    return `
      <article class="repo-card" data-rank="${index + 1}">
        <div class="repo-card-header">
          <div class="repo-title-wrapper">
            <svg class="repo-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            </svg>
            <a href="${repoUrl}" target="_blank" rel="noopener noreferrer" class="repo-link" title="${name}">
              ${name}
            </a>
          </div>
          ${rankPill}
        </div>

        <p class="repo-description">${description}</p>

        <div class="repo-footer">
          <span class="repo-language">
            <span class="lang-circle" style="background-color: ${langColor};"></span>
            <span>${escapeHTML(lang)}</span>
          </span>

          <div class="repo-stats">
            <span class="repo-stat-item" title="${repo.stargazers_count || 0} Stars">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              <span>${stars}</span>
            </span>

            <span class="repo-stat-item" title="${repo.forks_count || 0} Forks">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <line x1="6" y1="3" x2="6" y2="15"></line>
                <circle cx="18" cy="6" r="3"></circle>
                <circle cx="6" cy="18" r="3"></circle>
                <path d="M18 9a9 9 0 0 1-9 9"></path>
              </svg>
              <span>${forks}</span>
            </span>
          </div>
        </div>
      </article>
    `;
  }).join('');

  dom.reposGrid.innerHTML = cardsHTML;
}

// =============================================================================
// GitHub REST API Controller
// =============================================================================

/**
 * Fetch user profile and repositories from the GitHub REST API.
 * @param {string} rawUsername - Input username to search
 */
async function searchGitHubUser(rawUsername) {
  const username = rawUsername.trim();

  // Validate empty input
  if (!username) {
    dom.usernameInput.focus();
    showErrorState(
      'Username Required',
      'Please enter a valid GitHub username to search.'
    );
    return;
  }

  // Reset internal repository exploration state
  repoState.searchQuery = '';
  repoState.selectedLanguage = 'all';
  repoState.selectedSort = 'popular';
  repoState.viewMode = 'top4';
  repoState.displayLimit = 8;
  dom.repoSearchInput.value = '';
  dom.clearRepoSearchBtn.classList.add('hidden');
  dom.repoSortSelect.value = 'popular';

  // Set loading state
  setActiveState('loading');

  try {
    // 1. Fetch User Profile
    const userResponse = await fetch(`${GITHUB_API_BASE}/${encodeURIComponent(username)}`);

    if (userResponse.status === 404) {
      showErrorState(
        'User Not Found',
        `We could not find any GitHub user with the username "${username}". Please verify the spelling.`
      );
      return;
    }

    if (userResponse.status === 403) {
      showErrorState(
        'Rate Limit Exceeded',
        'GitHub API rate limit has been reached for your IP address. Please wait a few moments and try again.'
      );
      return;
    }

    if (!userResponse.ok) {
      showErrorState(
        'API Error',
        `GitHub API returned status code ${userResponse.status}. Please try again shortly.`
      );
      return;
    }

    const userData = await userResponse.json();

    // 2. Fetch User Repositories (Fetch up to 100 repositories)
    let reposData = [];
    if (userData.public_repos > 0) {
      try {
        const reposResponse = await fetch(
          `${GITHUB_API_BASE}/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`
        );

        if (reposResponse.ok) {
          reposData = await reposResponse.json();
        }
      } catch (repoErr) {
        console.warn('Could not fetch user repositories:', repoErr);
      }
    }

    // 3. Save state & populate controls
    repoState.rawRepos = reposData;
    repoState.totalPublicRepos = userData.public_repos;

    populateLanguageFilter(reposData);

    // 4. Render Profile and Repositories
    renderProfile(userData);
    renderRepositories();

    // Show result view
    setActiveState('result');

  } catch (error) {
    console.error('Fetch error:', error);
    showErrorState(
      'Connection Error',
      'Unable to connect to GitHub. Please check your internet connection and try again.'
    );
  }
}

// =============================================================================
// Event Listeners & Initialization
// =============================================================================

function setupEventListeners() {
  // Theme Toggle Button
  dom.themeToggleBtn.addEventListener('click', toggleTheme);

  // Main Profile Search Form Submit
  dom.searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    searchGitHubUser(dom.usernameInput.value);
  });

  // Search Input Input Handler (Toggle clear button visibility)
  dom.usernameInput.addEventListener('input', () => {
    if (dom.usernameInput.value.trim().length > 0) {
      dom.clearInputBtn.classList.remove('hidden');
    } else {
      dom.clearInputBtn.classList.add('hidden');
    }
  });

  // Clear Main Search Input Button
  dom.clearInputBtn.addEventListener('click', () => {
    dom.usernameInput.value = '';
    dom.clearInputBtn.classList.add('hidden');
    dom.usernameInput.focus();
  });

  // Error Retry Button
  dom.errorRetryBtn.addEventListener('click', () => {
    dom.usernameInput.value = '';
    dom.clearInputBtn.classList.add('hidden');
    dom.usernameInput.focus();
    setActiveState('initial');
  });

  // Quick Suggestion Chips
  dom.suggestionChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const username = chip.getAttribute('data-username');
      if (username) {
        dom.usernameInput.value = username;
        dom.clearInputBtn.classList.remove('hidden');
        searchGitHubUser(username);
      }
    });
  });

  // Repository View Tabs
  dom.tabTopRepos.addEventListener('click', () => {
    repoState.viewMode = 'top4';
    repoState.searchQuery = '';
    repoState.selectedLanguage = 'all';
    dom.repoSearchInput.value = '';
    dom.clearRepoSearchBtn.classList.add('hidden');
    dom.repoLangFilter.value = 'all';
    renderRepositories();
  });

  dom.tabAllRepos.addEventListener('click', () => {
    repoState.viewMode = 'all';
    repoState.displayLimit = 8;
    renderRepositories();
  });

  // In-Profile Repository Search Input
  dom.repoSearchInput.addEventListener('input', () => {
    const val = dom.repoSearchInput.value.trim();
    repoState.searchQuery = val;
    repoState.displayLimit = 8;
    if (val.length > 0) {
      dom.clearRepoSearchBtn.classList.remove('hidden');
      repoState.viewMode = 'all';
    } else {
      dom.clearRepoSearchBtn.classList.add('hidden');
    }
    renderRepositories();
  });

  // Clear Repository Search Input Button
  dom.clearRepoSearchBtn.addEventListener('click', () => {
    dom.repoSearchInput.value = '';
    repoState.searchQuery = '';
    repoState.displayLimit = 8;
    dom.clearRepoSearchBtn.classList.add('hidden');
    dom.repoSearchInput.focus();
    renderRepositories();
  });

  // Language Filter Dropdown
  dom.repoLangFilter.addEventListener('change', (e) => {
    repoState.selectedLanguage = e.target.value;
    repoState.displayLimit = 8;
    if (e.target.value !== 'all') {
      repoState.viewMode = 'all';
    }
    renderRepositories();
  });

  // Sort Dropdown
  dom.repoSortSelect.addEventListener('change', (e) => {
    repoState.selectedSort = e.target.value;
    renderRepositories();
  });

  // Reset Repository Filters Button
  dom.resetRepoFiltersBtn.addEventListener('click', () => {
    repoState.searchQuery = '';
    repoState.selectedLanguage = 'all';
    repoState.selectedSort = 'popular';
    repoState.viewMode = 'all';
    repoState.displayLimit = 8;
    dom.repoSearchInput.value = '';
    dom.clearRepoSearchBtn.classList.add('hidden');
    dom.repoLangFilter.value = 'all';
    dom.repoSortSelect.value = 'popular';
    renderRepositories();
  });

  // Load More Repositories Button
  dom.loadMoreBtn.addEventListener('click', () => {
    repoState.displayLimit += 8;
    renderRepositories();
  });
}

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  setupEventListeners();
  dom.usernameInput.focus();
});
