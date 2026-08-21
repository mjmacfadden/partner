/**
 * Main Application Controller for Partner
 * Manages multiple classes, rosters, pairing constraints, history, and user interactions.
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
    this.activeClass = StorageManager.getActiveClass();
    this.students = this.activeClass.students || [];
    this.history = this.activeClass.history || [];
    this.constraints = this.activeClass.constraints || [];
    this.settings = StorageManager.getSettings();

    this.selectedGroupSize = this.settings.defaultGroupSize || 2;
    this.currentResult = null;

    this.initDOM();
    this.initTheme();
    this.bindEvents();
    this.renderClassHeader();
    this.renderRoster();
    this.updateStatsAndPrediction();
    this.updateConstraintsBadges();

    // If there's history, restore the latest round display
    if (this.history.length > 0) {
      this.displayLastRoundFromHistory();
    }
  }

  /**
   * Cache DOM elements
   */
  initDOM() {
    // Header & Theme
    this.themeToggleBtn = document.getElementById('btn-toggle-theme');
    this.themeIconSun = document.getElementById('theme-icon-sun');
    this.btnOpenMatrix = document.getElementById('btn-open-matrix');
    this.btnOpenHistory = document.getElementById('btn-open-history');
    this.btnOpenSettings = document.getElementById('btn-open-settings');
    this.btnProjectorMode = document.getElementById('btn-projector-mode');
    this.btnExitProjector = document.getElementById('btn-exit-projector');
    this.historyCountBadge = document.getElementById('history-count-badge');

    // Class Switcher & Headers
    this.btnClassDropdown = document.getElementById('btn-class-dropdown');
    this.classDropdownMenu = document.getElementById('class-dropdown-menu');
    this.classDropdownList = document.getElementById('class-dropdown-list');
    this.currentClassNameHeader = document.getElementById('current-class-name-header');
    this.sidebarClassName = document.getElementById('sidebar-class-name');
    this.btnDropdownNewClass = document.getElementById('btn-dropdown-new-class');
    this.btnDropdownManageClasses = document.getElementById('btn-dropdown-manage-classes');
    this.btnManageClassesSidebar = document.getElementById('btn-manage-classes-sidebar');

    // Class Manager Modal
    this.modalClasses = document.getElementById('modal-classes');
    this.formCreateClass = document.getElementById('form-create-class');
    this.inputNewClassName = document.getElementById('input-new-class-name');
    this.classesListContainer = document.getElementById('classes-list-container');

    // Constraints Elements & Modal
    this.btnOpenConstraints = document.getElementById('btn-open-constraints');
    this.constraintsCountBadge = document.getElementById('constraints-count-badge');
    this.modalConstraints = document.getElementById('modal-constraints');
    this.constraintsClassName = document.getElementById('constraints-class-name');
    this.formAddConstraint = document.getElementById('form-add-constraint');
    this.selectStudent1 = document.getElementById('select-student-1');
    this.selectStudent2 = document.getElementById('select-student-2');
    this.selectConstraintType = document.getElementById('select-constraint-type');
    this.constraintsActiveCount = document.getElementById('constraints-active-count');
    this.constraintsListContainer = document.getElementById('constraints-list-container');

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
    this.constraintStatusBadge = document.getElementById('constraint-status-badge');
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

    // Class Picker & Dropdown
    this.btnClassDropdown.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleClassDropdown();
    });

    document.addEventListener('click', (e) => {
      if (!this.btnClassDropdown.contains(e.target) && !this.classDropdownMenu.contains(e.target)) {
        this.classDropdownMenu.style.display = 'none';
      }
    });

    this.btnDropdownNewClass.addEventListener('click', () => {
      this.classDropdownMenu.style.display = 'none';
      this.openClassesModal();
      setTimeout(() => this.inputNewClassName.focus(), 150);
    });

    this.btnDropdownManageClasses.addEventListener('click', () => {
      this.classDropdownMenu.style.display = 'none';
      this.openClassesModal();
    });

    this.btnManageClassesSidebar.addEventListener('click', () => {
      this.openClassesModal();
    });

    // Create Class Form
    this.formCreateClass.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = this.inputNewClassName.value.trim();
      if (name) {
        this.createClass(name);
        this.inputNewClassName.value = '';
      }
    });

    // Constraints & Rules
    this.btnOpenConstraints.addEventListener('click', () => this.openConstraintsModal());

    this.formAddConstraint.addEventListener('submit', (e) => {
      e.preventDefault();
      const s1 = this.selectStudent1.value;
      const s2 = this.selectStudent2.value;
      const type = this.selectConstraintType.value;
      if (s1 && s2 && type) {
        this.addConstraint(s1, s2, type);
      }
    });

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
    [this.modalMatrix, this.modalHistory, this.modalSettings, this.modalClasses, this.modalConstraints].forEach(modal => {
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
   * Render Class Headers and Dropdown
   */
  renderClassHeader() {
    const className = this.activeClass.name || 'Period 1';
    this.currentClassNameHeader.textContent = className;
    this.sidebarClassName.textContent = className;
    this.constraintsClassName.textContent = className;
  }

  toggleClassDropdown() {
    const isVisible = this.classDropdownMenu.style.display === 'block';
    if (isVisible) {
      this.classDropdownMenu.style.display = 'none';
    } else {
      this.renderClassDropdown();
      this.classDropdownMenu.style.display = 'block';
    }
  }

  renderClassDropdown() {
    const classes = StorageManager.getClasses();
    this.classDropdownList.innerHTML = '';

    classes.forEach(cls => {
      const btn = document.createElement('button');
      btn.className = `dropdown-item ${cls.id === this.activeClass.id ? 'active' : ''}`;

      const nameSpan = document.createElement('span');
      nameSpan.textContent = cls.name;
      nameSpan.style.overflow = 'hidden';
      nameSpan.style.textOverflow = 'ellipsis';
      nameSpan.style.whiteSpace = 'nowrap';

      const meta = document.createElement('span');
      meta.className = 'dropdown-item-meta';
      const studentCount = (cls.students || []).length;
      meta.textContent = `${studentCount} student${studentCount === 1 ? '' : 's'}`;

      btn.appendChild(nameSpan);
      btn.appendChild(meta);

      btn.addEventListener('click', () => {
        this.switchClass(cls.id);
        this.classDropdownMenu.style.display = 'none';
      });

      this.classDropdownList.appendChild(btn);
    });
  }

  /**
   * Open Class Manager Modal
   */
  openClassesModal() {
    this.renderClassesManagerList();
    this.openModal(this.modalClasses);
  }

  renderClassesManagerList() {
    const classes = StorageManager.getClasses();
    this.classesListContainer.innerHTML = '';

    classes.forEach(cls => {
      const isActive = cls.id === this.activeClass.id;
      const card = document.createElement('div');
      card.className = `class-row-card ${isActive ? 'active' : ''}`;

      const info = document.createElement('div');
      info.className = 'class-row-info';

      const name = document.createElement('div');
      name.className = 'class-row-name';
      name.textContent = cls.name;
      if (isActive) {
        const badge = document.createElement('span');
        badge.className = 'constraint-badge prefer';
        badge.style.marginLeft = '0.5rem';
        badge.style.fontSize = '0.7rem';
        badge.textContent = 'Active';
        name.appendChild(badge);
      }

      const meta = document.createElement('div');
      meta.className = 'class-row-meta';
      const studentCount = (cls.students || []).length;
      const historyCount = (cls.history || []).length;
      const rulesCount = (cls.constraints || []).length;
      meta.innerHTML = `
        <span>👥 ${studentCount} students</span>
        <span>•</span>
        <span>📜 ${historyCount} rounds</span>
        <span>•</span>
        <span>🛡️ ${rulesCount} rules</span>
      `;

      info.appendChild(name);
      info.appendChild(meta);

      const actions = document.createElement('div');
      actions.className = 'class-row-actions';

      if (!isActive) {
        const switchBtn = document.createElement('button');
        switchBtn.className = 'btn btn-primary btn-xs';
        switchBtn.textContent = 'Switch';
        switchBtn.addEventListener('click', () => {
          this.switchClass(cls.id);
          this.renderClassesManagerList();
        });
        actions.appendChild(switchBtn);
      }

      const renameBtn = document.createElement('button');
      renameBtn.className = 'btn btn-secondary btn-xs';
      renameBtn.textContent = 'Rename';
      renameBtn.addEventListener('click', () => {
        const newName = prompt(`Rename class "${cls.name}":`, cls.name);
        if (newName && newName.trim() && newName.trim() !== cls.name) {
          StorageManager.renameClass(cls.id, newName.trim());
          if (cls.id === this.activeClass.id) {
            this.activeClass.name = newName.trim();
            this.renderClassHeader();
          }
          this.renderClassesManagerList();
          this.showToast(`Renamed class to "${newName.trim()}"`);
        }
      });
      actions.appendChild(renameBtn);

      const duplicateBtn = document.createElement('button');
      duplicateBtn.className = 'btn btn-secondary btn-xs';
      duplicateBtn.textContent = 'Copy';
      duplicateBtn.title = 'Duplicate class with same roster and rules';
      duplicateBtn.addEventListener('click', () => {
        const dup = StorageManager.duplicateClass(cls.id);
        if (dup) {
          this.switchClass(dup.id);
          this.renderClassesManagerList();
          this.showToast(`Duplicated class as "${dup.name}"`);
        }
      });
      actions.appendChild(duplicateBtn);

      if (classes.length > 1) {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-danger btn-xs';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => {
          if (confirm(`Are you sure you want to delete class "${cls.name}"? This cannot be undone.`)) {
            const nextActive = StorageManager.deleteClass(cls.id);
            this.activeClass = nextActive;
            this.students = this.activeClass.students || [];
            this.history = this.activeClass.history || [];
            this.constraints = this.activeClass.constraints || [];
            this.renderClassHeader();
            this.renderRoster();
            this.updateStatsAndPrediction();
            this.updateConstraintsBadges();
            this.renderClassesManagerList();
            this.showToast(`Deleted class "${cls.name}"`);
          }
        });
        actions.appendChild(deleteBtn);
      }

      card.appendChild(info);
      card.appendChild(actions);
      this.classesListContainer.appendChild(card);
    });
  }

  createClass(name) {
    const newClass = StorageManager.createClass(name);
    this.switchClass(newClass.id);
    this.renderClassesManagerList();
    this.showToast(`Created and switched to "${newClass.name}"`);
  }

  switchClass(classId) {
    const target = StorageManager.switchClass(classId);
    if (!target) return;

    this.activeClass = target;
    this.students = this.activeClass.students || [];
    this.history = this.activeClass.history || [];
    this.constraints = this.activeClass.constraints || [];
    this.currentResult = null;

    this.renderClassHeader();
    this.renderRoster();
    this.updateStatsAndPrediction();
    this.updateConstraintsBadges();

    // Update result view
    if (this.history.length > 0) {
      this.displayLastRoundFromHistory();
    } else {
      this.groupsContainer.innerHTML = '';
      this.resultsBar.style.display = 'none';
      this.emptyState.style.display = 'block';
    }

    this.showToast(`Switched to ${this.activeClass.name}`);
  }

  /**
   * Pairing Constraints Management
   */
  openConstraintsModal() {
    this.constraintsClassName.textContent = this.activeClass.name;
    this.populateConstraintStudentSelects();
    this.renderConstraintsList();
    this.openModal(this.modalConstraints);
  }

  populateConstraintStudentSelects() {
    this.selectStudent1.innerHTML = '<option value="">Select Student 1...</option>';
    this.selectStudent2.innerHTML = '<option value="">Select Student 2...</option>';

    const sortedStudents = [...this.students].sort((a, b) => a.name.localeCompare(b.name));

    sortedStudents.forEach(s => {
      const opt1 = document.createElement('option');
      opt1.value = s.id;
      opt1.textContent = s.name + (s.active ? '' : ' (Absent)');
      this.selectStudent1.appendChild(opt1);

      const opt2 = document.createElement('option');
      opt2.value = s.id;
      opt2.textContent = s.name + (s.active ? '' : ' (Absent)');
      this.selectStudent2.appendChild(opt2);
    });
  }

  addConstraint(studentId1, studentId2, type) {
    if (studentId1 === studentId2) {
      this.showToast('Please select two different students.');
      return;
    }

    const key = GroupingEngine.getPairKey(studentId1, studentId2);
    const existingIndex = this.constraints.findIndex(
      c => GroupingEngine.getPairKey(c.studentId1, c.studentId2) === key
    );

    if (existingIndex !== -1) {
      this.showToast('A pairing rule already exists for these two students.');
      return;
    }

    const newConstraint = {
      id: 'c_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      studentId1,
      studentId2,
      type // 'avoid' | 'prefer'
    };

    this.constraints.push(newConstraint);
    this.persistConstraints();
    this.renderConstraintsList();
    this.updateConstraintsBadges();
    this.updateStatsAndPrediction();

    const s1 = this.students.find(s => s.id === studentId1)?.name || 'Student 1';
    const s2 = this.students.find(s => s.id === studentId2)?.name || 'Student 2';
    const typeLabel = type === 'avoid' ? 'Never Group' : 'Always Group';
    this.showToast(`Rule added: ${s1} & ${s2} (${typeLabel})`);

    // Reset selects
    this.selectStudent1.value = '';
    this.selectStudent2.value = '';
  }

  deleteConstraint(constraintId) {
    this.constraints = this.constraints.filter(c => c.id !== constraintId);
    this.persistConstraints();
    this.renderConstraintsList();
    this.updateConstraintsBadges();
    this.updateStatsAndPrediction();
    this.showToast('Pairing rule removed.');
  }

  renderConstraintsList() {
    this.constraintsListContainer.innerHTML = '';
    this.constraintsActiveCount.textContent = this.constraints.length;

    if (this.constraints.length === 0) {
      this.constraintsListContainer.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); padding: 1.5rem; font-size: 0.85rem; background: var(--bg-card-alt); border-radius: var(--radius-md);">
          No pairing rules set for this class yet.<br>
          Select two students above to add an <strong>Avoid</strong> or <strong>Prefer</strong> rule.
        </div>
      `;
      return;
    }

    const studentMap = new Map();
    this.students.forEach(s => studentMap.set(s.id, s));

    this.constraints.forEach(c => {
      const s1 = studentMap.get(c.studentId1) || { name: 'Unknown Student' };
      const s2 = studentMap.get(c.studentId2) || { name: 'Unknown Student' };

      const card = document.createElement('div');
      card.className = 'constraint-item-card';

      const pairInfo = document.createElement('div');
      pairInfo.className = 'constraint-item-pair';

      const s1Span = document.createElement('strong');
      s1Span.textContent = s1.name;

      const badge = document.createElement('span');
      badge.className = `constraint-badge ${c.type}`;
      badge.textContent = c.type === 'avoid' ? '⛔ Never Pair' : '🔗 Always Pair';

      const s2Span = document.createElement('strong');
      s2Span.textContent = s2.name;

      pairInfo.appendChild(s1Span);
      pairInfo.appendChild(badge);
      pairInfo.appendChild(s2Span);

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn btn-danger btn-xs';
      deleteBtn.textContent = 'Remove';
      deleteBtn.addEventListener('click', () => this.deleteConstraint(c.id));

      card.appendChild(pairInfo);
      card.appendChild(deleteBtn);
      this.constraintsListContainer.appendChild(card);
    });
  }

  updateConstraintsBadges() {
    const count = this.constraints.length;
    this.constraintsCountBadge.textContent = count;
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
    this.updateConstraintsBadges();
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
      this.updateConstraintsBadges();
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

      let ruleText = '';
      if (this.constraints.length > 0) {
        ruleText = ` with <strong>${this.constraints.length} rule${this.constraints.length > 1 ? 's' : ''}</strong> applied`;
      }

      this.groupPrediction.innerHTML = `<strong>${N} active students</strong> will form <strong>${parts.join(' and ')}</strong>${ruleText}.`;
    }

    // Update History Badge
    this.historyCountBadge.textContent = this.history.length;

    // Update Coverage Card
    const stats = GroupingEngine.calculateStats(active, this.history, this.constraints);
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
      this.history,
      this.constraints
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
      repeatPairsCount: result.repeatPairsCount,
      avoidViolations: result.avoidViolations || 0,
      preferSatisfied: result.preferSatisfied || 0,
      preferTotal: result.preferTotal || 0
    };

    this.history.push(roundRecord);
    this.persistHistory();

    // Render Results
    this.renderGeneratedGroups(result, this.history.length);
    this.updateStatsAndPrediction();

    // Friendly feedback
    if (result.avoidViolations > 0) {
      this.showToast(`⚠️ Warning: ${result.avoidViolations} Avoid rule(s) could not be mathematically satisfied.`);
    } else if (result.repeatPairsCount === 0) {
      this.showToast('🎉 Generated fresh non-repeating groups with all rules respected!');
    } else {
      this.showToast(`Generated groups (${result.repeatPairsCount} previous pairing${result.repeatPairsCount > 1 ? 's' : ''} repeated).`);
    }
  }

  /**
   * Display latest round from history on page load or class switch
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
      repeatPairsCount: lastRound.repeatPairsCount || 0,
      avoidViolations: lastRound.avoidViolations || 0,
      preferSatisfied: lastRound.preferSatisfied || 0,
      preferTotal: lastRound.preferTotal || 0
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

    // Constraint status badge
    if (result.avoidViolations && result.avoidViolations > 0) {
      this.constraintStatusBadge.style.display = 'inline-flex';
      this.constraintStatusBadge.className = 'status-badge constraints-warning';
      this.constraintStatusBadge.innerHTML = `⚠️ ${result.avoidViolations} Avoid Conflict`;
    } else if (this.constraints.length > 0) {
      this.constraintStatusBadge.style.display = 'inline-flex';
      this.constraintStatusBadge.className = 'status-badge constraints-ok';
      this.constraintStatusBadge.innerHTML = `🛡️ ${this.constraints.length} Rule${this.constraints.length > 1 ? 's' : ''} Enforced`;
    } else {
      this.constraintStatusBadge.style.display = 'none';
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
    const { avoidPairs, preferPairs } = GroupingEngine.buildConstraintSets(this.constraints);
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
          const isAvoid = avoidPairs.has(key);
          const isPrefer = preferPairs.has(key);

          td.textContent = count;

          let tooltip = `${s1.name} and ${s2.name}: ${count} previous meeting${count === 1 ? '' : 's'}.`;
          if (isAvoid) tooltip += ' [⛔ NEVER PAIR RULE]';
          if (isPrefer) tooltip += ' [🔗 ALWAYS PAIR RULE]';
          td.title = tooltip;

          if (isAvoid) {
            td.style.boxShadow = 'inset 0 0 0 2px var(--danger)';
          } else if (isPrefer) {
            td.style.boxShadow = 'inset 0 0 0 2px var(--primary)';
          }

          if (count === 0) {
            td.className = 'matrix-cell-0';
          } else {
            td.className = 'matrix-cell-met';
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
          No past grouping rounds recorded for ${this.activeClass.name} yet.
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
   * Clear History Only for Current Class
   */
  clearHistory() {
    if (this.history.length === 0) return;
    if (confirm(`Are you sure you want to reset pairing history for "${this.activeClass.name}"? Student roster and pairing rules will be kept.`)) {
      this.history = [];
      this.persistHistory();
      this.updateStatsAndPrediction();
      this.closeModal(this.modalHistory);
      this.closeModal(this.modalSettings);
      this.showToast(`Pairing history reset for ${this.activeClass.name}`);
    }
  }

  /**
   * Factory Reset (Wipe Everything)
   */
  factoryReset() {
    if (confirm('WARNING: This will wipe all classes, student rosters, pairing rules, and history from localStorage. Continue?')) {
      StorageManager.clearAll();
      this.activeClass = StorageManager.getActiveClass();
      this.students = this.activeClass.students || [];
      this.history = this.activeClass.history || [];
      this.constraints = this.activeClass.constraints || [];
      this.selectedGroupSize = 2;
      this.renderClassHeader();
      this.renderRoster();
      this.updateStatsAndPrediction();
      this.updateConstraintsBadges();
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
    a.download = `partner-all-classes-${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast('Exported full multi-class backup file');
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
        this.activeClass = StorageManager.getActiveClass();
        this.students = this.activeClass.students || [];
        this.history = this.activeClass.history || [];
        this.constraints = this.activeClass.constraints || [];
        this.settings = StorageManager.getSettings();

        this.renderClassHeader();
        this.renderRoster();
        this.updateStatsAndPrediction();
        this.updateConstraintsBadges();
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
   * Persistence helpers
   */
  persistStudents() {
    StorageManager.saveStudents(this.students);
    // Refresh constraints after auto-cleanup
    this.constraints = StorageManager.getConstraints();
  }

  persistHistory() {
    StorageManager.saveHistory(this.history);
  }

  persistConstraints() {
    StorageManager.saveConstraints(this.constraints);
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

