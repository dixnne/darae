from sqlalchemy.orm import Session
import models
import schemas

# --- OPERACIONES DE IDIOMA ---

def get_languages(db: Session):
    """Obtiene todos los idiomas configurados."""
    return db.query(models.Language).all()

def create_language(db: Session, language: schemas.LanguageCreate):
    """Registra un nuevo idioma (ej: Coreano, Japonés)."""
    db_language = models.Language(**language.model_dump())
    db.add(db_language)
    db.commit()
    db.refresh(db_language)
    return db_language

# --- OPERACIONES DE VOCABULARIO ---

def get_vocabulary_entries(db: Session, language_id: int = None, skip: int = 0, limit: int = 100):
    """Obtiene entradas de vocabulario, opcionalmente filtradas por idioma."""
    query = db.query(models.VocabularyEntry)
    if language_id:
        query = query.filter(models.VocabularyEntry.language_id == language_id)
    return query.offset(skip).limit(limit).all()

def create_vocabulary_entry(db: Session, entry: schemas.VocabularyEntryCreate):
    """
    Crea una entrada de vocabulario y sus múltiples significados (senses) 
    en una sola transacción atómica.
    """
    # Creamos la entrada base (la forma escrita y lectura)
    db_entry = models.VocabularyEntry(
        surface_form=entry.surface_form,
        reading=entry.reading,
        language_id=entry.language_id
    )
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    
    # Creamos cada significado asociado
    for sense_in in entry.senses:
        db_sense = models.Sense(
            **sense_in.model_dump(), 
            entry_id=db_entry.id
        )
        db.add(db_sense)
    
    db.commit()
    db.refresh(db_entry)
    return db_entry

# --- OPERACIONES DE EXPRESIONES ---

def get_expressions(db: Session, language_id: int = None):
    query = db.query(models.Expression)
    if language_id:
        query = query.filter(models.Expression.language_id == language_id)
    return query.all()

def create_expression(db: Session, expression: schemas.ExpressionCreate):
    db_expr = models.Expression(**expression.model_dump())
    db.add(db_expr)
    db.commit()
    db.refresh(db_expr)
    return db_expr

# --- OPERACIONES DE GRAMÁTICA ---

def get_grammar_rules(db: Session, language_id: int = None):
    query = db.query(models.GrammarRule)
    if language_id:
        query = query.filter(models.GrammarRule.language_id == language_id)
    return query.all()

def create_grammar_rule(db: Session, grammar: schemas.GrammarRuleCreate):
    """Guarda una regla gramatical, incluyendo el array de ejemplos en formato JSON."""
    db_grammar = models.GrammarRule(**grammar.model_dump())
    db.add(db_grammar)
    db.commit()
    db.refresh(db_grammar)
    return db_grammar

# --- OPERACIONES DE NOTAS ---

def get_notes(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Note).offset(skip).limit(limit).all()

def create_note(db: Session, note: schemas.NoteCreate):
    """Crea una nota y establece relaciones con vocabulario y gramática existente."""
    db_note = models.Note(
        title=note.title, 
        content=note.content, 
        topic=note.topic
    )
    
    # Relacionar con vocabulario por sus IDs
    if note.vocab_ids:
        vocab_items = db.query(models.VocabularyEntry).filter(
            models.VocabularyEntry.id.in_(note.vocab_ids)
        ).all()
        db_note.vocab_rel = vocab_items
        
    # Relacionar con gramática por sus IDs
    if note.grammar_ids:
        grammar_items = db.query(models.GrammarRule).filter(
            models.GrammarRule.id.in_(note.grammar_ids)
        ).all()
        db_note.grammar_rel = grammar_items
        
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note

# --- DICCIONARIO GLOBAL ---

def get_global_dictionary(db: Session):
    """
    Lógica para el diccionario global: agrupa entradas de diferentes idiomas
    que comparten la misma traducción nativa (Español).
    """
    senses = db.query(models.Sense).all()
    
    grouped = {}
    for s in senses:
        native = s.native_translation
        if native not in grouped:
            grouped[native] = []
        
        # Evitamos duplicados de la misma palabra física
        if s.entry not in grouped[native]:
            grouped[native].append(s.entry)
            
    # Formateamos para cumplir con el esquema GlobalSense
    return [
        {"native_translation": k, "related_entries": v} 
        for k, v in grouped.items()
    ]