/**
 * Grouping and Pairing Algorithm Module
 * Generates optimal, randomized student groups that minimize repeated pairings.
 */

export class GroupingEngine {
  /**
   * Helper to produce a consistent pair key for any two student IDs
   * @param {string} idA
   * @param {string} idB
   * @returns {string}
   */
  static getPairKey(idA, idB) {
    return idA < idB ? `${idA}:::${idB}` : `${idB}:::${idA}`;
  }

  /**
   * Calculate interaction counts between all pairs of students from history
   * @param {Array<{id: string, name: string}>} students
   * @param {Array} history
   * @returns {Map<string, number>} pairKey -> count
   */
  static buildInteractionMap(students, history) {
    const pairCounts = new Map();

    if (!history || !Array.isArray(history)) {
      return pairCounts;
    }

    for (const round of history) {
      if (!round.groups || !Array.isArray(round.groups)) continue;

      for (const group of round.groups) {
        if (!Array.isArray(group)) continue;
        const len = group.length;
        for (let i = 0; i < len; i++) {
          for (let j = i + 1; j < len; j++) {
            const key = this.getPairKey(group[i], group[j]);
            pairCounts.set(key, (pairCounts.get(key) || 0) + 1);
          }
        }
      }
    }

    return pairCounts;
  }

  /**
   * Calculate coverage statistics
   * @param {Array<{id: string, name: string}>} activeStudents
   * @param {Array} history
   * @returns {Object}
   */
  static calculateStats(activeStudents, history) {
    const totalStudents = activeStudents.length;
    if (totalStudents < 2) {
      return {
        totalPossiblePairs: 0,
        metPairs: 0,
        unmetPairs: 0,
        coveragePercent: 0,
        cycleNumber: 1,
        minInteractions: 0,
        maxInteractions: 0,
        allCombinationsMetOnce: false
      };
    }

    const totalPossiblePairs = (totalStudents * (totalStudents - 1)) / 2;
    const pairCounts = this.buildInteractionMap(activeStudents, history);

    let metPairs = 0;
    let minInteractions = Infinity;
    let maxInteractions = 0;

    for (let i = 0; i < totalStudents; i++) {
      for (let j = i + 1; j < totalStudents; j++) {
        const key = this.getPairKey(activeStudents[i].id, activeStudents[j].id);
        const count = pairCounts.get(key) || 0;
        if (count > 0) metPairs++;
        if (count < minInteractions) minInteractions = count;
        if (count > maxInteractions) maxInteractions = count;
      }
    }

    if (minInteractions === Infinity) minInteractions = 0;

    const unmetPairs = totalPossiblePairs - metPairs;
    const coveragePercent = totalPossiblePairs > 0 
      ? Math.round((metPairs / totalPossiblePairs) * 100) 
      : 0;

    const allCombinationsMetOnce = unmetPairs === 0;
    const cycleNumber = minInteractions + 1;

    return {
      totalPossiblePairs,
      metPairs,
      unmetPairs,
      coveragePercent,
      cycleNumber,
      minInteractions,
      maxInteractions,
      allCombinationsMetOnce
    };
  }

  /**
   * Determine balanced group sizes so no student is left alone (size >= 2)
   * @param {number} totalStudents
   * @param {number} targetGroupSize
   * @returns {Array<number>} array of sizes, e.g. [3, 2, 2]
   */
  static calculateBalancedGroupSizes(totalStudents, targetGroupSize) {
    if (totalStudents <= 0) return [];
    if (totalStudents <= targetGroupSize) return [totalStudents];

    const target = Math.max(2, Math.min(targetGroupSize, totalStudents));

    const mFloor = Math.max(1, Math.floor(totalStudents / target));
    const mCeil = Math.max(1, Math.ceil(totalStudents / target));

    const options = [mFloor, mCeil].map(m => {
      const base = Math.floor(totalStudents / m);
      const rem = totalStudents % m;
      const sizes = [];
      for (let i = 0; i < m; i++) {
        sizes.push(i < rem ? base + 1 : base);
      }
      return sizes;
    });

    const valid = options.filter(sizes => {
      if (totalStudents >= 2 && sizes.some(s => s < 2)) return false;
      return true;
    });

    if (valid.length === 0) {
      return options[0];
    }

    valid.sort((a, b) => {
      const scoreA = a.reduce((sum, s) => sum + Math.abs(s - target), 0) / a.length;
      const scoreB = b.reduce((sum, s) => sum + Math.abs(s - target), 0) / b.length;
      return scoreA - scoreB;
    });

    return valid[0];
  }

