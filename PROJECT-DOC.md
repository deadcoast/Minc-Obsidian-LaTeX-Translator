---
# M\|inc Obsidian LaTeX Translator
**“Mathematically Incorperate” – An Obsidian LaTeX Translator**

---

## Table of Contents

- [[#1. Core Goals & Overview]]
  - _Primary Goal_
  - _Secondary Goals (Ease-of-use, Visual Integration, Customizability, Error Handling)_
- [[#2. Folder & File Layout]]
  - _Directory Structure_
  - _Key Files (`manifest.json`, `main.ts`, etc.)_
- [[#3. Front-End Enhancements]]
  - .[[#3.1. React-Based UI]]
    - Installing React & ReactDOM
    - Mounting the React Component
    - Real-Time Preview, Logs, Controls
  - [[#3.2. Obsidian CSS Styling & Theming]]
    - CSS & Theming in `styles.css`
    - Dynamic Classes & Theme Variables
  - [[#3.3. Ribbon Icon & Commands]]
    - Adding a Ribbon Icon
    - Command & Context Menu Integration
- [[#4. Back-End Functionality]]
  - [[#4.1. TypeScript Parser]]
    - `latexParser.ts` (Bracket Replacements, Environment Conversions)
  - [[#4.2. Settings & Keybinds]]
    - Settings Interface & Persistence
    - Creating a Plugin Setting Tab
  - [[#4.3. Editor Operations]]
    - Commands for Selection Conversion
    - Commands for Entire File
  - [[#4.4. Vault Operations (Folder or Vault-Wide)]]
    - Batch Conversions
    - Progress & Notifications
- [[#5. Compilation & Workflow]]
  - [[#A. `package.json` & Scripts]]
  - [[#B. `tsconfig.json`]]
  - [[#C. Reloading]]
- [[#6. Example Workflow]]
  - Installing/Enabling the Plugin
  - Configuring Settings
  - Using Commands & the React Panel
  - Completion & Feedback
- [[#7. Summary & Best Practices]]
  - [[#1. Plugin Setup]]
  - [[#2. Settings & Commands]]
  - [[#3. User Interface & Experience]]
  - [[#4. Parser & Vault Operations]]
  - [[#5. Advanced Features & Extensibility]]

---

## 1. Core Goals & Overview

**Primary Goal**: Provide a convenient way to convert classic LaTeX syntax into Obsidian-compatible LaTeX, with a strong focus on user experience, aesthetics, and flexibility (selection-based, file-based, folder-based, or vault-wide conversions).

**Secondary Goals**:

1. **Ease-of-use**: Quick transformations via commands, ribbon icons, or keyboard shortcuts.
2. **Visual & Thematic Integration**: A React-based panel or “ItemView” that’s cohesive with Obsidian’s Dark/Light themes.
3. **Customizability**: Settings to tailor conversions (e.g., bracket transformations, notifications, auto-replace) and personalized user interface.
4. **Error Handling & Feedback**: Inline or popup notifications (e.g., using `new Notice()`) to inform users about successes, errors, or warnings.

---

## 2. Folder & File Layout

Your `.obsidian/plugins/` directory may look like this:

```
[YourVault]/.obsidian/plugins/
  obsidian-minc-latex-translator/
    ├─ manifest.json
    ├─ main.ts
    ├─ package.json
    ├─ tsconfig.json
    ├─ styles.css               (optional but recommended for custom styling)
    ├─ settings.ts              (handles plugin settings and UI)
    ├─ ReactView.tsx            (React component for advanced UI/features)
    ├─ latexParser.ts           (your TypeScript-based LaTeX→Obsidian transformations)
    └─ ...
```

**Key Files**

1. **`manifest.json`**: Basic plugin metadata (name, ID, version).
2. **`main.ts`**: Plugin entry point. Registers commands, loads settings, mounts React UI if needed, etc.
3. **`settings.ts`**: Manages saving/loading settings, user-facing Settings tab, default setting values.
4. **`ReactView.tsx`**: Optional but ideal for advanced UI or real-time previews (uses React + ReactDOM).
5. **`latexParser.ts`**: Core parser logic to do bracket replacements or any specialized LaTeX→Obsidian transformations (already completed, as you noted).
6. **`styles.css`**: Custom styles to unify the UI theme and handle advanced styling (especially if using React).

### `manifest.json`

Below is a sample `manifest.json` adapted to your official plugin name:

```json
{
  "id": "obsidian-minc-latex-translator",
  "name": "Obsidian M|inc LaTeX Translator",
  "version": "1.0.0",
  "minAppVersion": "1.0.0",
  "description": "Convert classic LaTeX to Obsidian Math Incorperation LaTeX style.",
  "author": "Your Name",
  "authorUrl": "https://example.com",
  "isDesktopOnly": false
}
```

- **`id`**: Typically all lowercase, often dash-separated.
- **`name`**: The user-facing name, matching your **“Obsidian M\|inc LaTeX Translator”**.
- **`version`**: Your plugin’s version, e.g. `1.0.0`.
- **`minAppVersion`**: Minimum Obsidian version required (e.g., `1.0.0`).
- **`isDesktopOnly`**: `true` if you don’t want to support mobile (due to Python dependencies or other reasons). Otherwise, leave as `false`.

---

## 3. Front-End Enhancements

### 3.1. React-Based UI

1. **Include React & ReactDOM**

   - Run: `npm install react react-dom`
   - In `ReactView.tsx`, export a top-level React component (`<MincLatexPanel />` or similar) that manages the plugin’s advanced UI or real-time previews.
   - In `ReactView.tsx`, implement a robust UI (real-time preview, logs, transformations).

2. **Mounting Your React Component**

   - Inside `main.ts` (or your `ItemView` class), create a container element (e.g., `contentEl.createDiv({ cls: 'minc-latex-panel' })`) and mount the React component with `ReactDOM.render(<MincLatexPanel {...props} />, containerEl)`.
   - Pass the Obsidian `App` or plugin instance as props if needed.

3. **App Context & State Management**

   - For growing complexity, consider using React context or a small state-management library. If you only pass `App` or plugin references in a few places, simple props are enough.

4. **UI Elements**

   - **Real-Time Preview**: Show an input area next to a “transformed output” area so users see how the classic LaTeX is being translated.
   - **Logs / Warnings**: Provide a small panel listing any errors (unmatched brackets, ambiguous commands, etc.).
   - **Controls**: Offer quick transformations, toggles for bracket conversion types, or advanced replacements (e.g., `\begin{align}` → `\begin{aligned}`).

5. **Lucide Ribbon Bar & Icon Integration**

   - **Custom Icon**: Add a unique icon that indicates LaTeX or math transformations (you could even design a custom icon with `addIcon()`, or use a [Lucide](https://lucide.dev) math-related icon).
   - **Click Behavior**: On click, open either:
     - The custom `ReactView`, or;
     - A command that automatically runs the transformation on the active editor.
   - **Hover Tooltip**: Provide a succinct description like “Incorperate Mathematics - Convert LaTeX to Obsidian style.”
   - `npm install lucide-react`
   - Import icons in React code, e.g. `import { Code } from "lucide-react";`
   - Use `<Code size="24" color="currentColor" />` or pass any SVG attributes as props.
   - Perfect for visually marking math/LaTeX transformations.

6. **Optional UI Enhancements**
   - Provide toggles, text fields, or even a real-time preview.
   - Show logs or warnings for incomplete LaTeX.
   - Provide a batch-convert button that triggers your TypeScript parser for an entire folder or vault.
   - After a conversion, display a small `[new Notice("Mathematics Incorperated successfully! LaTeX Converted.")]`.
   - If an error occurs (e.g., unmatched brackets), show a warning notice or highlight the text in the UI.

### 3.2. Obsidian CSS Styling & Theming

1. **CSS & Theming**

   - Place your custom styles in `styles.css`.
   - Reference Obsidian’s theme variables for a consistent look.
     - Use Obsidian’s CSS variables (e.g., `--text-muted`, `--background-modifier-border`) to ensure your plugin looks great in all themes (Dark, Light, or custom community themes).
   - Provide toggles (like `toggleClass`) for dynamic styling based on user settings, e.g., highlight errors or warnings if you detect questionable LaTeX patterns.

2. **Styling & Theming**

   - In `styles.css`, target `.my-plugin-class { ... }` or `.theme-dark` / `.theme-light` if needed.
   - Use Obsidian’s built-in CSS variables, e.g. `--background-primary`, `--text-accent`, etc., for consistent theming.

3. **Conditional Classes**
   - `toggleClass("error-state", isError)` to highlight elements when you detect invalid LaTeX or parse failures.

### 3.3. Ribbon Icon & Commands

1. **Add Ribbon Icon**:

   ```ts
   this.addRibbonIcon('dice', 'M|inc LaTeX Translator', () => {
     new Notice('Launching M|inc LaTeX Translator UI...');
     // Optionally open your ReactView or run a command
   });
   ```

   Replace `'dice'` with a custom icon from [Lucide icons](https://lucide.dev) if desired, using `addIcon()` or a built-in Obsidian icon.

2. **Context Menu / Commands**
   - **Commands**: Let users open the React panel, transform selection, transform entire file, or do folder/vault transformations.
   - **Keybinds**: For each command, register a hotkey so users can quickly invoke transformations.

---

## 4. Back-End Functionality

### 4.1. TypeScript Parser

1. **`latexParser.ts`** (already completed in your plan) performs bracket and LaTeX transformations.
   - Keep it modular so you can re-use it in:
     - The editor commands (single file or selection)
     - The React-based “batch transformation” flow
     - Vault-wide transformations, etc.

### 4.2. Settings & Keybinds

1. **Settings Definition**

   ```ts
   export interface MincLatexSettings {
     autoReplace: boolean;
     showNotifications: boolean;
     pythonPath?: string;
     // Additional user config as needed
   }

   export const DEFAULT_SETTINGS: MincLatexSettings = {
     autoReplace: false,
     showNotifications: true,
     pythonPath: '',
   };
   ```

   - Extend these as needed (e.g., custom bracket pairs, ignoring certain environments, etc.).

2. **Persisting Settings**

   - In `main.ts`:
     ```ts
     async loadSettings() {
     this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
     }
     async saveSettings() {
     await this.saveData(this.settings);
     }
     ```
   - Call `await this.loadSettings()` inside `onload()`, and `this.saveSettings()` after changes.

3. **Settings Tab**
   - Create a `MincLatexSettingTab` class extending `PluginSettingTab`.
   - Provide toggles, text inputs, and buttons to manage plugin behavior.

### 4.3. Editor Operations

- **Selection-Based**:

  ```ts
  this.addCommand({
    id: 'convert-selection-to-obsidian-latex',
    name: 'Convert Selection',
    editorCallback: (editor) => {
      const selection = editor.getSelection();
      const converted = convertLatex(selection);
      editor.replaceSelection(converted);
      if (this.settings.showNotifications) {
        new Notice('Selection converted!');
      }
    },
  });
  ```

- **File-Based**:
  ```ts
  this.addCommand({
    id: 'convert-file-to-obsidian-latex',
    name: 'Convert Current File',
    editorCallback: (editor) => {
      const content = editor.getValue();
      const converted = convertLatex(content);
      editor.setValue(converted);
      new Notice('File converted!');
    },
  });
  ```

### 4.4. Vault Operations (Folder or Vault-Wide)

1. **Folder or Vault-Wide**:

   - Retrieve a list of `.md` files from a folder or the entire vault:

   ```ts
   const markdownFiles = this.app.vault.getMarkdownFiles();
   ```

   - Loop through them, read the file contents (`vault.read(file)`), parse, then write back with `vault.modify(file, newContents)`.
   - Provide a progress indicator or logs in the React UI so the user sees conversion steps or errors.

2. **Checking File vs. Folder**:

   - If you let the user pick a TAbstractFile, confirm `instanceof TFile` vs. `TFolder`.

3. **Batch Conversion**:
   - Offer a button in your ReactView or Settings tab labeled “Convert Entire Folder” or “Convert Entire Vault.”
   - Because this could be time-consuming, display a progress bar or stepwise notices.

---

## 5. Compilation & Workflow

### A. `package.json` & Scripts

Your `package.json` might look like:

```json
{
  "name": "obsidian-minc-latex-translator",
  "version": "1.0.0",
  "scripts": {
    "dev": "webpack --mode=development --watch",
    "build": "webpack --mode=production"
  },
  "devDependencies": {
    "typescript": "^4.7.0",
    "webpack": "^5.0.0",
    "webpack-cli": "^4.0.0",
    "obsidian": "latest" // or a pinned version
  }
}
```

- `dev` script watches for file changes and recompiles automatically.
- `build` script creates an optimized `main.js`.

### B. `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM"],
    "module": "ESNext",
    "sourceMap": true,
    "jsx": "react-jsx",
    "outDir": "build"
  },
  "include": ["main.ts", "ReactView.tsx", "settings.ts", "latexParser.ts"]
}
```

Adjust paths to suit your layout.

### C. Reloading

- **Manual**: Toggle off the plugin in Obsidian → Toggle it on again.
- **Command Palette**: Use **Reload app without saving**.
- **Hot Reload Plugin**: Install the [Hot-Reload plugin](https://github.com/pjeby/hot-reload) for automatically reloading your plugin upon build changes.

1. **Real-Time Preview Panel**

   - In ReactView, add a split panel: left side for raw LaTeX input, right side for the converted Obsidian LaTeX output.
   - This helps users confirm the parser is doing what they expect.

2. **Error Handling**

   - If the parser encounters incomplete bracket pairs or unknown environments, highlight them with a notice or color-coded text in the React panel.

3. **Logs & History**

   - Optionally store a short history of transformations or a mini log for debugging.
   - Useful if a large batch transformation fails in the middle.

4. **Notifications & Theming**

   - Honor Obsidian’s themes by using CSS variables and minimal override styles.
   - For bigger transformations, you could use `new Notice("Converting file 4/10...")` or a progress bar in the React UI.

5. **Hot Reload / Development Flow**

   - Use a local dev environment with:

   ```json
   {
     "scripts": {
       "dev": "webpack --mode=development --watch",
       "build": "webpack --mode=production"
     }
   }
   ```

   - Optionally install the [Obsidian Hot-Reload plugin](https://github.com/pjeby/hot-reload) to skip manual toggling while coding.

6. **Testing**

   - Consider writing a small test suite for your parser logic (e.g., using [Jest](https://jestjs.io/)) so you can quickly verify bracket translations or environment transforms.

7. **User Documentation**
   - Provide a quick “How to Use” in your plugin’s README or a short help button in the React panel.
   - Outline each command (selection, file, folder, vault) and mention default hotkeys.

---

## 6. Example Workflow

1. **Install / Enable Plugin**

   - Place folder in `.obsidian/plugins/`, ensure `manifest.json` is valid.
   - Toggle on “Obsidian M|inc LaTeX Translator” in Obsidian’s Community Plugins tab.

2. **Load & Configure Settings**

   - Access “Settings → M|inc LaTeX Translator” to set toggles (autoReplace, notifications), define custom transformations, or specify a python path (if using advanced Python hooking).

3. **Use Commands**

   - Press your hotkey or open the Command Palette to run: “Convert Selection,” “Convert File,” “Convert Folder,” or “Open M|inc LaTeX Panel” (the React UI).
   - If autoReplace is on, your text is converted as you type or upon file save (depending on your logic).

4. **React Panel**

   - Launch the panel from the ribbon icon or command.
   - Paste sample LaTeX on the left → see the immediate translation on the right.
   - Optionally click “Apply to Current File” or “Batch Convert a Folder.”

5. **Completion**
   - The user sees a success notice or any warnings.
   - All processed content is now in the desired Obsidian LaTeX style.

---

Below is a concise **Table of Contents** for your M\|inc Obsidian LaTeX Translator plan, using the same section headings and structure you outlined. Feel free to use this as a high-level guide or quick reference.

---

## 7. Summary & Best Practices

### 1. Plugin Setup

- **Name & ID**

  - Use the official plugin name: **“Obsidian M\|inc LaTeX Translator”**.
  - Keep your folder name and `manifest.json` `id` consistent.

- **Folder Structure**

  - Organize core files (e.g., `manifest.json`, `main.ts`, compiled outputs) logically.
  - Maintain clarity for future expansion or collaboration.

- **Core Files**
  - **`manifest.json`**: Contains plugin metadata (id, version, etc.).
  - **`main.ts`**: Your plugin’s entry point.
  - **Compiled Output**: Bundle or transpile TypeScript/React code as needed.

---

### 2. Settings & Commands

- **Settings (PluginSettingTab)**

  - Provide a settings tab if your plugin offers user-configurable options (e.g., toggle auto-replace, set default behaviors).
  - Persist user preferences for consistency across sessions.

- **Commands**

  - Register commands in `onload()` to allow quick transformations.
  - Consider scope-specific commands (e.g., transform selection, file, folder, entire vault).

- **Keybinds & Toggles**

  - Allow users to assign hotkeys for common actions.
  - Include toggle-based features (e.g., enable/disable auto-replace, show/hide notifications).

- **Reloading**
  - Reload the plugin manually or via a hot-reload tool after code changes to see updates quickly.

---

### 3. User Interface & Experience

- **React & UI**

  - Enhance the UI with React (or a minimal settings panel) for real-time previews, theming, icons, and logs.
  - Provide a ribbon icon or toolbar button for easy access.

- **Visual Feedback**

  - Show notifications for successful transformations or errors.
  - Consider a logs panel for advanced usage or debugging.

- **Themed Aesthetics**

  - Use Obsidian’s color variables and class toggling to match various themes.
  - Include an optional `styles.css` for advanced styling that respects user-selected themes.

- **User-Centric Design**
  - Keep controls intuitive and documentation clear.
  - Use error highlighting or graceful fallback behaviors to reduce frustration.

---

### 4. Parser & Vault Operations

- **TypeScript-Based Parser**

  - Use TypeScript for bracket replacements and LaTeX transformations; it’s simpler and cross-platform friendly.
  - Handle edge cases gracefully (partial/incorrect LaTeX) for robust error handling.

- **Batch vs. Selection**

  - Provide different commands for operating on the current selection, an entire file, a folder, or the full vault.
  - Ensure efficiency and clarity in how transformations are applied.

- **Error Handling & Notifications**
  - Catch parsing errors or malformed LaTeX gracefully.
  - Notify the user in-app if an operation cannot be completed.

---

### 5. Advanced Features & Extensibility

- **Future Expansions**

  - Additional LaTeX syntax conversions (e.g., more math environments, specialized code blocks).
  - Thematic or context-aware transformations (e.g., different parser modes).

- **Logs & Diagnostics**

  - Optionally store transformation logs for troubleshooting.
  - Consider advanced toggles in the settings tab (e.g., verbose mode).

- **Extensible Architecture**
  - Keep the parser modular so you can easily add or modify rules.
  - Consider user-requested features or community pull requests.

---
