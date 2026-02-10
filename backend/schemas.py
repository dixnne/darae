from pydantic import BaseModel, Field
from typing import List, Optional

class LanguageBase(BaseModel):
    name: str # Ej: "Korean"
    code: str # Ej: "ko"

class LanguageCreate(LanguageBase):
    pass

class Language(LanguageBase):
    id: int
    class Config:
        from_attributes = True

class SenseBase(BaseModel):
    native_translation: str
    english_translation: Optional[str] = None
    definition: Optional[str] = None

class SenseCreate(SenseBase):
    pass

class Sense(SenseBase):
    id: int
    entry_id: int
    class Config:
        from_attributes = True

class VocabularyEntryBase(BaseModel):
    surface_form: str # 학생
    reading: Optional[str] = None # hak-saeng
    language_id: int

class VocabularyEntryCreate(VocabularyEntryBase):
    senses: List[SenseCreate] = []

class VocabularyEntry(VocabularyEntryBase):
    id: int
    language: Language
    senses: List[Sense] = []
    class Config:
        from_attributes = True

class ExpressionBase(BaseModel):
    text: str
    native_translation: str
    english_translation: Optional[str] = None
    usage_description: Optional[str] = None
    language_id: int

class ExpressionCreate(ExpressionBase):
    pass

class Expression(ExpressionBase):
    id: int
    language: Language
    class Config:
        from_attributes = True

class GrammarRuleBase(BaseModel):
    name: str
    structure: str
    explanation: str
    examples: List[str] = [] # Se manejará como JSON en la DB
    language_id: int

class GrammarRuleCreate(GrammarRuleBase):
    pass

class GrammarRule(GrammarRuleBase):
    id: int
    language: Language
    class Config:
        from_attributes = True


class NoteBase(BaseModel):
    title: str
    content: str
    topic: str = "General"

class NoteCreate(NoteBase):
    vocab_ids: List[int] = []
    grammar_ids: List[int] = []

class Note(NoteBase):
    id: int
    vocab_rel: List[VocabularyEntry] = []
    grammar_rel: List[GrammarRule] = []
    class Config:
        from_attributes = True

class GlobalSense(BaseModel):
    native_translation: str
    related_entries: List[VocabularyEntry]