  /**
   * Pair cost function with high exponential penalty for repeated pairs
   * @param {number} count - number of times pair met before
   * @returns {number}
   */
  static getPairWeight(count) {
    if (count === 0) return 0;
    return Math.pow(1000, count);
  }

  /**
   * Cost function for a single group based on previous interaction counts
   * @param {Array<string>} group - array of student IDs
   * @param {Map<string, number>} pairCounts
   * @returns {number}
   */
  static calculateGroupCost(group, pairCounts) {
    let cost = 0;
    const len = group.length;
    for (let i = 0; i < len; i++) {
      for (let j = i + 1; j < len; j++) {
        const key = this.getPairKey(group[i], group[j]);
        const count = pairCounts.get(key) || 0;
        cost += this.getPairWeight(count);
      }
    }
    return cost;
  }

  /**
   * Total cost of a full grouping partition
   * @param {Array<Array<string>>} groups
   * @param {Map<string, number>} pairCounts
   * @returns {number}
   */
  static calculateTotalCost(groups, pairCounts) {
    let total = 0;
    for (const group of groups) {
      total += this.calculateGroupCost(group, pairCounts);
    }
    return total;
  }

  /**
   * Generate optimal randomized groups avoiding repeats
   * @param {Array<{id: string, name: string}>} activeStudents
   * @param {number} targetGroupSize
   * @param {Array} history
   * @returns {Object}
   */
  static generateGroups(activeStudents, targetGroupSize, history) {
    if (!activeStudents || activeStudents.length === 0) {
      return {
        groups: [],
        groupSizes: [],
        cost: 0,
        newPairsCount: 0,
        repeatPairsCount: 0,
        pairDetails: []
      };
    }

    const studentMap = new Map();
    activeStudents.forEach(s => studentMap.set(s.id, s));

    const totalStudents = activeStudents.length;
    const groupSizes = this.calculateBalancedGroupSizes(totalStudents, targetGroupSize);
    const pairCounts = this.buildInteractionMap(activeStudents, history);

    if (groupSizes.length <= 1) {
      const singleGroup = activeStudents.map(s => s.id);
      const cost = this.calculateGroupCost(singleGroup, pairCounts);
      return this._formatResult([singleGroup], groupSizes, cost, pairCounts, studentMap);
    }

    // Optimization: Simulated Annealing + Multi-Restart Local Search
    const NUM_RESTARTS = Math.min(200, Math.max(50, totalStudents * 8));
    let bestGroups = null;
    let bestCost = Infinity;

    const studentIds = activeStudents.map(s => s.id);

    for (let restart = 0; restart < NUM_RESTARTS; restart++) {
      // 1. Random shuffle
      const shuffled = [...studentIds];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      // 2. Partition into groups
      const currentGroups = [];
      let cursor = 0;
      for (const size of groupSizes) {
        currentGroups.push(shuffled.slice(cursor, cursor + size));
        cursor += size;
      }

      let currentCost = this.calculateTotalCost(currentGroups, pairCounts);

      if (currentCost === 0) {
        bestGroups = currentGroups;
        bestCost = 0;
        break;
      }

      // 3. Fast simulated annealing with 2-opt and 3-opt swaps
      let temp = 50.0;
      const coolingRate = 0.95;
      const MAX_STEPS = 200;

      for (let step = 0; step < MAX_STEPS && temp > 0.01; step++) {
        temp *= coolingRate;

        // Pick two distinct random groups
        const g1 = Math.floor(Math.random() * currentGroups.length);
        let g2 = Math.floor(Math.random() * currentGroups.length);
        while (g2 === g1 && currentGroups.length > 1) {
          g2 = Math.floor(Math.random() * currentGroups.length);
        }

        const group1 = currentGroups[g1];
        const group2 = currentGroups[g2];

        const i1 = Math.floor(Math.random() * group1.length);
        const i2 = Math.floor(Math.random() * group2.length);

        const oldCostG1 = this.calculateGroupCost(group1, pairCounts);
        const oldCostG2 = this.calculateGroupCost(group2, pairCounts);

        // Tentative swap
        const tempStudent = group1[i1];
        group1[i1] = group2[i2];
        group2[i2] = tempStudent;

        const newCostG1 = this.calculateGroupCost(group1, pairCounts);
        const newCostG2 = this.calculateGroupCost(group2, pairCounts);

        const delta = (newCostG1 + newCostG2) - (oldCostG1 + oldCostG2);

        if (delta <= 0 || Math.random() < Math.exp(-delta / Math.max(0.1, temp))) {
          currentCost += delta;
          if (currentCost < bestCost) {
            bestCost = currentCost;
            bestGroups = currentGroups.map(g => [...g]);
            if (bestCost === 0) break;
          }
        } else {
          // Revert swap
          const revert = group1[i1];
          group1[i1] = group2[i2];
          group2[i2] = revert;
        }

        if (bestCost === 0) break;
      }

      if (bestCost === 0) break;
    }

    // Secondary deterministic polish: hill-climbing pass on best solution
    if (bestGroups && bestCost > 0) {
      let improved = true;
      let polishSteps = 0;
      while (improved && polishSteps < 50) {
        improved = false;
        polishSteps++;

        for (let g1 = 0; g1 < bestGroups.length; g1++) {
          for (let g2 = g1 + 1; g2 < bestGroups.length; g2++) {
            const group1 = bestGroups[g1];
            const group2 = bestGroups[g2];

            for (let i = 0; i < group1.length; i++) {
              for (let j = 0; j < group2.length; j++) {
                const oldPairCost = 
                  this.calculateGroupCost(group1, pairCounts) + 
                  this.calculateGroupCost(group2, pairCounts);

                const temp = group1[i];
                group1[i] = group2[j];
                group2[j] = temp;

                const newPairCost = 
                  this.calculateGroupCost(group1, pairCounts) + 
                  this.calculateGroupCost(group2, pairCounts);

                if (newPairCost < oldPairCost) {
                  bestCost += (newPairCost - oldPairCost);
                  improved = true;
                  if (bestCost === 0) break;
                } else {
                  const revert = group1[i];
                  group1[i] = group2[j];
                  group2[j] = revert;
                }
              }
              if (bestCost === 0) break;
            }
            if (bestCost === 0) break;
          }
          if (bestCost === 0) break;
        }
      }
    }

    return this._formatResult(bestGroups, groupSizes, bestCost, pairCounts, studentMap);
  }

