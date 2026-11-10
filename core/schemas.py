from datetime import date
from pydantic import BaseModel


# --- UŽIVATELÉ ---
class UserBase(BaseModel):
    email: str
    full_name: str


class UserCreate(UserBase):
    password: str


class UserRegister(BaseModel):
    email: str
    full_name: str
    password: str
    confirm_password: str


class UserLogin(BaseModel):
    email: str
    password: str


class GoogleLogin(BaseModel):
    email: str
    name: str | None = "Google User"


class UserOut(UserBase):
    id: int
    is_admin: bool

    class Config:
        from_attributes = True


# --- VOZIDLA ---
class VehicleBase(BaseModel):
    name: str | None = None
    brand: str
    model: str
    generation: str | None = None
    engine: str | None = None
    power_kw: int | None = None
    year: int | None = None
    vin: str | None = None
    license_plate: str | None = None


class VehicleCreate(VehicleBase):
    pass


class VehicleOut(VehicleBase):
    id: int
    owner_id: int

    class Config:
        from_attributes = True


# --- TANKOVÁNÍ ---
class RefuelingCreate(BaseModel):
    vehicle_id: int
    date: date
    liters: float
    price_total: float
    odometer: int


# --- VÝLETY ---
class TripCreate(BaseModel):
    vehicle_id: int
    title: str
    date: date
    start_location: str | None = None
    destination: str | None = None
    distance_km: float
    avg_consumption: float | None = None
    note: str | None = None


# --- SERVIS ---
class ServiceCreate(BaseModel):
    vehicle_id: int
    date: date
    title: str
    cost: float
    mileage: int
    note: str | None = None


# --- DOKLADY ---
class DocumentCreate(BaseModel):
    vehicle_id: int
    doc_type: str
    expiry_date: date
    note: str | None = None