from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional

# Importaciones absolutas para el entorno Docker
import models
import schemas
import crud
import database

# Inicialización de la base de datos y creación de tablas robustas
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(
    title="Darae API",
    description="Sistema de gestión de conocimiento para el aprendizaje de idiomas (Coreano y más)",
    version="2.0.0"
)

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- IDIOMAS ---

@app.get("/languages/", response_model=List[schemas.Language], tags=["Configuración"])
def list_languages(db: Session = Depends(database.get_db)):
    """Lista todos los idiomas disponibles en el sistema."""
    return crud.get_languages(db)

@app.post("/languages/", response_model=schemas.Language, tags=["Configuración"])
def add_language(language: schemas.LanguageCreate, db: Session = Depends(database.get_db)):
    """Registra un nuevo idioma de estudio."""
    return crud.create_language(db, language)

# --- VOCABULARIO ---

@app.get("/vocabulary/", response_model=List[schemas.VocabularyEntry], tags=["Vocabulario"])
def list_vocabulary(
    language_id: Optional[int] = None, 
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(database.get_db)
):
    """Obtiene el vocabulario, con opción de filtrar por idioma."""
    return crud.get_vocabulary_entries(db, language_id=language_id, skip=skip, limit=limit)

@app.post("/vocabulary/", response_model=schemas.VocabularyEntry, tags=["Vocabulario"])
def add_vocabulary_entry(entry: schemas.VocabularyEntryCreate, db: Session = Depends(database.get_db)):
    """Crea una palabra con múltiples significados y traducciones opcionales."""
    return crud.create_vocabulary_entry(db, entry)

# --- EXPRESIONES ---

@app.get("/expressions/", response_model=List[schemas.Expression], tags=["Expresiones"])
def list_expressions(language_id: Optional[int] = None, db: Session = Depends(database.get_db)):
    """Lista frases hechas y modismos con sus descripciones de uso."""
    return crud.get_expressions(db, language_id=language_id)

@app.post("/expressions/", response_model=schemas.Expression, tags=["Expresiones"])
def add_expression(expression: schemas.ExpressionCreate, db: Session = Depends(database.get_db)):
    """Añade una nueva expresión o saludo al diccionario."""
    return crud.create_expression(db, expression)

# --- GRAMÁTICA ---

@app.get("/grammar/", response_model=List[schemas.GrammarRule], tags=["Gramática"])
def list_grammar_rules(language_id: Optional[int] = None, db: Session = Depends(database.get_db)):
    """Obtiene reglas gramaticales y sus estructuras."""
    return crud.get_grammar_rules(db, language_id=language_id)

@app.post("/grammar/", response_model=schemas.GrammarRule, tags=["Gramática"])
def add_grammar_rule(grammar: schemas.GrammarRuleCreate, db: Session = Depends(database.get_db)):
    """Guarda reglas de gramática con ejemplos para futuras flashcards."""
    return crud.create_grammar_rule(db, grammar)

# --- NOTAS ---

@app.get("/notes/", response_model=List[schemas.Note], tags=["Conocimiento"])
def list_notes(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    """Lista todas tus notas personales y sus relaciones."""
    return crud.get_notes(db, skip=skip, limit=limit)

@app.post("/notes/", response_model=schemas.Note, tags=["Conocimiento"])
def add_note(note: schemas.NoteCreate, db: Session = Depends(database.get_db)):
    """Crea notas y las vincula con vocabulario o gramática específica."""
    return crud.create_note(db, note)

# --- DICCIONARIO GLOBAL ---

@app.get("/dictionary/global/", response_model=List[schemas.GlobalSense], tags=["Global"])
def get_global_dict(db: Session = Depends(database.get_db)):
    """Agrupa el conocimiento de todos los idiomas por su traducción nativa."""
    return crud.get_global_dictionary(db)

# --- SALUD DEL SISTEMA ---

@app.get("/", tags=["Sistema"])
def health_check():
    """Verifica que el motor de LingoGraph esté rugiendo."""
    return {
        "status": "online", 
        "message": "Bienvenida a tu grafo de idiomas, Bitna.",
        "version": "2.0.0"
    }