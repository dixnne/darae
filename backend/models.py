from sqlalchemy import Column, Integer, String, Text, ForeignKey, Table, JSON, Boolean
from sqlalchemy.orm import relationship
from database import Base

# --- TABLAS DE ASOCIACIÓN PARA EL GRAFO ---

note_vocabulary = Table(
    'note_vocabulary',
    Base.metadata,
    Column('note_id', Integer, ForeignKey('notes.id')),
    Column('entry_id', Integer, ForeignKey('vocabulary_entries.id'))
)

note_grammar = Table(
    'note_grammar',
    Base.metadata,
    Column('note_id', Integer, ForeignKey('notes.id')),
    Column('grammar_id', Integer, ForeignKey('grammar_rules.id'))
)

# Nueva tabla para vincular expresiones a notas
note_expressions = Table(
    'note_expressions',
    Base.metadata,
    Column('note_id', Integer, ForeignKey('notes.id')),
    Column('expression_id', Integer, ForeignKey('expressions.id'))
)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    display_name = Column(String)
    hashed_password = Column(String)
    avatar = Column(String, default="User")
    theme_colors = Column(JSON, default=["#F7CFD8", "#F4F8D3", "#A6D6D6", "#8E7DBE"])
    
    entries = relationship("VocabularyEntry", back_populates="owner")
    notes = relationship("Note", back_populates="owner")
    grammars = relationship("GrammarRule", back_populates="owner")
    expressions = relationship("Expression", back_populates="owner")

class VocabularyEntry(Base):
    __tablename__ = "vocabulary_entries"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    language_code = Column(String)
    surface_form = Column(String, index=True)
    reading = Column(String)
    is_public = Column(Boolean, default=True) # Corregido a Boolean
    
    owner = relationship("User", back_populates="entries")
    senses = relationship("Sense", back_populates="entry", cascade="all, delete-orphan")
    notes_rel = relationship("Note", secondary=note_vocabulary, back_populates="vocab_rel")

class Sense(Base):
    __tablename__ = "senses"
    id = Column(Integer, primary_key=True, index=True)
    entry_id = Column(Integer, ForeignKey('vocabulary_entries.id'))
    native_translation = Column(String)
    english_translation = Column(String, nullable=True)
    entry = relationship("VocabularyEntry", back_populates="senses")

class Expression(Base):
    __tablename__ = "expressions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    language_code = Column(String)
    text = Column(String, index=True)
    native_translation = Column(String)
    english_translation = Column(String, nullable=True)
    usage_description = Column(Text, nullable=True)
    is_public = Column(Boolean, default=True) # Corregido a Boolean
    
    owner = relationship("User", back_populates="expressions")
    notes_rel = relationship("Note", secondary=note_expressions, back_populates="expression_rel")

class GrammarRule(Base):
    __tablename__ = "grammar_rules"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    language_code = Column(String)
    name = Column(String, index=True)
    structure = Column(String)
    explanation = Column(Text)
    examples = Column(JSON, default=[])
    is_public = Column(Boolean, default=True) # Corregido a Boolean
    
    owner = relationship("User", back_populates="grammars")
    notes_rel = relationship("Note", secondary=note_grammar, back_populates="grammar_rel")

class Note(Base):
    __tablename__ = "notes"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    title = Column(String)
    content = Column(Text)
    topic = Column(String, default="General")
    
    owner = relationship("User", back_populates="notes")
    vocab_rel = relationship("VocabularyEntry", secondary=note_vocabulary, back_populates="notes_rel")
    grammar_rel = relationship("GrammarRule", secondary=note_grammar, back_populates="notes_rel")
    expression_rel = relationship("Expression", secondary=note_expressions, back_populates="notes_rel")