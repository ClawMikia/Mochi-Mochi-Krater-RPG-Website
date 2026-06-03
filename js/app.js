let selectedTeam = [];
let activeFilter = 'all';
let activeFilterModal = 'all';
let isPlayerTurn = true;
let battleEngine = null;
let playerTeam = [];
let opponentTeam = [];
let cpuDifficulty = 'medium';
let battleMode = 1;
let battleModeSetup = 1;
const getMaxTeamSize = function() {
  return document.getElementById('battleModeSetup') ? battleModeSetup : battleMode;
};
let battleReady = false;
let lastLogIndex = 0;
let currentTeamPage = 1;
let modalMonsterList = [];
const MONSTERS_PER_PAGE = 12;

document.addEventListener('DOMContentLoaded', initApp);

async function initApp() {
  const startBattleBtn = document.getElementById('startBattleBtn');
  const selectCharacterBtn = document.getElementById('selectCharacterBtn');
  const startMatchBtn = document.getElementById('startMatchBtn');
  const switchBtn = document.getElementById('switchBtn');
  const fleeBtn = document.getElementById('fleeBtn');
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const navLinks = document.getElementById('navLinks');

  if (startBattleBtn) startBattleBtn.addEventListener('click', startLocalBattle);
  if (selectCharacterBtn) selectCharacterBtn.addEventListener('click', showTeamSelectModal);
  const clearTeamBtn = document.getElementById('clearTeamBtn');
  if (clearTeamBtn) clearTeamBtn.addEventListener('click', clearTeam);
  if (startMatchBtn) startMatchBtn.addEventListener('click', startMatchSetup);
  if (switchBtn) switchBtn.addEventListener('click', showSwitchPanel);
  if (fleeBtn) fleeBtn.addEventListener('click', fleeBattle);
  if (hamburgerBtn && navLinks) {
    hamburgerBtn.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      const spans = hamburgerBtn.querySelectorAll('span');
      spans.forEach(span => span.classList.toggle('active'));
    });
  }

  const battleModeSetupEl = document.getElementById('battleModeSetup');
  const cpuDifficultyEl = document.getElementById('cpuDifficulty');
  const battleModeEl = document.getElementById('battleMode');

  if (battleModeSetupEl) {
    battleModeSetup = parseInt(battleModeSetupEl.value);
    battleModeSetupEl.addEventListener('change', (e) => {
      battleModeSetup = parseInt(e.target.value);
      trimTeamToMax();
      refreshTeamSlots();
      if (typeof updateTeamStats === 'function') updateTeamStats();
    });
  }
  if (battleModeEl) {
    battleMode = parseInt(battleModeEl.value);
    battleModeEl.addEventListener('change', (e) => {
      battleMode = parseInt(e.target.value);
      trimTeamToMax();
      refreshTeamSlots();
      if (typeof updateTeamStats === 'function') updateTeamStats();
    });
  }
  if (cpuDifficultyEl) {
    cpuDifficultyEl.addEventListener('change', (e) => {
      cpuDifficulty = e.target.value;
    });
  }

  const searchInput = document.getElementById('searchInput');
  const searchInputTeam = document.getElementById('searchInputTeam');
  const typeFilters = document.getElementById('typeFilters');
  const typeFiltersTeam = document.getElementById('typeFiltersTeam');
  const typeFiltersModal = document.getElementById('typeFiltersModal');
  const monsterModal = document.getElementById('monsterModal');
  const teamSelectModal = document.getElementById('teamSelectModal');

  if (searchInput) searchInput.addEventListener('input', filterMonsters);
  if (searchInputTeam) searchInputTeam.addEventListener('input', filterMonstersTeam);
  if (typeFilters) {
    initializeTypeFilters('typeFilters', 'main');
    displayMonsters(MONSTER_DB);
  }
  if (typeFiltersTeam) {
    initializeTypeFilters('typeFiltersTeam', 'team');
    displayMonstersTeam(MONSTER_DB);
  }
  if (typeFiltersModal) {
    initializeTypeFilters('typeFiltersModal', 'modal');
    displayMonstersModal(MONSTER_DB, 1);
  }

  generateSkyline();
  refreshTeamSlots();
  const quickMatchBtn = document.getElementById('quickMatchBtn');
  if (quickMatchBtn) {
    quickMatchBtn.remove();
  }
  try {
    const session = await getSession();
    if (session) {
      if (logoutBtn) {
        logoutBtn.classList.remove('hidden');
        logoutBtn.addEventListener('click', handleLogout);
      }
    }
  } catch (e) {
    console.warn('Session check failed:', e);
  }

  if (monsterModal) {
    monsterModal.addEventListener('click', (e) => {
      if (e.target.id === 'monsterModal' && typeof closeMonsterModal === 'function') closeMonsterModal();
    });
  }
  if (teamSelectModal) {
    teamSelectModal.addEventListener('click', (e) => {
      if (e.target.id === 'teamSelectModal' && typeof closeTeamSelectModal === 'function') closeTeamSelectModal();
    });
  }

  const storedTeam = sessionStorage.getItem('playerTeam');
  const storedMode = sessionStorage.getItem('battleMode');

  if (storedTeam && storedMode) {
    let sessionOk = false;
    try {
      const session = await getSession();
      sessionOk = !!session;
    } catch (e) {
      sessionOk = true;
    }
    if (sessionOk) {
      sessionStorage.removeItem('battleMode');
      battleMode = parseInt(storedMode);
      await initiateOnlineBattle();
    }
  }
}

