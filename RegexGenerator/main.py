"""
정규식 생성기 - 메인 애플리케이션
"""
import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext
try:
    import pyperclip
    HAS_PYPERCLIP = True
except ImportError:
    HAS_PYPERCLIP = False
    print("경고: pyperclip이 설치되지 않았습니다. 복사 기능을 사용할 수 없습니다.")
from regex_patterns import get_regex_pattern, get_pattern_names, get_languages


class RegexGeneratorApp:
    def __init__(self, root):
        self.root = root
        self.root.title("정규식 생성기 (Regex Generator)")
        self.root.geometry("900x750")
        self.root.resizable(True, True)
        
        # 스타일 설정
        style = ttk.Style()
        style.theme_use('clam')
        
        self.setup_ui()
        
    def setup_ui(self):
        # 메인 프레임
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)
        main_frame.columnconfigure(1, weight=1)
        main_frame.rowconfigure(4, weight=1)
        
        # 제목
        title_label = ttk.Label(main_frame, text="정규식 생성기", 
                               font=("맑은 고딕", 16, "bold"))
        title_label.grid(row=0, column=0, columnspan=2, pady=(0, 20))
        
        # 언어 선택
        ttk.Label(main_frame, text="언어 선택:", font=("맑은 고딕", 10)).grid(
            row=1, column=0, sticky=tk.W, pady=5)
        
        self.language_var = tk.StringVar(value="Python")
        language_combo = ttk.Combobox(main_frame, textvariable=self.language_var,
                                     values=get_languages(), state="readonly",
                                     width=20, font=("맑은 고딕", 10))
        language_combo.grid(row=1, column=1, sticky=tk.W, pady=5, padx=(10, 0))
        language_combo.bind("<<ComboboxSelected>>", self.on_language_change)
        
        # 패턴 선택
        ttk.Label(main_frame, text="패턴 선택:", font=("맑은 고딕", 10)).grid(
            row=2, column=0, sticky=tk.W, pady=5)
        
        self.pattern_var = tk.StringVar()
        pattern_names = get_pattern_names()
        self.pattern_combo = ttk.Combobox(main_frame, textvariable=self.pattern_var,
                                    values=pattern_names, state="readonly",
                                    width=60, font=("맑은 고딕", 10))
        self.pattern_combo.grid(row=2, column=1, sticky=(tk.W, tk.E), pady=5, padx=(10, 0))
        self.pattern_combo.bind("<<ComboboxSelected>>", self.on_pattern_change)
        # 패턴 개수 표시
        pattern_count_label = ttk.Label(main_frame, 
                                       text=f"(총 {len(pattern_names)}개 패턴)", 
                                       font=("맑은 고딕", 8),
                                       foreground="gray")
        pattern_count_label.grid(row=2, column=2, sticky=tk.W, padx=(5, 0), pady=5)
        
        # 생성된 정규식 표시 영역
        ttk.Label(main_frame, text="생성된 정규식:", font=("맑은 고딕", 10)).grid(
            row=3, column=0, columnspan=2, sticky=tk.W, pady=(10, 5))
        
        regex_frame = ttk.Frame(main_frame)
        regex_frame.grid(row=4, column=0, columnspan=2, sticky=(tk.W, tk.E, tk.N, tk.S), pady=5)
        regex_frame.columnconfigure(0, weight=1)
        regex_frame.rowconfigure(0, weight=1)
        
        self.regex_text = scrolledtext.ScrolledText(regex_frame, height=8,
                                                    font=("Consolas", 11),
                                                    wrap=tk.WORD, state=tk.DISABLED)
        self.regex_text.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # 사용 예제 표시 영역
        ttk.Label(main_frame, text="사용 예제:", font=("맑은 고딕", 10)).grid(
            row=5, column=0, columnspan=2, sticky=tk.W, pady=(10, 5))
        
        example_frame = ttk.Frame(main_frame)
        example_frame.grid(row=6, column=0, columnspan=2, sticky=(tk.W, tk.E, tk.N, tk.S), pady=5)
        example_frame.columnconfigure(0, weight=1)
        example_frame.rowconfigure(0, weight=1)
        
        self.example_text = scrolledtext.ScrolledText(example_frame, height=6,
                                                      font=("Consolas", 10),
                                                      wrap=tk.WORD, state=tk.DISABLED)
        self.example_text.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # 버튼 프레임
        button_frame = ttk.Frame(main_frame)
        button_frame.grid(row=7, column=0, columnspan=2, pady=20)
        
        copy_button = ttk.Button(button_frame, text="정규식 복사", 
                                command=self.copy_regex, width=15)
        copy_button.pack(side=tk.LEFT, padx=5)
        
        copy_example_button = ttk.Button(button_frame, text="예제 코드 복사",
                                        command=self.copy_example, width=15)
        copy_example_button.pack(side=tk.LEFT, padx=5)
        
        refresh_button = ttk.Button(button_frame, text="새로고침",
                                   command=self.refresh, width=15)
        refresh_button.pack(side=tk.LEFT, padx=5)
    
    def on_language_change(self, event=None):
        """언어 변경 시 정규식 재생성"""
        if self.pattern_var.get():
            self.on_pattern_change()
    
    def on_pattern_change(self, event=None):
        """패턴 선택 시 정규식 생성"""
        pattern_name = self.pattern_var.get()
        language = self.language_var.get()
        
        if not pattern_name:
            return
        
        regex = get_regex_pattern(pattern_name, language)
        
        if not regex:
            messagebox.showerror("오류", "정규식을 생성할 수 없습니다.")
            return
        
        # 정규식 표시
        self.regex_text.config(state=tk.NORMAL)
        self.regex_text.delete(1.0, tk.END)
        self.regex_text.insert(1.0, regex)
        self.regex_text.config(state=tk.DISABLED)
        
        # 사용 예제 생성
        example_code = self.generate_example(regex, language)
        self.example_text.config(state=tk.NORMAL)
        self.example_text.delete(1.0, tk.END)
        self.example_text.insert(1.0, example_code)
        self.example_text.config(state=tk.DISABLED)
    
    def generate_example(self, regex, language):
        """언어별 사용 예제 코드 생성"""
        if language == "Java":
            return f'''// Java 정규식 사용 예제
import java.util.regex.Pattern;
import java.util.regex.Matcher;

Pattern pattern = Pattern.compile("{regex}");
Matcher matcher = pattern.matcher("입력값");
boolean matches = matcher.matches();

// 또는 간단하게
boolean isValid = "입력값".matches("{regex}");'''
        
        elif language == "Python":
            return f'''# Python 정규식 사용 예제
import re

pattern = re.compile(r"{regex}")
result = pattern.match("입력값")
is_valid = bool(result)

# 또는 간단하게
import re
is_valid = bool(re.match(r"{regex}", "입력값"))'''
        
        elif language == "JavaScript":
            return f'''// JavaScript 정규식 사용 예제
const pattern = /{regex}/;
const isValid = pattern.test("입력값");

// 또는
const isValid = /{regex}/.test("입력값");

// match 메서드 사용
const result = "입력값".match(/{regex}/);
const isValid = result !== null;'''
        
        elif language == "PostgreSQL":
            return f'''-- PostgreSQL 정규식 사용 예제
-- WHERE 절에서 사용
SELECT * FROM table_name 
WHERE column_name ~ '{regex}';

-- 또는 LIKE 대신 사용
SELECT * FROM table_name 
WHERE column_name SIMILAR TO '{regex}';

-- 체크 제약 조건으로 사용
ALTER TABLE table_name 
ADD CONSTRAINT check_pattern 
CHECK (column_name ~ '{regex}');'''
        
        elif language == "Oracle":
            return f'''-- Oracle 정규식 사용 예제
-- REGEXP_LIKE 함수 사용
SELECT * FROM table_name 
WHERE REGEXP_LIKE(column_name, '{regex}');

-- REGEXP_REPLACE 사용 예
SELECT REGEXP_REPLACE(column_name, '{regex}', 'replacement') 
FROM table_name;

-- 체크 제약 조건으로 사용
ALTER TABLE table_name 
ADD CONSTRAINT check_pattern 
CHECK (REGEXP_LIKE(column_name, '{regex}'));'''
        
        elif language == "MySQL":
            return f'''-- MySQL 정규식 사용 예제
-- REGEXP 또는 RLIKE 연산자 사용
SELECT * FROM table_name 
WHERE column_name REGEXP '{regex}';

-- 또는 RLIKE 사용
SELECT * FROM table_name 
WHERE column_name RLIKE '{regex}';

-- 체크 제약 조건 (MySQL 8.0.16+)
ALTER TABLE table_name 
ADD CONSTRAINT check_pattern 
CHECK (column_name REGEXP '{regex}');'''
        
        elif language == "Django":
            return f'''# Django 정규식 사용 예제 (Python re 모듈 사용)
from django.core.validators import RegexValidator
from django.db import models

# 모델 필드에서 사용
class MyModel(models.Model):
    field_name = models.CharField(
        max_length=100,
        validators=[RegexValidator(
            regex=r'{regex}',
            message='올바른 형식이 아닙니다.'
        )]
    )

# 또는 forms.py에서 사용
from django import forms
import re

class MyForm(forms.Form):
    field_name = forms.CharField(
        validators=[RegexValidator(
            regex=r'{regex}',
            message='올바른 형식이 아닙니다.'
        )]
    )
    
    # 직접 검증
    def clean_field_name(self):
        value = self.cleaned_data['field_name']
        if not re.match(r'{regex}', value):
            raise forms.ValidationError('올바른 형식이 아닙니다.')
        return value'''
        
        return ""
    
    def copy_regex(self):
        """생성된 정규식을 클립보드에 복사"""
        if not HAS_PYPERCLIP:
            messagebox.showerror("오류", "pyperclip 패키지가 설치되지 않았습니다.\n'pip install pyperclip'으로 설치해주세요.")
            return
        
        regex = self.regex_text.get(1.0, tk.END).strip()
        if regex:
            try:
                pyperclip.copy(regex)
                messagebox.showinfo("복사 완료", "정규식이 클립보드에 복사되었습니다.")
            except Exception as e:
                messagebox.showerror("오류", f"복사 중 오류가 발생했습니다: {str(e)}")
        else:
            messagebox.showwarning("경고", "복사할 정규식이 없습니다.")
    
    def copy_example(self):
        """예제 코드를 클립보드에 복사"""
        if not HAS_PYPERCLIP:
            messagebox.showerror("오류", "pyperclip 패키지가 설치되지 않았습니다.\n'pip install pyperclip'으로 설치해주세요.")
            return
        
        example = self.example_text.get(1.0, tk.END).strip()
        if example:
            try:
                pyperclip.copy(example)
                messagebox.showinfo("복사 완료", "예제 코드가 클립보드에 복사되었습니다.")
            except Exception as e:
                messagebox.showerror("오류", f"복사 중 오류가 발생했습니다: {str(e)}")
        else:
            messagebox.showwarning("경고", "복사할 예제 코드가 없습니다.")
    
    def refresh(self):
        """화면 새로고침"""
        self.pattern_var.set("")
        self.regex_text.config(state=tk.NORMAL)
        self.regex_text.delete(1.0, tk.END)
        self.regex_text.config(state=tk.DISABLED)
        self.example_text.config(state=tk.NORMAL)
        self.example_text.delete(1.0, tk.END)
        self.example_text.config(state=tk.DISABLED)


def main():
    root = tk.Tk()
    app = RegexGeneratorApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
