/**
 * Storage Manager for Partner App
 * Handles multi-class rosters, pairing constraints, history, and settings in localStorage.
 */

const STORAGE_KEYS = {
  // Legacy v1 keys (for automatic migration)
  LEGACY_STUDENTS: 'partner_students_v1',
  LEGACY_HISTORY: 'partner_history_v1',
  LEGACY_SETTINGS: 'partner_settings_v1',

  // Modern multi-class v2 keys
  APP_DATA: 'partner_app_data_v2'
};

export class StorageManager {
  /**
   * Helper to create a default starter class
   * @param {string} name
   * @param {Array} [students=[]]
   * @param {Array} [history=[]]
   * @param {Array} [constraints=[]]
   * @returns {Object}
   */
  static createClassTemplate(name = 'Period 1', students = [], history = [], constraints = []) {
    return {
      id: 'class_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      name,
      createdAt: Date.now(),
      students,
      history,
      constraints
    };
  }

  /**
   * Get default app data structure
   * @private
   */
  static _getDefaultAppData() {
    const defaultClass = this.createClassTemplate('Period 1');
    return {
      version: 2,
      activeClassId: defaultClass.id,
      classes: [defaultClass],
      settings: {
        defaultGroupSize: 2,
        theme: 'system',
        autoRecordHistory: true,
        evenDistribution: true
      }
    };
  }