function generateSkyline() {
  const skyline = document.getElementById('skyline');
  if (!skyline) return;
  const heights = [120, 180, 100, 250, 150, 90, 220, 170, 110, 200, 130, 80, 240, 160, 105];
  const colors = [
    'linear-gradient(180deg, #3a3a55 0%, #2a2a44 50%, #1d1d33 100%)',
    'linear-gradient(180deg, #2e2e50 0%, #1f1f40 50%, #181830 100%)',
    'linear-gradient(180deg, #404060 0%, #303055 50%, #252545 100%)'
  ];
  heights.forEach((h, i) => {
    const building = document.createElement('div');
    building.className = 'skyline-building';
    building.style.height = h + 'px';
    building.style.flex = (Math.random() * 0.5 + 0.5).toFixed(2);
    building.style.background = colors[i % colors.length];
    const windowGrid = document.createElement('div');
    windowGrid.className = 'window-grid';
    const windowCount = 15 + Math.floor(Math.random() * 12);
    for (let j = 0; j < windowCount; j++) {
      const light = document.createElement('div');
      light.className = 'light';
      if (Math.random() < 0.6) {
        const brightness = (0.1 + Math.random() * 0.5).toFixed(2);
        const warm = Math.random() < 0.8;
        light.style.background = warm
          ? 'rgba(255,' + Math.floor(200 - Math.random() * 50) + ',' + Math.floor(100 + Math.random() * 100) + ',' + brightness + ')'
          : 'rgba(' + Math.floor(200 + Math.random() * 55) + ',' + Math.floor(200 + Math.random() * 55) + ',255,' + brightness + ')';
      }
      windowGrid.appendChild(light);
    }
    building.appendChild(windowGrid);
    skyline.appendChild(building);
  });
}

function initializeTypeFilters(containerId, context) {
  const types = ['all'];
  const seen = {};
  MONSTER_DB.forEach(m => { if (!seen[m.type]) { seen[m.type] = true; types.push(m.type); } });
  const container = document.getElementById(containerId);
  if (!container) return;
  types.forEach(type => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn' + (type === 'all' ? ' active' : '');
    btn.textContent = type;
    btn.addEventListener('click', function() {
      container.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      if (context === 'modal') activeFilterModal = type; else activeFilter = type;
      if (context === 'main') filterMonsters(); else if (context === 'team') filterMonstersTeam(); else filterMonstersModal();
    });
    container.appendChild(btn);
  });
}

function displayMonsters(monsters) {
  const grid = document.getElementById('monsterGrid');
  if (!grid) return;
  grid.innerHTML = '';
  monsters.forEach(function(m) {
    const card = document.createElement('div');
    card.className = 'monster-card';
    card.innerHTML = '<img src="assets/characters/' + m.name + '.png" alt="' + m.name + '" onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'flex\';"><div style="display:none; width:100%; height:120px; align-items:center; justify-content:center; background: rgba(0,0,0,0.3); border-radius:2px; margin-bottom:10px; font-size:11px; color:var(--text-secondary);">' + m.name + '.png</div><div class="monster-name">' + m.name + '</div><div class="monster-type">' + m.type + '</div><div class="monster-stats"><div class="stat-bar"><span class="label">HP</span><div class="bar-container"><div class="bar-fill" style="width:' + ((m.hp - 250) / 15 * 100) + '%; background: var(--neon-blue);"></div></div><span class="value">' + m.hp + '</span></div><div class="stat-bar"><span class="label">ATK</span><div class="bar-container"><div class="bar-fill" style="width:' + ((m.atk - 250) / 15 * 100) + '%; background: var(--neon-pink);"></div></div><span class="value">' + m.atk + '</span></div><div class="stat-bar"><span class="label">DEF</span><div class="bar-container"><div class="bar-fill" style="width:' + ((m.def - 250) / 15 * 100) + '%; background: var(--neon-green);"></div></div><span class="value">' + m.def + '</span></div></div>';
    card.addEventListener('click', function() { showMonsterModal(m); });
    grid.appendChild(card);
  });
}

function displayMonstersTeam(monsters) {
  const grid = document.getElementById('monsterGridTeam');
  if (!grid) return;
  grid.innerHTML = '';
  const maxSlots = getMaxTeamSize ? getMaxTeamSize() : 3;
  monsters.forEach(function(m) {
    const card = document.createElement('div');
    card.className = 'monster-card';
    card.style.opacity = (selectedTeam.length < maxSlots || selectedTeam.find(function(t) { return t.id === m.id; })) ? '1' : '0.4';
    card.innerHTML = '<img src="assets/characters/' + m.name + '.png" alt="' + m.name + '" onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'flex\';"><div style="display:none; width:100%; height:120px; align-items:center; justify-content:center; background: rgba(0,0,0,0.3); border-radius:2px; margin-bottom:10px; font-size:11px; color:var(--text-secondary);">' + m.name + '.png</div><div class="monster-name">' + m.name + '</div><div class="monster-type">' + m.type + '</div><div class="monster-stats"><div class="stat-bar"><span class="label">HP</span><div class="bar-container"><div class="bar-fill" style="width:' + ((m.hp - 250) / 15 * 100) + '%; background: var(--neon-blue);"></div></div><span class="value">' + m.hp + '</span></div><div class="stat-bar"><span class="label">ATK</span><div class="bar-container"><div class="bar-fill" style="width:' + ((m.atk - 250) / 15 * 100) + '%; background: var(--neon-pink);"></div></div><span class="value">' + m.atk + '</span></div><div class="stat-bar"><span class="label">DEF</span><div class="bar-container"><div class="bar-fill" style="width:' + ((m.def - 250) / 15 * 100) + '%; background: var(--neon-green);"></div></div><span class="value">' + m.def + '</span></div></div>';
    card.addEventListener('click', function() { selectTeamMonster(m); });
    grid.appendChild(card);
  });
  updateTeamSlots();
  updateTeamStats();
}

