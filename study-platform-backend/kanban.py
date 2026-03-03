from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from datetime import datetime

import models, schemas, database, ai_service, auth

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")


def get_db():
    return database.get_db()


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    from jose import JWTError, jwt
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email: str | None = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter_by(email=email).first()
    if not user:
        raise credentials_exception
    return user


@router.post("/boards", response_model=schemas.KanbanBoardResponse, status_code=status.HTTP_201_CREATED)
def create_board(board: schemas.KanbanBoardCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    new = models.KanbanBoard(name=board.name, owner_id=current_user.id)
    db.add(new)
    db.commit()
    db.refresh(new)
    return new


@router.get("/boards")
def list_boards(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.KanbanBoard).filter_by(owner_id=current_user.id).all()


@router.get("/boards/{board_id}")
def get_board(board_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    board = db.query(models.KanbanBoard).filter_by(id=board_id, owner_id=current_user.id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    return board


@router.post("/columns", response_model=schemas.KanbanColumnResponse, status_code=status.HTTP_201_CREATED)
def create_column(col: schemas.KanbanColumnCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    # ensure board belongs to user
    board = db.query(models.KanbanBoard).filter_by(id=col.board_id, owner_id=current_user.id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    new = models.KanbanColumn(title=col.title, board_id=col.board_id)
    db.add(new)
    db.commit()
    db.refresh(new)
    return new


@router.post("/cards", response_model=schemas.KanbanCardResponse, status_code=status.HTTP_201_CREATED)
def create_card(card: schemas.KanbanCardCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    # verify column belongs to board owned by user
    col = db.query(models.KanbanColumn).filter_by(id=card.column_id).first()
    if not col:
        raise HTTPException(status_code=404, detail="Column not found")
    board = db.query(models.KanbanBoard).filter_by(id=col.board_id, owner_id=current_user.id).first()
    if not board:
        raise HTTPException(status_code=403, detail="Not allowed")
    new = models.KanbanCard(
        title=card.title,
        description=card.description,
        due_date=card.due_date,
        priority=card.priority or 3,
        column_id=card.column_id,
    )
    db.add(new)
    db.commit()
    db.refresh(new)
    return new


@router.patch("/cards/{card_id}", response_model=schemas.KanbanCardResponse)
def update_card(card_id: int, payload: schemas.KanbanCardUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    card = db.query(models.KanbanCard).filter_by(id=card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    # ensure user owns the board
    board = db.query(models.KanbanBoard).filter_by(id=card.column.board_id, owner_id=current_user.id).first()
    if not board:
        raise HTTPException(status_code=403, detail="Not allowed")
    for k, v in payload.__dict__.items():
        if v is not None:
            setattr(card, k, v)
    db.commit()
    db.refresh(card)
    return card


@router.delete("/cards/{card_id}")
def delete_card(card_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    card = db.query(models.KanbanCard).filter_by(id=card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    board = db.query(models.KanbanBoard).filter_by(id=card.column.board_id, owner_id=current_user.id).first()
    if not board:
        raise HTTPException(status_code=403, detail="Not allowed")
    db.delete(card)
    db.commit()
    return {"deleted": True}


@router.post("/suggest", response_model=schemas.KanbanSuggestionResponse)
def suggest_card(payload: dict):
    title = payload.get("title", "")
    description = payload.get("description", "")
    due = payload.get("due_date")

    suggestion = ai_service.generate_card_suggestion(title=title, description=description, due_date=due)
    return suggestion
