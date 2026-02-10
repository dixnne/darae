from sqlalchemy import Column, Integer, String, Text, ForeignKey, Table, JSON
from sqlalchemy.orm import relationship
from database import Base

# --- TABLAS INTERMEDIAS PARA RELACIONES M:N ---

# Relación entre Notas y Vocabulario
note_vocabulary = Table(
    'note_vocabulary',
    Base.metadata,
    Column('note_id', Integer, ForeignKey('notes.id')),
    Column('entry_id', Integer, ForeignKey('vocabulary_entries.id'))
)

# Relación entre Notas y Gramática
note_grammar = Table(
    'note_grammar',
    Base.metadata,
    Column('note_id', Integer, ForeignKey('notes.id')),
    Column('grammar_id', Integer, ForeignKey('grammar_rules.id'))
)

# --- ENTIDADES PRINCIPALES ---

class Language(Base):
    __tablename__ = "languages"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True) # Ej: "Korean", "Japanese"
    code = Column(String, unique=True) # Ej: "ko", "ja"
    
    entries = relationship("VocabularyEntry", back_populates="language")
    expressions = relationship("Expression", back_populates="language")
    grammars = relationship("GrammarRule", back_populates="language")

class VocabularyEntry(Base):
    """Representa la palabra física en un idioma específico"""
    __tablename__ = "vocabulary_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    language_id = Column(Integer, ForeignKey('languages.id'))
    surface_form = Column(String, index=True) # La palabra escrita (학생)
    reading = Column(String)                  # Lectura/Pronunciación (hak-saeng)
    
    language = relationship("Language", back_populates="entries")
    senses = relationship("Sense", back_populates="entry", cascade="all, delete-orphan")
    notes_rel = relationship("Note", secondary=note_vocabulary, back_populates="vocab_rel")

class Sense(Base):
    """Representa uno de los múltiples significados de una palabra"""
    __tablename__ = "senses"
    
    id = Column(Integer, primary_key=True, index=True)
    entry_id = Column(Integer, ForeignKey('vocabulary_entries.id'))
    native_translation = Column(String, index=True) # Traducción al Español (Clave para Diccionario Global)
    english_translation = Column(String, nullable=True) # Traducción al Inglés (Opcional)
    definition = Column(Text, nullable=True)
    
    entry = relationship("VocabularyEntry", back_populates="senses")

class Expression(Base):
    """Frases hechas, modismos o saludos"""
    __tablename__ = "expressions"
    
    id = Column(Integer, primary_key=True, index=True)
    language_id = Column(Integer, ForeignKey('languages.id'))
    text = Column(String, index=True)
    native_translation = Column(String)
    english_translation = Column(String, nullable=True)
    usage_description = Column(Text) # Cómo y cuándo usarla
    
    language = relationship("Language", back_populates="expressions")

class GrammarRule(Base):
    """Reglas gramaticales con ejemplos estructurados"""
    __tablename__ = "grammar_rules"
    
    id = Column(Integer, primary_key=True, index=True)
    language_id = Column(Integer, ForeignKey('languages.id'))
    name = Column(String, index=True) # Ej: "Partícula de sujeto -i/-ga"
    structure = Column(String)        # Ej: "N + 이/가"
    explanation = Column(Text)
    # Usamos JSON para guardar el array de ejemplos de forma flexible
    examples = Column(JSON, default=[]) 
    
    language = relationship("Language", back_populates="grammars")
    notes_rel = relationship("Note", secondary=note_grammar, back_populates="grammar_rel")

class Note(Base):
    """Tu centro de conocimiento personal"""
    __tablename__ = "notes"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    content = Column(Text)
    topic = Column(String, default="General")
    
    vocab_rel = relationship("VocabularyEntry", secondary=note_vocabulary, back_populates="notes_rel")
    grammar_rel = relationship("GrammarRule", secondary=note_grammar, back_populates="notes_rel")