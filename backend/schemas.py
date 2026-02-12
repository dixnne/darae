from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Any

# --- ESQUEMAS DE USUARIO ---

class UserBase(BaseModel):
    username: str
    email: EmailStr
    display_name: str
    avatar: str = "User"
    theme_colors: List[str] = Field(default_factory=lambda: ["#F7CFD8", "#F4F8D3", "#A6D6D6", "#8E7DBE"])

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    class Config:
        from_attributes = True

# --- ESQUEMAS DE AUTENTICACIÓN ---

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class TokenData(BaseModel):
    username: Optional[str] = None

# --- ESQUEMAS DE SIGNIFICADOS ---

class SenseBase(BaseModel):
    native_translation: str
    english_translation: Optional[str] = None

class SenseCreate(SenseBase):
    pass

class Sense(SenseBase):
    id: int
    entry_id: int
    class Config:
        from_attributes = True

# --- ESQUEMAS DE VOCABULARIO ---

class VocabularyEntryBase(BaseModel):
    surface_form: str
    reading: Optional[str] = None
    language_code: str
    is_public: bool = True

class VocabularyEntryCreate(VocabularyEntryBase):
    senses: List[SenseCreate] = []

class VocabularyEntry(VocabularyEntryBase):
    id: int
    user_id: int
    senses: List[Sense] = []
    class Config:
        from_attributes = True

# --- ESQUEMAS DE EXPRESIONES ---

class ExpressionBase(BaseModel):
    text: str
    native_translation: str
    english_translation: Optional[str] = None
    usage_description: Optional[str] = None
    language_code: str
    is_public: bool = True

class ExpressionCreate(ExpressionBase):
    pass

class Expression(ExpressionBase):
    id: int
    user_id: int
    class Config:
        from_attributes = True

# --- ESQUEMAS DE GRAMÁTICA ---

class GrammarRuleBase(BaseModel):
    name: str
    structure: str
    explanation: str
    examples: List[str] = []
    language_code: str
    is_public: bool = True

class GrammarRuleCreate(GrammarRuleBase):
    pass

class GrammarRule(GrammarRuleBase):
    id: int
    user_id: int
    class Config:
        from_attributes = True

# --- ESQUEMAS DE NOTAS ---

class NoteBase(BaseModel):
    title: str
    content: str
    topic: str = "General"

class NoteCreate(NoteBase):
    vocab_ids: List[int] = []
    grammar_ids: List[int] = []

class Note(NoteBase):
    id: int
    user_id: int
    # Usamos Any o referencias directas para evitar el error de validación
    vocab_rel: List[VocabularyEntry] = []
    grammar_rel: List[GrammarRule] = []
    class Config:
        from_attributes = True