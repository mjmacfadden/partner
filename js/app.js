/**
 * Main Application Controller for Partner
 */

import { StorageManager } from './storage.js';
import { GroupingEngine } from './grouping.js';

// Sample students for instant demo
const SAMPLE_STUDENTS = [
  'Alex Rivera',
  'Bailey Cooper',
  'Charlie Kim',
  'Dana Vance',
  'Ethan Hunt',
  'Fiona Gallagher',
  'Gabriel Stone',
  'Harper Lee',
  'Isaac Newton',
  'Julia Roberts',
  'Kai Chen',
  'Luna Lovegood'
];

class PartnerApp {
  constructor() {
    this.students = StorageManager.getStudents();
    this.history = StorageManager.getHistory();
    this.settings = StorageManager.getSettings();

    this.selectedGroupSize = this.settings.defaultGroupSize || 2;
    this.currentResult = null;

    this.initDOM();
    this.initTheme();
    this.bindEvents();
    this.renderRoster();
    this.updateStatsAndPrediction();

    // If there's history, restore the latest round display
    if (this.history.length > 0) {
      this.displayLastRoundFromHistory();
    }
  }

  /**
   * Cache DOM elements
   */
  initDOM() {
    // Buttons & Toggles
    this.themeToggleBtn = document.getElementById('btn-toggle-theme');
    this.themeIconSun = document.getElementById('theme-icon-sun');
    this.btnOpenMatrix = document.getElementById('btn-open-matrix');
    this.btnOpenHistory = document.getElementById('btn-open-history');
    this.btnOpenSettings = document.getElementById('btn-open-settings');
    this.btnProjectorMode = document.getElementById('btn-projector-mode');
    this.btnExitProjector = document.getElementById('btn-exit-projector');
    this.historyCountBadge = document.getElementById('history-count-badge');

    // Input Tabs & Forms
    this.tabSingle = document.getElementById('tab-single');
    this.tabBulk = document.getElementById('tab-bulk');
    this.formSingle = document.getElementById('form-single');
    this.formBulk = document.getElementById('form-bulk');
    this.inputSingleName = document.getElementById('input-single-name');
    this.inputBulkNames = document.getElementById('input-bulk-names');
    this.btnLoadDemo = document.getElementById('btn-load-demo');
    this.btnEmptyLoadDemo = document.getElementById('btn-empty-load-demo');

    // Roster Elements
    this.countActive = document.getElementById('count-active');
    this.countTotal = document.getElementById('count-total');
    this.studentList = document.getElementById('student-list');
    this.btnSelectAll = document.getElementById('btn-select-all');
    this.btnDeselectAll = document.getElementById('btn-deselect-all');
    this.btnClearRoster = document.getElementById('btn-clear-roster');

    // Group Size Controls
    this.sizeButtons = document.querySelectorAll('.size-btn');
    this.inputCustomSize = document.getElementById('input-custom-size');
    this.groupPrediction = document.getElementById('group-prediction');
    this.btnGenerateGroups = document.getElementById('btn-generate-groups');

    // Results Display
    this.resultsBar = document.getElementById('results-bar');
    this.roundIndicator = document.getElementById('round-indicator');
    this.repetitionBadge = document.getElementById('repetition-badge');
    this.btnCopyGroups = document.getElementById('btn-copy-groups');
    this.btnRegenerate = document.getElementById('btn-regenerate');
    this.groupsContainer = document.getElementById('groups-container');
    this.emptyState = document.getElementById('empty-state');

    // Coverage Bar
    this.coverageProgressBar = document.getElementById('coverage-progress-bar');
    this.coveragePercentageText = document.getElementById('coverage-percentage-text');
    this.coverageDetailText = document.getElementById('coverage-detail-text');
    this.cycleIndicatorText = document.getElementById('cycle-indicator-text');

    // Modals
    this.modalMatrix = document.getElementById('modal-matrix');
    this.modalHistory = document.getElementById('modal-history');
    this.modalSettings = document.getElementById('modal-settings');
    this.matrixTable = document.getElementById('matrix-table');
    this.historyListContainer = document.getElementById('history-list-container');
    this.btnClearHistory = document.getElementById('btn-clear-history');
    this.btnExportJson = document.getElementById('btn-export-json');
    this.inputImportJson = document.getElementById('input-import-json');
    this.btnResetHistoryOnly = document.getElementById('btn-reset-history-only');
    this.btnResetAllData = document.getElementById('btn-reset-all-data');

    // Toast Container
    this.toastContainer = document.getElementById('toast-container');
  }

