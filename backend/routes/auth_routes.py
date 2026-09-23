import uuid
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr, Field
from backend.database import get_db
from backend.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

class SignupRequest(BaseModel):
    name: str = Field(..., min_length=2)
    email: EmailStr
    password: str = Field(..., min_length=6)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=6)

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

@router.post("/signup", response_model=AuthResponse)
def signup(req: SignupRequest):
    email = req.email.strip().lower()
    name = req.name.strip()
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Check if user already exists
    cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please sign in."
        )
        
    user_id = str(uuid.uuid4())
    pwd_hash = hash_password(req.password)
    
    cursor.execute(
        "INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)",
        (user_id, name, email, pwd_hash)
    )
    conn.commit()
    conn.close()
    
    token = create_access_token({"sub": user_id, "email": email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "name": name,
            "email": email
        }
    }

@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest):
    email = req.email.strip().lower()
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, email, password_hash FROM users WHERE email = ?", (email,))
    row = cursor.fetchone()
    conn.close()
    
    if not row or not verify_password(req.password, row["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please verify your credentials and try again."
        )
        
    token = create_access_token({"sub": row["id"], "email": row["email"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": row["id"],
            "name": row["name"],
            "email": row["email"]
        }
    }

@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "user": current_user
    }

@router.post("/change-password")
def change_password(req: ChangePasswordRequest, current_user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT password_hash FROM users WHERE id = ?", (current_user["id"],))
    row = cursor.fetchone()
    
    if not row or not verify_password(req.old_password, row["password_hash"]):
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password entered is incorrect."
        )
        
    new_hash = hash_password(req.new_password)
    cursor.execute("UPDATE users SET password_hash = ? WHERE id = ?", (new_hash, current_user["id"]))
    conn.commit()
    conn.close()
    return {"message": "Password changed successfully."}