function filterMonsters() {
  const searchInput = document.getElementById('searchInput');
  if (!searchInput) return;
  const search = searchInput.value.toLowerCase();
  let filtered = MONSTER_DB;
  if (activeFilter !== 'all') filtered = filtered.filter(function(m) { return m.type === activeFilter; });
  if (search) filtered = filtered.filter(function(m) { return m.name.toLowerCase().indexOf(search) !== -1 || m.type.toLowerCase().indexOf(search) !== -1; });
  displayMonsters(filtered);
}

function filterMonstersTeam() {
  const searchInputTeam = document.getElementById('searchInputTeam');
  if (!searchInputTeam) return;
  const search = searchInputTeam.value.toLowerCase();
  let filtered = MONSTER_DB;
  if (activeFilter !== 'all') filtered = filtered.filter(function(m) { return m.type === activeFilter; });
  if (search) filtered = filtered.filter(function(m) { return m.name.toLowerCase().indexOf(search) !== -1 || m.type.toLowerCase().indexOf(search) !== -1; });
  displayMonstersTeam(filtered);
}

function showTeamSelectModal() {
  const modal = document.getElementById('teamSelectModal');
  const panel = modal.querySelector('.viewer-panel');
  if (modal) {
    modal.classList.remove('hidden');
    panel.style.transform = 'translateY(-100vh)';
    setTimeout(function() {
      panel.style.transform = 'translateY(0)';
    }, 10);
  }
}

function closeTeamSelectModal() {
  const modal = document.getElementById('teamSelectModal');
  const panel = modal.querySelector('.viewer-panel');
  if (modal) {
    panel.style.transform = 'translateY(-100vh)';
    setTimeout(function() {
      modal.classList.add('hidden');
    }, 500);
  }
}

function displayMonstersModal(monsters, page) {
  modalMonsterList = monsters;
  const grid = document.getElementById('monsterGridModal');
  const paginationBar = document.getElementById('paginationBar');
  if (!grid) return;
  
  const maxSlots = getMaxTeamSize ? getMaxTeamSize() : 3;
  const startIndex = (page - 1) * MONSTERS_PER_PAGE;
  const paginatedMonsters = monsters.slice(startIndex, startIndex + MONSTERS_PER_PAGE);
  const totalPages = Math.ceil(monsters.length / MONSTERS_PER_PAGE) || 1;
  
  grid.innerHTML = '';
  paginatedMonsters.forEach(function(m) {
    const card = document.createElement('div');
    card.className = 'monster-card';
    card.style.opacity = (selectedTeam.length < maxSlots || selectedTeam.find(function(t) { return t.id === m.id; })) ? '1' : '0.4';
    card.innerHTML = '<img src="assets/characters/' + m.name + '.png" alt="' + m.name + '" onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'flex\';"><div style="display:none; width:100%; height:120px; align-items:center; justify-content:center; background: rgba(0,0,0,0.3); border-radius:2px; margin-bottom:10px; font-size:11px; color:var(--text-secondary);">' + m.name + '.png</div><div class="monster-name">' + m.name + '</div><div class="monster-type">' + m.type + '</div><div class="monster-stats"><div class="stat-bar"><span class="label">HP</span><div class="bar-container"><div class="bar-fill" style="width:' + ((m.hp - 250) / 15 * 100) + '%; background: var(--neon-blue);"></div></div><span class="value">' + m.hp + '</span></div><div class="stat-bar"><span class="label">ATK</span><div class="bar-container"><div class="bar-fill" style="width:' + ((m.atk - 250) / 15 * 100) + '%; background: var(--neon-pink);"></div></div><span class="value">' + m.atk + '</span></div><div class="stat-bar"><span class="label">DEF</span><div class="bar-container"><div class="bar-fill" style="width:' + ((m.def - 250) / 15 * 100) + '%; background: var(--neon-green);"></div></div><span class="value">' + m.def + '</span></div></div>';
    card.addEventListener('click', function() { selectTeamMonster(m); });
    grid.appendChild(card);
  });
  
  if (paginationBar) {
    const pageInfo = document.getElementById('pageInfo');
    if (pageInfo) {
      pageInfo.textContent = 'Page ' + page + ' of ' + totalPages;
    }
    const firstPageBtn = document.getElementById('firstPageBtn');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    const lastPageBtn = document.getElementById('lastPageBtn');
    
    if (firstPageBtn) {
      firstPageBtn.disabled = page === 1;
      firstPageBtn.onclick = function() { if (page > 1) displayMonstersModal(monsters, 1); };
    }
    if (prevPageBtn) {
      prevPageBtn.disabled = page === 1;
      prevPageBtn.onclick = function() { if (page > 1) displayMonstersModal(monsters, page - 1); };
    }
    if (nextPageBtn) {
      nextPageBtn.disabled = page === totalPages;
      nextPageBtn.onclick = function() { if (page < totalPages) displayMonstersModal(monsters, page + 1); };
    }
    if (lastPageBtn) {
      lastPageBtn.disabled = page === totalPages;
      lastPageBtn.onclick = function() { if (page < totalPages) displayMonstersModal(monsters, totalPages); };
    }
  }
}