  /**
   * Theme Management
   */
  initTheme() {
    const savedTheme = this.settings.theme || 'system';
    this.applyTheme(savedTheme);
  }

  applyTheme(theme) {
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    this.settings.theme = newTheme;
    StorageManager.saveSettings(this.settings);
    this.applyTheme(newTheme);
    this.showToast(`Theme switched to ${newTheme} mode`);
  }

  /**
   * Attach Event Listeners
   */
  bindEvents() {
    // Theme toggle
    this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());

    // Input Tabs
    this.tabSingle.addEventListener('click', () => this.switchInputTab('single'));
    this.tabBulk.addEventListener('click', () => this.switchInputTab('bulk'));

    // Add Single Form
    this.formSingle.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = this.inputSingleName.value.trim();
      if (name) {
        this.addStudent(name);
        this.inputSingleName.value = '';
        this.inputSingleName.focus();
      }
    });

    // Add Bulk Form
    this.formBulk.addEventListener('submit', (e) => {
      e.preventDefault();
      const rawText = this.inputBulkNames.value;
      if (rawText) {
        this.addBulkStudents(rawText);
        this.inputBulkNames.value = '';
        this.switchInputTab('single');
      }
    });

    // Load Demo Data
    const loadDemoHandler = () => this.loadDemoClass();
    this.btnLoadDemo.addEventListener('click', loadDemoHandler);
    this.btnEmptyLoadDemo.addEventListener('click', loadDemoHandler);

    // Roster Bulk Actions
    this.btnSelectAll.addEventListener('click', () => this.toggleAllAttendance(true));
    this.btnDeselectAll.addEventListener('click', () => this.toggleAllAttendance(false));
    this.btnClearRoster.addEventListener('click', () => this.clearRoster());

    // Size Selector Buttons
    this.sizeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const size = parseInt(btn.dataset.size, 10);
        this.setSize(size);
      });
    });

    // Custom Size Input
    this.inputCustomSize.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      if (val && val >= 2) {
        this.setSize(val, true);
      }
    });

    // Generate Buttons
    this.btnGenerateGroups.addEventListener('click', () => this.generateGroups());
    this.btnRegenerate.addEventListener('click', () => this.generateGroups());
    this.btnCopyGroups.addEventListener('click', () => this.copyCurrentGroupsToClipboard());

    // Projector Mode
    this.btnProjectorMode.addEventListener('click', () => this.toggleProjectorMode(true));
    this.btnExitProjector.addEventListener('click', () => this.toggleProjectorMode(false));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && document.body.classList.contains('projector-mode')) {
        this.toggleProjectorMode(false);
      }
    });

    // Modals
    this.btnOpenMatrix.addEventListener('click', () => this.openMatrixModal());
    this.btnOpenHistory.addEventListener('click', () => this.openHistoryModal());
    this.btnOpenSettings.addEventListener('click', () => this.openModal(this.modalSettings));

    document.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modalId = e.currentTarget.dataset.close;
        if (modalId) {
          this.closeModal(document.getElementById(modalId));
        }
      });
    });

    // Close modal on backdrop click
    [this.modalMatrix, this.modalHistory, this.modalSettings].forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeModal(modal);
        }
      });
    });

    // Settings actions
    this.btnClearHistory.addEventListener('click', () => this.clearHistory());
    this.btnResetHistoryOnly.addEventListener('click', () => this.clearHistory());
    this.btnResetAllData.addEventListener('click', () => this.factoryReset());
    this.btnExportJson.addEventListener('click', () => this.exportBackup());
    this.inputImportJson.addEventListener('change', (e) => this.importBackup(e));
  }

  /**
   * Switch between single and bulk entry tabs
   */
  switchInputTab(mode) {
    if (mode === 'single') {
      this.tabSingle.classList.add('active');
      this.tabBulk.classList.remove('active');
      this.formSingle.style.display = 'flex';
      this.formBulk.style.display = 'none';
      this.inputSingleName.focus();
    } else {
      this.tabBulk.classList.add('active');
      this.tabSingle.classList.remove('active');
      this.formBulk.style.display = 'block';
      this.formSingle.style.display = 'none';
      this.inputBulkNames.focus();
    }
  }

  /**
   * Set target group size
   */
  setSize(size, isCustom = false) {
    this.selectedGroupSize = size;
    this.sizeButtons.forEach(btn => {
      const btnSize = parseInt(btn.dataset.size, 10);
      btn.classList.toggle('active', !isCustom && btnSize === size);
    });
    if (!isCustom) {
      this.inputCustomSize.value = '';
    }
    this.updateStatsAndPrediction();
  }

  /**
   * Add a single student
   */
  addStudent(name) {
    const trimmed = name.trim();
    if (!trimmed) return;

    // Check duplicate name warning
    if (this.students.some(s => s.name.toLowerCase() === trimmed.toLowerCase())) {
      this.showToast(`Note: A student named "${trimmed}" is already on the roster.`);
    }

    const newStudent = {
      id: 's_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      name: trimmed,
      active: true
    };

    this.students.push(newStudent);
    this.persistStudents();
    this.renderRoster();
    this.updateStatsAndPrediction();
    this.showToast(`Added ${trimmed}`);
  }

  /**
   * Add multiple students via CSV or multiline input
   */
  addBulkStudents(text) {
    const entries = text
      .split(/[,\n\r]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (entries.length === 0) {
      this.showToast('No valid names found in text.');
      return;
    }

    let addedCount = 0;
    entries.forEach(name => {
      const newStudent = {
        id: 's_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        name: name,
        active: true
      };
      this.students.push(newStudent);
      addedCount++;
    });

    this.persistStudents();
    this.renderRoster();
    this.updateStatsAndPrediction();
    this.showToast(`Added ${addedCount} student${addedCount > 1 ? 's' : ''}`);
  }

  /**
   * Populate with sample class names
   */
  loadDemoClass() {
    this.students = SAMPLE_STUDENTS.map(name => ({
      id: 's_' + Math.random().toString(36).substr(2, 9),
      name: name,
      active: true
    }));
    this.persistStudents();
    this.renderRoster();
    this.updateStatsAndPrediction();
    this.showToast('Loaded 12 sample students!');
  }

  /**
   * Toggle student attendance/active state
   */
  toggleStudentActive(id) {
    const student = this.students.find(s => s.id === id);
    if (student) {
      student.active = !student.active;
      this.persistStudents();
      this.renderRoster();
      this.updateStatsAndPrediction();
    }
  }

  /**
   * Toggle all students active/inactive
   */
  toggleAllAttendance(active) {
    this.students.forEach(s => s.active = active);
    this.persistStudents();
    this.renderRoster();
    this.updateStatsAndPrediction();
    this.showToast(active ? 'All students marked active' : 'All students marked inactive');
  }

  /**
   * Delete single student
   */
  deleteStudent(id) {
    const student = this.students.find(s => s.id === id);
    const name = student ? student.name : 'Student';
    this.students = this.students.filter(s => s.id !== id);
    this.persistStudents();
    this.renderRoster();
    this.updateStatsAndPrediction();
    this.showToast(`Removed ${name}`);
  }

  /**
   * Clear roster
   */
  clearRoster() {
    if (this.students.length === 0) return;
    if (confirm('Are you sure you want to clear all students from the roster?')) {
      this.students = [];
      this.persistStudents();
      this.renderRoster();
      this.updateStatsAndPrediction();
      this.showToast('Roster cleared');
    }
  }

  /**
   * Render Roster List in Sidebar
   */
  renderRoster() {
    this.studentList.innerHTML = '';
    const activeCount = this.students.filter(s => s.active).length;
    const totalCount = this.students.length;

    this.countActive.textContent = activeCount;
    this.countTotal.textContent = totalCount;

    this.students.forEach(student => {
      const li = document.createElement('li');
      li.className = `student-item ${student.active ? '' : 'inactive'}`;

      const left = document.createElement('div');
      left.className = 'student-item-left';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'student-checkbox';
      checkbox.checked = student.active;
      checkbox.title = student.active ? 'Mark absent' : 'Mark active';
      checkbox.addEventListener('change', () => this.toggleStudentActive(student.id));

      const nameSpan = document.createElement('span');
      nameSpan.className = 'student-name';
      nameSpan.textContent = student.name;
      nameSpan.title = 'Click to toggle presence';
      nameSpan.addEventListener('click', () => this.toggleStudentActive(student.id));

      left.appendChild(checkbox);
      left.appendChild(nameSpan);

      const actions = document.createElement('div');
      actions.className = 'student-actions';

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'student-delete-btn';
      deleteBtn.title = 'Delete student';
      deleteBtn.innerHTML = `
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" style="width: 1rem; height: 1rem;">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      `;
      deleteBtn.addEventListener('click', () => this.deleteStudent(student.id));

      actions.appendChild(deleteBtn);
      li.appendChild(left);
      li.appendChild(actions);

      this.studentList.appendChild(li);
    });
  }

  /**
   * Update Prediction Text & Pairing Progress
   */
  updateStatsAndPrediction() {
    const active = this.students.filter(s => s.active);
    const N = active.length;
    const K = this.selectedGroupSize;

    if (N < 2) {
      this.groupPrediction.textContent = 'Add at least 2 active students to generate groups.';
    } else {
      const sizes = GroupingEngine.calculateBalancedGroupSizes(N, K);
      const sizeCounts = {};
      sizes.forEach(s => sizeCounts[s] = (sizeCounts[s] || 0) + 1);

      const parts = Object.entries(sizeCounts)
        .map(([size, count]) => {
          let label = size === '2' ? 'pair' : size === '3' ? 'trio' : size === '4' ? 'quad' : `group of ${size}`;
          if (count > 1) label += 's';
          return `${count} ${label}`;
        });

      this.groupPrediction.innerHTML = `<strong>${N} active students</strong> will form <strong>${parts.join(' and ')}</strong>.`;
    }

    // Update History Badge
    this.historyCountBadge.textContent = this.history.length;

    // Update Coverage Card
    const stats = GroupingEngine.calculateStats(active, this.history);
    this.coveragePercentageText.textContent = `${stats.coveragePercent}%`;
    this.coverageProgressBar.style.width = `${stats.coveragePercent}%`;
    this.coverageDetailText.textContent = `${stats.metPairs} of ${stats.totalPossiblePairs} unique pairs have worked together`;
    this.cycleIndicatorText.textContent = `Cycle ${stats.cycleNumber}`;
  }

  /**
   * Generate Groups
   */
  generateGroups() {
    const activeStudents = this.students.filter(s => s.active);
    if (activeStudents.length < 2) {
      this.showToast('Please have at least 2 active students to create groups.');
      return;
    }

    const result = GroupingEngine.generateGroups(
      activeStudents,
      this.selectedGroupSize,
      this.history
    );

    this.currentResult = result;

    // Record round in history
    const roundRecord = {
      id: 'round_' + Date.now(),
      timestamp: Date.now(),
      groupSize: this.selectedGroupSize,
      groups: result.groupIds,
      studentNames: Object.fromEntries(activeStudents.map(s => [s.id, s.name])),
      cost: result.cost,
      repeatPairsCount: result.repeatPairsCount
    };

    this.history.push(roundRecord);
    this.persistHistory();

    // Render Results
    this.renderGeneratedGroups(result, this.history.length);
    this.updateStatsAndPrediction();

    // Friendly feedback
    if (result.repeatPairsCount === 0) {
      this.showToast('🎉 Generated fresh non-repeating groups!');
    } else {
      this.showToast(`Generated groups (${result.repeatPairsCount} previous pairing${result.repeatPairsCount > 1 ? 's' : ''} repeated).`);
    }
  }

  /**
   * Display latest round from history on page load
   */
  displayLastRoundFromHistory() {
    const lastRound = this.history[this.history.length - 1];
    if (!lastRound || !lastRound.groups) return;

    const studentMap = new Map();
    this.students.forEach(s => studentMap.set(s.id, s));

    const enrichedGroups = lastRound.groups.map(group => {
      return group.map(id => {
        return studentMap.get(id) || { id, name: lastRound.studentNames?.[id] || id };
      });
    });

    const mockResult = {
      groups: enrichedGroups,
      groupIds: lastRound.groups,
      groupSizes: lastRound.groups.map(g => g.length),
      repeatPairsCount: lastRound.repeatPairsCount || 0
    };

    this.currentResult = mockResult;
    this.renderGeneratedGroups(mockResult, this.history.length);
  }

  /**
   * Render Groups to Grid
   */
  renderGeneratedGroups(result, roundNumber = 1) {
    this.emptyState.style.display = 'none';
    this.resultsBar.style.display = 'flex';
    this.groupsContainer.innerHTML = '';

    this.roundIndicator.textContent = `Round #${roundNumber}`;

    if (result.repeatPairsCount === 0) {
      this.repetitionBadge.className = 'status-badge fresh';
      this.repetitionBadge.innerHTML = '✨ 100% Fresh Pairings (0 repeats)';
    } else {
      this.repetitionBadge.className = 'status-badge repeats';
      this.repetitionBadge.innerHTML = `🔄 ${result.repeatPairsCount} repeat pairing${result.repeatPairsCount > 1 ? 's' : ''}`;
    }

    result.groups.forEach((group, groupIdx) => {
      const card = document.createElement('div');
      card.className = 'group-card';

      const header = document.createElement('div');
      header.className = 'group-card-header';

      const number = document.createElement('span');
      number.className = 'group-number';
      number.textContent = `Group ${groupIdx + 1}`;

      const sizeTag = document.createElement('span');
      sizeTag.className = 'group-size-tag';
      sizeTag.textContent = `${group.length} student${group.length > 1 ? 's' : ''}`;

      header.appendChild(number);
      header.appendChild(sizeTag);

      const body = document.createElement('div');
      body.className = 'group-card-body';

      group.forEach(student => {
        const chip = document.createElement('div');
        chip.className = 'student-chip';

        const avatar = document.createElement('div');
        avatar.className = 'student-avatar';
        avatar.textContent = this.getInitials(student.name);

        const nameSpan = document.createElement('span');
        nameSpan.textContent = student.name;

        chip.appendChild(avatar);
        chip.appendChild(nameSpan);
        body.appendChild(chip);
      });

      card.appendChild(header);
      card.appendChild(body);
      this.groupsContainer.appendChild(card);
    });
  }

  /**
   * Helper to get 1 or 2 letter initials
   */
  getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  /**
   * Copy current groups formatted as clean text
   */
  copyCurrentGroupsToClipboard() {
    if (!this.currentResult || !this.currentResult.groups || this.currentResult.groups.length === 0) {
      this.showToast('No groups to copy.');
      return;
    }

    const text = GroupingEngine.formatGroupsToText(this.currentResult.groups);
    navigator.clipboard.writeText(text).then(() => {
      this.showToast('📋 Copied pairings to clipboard!');
    }).catch(() => {
      this.showToast('Failed to copy to clipboard.');
    });
  }

  /**
   * Toggle Projector / Fullscreen Mode
   */
  toggleProjectorMode(enable) {
    if (enable) {
      document.body.classList.add('projector-mode');
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
      this.showToast('Projector Mode on (Press Esc to exit)');
    } else {
      document.body.classList.remove('projector-mode');
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }

  /**
   * Modal Management
   */
  openModal(modal) {
    modal.classList.add('open');
  }

  closeModal(modal) {
    modal.classList.remove('open');
  }

  /**
   * Render and open Interaction Matrix
   */
  openMatrixModal() {
    const active = this.students.filter(s => s.active);
    if (active.length < 2) {
      this.showToast('Need at least 2 active students to display interaction matrix.');
      return;
    }

    const pairCounts = GroupingEngine.buildInteractionMap(active, this.history);
    this.matrixTable.innerHTML = '';

    // Header Row
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const cornerTh = document.createElement('th');
    cornerTh.textContent = 'Student';
    headerRow.appendChild(cornerTh);

    active.forEach(s => {
      const th = document.createElement('th');
      th.textContent = s.name;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    this.matrixTable.appendChild(thead);

    // Body Rows
    const tbody = document.createElement('tbody');
    active.forEach(s1 => {
      const tr = document.createElement('tr');
      const rowHeader = document.createElement('th');
      rowHeader.textContent = s1.name;
      tr.appendChild(rowHeader);

      active.forEach(s2 => {
        const td = document.createElement('td');
        if (s1.id === s2.id) {
          td.className = 'matrix-cell-self';
          td.textContent = '—';
        } else {
          const key = GroupingEngine.getPairKey(s1.id, s2.id);
          const count = pairCounts.get(key) || 0;
          td.textContent = count;
          if (count === 0) {
            td.className = 'matrix-cell-0';
            td.title = `${s1.name} and ${s2.name} have NOT worked together yet.`;
          } else {
            td.className = 'matrix-cell-met';
            td.title = `${s1.name} and ${s2.name} have worked together ${count} time${count > 1 ? 's' : ''}.`;
          }
        }
        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });

    this.matrixTable.appendChild(tbody);
    this.openModal(this.modalMatrix);
  }

  /**
   * Render and open History Modal
   */
  openHistoryModal() {
    this.historyListContainer.innerHTML = '';

    if (this.history.length === 0) {
      this.historyListContainer.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); padding: 2rem;">
          No past grouping rounds recorded yet.
        </div>
      `;
    } else {
      // Reverse chronological order
      [...this.history].reverse().forEach((round, index) => {
        const roundNum = this.history.length - index;
        const card = document.createElement('div');
        card.className = 'history-card';

        const top = document.createElement('div');
        top.className = 'history-card-top';

        const timeStr = new Date(round.timestamp).toLocaleString();
        top.innerHTML = `
          <strong>Round #${roundNum}</strong>
          <span style="color: var(--text-muted);">${timeStr}</span>
        `;

        const summary = document.createElement('div');
        summary.className = 'history-groups-summary';

        const groupsText = (round.groups || []).map((group, gIdx) => {
          const names = group.map(id => round.studentNames?.[id] || this.students.find(s => s.id === id)?.name || id).join(', ');
          return `<div><strong>Group ${gIdx + 1}:</strong> ${names}</div>`;
        }).join('');

        summary.innerHTML = groupsText;

        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.justifyContent = 'flex-end';
        actions.style.gap = '0.5rem';
        actions.style.marginTop = '0.35rem';

        const copyBtn = document.createElement('button');
        copyBtn.className = 'btn btn-secondary btn-sm';
        copyBtn.textContent = 'Copy Text';
        copyBtn.addEventListener('click', () => {
          const formatted = (round.groups || []).map((group, gIdx) => {
            const names = group.map(id => round.studentNames?.[id] || id).join(', ');
            return `Group ${gIdx + 1}: ${names}`;
          }).join('\n');
          navigator.clipboard.writeText(formatted);
          this.showToast(`Copied Round #${roundNum} to clipboard!`);
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-danger btn-sm';
        deleteBtn.textContent = 'Delete Round';
        deleteBtn.addEventListener('click', () => {
          if (confirm(`Delete Round #${roundNum} from history? This will update pairing stats.`)) {
            this.history = this.history.filter(h => h.id !== round.id);
            this.persistHistory();
            this.updateStatsAndPrediction();
            this.openHistoryModal(); // Refresh modal
            this.showToast(`Deleted Round #${roundNum}`);
          }
        });

        actions.appendChild(copyBtn);
        actions.appendChild(deleteBtn);

        card.appendChild(top);
        card.appendChild(summary);
        card.appendChild(actions);

        this.historyListContainer.appendChild(card);
      });
    }

    this.openModal(this.modalHistory);
  }

  /**
   * Clear History Only
   */
  clearHistory() {
    if (this.history.length === 0) return;
    if (confirm('Are you sure you want to reset all pairing history? Student roster will be kept.')) {
      this.history = [];
      this.persistHistory();
      this.updateStatsAndPrediction();
      this.closeModal(this.modalHistory);
      this.closeModal(this.modalSettings);
      this.showToast('Pairing history reset to zero');
    }
  }

  /**
   * Factory Reset (Wipe Everything)
   */
  factoryReset() {
    if (confirm('WARNING: This will wipe all students, history, and settings from localStorage. Continue?')) {
      StorageManager.clearAll();
      this.students = [];
      this.history = [];
      this.selectedGroupSize = 2;
      this.renderRoster();
      this.updateStatsAndPrediction();
      this.groupsContainer.innerHTML = '';
      this.resultsBar.style.display = 'none';
      this.emptyState.style.display = 'block';
      this.closeModal(this.modalSettings);
      this.showToast('All app data cleared');
    }
  }

  /**
   * Export JSON Backup
   */
  exportBackup() {
    const dataStr = StorageManager.exportAllData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `partner-backup-${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast('Exported backup file');
  }

  /**
   * Import JSON Backup
   */
  importBackup(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        StorageManager.importData(content);
        this.students = StorageManager.getStudents();
        this.history = StorageManager.getHistory();
        this.settings = StorageManager.getSettings();
        this.renderRoster();
        this.updateStatsAndPrediction();
        this.closeModal(this.modalSettings);
        this.showToast('Backup restored successfully!');
      } catch (err) {
        alert('Failed to import backup file: Invalid format.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  /**
   * Save helpers
   */
  persistStudents() {
    StorageManager.saveStudents(this.students);
  }

  persistHistory() {
    StorageManager.saveHistory(this.history);
  }

  /**
   * Toast notification system
   */
  showToast(message, duration = 3000) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
}

// Instantiate app on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.partnerApp = new PartnerApp();
});
