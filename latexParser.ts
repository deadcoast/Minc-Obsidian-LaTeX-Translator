/*******************************************************
 * TYPES & INTERFACES
 ********************************************************/
export interface ParserOptions {
	/** Convert \begin{env}...\end{env} to $$ blocks? */
	convertEnvironments?: boolean;

	/** Additional environment names you want to treat as display math.
	 *  By default, we handle: equation, align, align*, cases
	 */
	extraEnvironments?: string[];

	/** Also convert eqnarray to $$...$$? */
	convertEqnarray?: boolean;

	/** Remove \label{} entirely? */
	removeLabels?: boolean;

	/** How to handle \ref{} or \eqref{}?
	 * 'ignore'      = Leave them as-is
	 * 'placeholder' = Convert to (ref: label)
	 * 'autoNumber'  = Attempt to auto-number equations
	 */
	handleRefs?: 'ignore' | 'placeholder' | 'autoNumber';

	/** Expand custom macros from \newcommand or \renewcommand? */
	expandMacros?: boolean;

	/** Convert \cite{...} to [cite: ...]? */
	convertCitations?: boolean;

	/** Remove \left and \right commands, e.g. \left( -> ( */
	removeLeftRight?: boolean;

	/** Convert \text{xyz} into \mathrm{xyz}? */
	unifyTextToMathrm?: boolean;
}

/*******************************************************
 * NESTED ENVIRONMENTS PARSER HELPERS
 *******************************************************/
function replaceNestedEnvironments(text: string, envPattern: string): string {
	/**
	 * This function handles truly nested environments, e.g.:
	 *   \begin{envA}
	 *     text...
	 *     \begin{envB}
	 *       more text...
	 *     \end{envB}
	 *   \end{envA}
	 *
	 * We track a stack of environment names. Once we pop back to
	 * an empty stack, we know we've closed an entire environment block.
	 * Then we wrap that entire chunk in `$$ ... $$`.
	 */

	const envRegex = new RegExp(`\\\\(begin|end)\\{(${envPattern})\\}`, 'g');
	const stack: string[] = [];
	let lastIndex = 0;
	let result = '';

	let match;
	while ((match = envRegex.exec(text)) !== null) {
		const [full, type, name] = match;
		if (type === 'begin') {
  			// Pushing environment name onto the stack
  			stack.push(name);
  		}
  else if (stack.length === 0 || stack.pop() !== name) {
  				// Mismatched \end, skip or handle error
  				continue;
  			}

		// Once the stack is empty, we've closed a top-level environment
		if (stack.length === 0) {
			// Take everything from lastIndex up to the \begin
			result += text.slice(lastIndex, match.index);

			// Now convert that environment block content
			// `text.slice(lastIndex, match.index)` is everything
			// from the previous environment boundary up until
			// this new \begin or \end. We pass it to `convertEnvironment`.
			result += convertEnvironment(
				full,
				text.slice(lastIndex, match.index)
			);

			// Move lastIndex forward
			lastIndex = envRegex.lastIndex;
		}
	}
	// Append any remaining text after the final environment
	result += text.slice(lastIndex);
	return result;
}

function convertEnvironment(_match: string, content: string): string {
	/**
	 * Called whenever we've closed out a top-level environment.
	 * We simply wrap the environment's content in $$ ... $$.
	 */
	return `$$\n${content.trim()}\n$$`;
}

/*******************************************************
 * MACRO REMOVAL HELPER
 *******************************************************/
function removeMacros(text: string): string {
	/**
	 * A simpler fallback approach to removing lines with
	 * \newcommand or \renewcommand. If you do not want expansions,
	 * call this to strip them out entirely.
	 */
	let inMacro = false;
	let braceDepth = 0;
	let result = '';

	for (let i = 0; i < text.length; i++) {
		// Example simplistic detection of \newcommand or \renewcommand
		if (!inMacro && text.substr(i, 12).match(/\\(new|renew)command/)) {
			inMacro = true;
			// Skip ahead over "\newcommand" or "\renewcommand"
			// This is simplistic and may need to handle multiline, etc.
			if (text.substr(i, 5) === '\\newc') {
				i += 10; // skip "\newcommand"
			} else {
				i += 12; // skip "\renewcommand"
			}
			continue;
		}

		if (inMacro) {
			if (text[i] === '{') {
     braceDepth++;
   }
			if (text[i] === '}') {
				braceDepth--;
				if (braceDepth === 0) {
      inMacro = false;
    }
			}
			continue;
		}

		result += text[i];
	}
	return result;
}

/*******************************************************
 * MAIN PARSER FUNCTION
 *******************************************************/