function filterMonstersModal() {
  const searchInputModal = document.getElementById('searchInputModal');
  if (!searchInputModal) return;
  const search = searchInputModal.value.toLowerCase();
  let filtered = MONSTER_DB;
  if (activeFilterModal !== 'all') filtered = filtered.filter(function(m) { return m.type === activeFilterModal; });
  if (search) filtered = filtered.filter(function(m) { return m.name.toLowerCase().indexOf(search) !== -1 || m.type.toLowerCase().indexOf(search) !== -1; });
  currentTeamPage = 1;
  displayMonstersModal(filtered, 1);
}

function selectTeamMonster(monster) {
  const existingIndex = selectedTeam.findIndex(function(t) { return t && t.id === monster.id; });
  if (existingIndex >= 0) {
    selectedTeam.splice(existingIndex, 1);
  } else {
    const maxSlots = getMaxTeamSize ? getMaxTeamSize() : 3;
    if (selectedTeam.length >= maxSlots) {
      showNotification('Your team is full! Remove a monster first.', 'error');
      return;
    }
    selectedTeam.push(monster);
    if (selectedTeam.length === maxSlots) {
      closeTeamSelectModal();
    }
  }
  if (typeof filterMonstersTeam === 'function') filterMonstersTeam();
  if (typeof refreshModalDisplay === 'function') refreshModalDisplay();
  if (typeof updateTeamSlots === 'function') updateTeamSlots();
  if (typeof updateTeamStats === 'function') updateTeamStats();
}

function updateTeamSlots() {
  const container = document.getElementById('teamSlots');
  if (!container) return;
  const maxSlots = getMaxTeamSize ? getMaxTeamSize() : 3;
  container.innerHTML = '';
  for (let i = 0; i < maxSlots; i++) {
    const slot = document.createElement('div');
    slot.className = 'team-slot';
    slot.dataset.index = i;
    slot.style.flex = '1';
    const monster = selectedTeam[i];
    if (monster) {
      slot.classList.add('filled');
      slot.innerHTML = '<img src="assets/characters/' + monster.name + '.png" alt="' + monster.name + '" onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'flex\';"><div style="display:none; width:80px; height:80px; align-items:center; justify-content:center; background: rgba(0,0,0,0.3); border-radius:2px; font-size:10px; color:var(--text-secondary);">' + monster.name + '.png</div><div class="slot-name">' + monster.name + '</div><button class="remove-btn" onclick="removeFromTeam(' + i + ')">Remove</button>';
    } else {
      slot.classList.remove('filled');
      slot.innerHTML = '<div style="color: var(--text-secondary); font-size: 12px;">SLOT ' + (i + 1) + '</div>';
    }
    container.appendChild(slot);
  }
  updateSlotsHint();
}

function removeFromTeam(index) {
  selectedTeam.splice(index, 1);
  if (typeof filterMonstersTeam === 'function') filterMonstersTeam();
  if (typeof refreshModalDisplay === 'function') refreshModalDisplay();
  if (typeof updateTeamSlots === 'function') updateTeamSlots();
  if (typeof updateTeamStats === 'function') updateTeamStats();
}

function clearTeam() {
  selectedTeam = [];
  if (typeof filterMonstersTeam === 'function') filterMonstersTeam();
  if (typeof refreshModalDisplay === 'function') refreshModalDisplay();
  if (typeof updateTeamSlots === 'function') updateTeamSlots();
  if (typeof updateTeamStats === 'function') updateTeamStats();
}

function trimTeamToMax() {
  const max = getMaxTeamSize ? getMaxTeamSize() : 3;
  if (selectedTeam.length > max) {
    selectedTeam = selectedTeam.slice(0, max);
    if (typeof filterMonstersTeam === 'function') filterMonstersTeam();
    if (typeof refreshModalDisplay === 'function') refreshModalDisplay();
  }
  if (typeof updateTeamSlots === 'function') updateTeamSlots();
  if (typeof updateTeamStats === 'function') updateTeamStats();
}

function refreshTeamSlots() {
  if (typeof updateTeamSlots === 'function') updateTeamSlots();
  if (typeof updateTeamStats === 'function') updateTeamStats();
}

function updateSlotsHint() {
  const hint = document.getElementById('slotHint');
  if (!hint) return;
  var maxSlots = getMaxTeamSize ? getMaxTeamSize() : 3;
  hint.textContent = 'Slots based on ' + maxSlots + 'v' + maxSlots + ' format';
}

