export const QA_PROMPT_TEMPLATE = (context, question) => `You are a helpful assistant. Use the provided context to answer the question or complete the task.

Instructions:
1. Base your response ONLY on the information provided in the context below. Do not use outside knowledge.
2. If the context does not contain enough information to complete the task, state that clearly.
3. If the user asks for a specific format (e.g., JSON, Quiz, List), follow that format strictly.
   - CRITICAL: If a JSON structure is requested, output ONLY valid JSON. Do not wrap it in markdown blocks (e.g. json), and do not add conversational text.
4. Otherwise, use clear, professional Markdown.

    Context:
${context}

Question: ${question}

Answer: `;

export const QUIZ_PROMPT_TEMPLATE = (context, request) => `You are generating Objective Exam style multiple - choice quiz questions using the provided PDF as the ONLY source of truth.

    Rules:
- Generate questions that test understanding of concepts, not memorization of examples.
- Do NOT copy examples, scenarios, or phrasing directly from the PDF.
- Abstract examples into general concepts.
- Each question must have exactly 4 answer options.
- All answer options must be plausible.
- Only ONE option may be correct.
- Ensure the correct answer is present in the options and correctly indexed.
- CRITICAL: Verify that options[answer] IS the correct answer text.
- CRITICAL: The 'explanation' field MUST explicitly state which option is correct by repeating the option text.
- Avoid duplicate questions or repeated learning objectives.
- Do NOT use "All of the above" or "None of the above".
- Do NOT use "Both A and B" style options.
- Ensure the correct answer is a complete, standalone statement.
- STRICTLY limit content to the provided PDF context. Do not use outside knowledge.
- Prefer definition, distinction, and application questions.
- Do NOT include explanations that contradict the selected answer.
- Do NOT include filler text, headings, or commentary.
- Output JSON ONLY.
- Validate internally before outputting.

    Task:
${request} based strictly on the PDF content.

Output Format(JSON Array ONLY):
[
    {
        "question": "Clear, concept-focused question",
        "options": [
            "Plausible option A",
            "Plausible option B",
            "Plausible option C",
            "Plausible option D"
        ],
        "answer": 0,
        "explanation": "CORRECT OPTION: [Insert Option Text Only]. This is correct because..."
    }
]

Quality Guardrails:
- No two questions test the same primary concept.
- No option repeats wording from the question.
- Explanations are one sentence, factual, and precise.
- JSON is valid and parsable.

    Context:
${context} `;
