from sqlalchemy.orm import Session
import models
import schemas
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- USUARIOS ---

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = pwd_context.hash(user.password)
    db_user = models.User(
        username=user.username,
        email=user.email,
        display_name=user.display_name,
        hashed_password=hashed_password,
        avatar=user.avatar,
        theme_colors=user.theme_colors
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# --- VOCABULARIO (CRUD COMPLETO) ---

def get_my_vocabulary(db: Session, user_id: int, lang_code: str = None):
    query = db.query(models.VocabularyEntry).filter(models.VocabularyEntry.user_id == user_id)
    if lang_code:
        query = query.filter(models.VocabularyEntry.language_code == lang_code)
    return query.all()

def create_vocabulary_entry(db: Session, entry: schemas.VocabularyEntryCreate, user_id: int):
    db_entry = models.VocabularyEntry(
        surface_form=entry.surface_form,
        reading=entry.reading,
        language_code=entry.language_code,
        is_public=entry.is_public,
        user_id=user_id
    )
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    
    for sense_in in entry.senses:
        db_sense = models.Sense(**sense_in.model_dump(), entry_id=db_entry.id)
        db.add(db_sense)
    
    db.commit()
    db.refresh(db_entry)
    return db_entry

def update_vocabulary_entry(db: Session, entry_id: int, entry: schemas.VocabularyEntryCreate, user_id: int):
    db_entry = db.query(models.VocabularyEntry).filter(models.VocabularyEntry.id == entry_id, models.VocabularyEntry.user_id == user_id).first()
    if not db_entry:
        return None
    
    # Actualizar campos básicos
    db_entry.surface_form = entry.surface_form
    db_entry.reading = entry.reading
    db_entry.is_public = entry.is_public
    
    # Limpiar sentidos antiguos e insertar nuevos (estrategia simple para edición)
    db.query(models.Sense).filter(models.Sense.entry_id == entry_id).delete()
    for sense_in in entry.senses:
        db_sense = models.Sense(**sense_in.model_dump(), entry_id=db_entry.id)
        db.add(db_sense)
    
    db.commit()
    db.refresh(db_entry)
    return db_entry

def delete_vocabulary_entry(db: Session, entry_id: int, user_id: int):
    db_entry = db.query(models.VocabularyEntry).filter(models.VocabularyEntry.id == entry_id, models.VocabularyEntry.user_id == user_id).first()
    if db_entry:
        db.delete(db_entry)
        db.commit()
        return True
    return False

# --- GRAMÁTICA Y EXPRESIONES ---

def update_grammar_rule(db: Session, grammar_id: int, grammar: schemas.GrammarRuleCreate, user_id: int):
    db_g = db.query(models.GrammarRule).filter(models.GrammarRule.id == grammar_id, models.GrammarRule.user_id == user_id).first()
    if not db_g: return None
    for key, value in grammar.model_dump().items():
        setattr(db_g, key, value)
    db.commit()
    db.refresh(db_g)
    return db_g

def update_expression(db: Session, expr_id: int, expr: schemas.ExpressionCreate, user_id: int):
    db_e = db.query(models.Expression).filter(models.Expression.id == expr_id, models.Expression.user_id == user_id).first()
    if not db_e: return None
    for key, value in expr.model_dump().items():
        setattr(db_e, key, value)
    db.commit()
    db.refresh(db_e)
    return db_e

# --- NOTAS ---

def get_my_notes(db: Session, user_id: int):
    return db.query(models.Note).filter(models.Note.user_id == user_id).all()

def create_note(db: Session, note: schemas.NoteCreate, user_id: int):
    db_note = models.Note(
        title=note.title,
        content=note.content,
        topic=note.topic,
        user_id=user_id
    )
    if note.vocab_ids:
        db_note.vocab_rel = db.query(models.VocabularyEntry).filter(models.VocabularyEntry.id.in_(note.vocab_ids)).all()
    if note.grammar_ids:
        db_note.grammar_rel = db.query(models.GrammarRule).filter(models.GrammarRule.id.in_(note.grammar_ids)).all()
    if note.expression_ids:
        db_note.expression_rel = db.query(models.Expression).filter(models.Expression.id.in_(note.expression_ids)).all()
        
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note