function refreshModalDisplay() {
  const grid = document.getElementById('monsterGridModal');
  if (!grid || !modalMonsterList.length) return;
  
  const maxSlots = getMaxTeamSize ? getMaxTeamSize() : 3;
  const startIndex = (currentTeamPage - 1) * MONSTERS_PER_PAGE;
  const paginatedMonsters = modalMonsterList.slice(startIndex, startIndex + MONSTERS_PER_PAGE);
  
  grid.innerHTML = '';
  paginatedMonsters.forEach(function(m) {
    const card = document.createElement('div');
    card.className = 'monster-card';
    card.style.opacity = (selectedTeam.length < maxSlots || selectedTeam.find(function(t) { return t.id === m.id; })) ? '1' : '0.4';
    card.innerHTML = '<img src="assets/characters/' + m.name + '.png" alt="' + m.name + '" onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'flex\';"><div style="display:none; width:100%; height:120px; align-items:center; justify-content:center; background: rgba(0,0,0,0.3); border-radius:2px; margin-bottom:10px; font-size:11px; color:var(--text-secondary);">' + m.name + '.png</div><div class="monster-name">' + m.name + '</div><div class="monster-type">' + m.type + '</div><div class="monster-stats"><div class="stat-bar"><span class="label">HP</span><div class="bar-container"><div class="bar-fill" style="width:' + ((m.hp - 250) / 15 * 100) + '%; background: var(--neon-blue);"></div></div><span class="value">' + m.hp + '</span></div><div class="stat-bar"><span class="label">ATK</span><div class="bar-container"><div class="bar-fill" style="width:' + ((m.atk - 250) / 15 * 100) + '%; background: var(--neon-pink);"></div></div><span class="value">' + m.atk + '</span></div><div class="stat-bar"><span class="label">DEF</span><div class="bar-container"><div class="bar-fill" style="width:' + ((m.def - 250) / 15 * 100) + '%; background: var(--neon-green);"></div></div><span class="value">' + m.def + '</span></div></div>';
    card.addEventListener('click', function() { selectTeamMonster(m); });
    grid.appendChild(card);
  });
  
  const pageInfo = document.getElementById('pageInfo');
  if (pageInfo) {
    const totalPages = Math.ceil(modalMonsterList.length / MONSTERS_PER_PAGE) || 1;
    pageInfo.textContent = 'Page ' + currentTeamPage + ' of ' + totalPages;
  }
}

function updateTeamStats() {
  const statsDiv = document.getElementById('teamStats');
  if (!statsDiv) return;
  if (selectedTeam.length === 0) {
    statsDiv.innerHTML = '<p>Add monsters to see team summary.</p>';
    return;
  }
  const maxSlots = getMaxTeamSize ? getMaxTeamSize() : 3;
  const totalHp = selectedTeam.reduce(function(sum, m) { return sum + m.hp; }, 0);
  const totalAtk = selectedTeam.reduce(function(sum, m) { return sum + m.atk; }, 0);
  const totalDef = selectedTeam.reduce(function(sum, m) { return sum + m.def; }, 0);
  const avgHp = Math.round(totalHp / selectedTeam.length);
  const avgAtk = Math.round(totalAtk / selectedTeam.length);
  const avgDef = Math.round(totalDef / selectedTeam.length);
  statsDiv.innerHTML = '<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; text-align: center;"><div class="detailed-stat" style="display: block;"><div class="stat-name">Total HP</div><div class="stat-value" style="color: var(--neon-blue);">' + totalHp + '</div></div><div class="detailed-stat" style="display: block;"><div class="stat-name">Total ATK</div><div class="stat-value" style="color: var(--neon-pink);">' + totalAtk + '</div></div><div class="detailed-stat" style="display: block;"><div class="stat-name">Total DEF</div><div class="stat-value" style="color: var(--neon-orange);">' + totalDef + '</div></div><div class="detailed-stat" style="display: block;"><div class="stat-name">Avg HP</div><div class="stat-value">' + avgHp + '</div></div><div class="detailed-stat" style="display: block;"><div class="stat-name">Avg ATK</div><div class="stat-value">' + avgAtk + '</div></div><div class="detailed-stat" style="display: block;"><div class="stat-name">Avg DEF</div><div class="stat-value">' + avgDef + '</div></div></div><div style="margin-top: 15px; text-align: center; color: var(--neon-green); font-size: 12px; letter-spacing: 2px;">' + selectedTeam.length + ' / ' + maxSlots + ' monsters selected</div>';
}

function showMonsterModal(monster) {
  document.getElementById('monsterModalContent').innerHTML = '<div class="viewer-image"><img src="assets/characters/' + monster.name + '.png" alt="' + monster.name + '" onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'flex\';"><div style="display:none; width:100%; height:100%; align-items:center; justify-content:center; font-size:14px; color:var(--text-secondary);">' + monster.name + '.png</div></div><div class="viewer-stats"><h2>' + monster.name + '</h2><div class="type-badge">' + monster.type + '</div><div class="detailed-stats"><div class="detailed-stat"><span class="stat-name">HP</span><span class="stat-value">' + monster.hp + '</span></div><div class="detailed-stat"><span class="stat-name">ATK</span><span class="stat-value">' + monster.atk + '</span></div><div class="detailed-stat"><span class="stat-name">DEF</span><span class="stat-value">' + monster.def + '</span></div><div class="detailed-stat"><span class="stat-name">Total</span><span class="stat-value">' + (monster.hp + monster.atk + monster.def) + '</span></div></div></div>';
  const modal = document.getElementById('monsterModal');
  if (modal) modal.classList.remove('hidden');
}

function closeMonsterModal() {
  const modal = document.getElementById('monsterModal');
  if (modal) modal.classList.add('hidden');
}

function startLocalBattle() {
   const modeSelect = document.getElementById('battleMode');
   const modeVal = modeSelect ? parseInt(modeSelect.value) : 1;

   if (!selectedTeam.length) {
     showNotification('Select at least 1 monster for your team!', 'error');
     return;
   }
   sessionStorage.setItem('playerTeam', JSON.stringify(selectedTeam));
   sessionStorage.setItem('battleMode', modeVal);
   window.location.href = 'battle.html';
 }

