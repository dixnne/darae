from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import List, Optional

import models, schemas, crud, database

SECRET_KEY = "tu_llave_secreta_poetica_para_lingograph"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="LingoGraph API Pro", version="2.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None: raise HTTPException(status_code=401)
    except JWTError: raise HTTPException(status_code=401)
    user = crud.get_user_by_username(db, username=username)
    if user is None: raise HTTPException(status_code=401)
    return user

# --- AUTH ---
@app.post("/register", response_model=schemas.User)
def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    return crud.create_user(db, user)

@app.post("/token", response_model=schemas.Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = crud.get_user_by_username(db, form_data.username)
    if not user or not crud.pwd_context.verify(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrecto")
    access_token = jwt.encode({"sub": user.username, "exp": datetime.utcnow() + timedelta(days=7)}, SECRET_KEY, algorithm=ALGORITHM)
    return {"access_token": access_token, "token_type": "bearer", "user": user}

# --- VOCABULARY ---
@app.get("/vocabulary/me", response_model=List[schemas.VocabularyEntry])
def read_v(lang: Optional[str] = None, db: Session = Depends(database.get_db), user=Depends(get_current_user)):
    return crud.get_my_vocabulary(db, user.id, lang)

@app.post("/vocabulary/", response_model=schemas.VocabularyEntry)
def create_v(entry: schemas.VocabularyEntryCreate, db: Session = Depends(database.get_db), user=Depends(get_current_user)):
    return crud.create_vocabulary_entry(db, entry, user.id)

@app.put("/vocabulary/{id}", response_model=schemas.VocabularyEntry)
def update_v(id: int, entry: schemas.VocabularyEntryCreate, db: Session = Depends(database.get_db), user=Depends(get_current_user)):
    updated = crud.update_vocabulary_entry(db, id, entry, user.id)
    if not updated: raise HTTPException(status_code=404)
    return updated

@app.delete("/vocabulary/{id}")
def delete_v(id: int, db: Session = Depends(database.get_db), user=Depends(get_current_user)):
    if not crud.delete_vocabulary_entry(db, id, user.id): raise HTTPException(status_code=404)
    return {"status": "deleted"}

# --- GRAMMAR ---
@app.get("/grammar/", response_model=List[schemas.GrammarRule])
def read_g(db: Session = Depends(database.get_db), user=Depends(get_current_user)):
    return db.query(models.GrammarRule).filter(models.GrammarRule.user_id == user.id).all()

@app.post("/grammar/", response_model=schemas.GrammarRule)
def create_g(grammar: schemas.GrammarRuleCreate, db: Session = Depends(database.get_db), user=Depends(get_current_user)):
    db_obj = models.GrammarRule(**grammar.model_dump(), user_id=user.id)
    db.add(db_obj); db.commit(); db.refresh(db_obj)
    return db_obj

@app.put("/grammar/{id}", response_model=schemas.GrammarRule)
def update_g(id: int, grammar: schemas.GrammarRuleCreate, db: Session = Depends(database.get_db), user=Depends(get_current_user)):
    updated = crud.update_grammar_rule(db, id, grammar, user.id)
    if not updated: raise HTTPException(status_code=404)
    return updated

@app.delete("/grammar/{id}")
def delete_g(id: int, db: Session = Depends(database.get_db), user=Depends(get_current_user)):
    db_obj = db.query(models.GrammarRule).filter(models.GrammarRule.id == id, models.GrammarRule.user_id == user.id).first()
    if not db_obj: raise HTTPException(status_code=404)
    db.delete(db_obj); db.commit()
    return {"status": "deleted"}

# --- EXPRESSIONS ---
@app.get("/expressions/", response_model=List[schemas.Expression])
def read_e(db: Session = Depends(database.get_db), user=Depends(get_current_user)):
    return db.query(models.Expression).filter(models.Expression.user_id == user.id).all()

@app.post("/expressions/", response_model=schemas.Expression)
def create_e(expr: schemas.ExpressionCreate, db: Session = Depends(database.get_db), user=Depends(get_current_user)):
    db_obj = models.Expression(**expr.model_dump(), user_id=user.id)
    db.add(db_obj); db.commit(); db.refresh(db_obj)
    return db_obj

@app.put("/expressions/{id}", response_model=schemas.Expression)
def update_e(id: int, expr: schemas.ExpressionCreate, db: Session = Depends(database.get_db), user=Depends(get_current_user)):
    updated = crud.update_expression(db, id, expr, user.id)
    if not updated: raise HTTPException(status_code=404)
    return updated

@app.delete("/expressions/{id}")
def delete_e(id: int, db: Session = Depends(database.get_db), user=Depends(get_current_user)):
    db_obj = db.query(models.Expression).filter(models.Expression.id == id, models.Expression.user_id == user.id).first()
    if not db_obj: raise HTTPException(status_code=404)
    db.delete(db_obj); db.commit()
    return {"status": "deleted"}

# --- NOTES ---
@app.get("/notes/", response_model=List[schemas.Note])
def list_n(db: Session = Depends(database.get_db), user=Depends(get_current_user)):
    return crud.get_my_notes(db, user.id)

@app.post("/notes/", response_model=schemas.Note)
def save_n(note: schemas.NoteCreate, db: Session = Depends(database.get_db), user=Depends(get_current_user)):
    return crud.create_note(db, note, user.id)

@app.get("/vocabulary/public", response_model=List[schemas.VocabularyEntry])
def public_v(db: Session = Depends(database.get_db)):
    return db.query(models.VocabularyEntry).filter(models.VocabularyEntry.is_public == True).all()