  /**
   * Helper to format final result object with enriched data
   * @private
   */
  static _formatResult(groupsOfIds, groupSizes, cost, pairCounts, studentMap) {
    let newPairsCount = 0;
    let repeatPairsCount = 0;
    const pairDetails = [];

    const enrichedGroups = groupsOfIds.map((group, groupIdx) => {
      const studentObjects = group.map(id => studentMap.get(id) || { id, name: id });

      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          const key = this.getPairKey(group[i], group[j]);
          const previousCount = pairCounts.get(key) || 0;
          if (previousCount === 0) {
            newPairsCount++;
          } else {
            repeatPairsCount++;
          }
          pairDetails.push({
            studentA: studentObjects[i].name,
            studentB: studentObjects[j].name,
            previousCount,
            groupIndex: groupIdx + 1
          });
        }
      }

      return studentObjects;
    });

    return {
      groups: enrichedGroups,
      groupIds: groupsOfIds,
      groupSizes,
      cost,
      newPairsCount,
      repeatPairsCount,
      pairDetails
    };
  }

  /**
   * Convert generated groups to nicely formatted text for copying/sharing
   * @param {Array<Array<{name: string}>>} groups
   * @returns {string}
   */
  static formatGroupsToText(groups) {
    if (!groups || groups.length === 0) return '';
    return groups.map((g, idx) => {
      const names = g.map(s => s.name).join(', ');
      return `Group ${idx + 1}: ${names}`;
    }).join('\n');
  }
}