async function startMatchSetup() {
    const cpuDifficultyEl = document.getElementById('cpuDifficulty');
    const storedMode = sessionStorage.getItem('battleMode');
    if (storedMode) battleMode = parseInt(storedMode);
    else {
      const el = document.getElementById('battleModeSetup');
      battleMode = el ? parseInt(el.value) : 1;
    }
    if (cpuDifficultyEl) cpuDifficulty = cpuDifficultyEl.value;
    else cpuDifficulty = 'medium';

    sessionStorage.setItem('battleMode', String(battleMode));

    if (typeof selectedTeam !== 'undefined' && selectedTeam.length > 0) {
      sessionStorage.setItem('playerTeam', JSON.stringify(selectedTeam));
    } else if (!sessionStorage.getItem('playerTeam')) {
      await initPlayerTeam();
    }
    await initiateOnlineBattle();
  }

async function initPlayerTeam() {
  const randomMonsters = [];
  const available = MONSTER_DB.slice().sort(function() { return Math.random() - 0.5; });
  for (let i = 0; i < Math.min(battleMode, 3); i++) {
    randomMonsters.push(available[i]);
  }
  sessionStorage.setItem('playerTeam', JSON.stringify(randomMonsters));
}

function generateCPUTeams(battleMode, difficulty) {
  const team = [];
  for (let i = 0; i < battleMode; i++) {
    team.push(generateCPUTeam(difficulty));
  }
  return team;
}

function generateCPUTeam(difficulty) {
  let pool = MONSTER_DB.slice();
  if (difficulty === 'easy') pool = pool.filter(function(m) { return m.hp + m.atk + m.def < 860; });
  else if (difficulty === 'medium') pool = pool.filter(function(m) { return m.hp + m.atk + m.def < 880; });
  pool.sort(function() { return Math.random() - 0.5; });
  return pool[0];
}

function initiateBattle(playerMonsters, mode) {
    playerTeam = playerMonsters.map(function(m, i) {
      return Object.assign({}, m, { currentHp: m.hp, index: i, alive: true, moves: getMovesForMonster(m) });
    });
    const pool = MONSTER_DB.slice().sort(function() { return Math.random() - 0.5; });
    const opponentMonsters = [];
    for (let i = 0; i < mode; i++) {
      opponentMonsters.push(Object.assign({}, pool[i], { currentHp: pool[i].hp, index: i, alive: true, moves: getMovesForMonster(pool[i]) }));
    }
    opponentTeam = opponentMonsters;
    startBattleEngine();
  }

async function initiateOnlineBattle() {
    if (typeof selectedTeam !== 'undefined' && selectedTeam.length > 0) {
      sessionStorage.setItem('playerTeam', JSON.stringify(selectedTeam));
    }
    const stored = sessionStorage.getItem('playerTeam');
    const playerTeamData = stored ? JSON.parse(stored) : [];
    playerTeam = playerTeamData.map(function(m, i) {
      return Object.assign({}, m, { currentHp: m.hp, index: i, alive: true, moves: getMovesForMonster(m) });
    });

    opponentTeam = generateCPUTeams(battleMode, cpuDifficulty).map(function(m, i) {
      return Object.assign({}, m, { currentHp: m.hp, index: i, alive: true, moves: getMovesForMonster(m) });
    });
    startBattleEngine();
  }

 function startBattleEngine() {
   const battleSetup = document.getElementById('battleSetup');
   const battleArea = document.getElementById('battleArea');
   if (battleSetup) battleSetup.classList.add('hidden');
   if (battleArea) battleArea.classList.remove('hidden');

   battleEngine = new BattleEngine(JSON.parse(JSON.stringify(playerTeam)), JSON.parse(JSON.stringify(opponentTeam)));
   playerTeam = battleEngine.team1;
   opponentTeam = battleEngine.team2;
   battleReady = true;
   lastLogIndex = 0;

   renderMoveButtons();
   updateBattleUI();
   updateMonsterImages();
   addLog('system', 'Battle start! Choose your move.');
   isPlayerTurn = true;
   const battleStatus = document.getElementById('battleStatus');
   if (battleStatus) battleStatus.textContent = 'Your turn';
   const teamPanel = document.getElementById('teamPanel');
   if (teamPanel) teamPanel.style.display = 'none';
 }

function renderMoveButtons() {
  const movePanel = document.getElementById('movePanel');
  if (!movePanel || !battleEngine || !battleReady) return;

  movePanel.innerHTML = '';
  const activeMonster = battleEngine.getActiveMonster(playerTeam) || battleEngine.currentMonster;
  if (!activeMonster || !activeMonster.moves || !activeMonster.moves.length) {
    movePanel.innerHTML = '<p style="color: var(--text-secondary); font-size: 12px;">No moves available</p>';
    return;
  }

  activeMonster.moves.forEach(function(move) {
    const btn = document.createElement('button');
    btn.className = 'move-btn';
    btn.dataset.move = move.name;
    btn.textContent = move.name;
    btn.addEventListener('click', handleBattleAction);
    movePanel.appendChild(btn);
  });
}