  /**
   * Load entire application data with automatic v1-to-v2 migration
   * @returns {Object}
   */
  static getAppData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.APP_DATA);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.classes) && parsed.classes.length > 0) {
          // Ensure all classes have valid constraints arrays
          parsed.classes.forEach(cls => {
            if (!Array.isArray(cls.constraints)) {
              cls.constraints = [];
            }
            if (!Array.isArray(cls.students)) {
              cls.students = [];
            }
            if (!Array.isArray(cls.history)) {
              cls.history = [];
            }
          });
          // Ensure activeClassId is valid
          if (!parsed.classes.some(c => c.id === parsed.activeClassId)) {
            parsed.activeClassId = parsed.classes[0].id;
          }
          return parsed;
        }
      }

      // Check for legacy v1 data to migrate
      const legacyStudents = localStorage.getItem(STORAGE_KEYS.LEGACY_STUDENTS);
      const legacyHistory = localStorage.getItem(STORAGE_KEYS.LEGACY_HISTORY);
      const legacySettings = localStorage.getItem(STORAGE_KEYS.LEGACY_SETTINGS);

      if (legacyStudents || legacyHistory) {
        const students = legacyStudents ? JSON.parse(legacyStudents) : [];
        const history = legacyHistory ? JSON.parse(legacyHistory) : [];
        let settings = {
          defaultGroupSize: 2,
          theme: 'system',
          autoRecordHistory: true,
          evenDistribution: true
        };
        if (legacySettings) {
          try {
            settings = { ...settings, ...JSON.parse(legacySettings) };
          } catch (e) {}
        }

        const migratedClass = this.createClassTemplate('Period 1', students, history, []);
        const appData = {
          version: 2,
          activeClassId: migratedClass.id,
          classes: [migratedClass],
          settings
        };
        this.saveAppData(appData);
        return appData;
      }

      // Fresh initialization
      const defaultData = this._getDefaultAppData();
      this.saveAppData(defaultData);
      return defaultData;
    } catch (e) {
      console.error('Failed to load app data:', e);
      return this._getDefaultAppData();
    }
  }

  /**
   * Save entire application data to localStorage
   * @param {Object} data
   */
  static saveAppData(data) {
    try {
      localStorage.setItem(STORAGE_KEYS.APP_DATA, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save app data to localStorage:', e);
    }
  }

  /**
   * Get the currently active class object
   * @returns {Object}
   */
  static getActiveClass() {
    const appData = this.getAppData();
    let active = appData.classes.find(c => c.id === appData.activeClassId);
    if (!active) {
      active = appData.classes[0];
      if (!active) {
        active = this.createClassTemplate('Period 1');
        appData.classes = [active];
      }
      appData.activeClassId = active.id;
      this.saveAppData(appData);
    }
    return active;
  }

  /**
   * Update and save the active class
   * @param {Object} updatedClass
   */
  static saveActiveClass(updatedClass) {
    const appData = this.getAppData();
    const index = appData.classes.findIndex(c => c.id === updatedClass.id);
    if (index !== -1) {
      appData.classes[index] = updatedClass;
    } else {
      appData.classes.push(updatedClass);
    }
    appData.activeClassId = updatedClass.id;
    this.saveAppData(appData);
  }

  /**
   * Switch the active class by ID
   * @param {string} classId
   * @returns {Object|null} The newly active class
   */
  static switchClass(classId) {
    const appData = this.getAppData();
    const target = appData.classes.find(c => c.id === classId);
    if (target) {
      appData.activeClassId = classId;
      this.saveAppData(appData);
      return target;
    }
    return null;
  }

  /**
   * Create a new class and make it active
   * @param {string} className
   * @param {Array} [students=[]]
   * @returns {Object} The new class
   */
  static createClass(className, students = []) {
    const appData = this.getAppData();
    const trimmedName = className.trim() || `Class ${appData.classes.length + 1}`;
    const newClass = this.createClassTemplate(trimmedName, students, [], []);
    appData.classes.push(newClass);
    appData.activeClassId = newClass.id;
    this.saveAppData(appData);
    return newClass;
  }

  /**
   * Rename a class
   * @param {string} classId
   * @param {string} newName
   */
  static renameClass(classId, newName) {
    const appData = this.getAppData();
    const cls = appData.classes.find(c => c.id === classId);
    if (cls && newName.trim()) {
      cls.name = newName.trim();
      this.saveAppData(appData);
    }
  }

  /**
   * Duplicate a class (copies roster & constraints, starts fresh history)
   * @param {string} classId
   * @param {string} [customName]
   * @returns {Object|null}
   */
  static duplicateClass(classId, customName) {
    const appData = this.getAppData();
    const sourceClass = appData.classes.find(c => c.id === classId);
    if (!sourceClass) return null;

    const duplicatedName = customName || `${sourceClass.name} (Copy)`;
    const duplicatedStudents = JSON.parse(JSON.stringify(sourceClass.students || []));
    const duplicatedConstraints = JSON.parse(JSON.stringify(sourceClass.constraints || []));

    const newClass = this.createClassTemplate(duplicatedName, duplicatedStudents, [], duplicatedConstraints);
    appData.classes.push(newClass);
    appData.activeClassId = newClass.id;
    this.saveAppData(appData);
    return newClass;
  }

  /**
   * Delete a class by ID
   * @param {string} classId
   * @returns {Object} The new active class
   */
  static deleteClass(classId) {
    const appData = this.getAppData();
    appData.classes = appData.classes.filter(c => c.id !== classId);
    if (appData.classes.length === 0) {
      const freshClass = this.createClassTemplate('Period 1');
      appData.classes = [freshClass];
      appData.activeClassId = freshClass.id;
    } else if (appData.activeClassId === classId) {
      appData.activeClassId = appData.classes[0].id;
    }
    this.saveAppData(appData);
    return this.getActiveClass();
  }

  /**
   * Get all classes list
   * @returns {Array<Object>}
   */
  static getClasses() {
    const appData = this.getAppData();
    return appData.classes || [];
  }

  /**
   * Load students of currently active class
   * @returns {Array<{id: string, name: string, active: boolean}>}
   */
  static getStudents() {
    const active = this.getActiveClass();
    return active.students || [];
  }

  /**
   * Save students list to active class
   * @param {Array<{id: string, name: string, active: boolean}>} students
   */
  static saveStudents(students) {
    const active = this.getActiveClass();
    active.students = students;
    // Auto-cleanup constraints referencing deleted student IDs
    const studentIdSet = new Set(students.map(s => s.id));
    if (Array.isArray(active.constraints)) {
      active.constraints = active.constraints.filter(
        c => studentIdSet.has(c.studentId1) && studentIdSet.has(c.studentId2)
      );
    }
    this.saveActiveClass(active);
  }

  /**
   * Load grouping history rounds for active class
   * @returns {Array}
   */
  static getHistory() {
    const active = this.getActiveClass();
    return active.history || [];
  }

  /**
   * Save history rounds for active class
   * @param {Array} history
   */
  static saveHistory(history) {
    const active = this.getActiveClass();
    active.history = history;
    this.saveActiveClass(active);
  }

  /**
   * Load constraints for active class
   * @returns {Array<{id: string, studentId1: string, studentId2: string, type: 'avoid'|'prefer'}>}
   */
  static getConstraints() {
    const active = this.getActiveClass();
    return active.constraints || [];
  }

  /**
   * Save constraints for active class
   * @param {Array<{id: string, studentId1: string, studentId2: string, type: 'avoid'|'prefer'}>} constraints
   */
  static saveConstraints(constraints) {
    const active = this.getActiveClass();
    active.constraints = constraints;
    this.saveActiveClass(active);
  }

  /**
   * Load app settings
   * @returns {Object}
   */
  static getSettings() {
    const appData = this.getAppData();
    const defaultSettings = {
      defaultGroupSize: 2,
      theme: 'system',
      autoRecordHistory: true,
      evenDistribution: true
    };
    return { ...defaultSettings, ...(appData.settings || {}) };
  }

  /**
   * Save app settings
   * @param {Object} settings
   */
  static saveSettings(settings) {
    const appData = this.getAppData();
    appData.settings = settings;
    this.saveAppData(appData);
  }

  /**
   * Export all data as JSON
   * @returns {string}
   */
  static exportAllData() {
    const appData = this.getAppData();
    const exportObj = {
      version: 2,
      exportedAt: new Date().toISOString(),
      activeClassId: appData.activeClassId,
      classes: appData.classes,
      settings: this.getSettings()
    };
    return JSON.stringify(exportObj, null, 2);
  }

  /**
   * Import data from JSON string (supports v1 and v2 formats)
   * @param {string} jsonString
   */
  static importData(jsonString) {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid backup file format');
    }

    // Version 2 structure
    if (Array.isArray(parsed.classes) && parsed.classes.length > 0) {
      const appData = {
        version: 2,
        activeClassId: parsed.activeClassId || parsed.classes[0].id,
        classes: parsed.classes,
        settings: parsed.settings || this.getSettings()
      };
      this.saveAppData(appData);
      return true;
    }

    // Legacy Version 1 structure
    if (Array.isArray(parsed.students)) {
      const importedClass = this.createClassTemplate(
        'Imported Class',
        parsed.students || [],
        parsed.history || [],
        []
      );
      const appData = {
        version: 2,
        activeClassId: importedClass.id,
        classes: [importedClass],
        settings: parsed.settings || this.getSettings()
      };
      this.saveAppData(appData);
      return true;
    }

    throw new Error('Unrecognized backup format');
  }

  /**
   * Clear all stored application data completely
   */
  static clearAll() {
    localStorage.removeItem(STORAGE_KEYS.APP_DATA);
    localStorage.removeItem(STORAGE_KEYS.LEGACY_STUDENTS);
    localStorage.removeItem(STORAGE_KEYS.LEGACY_HISTORY);
    localStorage.removeItem(STORAGE_KEYS.LEGACY_SETTINGS);
  }
}
