import openai
import os

# OpenAI API 키 설정 (GitHub Secrets에서 관리 권장)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")  # 환경 변수에서 API 키 불러오기

def review_code(file_path):
    """AI를 활용한 코드 리뷰 수행"""
    with open(file_path, "r", encoding="utf-8") as file:
        code_content = file.read()

    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are an AI code reviewer."},
            {"role": "user", "content": f"Review the following code:\n{code_content}"}
        ]
    )

    return response["choices"][0]["message"]["content"]

# 리뷰할 파일 목록 (예시)
files_to_review = ["app.py", "main.js", "index.html"]  # 프로젝트에 맞게 수정

for file in files_to_review:
    if os.path.exists(file):
        review_result = review_code(file)
        print(f"📌 코드 리뷰 결과 ({file}):\n", review_result)
    else:
        print(f"⚠️ 파일을 찾을 수 없음: {file}")