function updateBattleUI() {
  if (!battleEngine) return;
  const state = battleEngine.getState();
  const p1 = state.currentMonster;
  const p2 = state.opponent;

  renderMoveButtons();
  updateMonsterDetails(p1, p2);

  const player1Name = document.getElementById('player1Name');
  const player2Name = document.getElementById('player2Name');
  const player1HpBar = document.getElementById('player1HpBar');
  const player2HpBar = document.getElementById('player2HpBar');
  const player1HpText = document.getElementById('player1HpText');
  const player2HpText = document.getElementById('player2HpText');
  const player1MaxHp = document.getElementById('player1MaxHp');
  const player2MaxHp = document.getElementById('player2MaxHp');
  const turnCounter = document.getElementById('turnCounter');

  if (player1Name) player1Name.textContent = p1 ? p1.name : '??';
  if (player2Name) player2Name.textContent = p2 ? p2.name : '??';

  const p1HpPercent = p1 ? (p1.currentHp / p1.hp) * 100 : 0;
  const p2HpPercent = p2 ? (p2.currentHp / p2.hp) * 100 : 0;

  if (player1HpBar) { player1HpBar.style.width = p1HpPercent + '%'; player1HpBar.offsetHeight; }
  if (player2HpBar) { player2HpBar.style.width = p2HpPercent + '%'; player2HpBar.offsetHeight; }
  if (player1HpText) player1HpText.textContent = p1 ? p1.currentHp : 0;
  if (player2HpText) player2HpText.textContent = p2 ? p2.currentHp : 0;
  if (player1MaxHp) player1MaxHp.textContent = p1 ? p1.hp : 0;
  if (player2MaxHp) player2MaxHp.textContent = p2 ? p2.hp : 0;
  if (turnCounter) turnCounter.textContent = state.turn;

  if (player1HpBar) {
    player1HpBar.className = 'hp-bar';
    if (p1HpPercent < 25) player1HpBar.classList.add('critical');
    else if (p1HpPercent < 50) player1HpBar.classList.add('low');
  }
  if (player2HpBar) {
    player2HpBar.className = 'hp-bar';
    if (p2HpPercent < 25) player2HpBar.classList.add('critical');
    else if (p2HpPercent < 50) player2HpBar.classList.add('low');
  }

  document.querySelectorAll('.move-btn').forEach(function(btn) {
    btn.disabled = !isPlayerTurn || (battleEngine && battleEngine.gameOver);
  });
}

function updateMonsterImages() {
  const state = battleEngine ? battleEngine.getState() : null;
  const p1 = state ? state.currentMonster : null;
  const p2 = state ? state.opponent : null;
  const player1Image = document.getElementById('player1Image');
  const player2Image = document.getElementById('player2Image');

  if (p1 && player1Image) {
    player1Image.style.display = 'block';
    const fallback1 = player1Image.nextElementSibling;
    if (fallback1) fallback1.style.display = 'none';
    player1Image.src = 'assets/characters/' + p1.name + '.png';
    player1Image.onerror = function() {
      this.style.display = 'none';
      const fallback = this.nextElementSibling;
      if (fallback) fallback.style.display = 'flex';
    };
  }
  if (p2 && player2Image) {
    player2Image.style.display = 'block';
    const fallback2 = player2Image.nextElementSibling;
    if (fallback2) fallback2.style.display = 'none';
    player2Image.src = 'assets/characters/' + p2.name + '.png';
    player2Image.onerror = function() {
      this.style.display = 'none';
      const fallback = this.nextElementSibling;
      if (fallback) fallback.style.display = 'flex';
    };
  }
}

function handleBattleAction(e) {
  if (!isPlayerTurn || !battleEngine || battleEngine.gameOver) return;
  const moveName = e.target.dataset.move;
  if (!moveName) return;
  const currentMonster = battleEngine.getActiveMonster(playerTeam) || battleEngine.currentMonster;
  const move = currentMonster.moves.find(function(m) { return m.name === moveName; });
  if (!move) return;
  executeTurn(move);
}

function showSwitchPanel() {
  const panel = document.getElementById('teamPanel');
  const container = document.getElementById('switchOptions');
  if (!panel || !container || !battleEngine) return;
  panel.style.display = 'block';
  container.innerHTML = '';
  const enginePlayerTeam = battleEngine.team1;
  const available = enginePlayerTeam.filter(function(m) {
    return m.alive && (!battleEngine.currentMonster || m.id !== battleEngine.currentMonster.id);
  });
  available.forEach(function(m) {
    const btn = document.createElement('div');
    btn.className = 'monster-card';
    btn.style.cssText = 'flex: 0 0 120px; cursor: pointer;';
    btn.innerHTML = '<img src="assets/characters/' + m.name + '.png" alt="' + m.name + '" onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'flex\';"><div style="display:none; width:100%; height:60px; align-items:center; justify-content:center; background: rgba(0,0,0,0.3); border-radius:2px; font-size:9px; color:var(--text-secondary);">' + m.name + '.png</div><div class="monster-name" style="font-size: 11px;">' + m.name + '</div><div style="font-size: 10px; color: var(--text-secondary);">HP: ' + m.currentHp + '</div>';
    btn.addEventListener('click', function() {
      battleEngine.switchMonster(playerTeam, m.index);
      renderEngineLogs();
      updateBattleUI();
      updateMonsterImages();
      panel.style.display = 'none';
      isPlayerTurn = false;
      const battleStatus = document.getElementById('battleStatus');
      if (battleStatus) battleStatus.textContent = 'Opponent turn...';
      setTimeout(cpuExecuteTurn, 1200);
    });
    container.appendChild(btn);
  });
  if (typeof updateTeamSlots === 'function') updateTeamSlots();
}

function executeTurn(selectedMove) {
   if (!battleEngine || battleEngine.gameOver || !selectedMove) return;
   const result = battleEngine.attack(playerTeam, opponentTeam, selectedMove);
   renderEngineLogs();
   updateBattleUI();
   updateMonsterImages();
   if (battleEngine.gameOver) {
     endBattle();
     return;
   }
   isPlayerTurn = false;
   const battleStatus = document.getElementById('battleStatus');
   if (battleStatus) battleStatus.textContent = 'Opponent turn...';
   setTimeout(cpuExecuteTurn, 1200);
 }

