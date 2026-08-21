/**
 * Storage Manager for Partner App
 * Handles reading and writing students, history, and settings to localStorage.
 */

const STORAGE_KEYS = {
  STUDENTS: 'partner_students_v1',
  HISTORY: 'partner_history_v1',
  SETTINGS: 'partner_settings_v1'
};

export class StorageManager {
  /**
   * Load students from localStorage
   * @returns {Array<{id: string, name: string, active: boolean}>}
   */
  static getStudents() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load students from storage:', e);
      return [];
    }
  }

  /**
   * Save students list to localStorage
   * @param {Array<{id: string, name: string, active: boolean}>} students
   */
  static saveStudents(students) {
    try {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    } catch (e) {
      console.error('Failed to save students to storage:', e);
    }
  }

  /**
   * Load grouping history rounds
   * @returns {Array<{id: string, timestamp: number, groupSize: number, groups: Array<Array<string>>, studentNames: Object<string, string>}>}
   */
  static getHistory() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load history from storage:', e);
      return [];
    }
  }

  /**
   * Save history rounds to localStorage
   * @param {Array} history
   */
  static saveHistory(history) {
    try {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save history to storage:', e);
    }
  }

  /**
   * Load settings
   * @returns {Object}
   */
  static getSettings() {
    const defaultSettings = {
      defaultGroupSize: 2,
      theme: 'system',
      autoRecordHistory: true,
      evenDistribution: true
    };
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...defaultSettings, ...JSON.parse(data) } : defaultSettings;
    } catch (e) {
      return defaultSettings;
    }
  }

  /**
   * Save settings
   * @param {Object} settings
   */
  static saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  }

  /**
   * Export all data as JSON
   * @returns {string}
   */
  static exportAllData() {
    const exportObj = {
      version: 1,
      exportedAt: new Date().toISOString(),
      students: this.getStudents(),
      history: this.getHistory(),
      settings: this.getSettings()
    };
    return JSON.stringify(exportObj, null, 2);
  }

  /**
   * Import data from JSON string
   * @param {string} jsonString
   */
  static importData(jsonString) {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid backup file format');
    }
    if (Array.isArray(parsed.students)) {
      this.saveStudents(parsed.students);
    }
    if (Array.isArray(parsed.history)) {
      this.saveHistory(parsed.history);
    }
    if (parsed.settings && typeof parsed.settings === 'object') {
      this.saveSettings(parsed.settings);
    }
    return true;
  }

  /**
   * Clear all stored application data
   */
  static clearAll() {
    localStorage.removeItem(STORAGE_KEYS.STUDENTS);
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  }
}
