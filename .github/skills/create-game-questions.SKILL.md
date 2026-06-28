## Skill: Generate high-quality DevGuessr questions

Purpose
-------
This skill guides Copilot (or any assistant) to create improved, expanded, and consistent RawQuestion entries suitable for insertion into `server/src/gameData.ts` in the DevGuessr repo.

Goals
-----
- Produce clear, concise, playable questions across categories: `language`, `framework`, `company`, `bug`, and `funny`.
- Follow existing project conventions (ESM, `RawQuestion` shape, no `options` field, short code snippets, valid `slug` for logos).
- Keep question IDs unique and human-readable (e.g. `lang-rust-async`, `fw-react-hooks`, `co-huggingface`).

Constraints & rules
-------------------
- Output must be TypeScript-compatible object literals matching the `RawQuestion` shape (see `server/src/types.ts`).
- Do NOT include the `options` array — the server generates multiple-choice options from `ANSWER_POOLS` at runtime.
- For code questions:
  - Keep snippets short (3–12 lines).
  - Avoid comments or identifiers that directly reveal the answer (no `// JavaScript` comments or functions named `isPython`).
  - Use realistic, idiomatic code for the claimed language or framework.
  - Use the `highlight` key with a reasonable Prism language id (e.g. `javascript`, `python`, `tsx`, `rust`).
- For bug questions:
  - Provide `bugLine` as a 1-based integer pointing to the single buggy line.
  - Also include `answer: 'Line N'` (this matches current file style and keeps editors consistent).
  - Code must contain exactly one clear, explainable bug referenced by `fact`.
- For company/logo questions:
  - Use `type: 'logo'`, include `slug` (simple-icons style, lowercase, alphanumeric or hyphen), and an optional `color` (6-hex, e.g. `#1DB954`).
- For `funny` or `text` questions:
  - Use `type: 'text'` and short prompts that make sense as a light-hearted category.
- Keep `fact` short (<= 120 characters). Avoid claims that may be inaccurate or legally risky.

Quality checklist
-----------------
- Unique `id` that fits the repository naming scheme.
- `prompt` is concise and consistent with other entries.
- `code` snippets are runnable or believable, not intentionally obfuscated.
- `highlight` matches the snippet language.
- `fact` is interesting and correct.
- Avoid including answers or revealing hints inside the snippet or prompt.

Prompt templates (use these when asking Copilot)
----------------------------------------------

1) Generate N language questions

Example prompt:

"Generate 6 `language` RawQuestion objects for DevGuessr. Return only a TypeScript array literal called `newLanguages` containing objects with fields: `id`, `category: 'language'`, `type: 'code'`, `prompt: 'Which language is this?'`, `answer`, `highlight`, `fact`, and `code`. Keep snippets 4–8 lines, avoid naming the language in the snippet, and ensure answers are common language names that will fit into the existing `ANSWER_POOLS`."

2) Generate N framework questions

Example prompt:

"Generate 5 `framework` RawQuestion objects in a TypeScript array `newFrameworks`. Each question should use `type: 'code'`, a short `fact`, and `highlight` appropriate for the snippet. Make answers obvious to developers without leaking the answer in the code." 

3) Generate company/logo questions

Example prompt:

"Generate 8 `company` RawQuestion objects in `newCompanies`. Use `type: 'logo'`, include `slug` suitable for simple-icons (lowercase-with-hyphens), `color` hex if known, and a one-line `fact`."

4) Generate bug questions

Example prompt:

"Generate 4 `bug` RawQuestion objects in `newBugs`. Each should contain a 4–8 line snippet with a single clear bug, `bugLine` (1-based), `answer: 'Line N'`, `highlight`, and a short `fact` that explains the bug. Ensure `bugLine` is correct." 

Output formatting guidance
-------------------------
- Return valid TypeScript array literals (e.g. `const newLanguages: RawQuestion[] = [ ... ]`) or plain array literals. Keep consistent quotation and template-literal style used in `server/src/gameData.ts`.
- Provide only the array/object literal(s) when asked to generate content intended for direct insertion. Do not output narrative around the objects unless asked.

Insertion guidance for maintainers
---------------------------------
- Insert generated objects into the correct array in `server/src/gameData.ts`:
  - `languages` — language code questions
  - `frameworks` — framework code questions
  - `companies` — logo questions
  - `bugs` — spot-the-bug code questions
  - `funny` — text or humorous questions
- After insertion, run the project's type-check/build: `npm run build` from the repository root.
- Validate that new ids do not collide with existing `ALL_QUESTIONS` ids.

Example question output (copy/paste-ready style)
------------------------------------------------
```ts
// language example
{
  id: 'lang-elm-patterns',
  category: 'language',
  type: 'code',
  prompt: 'Which language is this?',
  answer: 'Elm',
  highlight: 'elm',
  fact: 'A purely functional front-end language with no runtime exceptions.',
  code: `import Html exposing (text)

main =
  text (String.fromInt (List.sum [1, 2, 3, 4]))`,
},

// framework example
{
  id: 'fw-svelte-reactivity',
  category: 'framework',
  type: 'code',
  prompt: 'Which framework / library is this?',
  answer: 'Svelte',
  highlight: 'html',
  fact: 'Svelte compiles away its framework to produce minimal runtime code.',
  code: `<script>
  let count = 0;
</script>

<button on:click={() => count += 1}>
  Clicked {count} times
</button>`,
},

// bug example
{
  id: 'bug-js-offbyone-2',
  category: 'bug',
  type: 'code',
  prompt: 'Which line has the bug?',
  bugLine: 3,
  answer: 'Line 3',
  highlight: 'javascript',
  fact: 'The loop condition reads one past the end of the array — change `<=` to `<`.',
  code: `function sum(arr) {
  let total = 0;
  for (let i = 0; i <= arr.length; i++) {
    total += arr[i];
  }
  return total;
}`,
},

// company example
{
  id: 'co-huggingface-basic',
  category: 'company',
  type: 'logo',
  prompt: 'Which company / brand is this?',
  answer: 'Hugging Face',
  slug: 'huggingface',
  color: '#FFD21E',
  fact: 'A popular hub for open machine learning models.',
},
```

Notes for Copilot maintainers
----------------------------
- When asked to generate questions, prefer clarity and educative value over trickiness. A good question teaches something interesting in its `fact`.
- If unsure about a `slug` for a company logo, use the simple-icons naming convention (lowercase, hyphens) and keep a short list of likely slugs in the output so a human can confirm.
- Avoid generating large numbers of near-duplicate questions. Favor variety across languages, paradigms, and difficulty.

Developer workflow
------------------
1. Ask Copilot to generate a batch using one of the prompt templates above.
2. Review snippets for accidental hints and validate `bugLine` correctness.
3. Insert into `server/src/gameData.ts` arrays and run `npm run build`.

End of skill.