function cpuExecuteTurn() {
   if (!battleEngine || battleEngine.gameOver) return;
   const result = battleEngine.cpuTurn();
   renderEngineLogs();
   updateBattleUI();
   updateMonsterImages();
   if (battleEngine.gameOver) {
     endBattle();
     return;
   }
   isPlayerTurn = true;
   const battleStatus = document.getElementById('battleStatus');
   if (battleStatus) battleStatus.textContent = 'Your turn';
   updateBattleUI();
 }

function fleeBattle() {
  if (!battleEngine) return;
  addLog('system', 'You fled from battle!');
  battleEngine.gameOver = true;
  battleEngine.winner = 'opponent';
  endBattle();
}

function endBattle() {
    isPlayerTurn = false;
    document.querySelectorAll('.move-btn').forEach(function(btn) { btn.disabled = true; });

    const resultDiv = document.getElementById('matchResult');
    const title = document.getElementById('resultTitle');
    const message = document.getElementById('resultMessage');
    const icon = document.getElementById('resultIcon');

    if (!resultDiv || !title || !message || !icon || !battleEngine) return;
    requestAnimationFrame(() => { resultDiv.classList.add('show'); });

    if (battleEngine.winner === 'player1') {
      icon.textContent = '\u{1F3C6}';
      title.style.color = 'var(--neon-green)';
      title.textContent = 'Victory!';
      message.textContent = 'You won the battle!';
    } else if (battleEngine.winner === 'player2' || battleEngine.winner === 'opponent') {
      icon.textContent = '\u{1F480}';
      title.style.color = 'var(--neon-pink)';
      title.textContent = 'Defeat';
      message.textContent = 'You lost the battle.';
    } else {
      icon.textContent = '\u{1F91D}';
      title.style.color = 'var(--neon-blue)';
      title.textContent = 'Draw';
      message.textContent = 'The battle ended in a draw!';
    }
  }

  function renderEngineLogs() {
   if (!battleEngine) return;
   const log = document.getElementById('battleLog');
   if (!log) return;
   for (let i = lastLogIndex; i < battleEngine.log.length; i++) {
     const entry = battleEngine.log[i];
     const div = document.createElement('div');
     div.className = 'log-entry ' + (entry.type || entry.attackerTeam || 'system');
     div.textContent = '[Turn ' + entry.turn + '] ' + (entry.message || (entry.attacker + ' used ' + entry.move + ' on ' + entry.defender + ' for ' + entry.damage + ' damage!'));
     log.appendChild(div);
   }
   lastLogIndex = battleEngine.log.length;
   log.scrollTop = log.scrollHeight;
 }
 
 function addLog(type, message) {
  const log = document.getElementById('battleLog');
  if (!log || !battleEngine) return;
  const entry = document.createElement('div');
  entry.className = 'log-entry ' + type;
  entry.textContent = '[Turn ' + (battleEngine.turn - 1) + '] ' + message;
  log.appendChild(entry);
  log.scrollTop = log.scrollHeight;
}

function showNotification(message, type) {
  type = type || 'success';
  const existing = document.querySelector('.notification');
  if (existing) existing.remove();
  const notif = document.createElement('div');
  notif.className = 'notification ' + type;
  notif.textContent = message;
  document.body.appendChild(notif);
  setTimeout(function() { notif.remove(); }, 3000);
}

async function handleLogout() {
  try {
    await signOut();
    showNotification('Logged out successfully');
    sessionStorage.removeItem('playerTeam');
    window.location.reload();
  } catch (err) {
    showNotification('Logout failed', 'error');
  }
}


function updateMonsterDetails(p1, p2) {
  if (p1) {
    const n = document.getElementById('playerMonsterName');
    const t = document.getElementById('playerMonsterType');
    const h = document.getElementById('playerMonsterHp');
    const a = document.getElementById('playerMonsterAtk');
    const d = document.getElementById('playerMonsterDef');
    const mv = document.getElementById('playerMonsterMoves');
    if (n) n.textContent = p1.name;
    if (t) t.textContent = p1.type;
    if (h) h.textContent = p1.currentHp + ' / ' + p1.hp;
    if (a) a.textContent = p1.atk;
    if (d) d.textContent = p1.def;
    if (mv && p1.moves) mv.textContent = p1.moves.map(function(m){return m.name;}).join(', ');
  }
  if (p2) {
    const n = document.getElementById('opponentMonsterName');
    const t = document.getElementById('opponentMonsterType');
    const h = document.getElementById('opponentMonsterHp');
    const a = document.getElementById('opponentMonsterAtk');
    const d = document.getElementById('opponentMonsterDef');
    const mv = document.getElementById('opponentMonsterMoves');
    if (n) n.textContent = p2.name;
    if (t) t.textContent = p2.type;
    if (h) h.textContent = p2.currentHp + ' / ' + p2.hp;
    if (a) a.textContent = p2.atk;
    if (d) d.textContent = p2.def;
    if (mv && p2.moves) mv.textContent = p2.moves.map(function(m){return m.name;}).join(', ');
  }
}

const searchInputModal = document.getElementById('searchInputModal');
if (searchInputModal) searchInputModal.addEventListener('input', filterMonstersModal);

window.closeMonsterModal = closeMonsterModal;
window.closeTeamSelectModal = closeTeamSelectModal;
