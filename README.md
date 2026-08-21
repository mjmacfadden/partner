# Partner 🤝

A fast, lightweight, and modern student group & pair generator built with **Vanilla HTML5, CSS3, and JavaScript**.

Partner uses an optimization algorithm to randomly pair or group students into **2s (Pairs)**, **3s (Trios)**, **4s (Quads)**, or **Custom sizes** without repeating pairings until all combinations of students have worked with one another.

---

## ✨ Features

- **Multi-Class Rosters & Management**:
  - Switch effortlessly between multiple classes (e.g. Period 1, Period 2, Math 101, Science Lab).
  - Each class maintains its own independent student roster, attendance states, grouping history, pairing rules, and interaction matrix.
  - Create, rename, duplicate (with roster & rules preserved), and delete classes with 1-click.
- **Pairing Rules & Constraints**:
  - **Avoid (Never Pair)**: Enforce rules that prevent specified pairs of students from ever being grouped together.
  - **Prefer (Always Pair)**: Prioritize keeping partners together (e.g. peer tutors, accommodations, ESL partners).
  - High-priority penalty optimization seamlessly integrates rules with non-repeating history balance.
  - Visual rule indicators and matrix highlighting.
- **Smart Non-Repeating Pairing Engine**: Uses simulated annealing and multi-restart local search with exponential penalty scoring. It guarantees that pairings will not repeat until every student has paired with every other student (or minimal mathematically inevitable overlaps for odd sizes/quads). Once all pairs have met, it seamlessly transitions into Cycle 2.
- **Flexible Student Entry**:
  - Add students individually with quick Enter-key support.
  - Bulk / CSV input (paste comma-separated or newline-separated names).
  - 1-click **Sample Class** button to test with 12 mock students.
- **Attendance & Presence Toggling**: Check/uncheck students who are absent for the day without deleting them or losing their historical pairings.
- **Zero-Lone-Student Distribution**: Automatically balances odd remainders (e.g. 11 students in pairs creates 4 pairs and 1 trio so nobody is ever left alone).
- **Classroom Projector Mode**: Fullscreen high-contrast presentation mode with large student chips designed for classroom smartboards and projectors.
- **Interaction Matrix & Coverage Stats**:
  - Live progress bar showing what percentage of all possible classmate pairings have been formed.
  - Visual grid/matrix showing the exact number of times any two students have been grouped together, complete with pairing rule badges.
- **Full Round History & Revert**: View all past rounds, copy formatted text for LMS/Slack/email, or delete/undo individual rounds.
- **Persistent Local Storage**: All classes, rosters, rules, rounds, and settings are saved locally in the browser (`localStorage`) with backward-compatible v1 migration.
- **Data Backup & Restore**: Export and import full multi-class databases and history as JSON files.
- **Installable Web App (PWA)**: Includes a Web App Manifest and Service Worker so you can install it as a standalone desktop or mobile web app and run it completely offline.
- **Dark & Light Mode**: Clean, accessible design that respects system preferences and allows manual toggle.

---

## 🚀 Getting Started

No build steps or Node packages are required! You can run the application directly in any web browser.

### Option 1: Direct File Opening
Double-click `index.html` or open it directly in Google Chrome, Microsoft Edge, Firefox, or Safari.

### Option 2: Local HTTP Server (Recommended for PWA / Service Workers)
Using any local static file server:

```bash
# Using Python 3
python3 -m http.server 8080

# Or using Node.js npx
npx serve .
```
Then navigate to `http://localhost:8080` in your browser.

---

## 📁 Project Structure

```
partner/
├── index.html          # Semantic HTML5 layout and modal dialogs
├── manifest.json       # Progressive Web App manifest
├── sw.js               # Service Worker for offline caching
├── css/
│   └── styles.css      # Modern responsive styles, dark mode, projector view
├── js/
│   ├── app.js          # Multi-class controller, constraints, and state management
│   ├── grouping.js     # Constraint-aware pairing and group optimization engine
│   └── storage.js      # Multi-class storage manager and JSON import/export
└── icons/
    └── icon.svg        # Scalable application icon
```

---

## 💻 How the Pairing Algorithm Works

1. **Pair Interaction Map**: The algorithm maintains a frequency map of previous interactions for every student pair $(u, v)$.
2. **Objective Function**: For a proposed grouping partition $G$, the cost is:
   $$\text{Cost}(G) = \sum_{\text{group } g \in G} \sum_{\{u, v\} \subseteq g} \left( 1000^{\text{count}(u, v)} + 10^9 \cdot \mathbb{I}_{\text{avoid}}(u, v) \right) + \sum_{(a, b) \in \text{Prefer}} 10^8 \cdot \mathbb{I}_{\text{separated}}(a, b)$$
   The tiered penalty hierarchy guarantees that:
   - **Avoid (Never Pair)** rules are strictly respected ($10^9$).
   - **Prefer (Always Pair)** rules are prioritized next ($10^8$).
   - Unmet pairs (0 interactions) are prioritized over repeated pairs ($10^3, 10^6 \dots$).
3. **Simulated Annealing & Local Search**: The engine executes multi-start randomized searches with temperature-cooled swaps, followed by a deterministic hill-climbing polish to find the global optimum partition for each round.