export function parseLatexToObsidian(text: string, options: ParserOptions = {}): string {
	const {
		convertEnvironments = true,
		extraEnvironments = [],
		convertEqnarray = false,
		removeLabels = false,
		handleRefs = 'ignore',
		expandMacros = false,
		convertCitations = false,
		removeLeftRight = false,
		unifyTextToMathrm = false,
	} = options;

	/*******************************************************
	 * STEP 1) BRACKET HANDLING WITH CONTEXT AWARENESS
	 *    - Convert \(...\)  ->  $(...)$
	 *    - Convert \[...\] ->  $$[...]$$
	 *    - Also handle \begin{equation}, etc., into $$ if encountered.
	 *******************************************************/

		// We keep a stack for inline/display contexts:
	let mathModeStack: ('inline' | 'display')[] = [];

	text = text.replace(
		/\\([()[\]]|begin\{equation\*?}|end\{equation\*?}|begin\{align\*?}|end\{align\*?})/g,
		(match: string, command: string): string => {
			switch (command) {
				case '(':
					mathModeStack.push('inline');
					return '$(';

				case ')':
					if (mathModeStack.pop() !== 'inline') {
						console.warn('Mismatched inline math closure');
					}
					return ')$';

				case '[':
					mathModeStack.push('display');
					return '$$[';

				case ']':
					if (mathModeStack.pop() !== 'display') {
						console.warn('Mismatched display math closure');
					}
					return ']$$';

				case 'begin{equation}':
				case 'begin{equation*}':
				case 'begin{align}':
				case 'begin{align*}':
					mathModeStack.push('display');
					return '$$';

				case 'end{equation}':
				case 'end{equation*}':
				case 'end{align}':
				case 'end{align*}':
					if (mathModeStack.pop() !== 'display') {
						console.warn('Mismatched environment closure');
					}
					return '$$';

				default:
					return match;
			}
		}
	);

	// Reset the stack after bracket handling
	mathModeStack = [];

	// Standard post-processing for matched pairs
	text = text.replace(/(\$\$?)([^$]*?)(\$\$?)/g, (fullMatch, open, content, close) => {
		// Check for consistent delimiter pairing
		if ((open === '$(' && close !== ')$') || (open === '$$[' && close !== ']$$')) {
			console.warn(`Mismatched math delimiters: ${open} ... ${close}`);
			return fullMatch;
		}

		// Determine if it's display or inline
		const isDisplayMath = (open === '$$[' || open === '$$');
		const cleanContent = content
			.replace(/^\n+/, '')     // remove leading newlines
			.replace(/\n+$/, '')     // remove trailing newlines
			.replace(/\n{2,}/g, '\n'); // collapse multiple newlines

		return isDisplayMath
			? `$$\n${cleanContent}\n$$`
			: `$${cleanContent}$`;
	});

	// Handle edge cases with escaped brackets (e.g., `\\[`)
	text = text.replace(/(\\\\)*\\[()[\]]/g, (match) => {
		// If there's an odd number of backslashes, strip one:
		const escapeCount = (match.match(/\\/g) || []).length;
		if (escapeCount % 2 === 1) {
			// Remove just one backslash so it remains properly escaped for Obsidian
			return match.slice(1);
		}
		return match;
	});

	/*******************************************************
	 * STEP 2) ENVIRONMENT DETECTION & CONVERSION
	 *    - By default handles: equation, align, align*, cases
	 *    - Additional: user-provided extraEnvironments
	 *    - Optionally: eqnarray
	 *    - NESTED approach + single-pass fallback
	 *******************************************************/
	if (convertEnvironments) {
		const defaultEnvs = ['equation', 'align', 'align*', 'cases'];
		let allEnvs = defaultEnvs.concat(extraEnvironments);
		if (convertEqnarray) {
			allEnvs.push('eqnarray');
		}

		if (allEnvs.length > 0) {
			// 1) Perform truly nested environment replacement
			const nestedPattern = allEnvs.map(env => env.replace('*', '\\*')).join('|');
			text = replaceNestedEnvironments(text, nestedPattern);

			// 2) As a fallback, also do single-pass environment replacement
			const envRegex = new RegExp(
				`\\\\begin\\{(${nestedPattern})\}([\\s\\S]*?)\\\\end\\{\\1\\}`,
				'g'
			);
			text = text.replace(envRegex, (_match, _envName, content) => {
				// Convert entire environment to $$ ... $$
				return `$$\n${content.trim()}\n$$`;
			});
		}
	}

	/*******************************************************
	 * STEP 3) MACRO EXPANSIONS OR REMOVAL
	 *******************************************************/
	if (expandMacros) {
		/*******************************************************
		 * 3A) COLLECT AND STORE MACRO DEFINITIONS
		 *******************************************************/
		type MacroDefinition = {
			expansion: string;
			args: number;
		};
		const macroMap = new Map<string, MacroDefinition>();

		// Phase 1: Collect macro definitions
		text = text.replace(
			/\\(?:new|renew)command\\([a-zA-Z]+)(?:\[([0-9]+)])?\{((?:[^{}]|(\{[^{}]*}))*)}/g,
			(match, name: string, argCount: string, expansion: string) => {
				const args = argCount ? parseInt(argCount, 10) : 0;
				if (!/^[a-zA-Z]+$/.test(name)) {
					// Invalid macro name, leave it untouched
					return match;
				}
				macroMap.set(name, {
					expansion: expansion.trim(),
					args
				});
				return ''; // remove definition from the text
			}
		);

		/*******************************************************
		 * 3B) EXPAND MACROS
		 *******************************************************/
			// Sort macros by descending name length to avoid partial matches
		const sortedMacros = Array.from(macroMap.entries())
				.sort(([a], [b]) => b.length - a.length);

		for (const [name, { expansion, args }] of sortedMacros) {
			const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
			const argPattern = Array.from({ length: args }, () => '\\{([^}]*)\\}').join('');
			const macroRegex = new RegExp(`(?<!\\\\)\\\\${escapedName}(?:${argPattern})`, 'g');

			text = text.replace(macroRegex, (_fullMatch, ...captures) => {
				const callArgs = captures.slice(0, args);
				let result = expansion;
				callArgs.forEach((argVal, idx) => {
					const placeholderRegex = new RegExp(`#${idx + 1}(?!\\d)`, 'g');
					result = result.replace(placeholderRegex, argVal || '');
				});
				return result;
			});
		}

		// Clean up leftover #n if expansions were incomplete
		text = text.replace(/#[0-9]+/g, '');
	} else {
		/*******************************************************
		 * 3C) REMOVE MACRO DEFINITIONS IF NOT EXPANDING
		 *******************************************************/
		text = text.replace(
			/\\(?:new|renew)command\\[a-zA-Z]+(?:\[[0-9]+])?\{(?:[^{}]|\{[^{}]*})*}/g,
			''
		);
		// Also call your removal helper if you want a second pass:
		text = removeMacros(text);
	}

	/*******************************************************
	 * STEP 4) REFERENCE & LABEL HANDLING
	 *    - removeLabels?
	 *    - handleRefs? ('ignore', 'placeholder', 'autoNumber')
	 *******************************************************/
	if (handleRefs === 'autoNumber') {
		// (a) Find all labels in $$ blocks and assign numbers
		let eqCounter = 1;
		const labelMap = new Map<string, number>();

		text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_fullMatch: string, inner: string) => {
			const cleanedInner = inner.replace(/\\label\{([^}]+)}/g, (_m, labelName: string) => {
				if (labelMap.has(labelName)) {
					console.warn(`Duplicate label detected: ${labelName}`);
				}
				labelMap.set(labelName, eqCounter++);
				return ''; // remove the label from output
			});
			return `$$${cleanedInner}$$`;
		});

		// (b) Replace \ref{} or \eqref{} with (eq#)
		text = text.replace(/\\(?:ref|eqref)\{([^}]+)}/g, (_m, labelName) => {
			const eqNum = labelMap.get(labelName);
			return eqNum ? `(${eqNum})` : '(??)';
		});
	} else if (handleRefs === 'placeholder') {
		// e.g.  \ref{xyz} -> (ref: xyz)
		text = text.replace(/\\(?:ref|eqref)\{([^}]+)}/g, '(ref: $1)');
	}
	// if 'ignore', leave them as-is

	// Finally, remove or convert \label if requested
	if (removeLabels) {
		// Remove \label entirely
		text = text.replace(/\\label\{[^}]+}/g, '');
	} else {
		// Convert \label{xyz} -> [label: xyz]
		text = text.replace(/\\label\{([^}]+)}/g, '[label: $1]');
	}

	/*******************************************************
	 * STEP 5) CONVERT CITATIONS
	 *    - e.g. \cite{XYZ} -> [cite: XYZ]
	 *******************************************************/
	if (convertCitations) {
		text = text.replace(/\\cite\{([^}]+)}/g, '[cite: $1]');
		// Additional patterns like \parencite could be added similarly
	}

	/*******************************************************
	 * STEP 6) REMOVE \left and \right if requested
	 *******************************************************/
	if (removeLeftRight) {
		text = text.replace(/\\left\s*([({\[])/g, '$1');
		text = text.replace(/\\right\s*([)}\]])/g, '$1');
	}

	/*******************************************************
	 * STEP 7) CONVERT \text{xyz} TO \mathrm{xyz} IF REQUESTED
	 *******************************************************/
	if (unifyTextToMathrm) {
		text = text.replace(/\\text\{([^}]+)}/g, '\\mathrm{$1}');
	}

	/*******************************************************
	 * RETURN FINAL
	 *******************************************************/
	return text;
}
