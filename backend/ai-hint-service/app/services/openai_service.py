import openai




model = 'gpt-3.5-turbo-0125'

def generate_hint(question_description: str) -> str:
    prompt = f"Provide a concise hint for the following programming problem:\n\n{question_description}\n\nHint:"
    completion = openai.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": prompt}
        ]
    )

    hint = completion.choices[0].message.content
    return hint

def analyze_code_complexity(code: str, language: str) -> dict:
    prompt = f"Analyze the following {language} code for its time and space complexity. Provide a detailed explanation.\n\nCode:\n{code}\n\nAnalysis:"
    completion = openai.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": prompt}
        ]
    )
    analysis = completion.choices[0].message['content']
    if "O(" in analysis:
        start = analysis.find("O(")
        end = analysis.find(")", start) + 1
        complexity = analysis[start:end]
    else:
        complexity = "Complexity could not be determined."
    return {"complexity": complexity, "analysis": analysis}

def generate_model_answer(question_description: str, language: str) -> str:
    prompt = f"Provide a complete and optimized {language} solution for the following programming problem:\n\n{question_description}\n\nSolution:"
    completion = openai.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": prompt}
        ]
    )
    model_answer = completion.choices[0].message['content']
    return model_answer