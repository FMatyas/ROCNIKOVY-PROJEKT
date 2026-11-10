from datetime import datetime
from decimal import Decimal
from dotenv import load_dotenv
import os
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from passlib.context import CryptContext
import requests
from sqlalchemy.orm import Session
from starlette.middleware.sessions import SessionMiddleware

import core.models as models
from core import crud, schemas
from database import Base, engine, get_db

# Načtení proměnných z .env souboru
load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI(title="TrackMyRide API")

# Konfigurace CORS pro React frontend (Vite běží standardně na portu 5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = os.getenv("SECRET_KEY", "trackmyride-super-secret-key-2026")
app.add_middleware(
    SessionMiddleware, secret_key=SECRET_KEY, max_age=30 * 24 * 60 * 60
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


@app.on_event("startup")
def create_admin_user():
    db = next(get_db())
    admin_email = "admin@trackmyride.cz"
    admin = (
        db.query(models.User).filter(models.User.email == admin_email).first()
    )
    if not admin:
        hashed_pw = get_password_hash("admin123")
        admin_user = models.User(
            email=admin_email,
            full_name="Super Admin",
            hashed_password=hashed_pw,
            is_admin=True,
        )
        db.add(admin_user)
        db.commit()


# UNIVERZÁLNÍ VEŘEJNÉ VIN API
@app.get("/api/etechnicak/{vin}")
def fetch_vin_data(vin: str):
    clean_vin = vin.strip().upper()
    if len(clean_vin) != 17:
        raise HTTPException(
            status_code=400, detail="VIN kód musí mít přesně 17 znaků."
        )

    try:
        fallback_url = f"https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/{clean_vin}?format=json"
        fb_resp = requests.get(fallback_url, timeout=5)
        if fb_resp.status_code == 200:
            fb_data = fb_resp.json()
            results = fb_data.get("Results", [])
            if results:
                car = results[0]
                brand = car.get("Make")
                model = car.get("Model")
                year = car.get("ModelYear")
                displacement = car.get("DisplacementL")
                fuel = car.get("FuelTypePrimary")

                engine_str = ""
                if displacement:
                    engine_str += f"{displacement}L "
                if fuel:
                    engine_str += fuel

                if brand and model:
                    return {
                        "success": True,
                        "brand": brand.title(),
                        "model": model,
                        "engine": engine_str.strip(),
                        "power_kw": None,
                        "year": int(year) if year and year.isdigit() else None,
                        "license_plate": "",
                    }
    except Exception as e:
        print(f"Chyba při dekódování VIN: {e}")

    return {
        "success": True,
        "brand": "",
        "model": "",
        "engine": "",
        "power_kw": None,
        "year": None,
        "license_plate": "",
    }


# ==========================================================================
# 🔐 AUTENTIZACE API
# ==========================================================================
@app.get("/api/auth/me")
def get_current_user(request: Request):
    user = request.session.get("user")
    if not user:
        raise HTTPException(status_code=401, detail="Nepřihlášený uživatel")
    return {"success": True, "user": user}


@app.post("/api/register")
def register_user(user_in: schemas.UserRegister, request: Request, db: Session = Depends(get_db)):
    if user_in.password != user_in.confirm_password:
        raise HTTPException(status_code=400, detail="Zadaná hesla se neshodují.")

    existing_user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Tento e-mail je již zaregistrován.")

    hashed_pw = get_password_hash(user_in.password)
    new_user = models.User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=hashed_pw,
        is_admin=False,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    request.session["user"] = {
        "id": new_user.id,
        "email": new_user.email,
        "name": new_user.full_name,
        "is_admin": new_user.is_admin,
    }
    return {"success": True, "user": request.session["user"]}


@app.post("/api/login")
def login_user(credentials: schemas.UserLogin, request: Request, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Nesprávný e-mail nebo heslo.")

    request.session["user"] = {
        "id": user.id,
        "email": user.email,
        "name": user.full_name,
        "is_admin": user.is_admin,
    }
    return {"success": True, "user": request.session["user"]}


@app.post("/api/auth/google-login")
def google_login_api(google_data: schemas.GoogleLogin, request: Request, db: Session = Depends(get_db)):
    if not google_data.email:
        raise HTTPException(status_code=400, detail="Chybí e-mail.")

    db_user = db.query(models.User).filter(models.User.email == google_data.email).first()
    if not db_user:
        db_user = models.User(
            email=google_data.email,
            full_name=google_data.name or "Google User",
            hashed_password=get_password_hash(os.urandom(16).hex()),
            is_admin=False,
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

    request.session["user"] = {
        "id": db_user.id,
        "email": db_user.email,
        "name": db_user.full_name,
        "is_admin": db_user.is_admin,
    }
    return {"success": True, "user": request.session["user"]}


@app.post("/api/logout")
def logout(request: Request):
    request.session.clear()
    return {"success": True}


# ==========================================================================
# 📊 DASHBOARD & STATISTIKY API
# ==========================================================================
@app.get("/api/dashboard")
def dashboard_data(request: Request, vehicle_id: int = None, db: Session = Depends(get_db)):
    user_session = request.session.get("user")
    if not user_session:
        raise HTTPException(status_code=401, detail="Nepřihlášený uživatel")

    vehicles = crud.get_user_vehicles(db, user_id=user_session["id"])

    selected_vehicle = None
    if vehicle_id:
        selected_vehicle = next((v for v in vehicles if v.id == vehicle_id), None)
    if not selected_vehicle and vehicles:
        selected_vehicle = vehicles[0]

    avg_consumption = 0.0
    total_cost = 0.0
    chart_dates = []
    chart_consumptions = []

    if selected_vehicle:
        stats = crud.calculate_vehicle_statistics(db, selected_vehicle.id)
        avg_consumption = stats["avg_consumption"]
        total_cost = stats["total_costs"]

        refuelings = (
            db.query(models.Refueling)
            .filter(models.Refueling.vehicle_id == selected_vehicle.id)
            .order_by(models.Refueling.date.asc())
            .all()
        )
        chart_dates = [r.date.strftime("%d.%m.%Y") for r in refuelings]
        chart_consumptions = [
            getattr(r, "calculated_consumption", 0.0) or 0.0 for r in refuelings
        ]

    return {
        "success": True,
        "vehicles": [{"id": v.id, "name": v.name, "brand": v.brand, "model": v.model} for v in vehicles],
        "selected_vehicle": {"id": selected_vehicle.id, "name": selected_vehicle.name} if selected_vehicle else None,
        "avg_consumption": avg_consumption,
        "total_cost": total_cost,
        "chart_dates": chart_dates,
        "chart_consumptions": chart_consumptions,
    }


# ==========================================================================
# 🚗 VOZIDLA API
# ==========================================================================
@app.post("/api/vehicles/add")
def add_vehicle(vehicle_in: schemas.VehicleCreate, request: Request, db: Session = Depends(get_db)):
    user_session = request.session.get("user")
    if not user_session:
        raise HTTPException(status_code=401, detail="Nepřihlášený uživatel")

    if not vehicle_in.name:
        vehicle_in.name = f"{vehicle_in.brand} {vehicle_in.model}"

    if vehicle_in.vin:
        vehicle_in.vin = vehicle_in.vin.upper()

    new_vehicle = crud.create_vehicle(db, vehicle_in, user_id=user_session["id"])
    return {"success": True, "vehicle_id": new_vehicle.id}


# ==========================================================================
# 🗺️ VÝLETY A JÍZDY API
# ==========================================================================
@app.get("/api/trips")
def get_trips(request: Request, db: Session = Depends(get_db)):
    user_session = request.session.get("user")
    if not user_session:
        raise HTTPException(status_code=401, detail="Nepřihlášený uživatel")

    trips = (
        db.query(models.Trip)
        .join(models.Vehicle)
        .filter(models.Vehicle.owner_id == user_session["id"])
        .order_by(models.Trip.date.desc())
        .all()
    )
    return {"success": True, "trips": [{"id": t.id, "title": t.title, "date": str(t.date), "distance_km": float(t.distance_km)} for t in trips]}


@app.post("/api/trips/add")
def add_trip(trip_in: schemas.TripCreate, request: Request, db: Session = Depends(get_db)):
    user_session = request.session.get("user")
    if not user_session:
        raise HTTPException(status_code=401, detail="Nepřihlášený uživatel")

    new_trip = models.Trip(
        vehicle_id=trip_in.vehicle_id,
        title=trip_in.title,
        date=trip_in.date,
        start_location=trip_in.start_location,
        destination=trip_in.destination,
        distance_km=Decimal(str(trip_in.distance_km)),
        avg_consumption=Decimal(str(trip_in.avg_consumption)) if trip_in.avg_consumption else None,
        note=trip_in.note,
    )
    db.add(new_trip)
    db.commit()
    return {"success": True}


# ==========================================================================
# ⛽ TANKOVÁNÍ API
# ==========================================================================
@app.get("/api/refuelings")
def get_refuelings(request: Request, db: Session = Depends(get_db)):
    user_session = request.session.get("user")
    if not user_session:
        raise HTTPException(status_code=401, detail="Nepřihlášený uživatel")

    refuelings = (
        db.query(models.Refueling)
        .join(models.Vehicle)
        .filter(models.Vehicle.owner_id == user_session["id"])
        .order_by(models.Refueling.date.desc())
        .all()
    )
    return {"success": True, "refuelings": [{"id": r.id, "date": str(r.date), "liters": float(r.liters), "price_total": float(r.price_total), "odometer": r.odometer} for r in refuelings]}


@app.post("/api/refuelings/add")
def add_refueling(refueling_in: schemas.RefuelingCreate, request: Request, db: Session = Depends(get_db)):
    user_session = request.session.get("user")
    if not user_session:
        raise HTTPException(status_code=401, detail="Nepřihlášený uživatel")

    crud.create_refueling(db, refueling_in)
    return {"success": True}


# ==========================================================================
# 🛠️ SERVIS A ÚDRŽBA API
# ==========================================================================
@app.get("/api/services")
def get_services(request: Request, db: Session = Depends(get_db)):
    user_session = request.session.get("user")
    if not user_session:
        raise HTTPException(status_code=401, detail="Nepřihlášený uživatel")

    services = (
        db.query(models.ServiceRecord)
        .join(models.Vehicle)
        .filter(models.Vehicle.owner_id == user_session["id"])
        .order_by(models.ServiceRecord.date.desc())
        .all()
    )
    return {"success": True, "services": [{"id": s.id, "title": s.title, "date": str(s.date), "cost": float(s.cost), "mileage": s.mileage} for s in services]}


@app.post("/api/services/add")
def add_service(service_in: schemas.ServiceCreate, request: Request, db: Session = Depends(get_db)):
    user_session = request.session.get("user")
    if not user_session:
        raise HTTPException(status_code=401, detail="Nepřihlášený uživatel")

    new_service = models.ServiceRecord(
        vehicle_id=service_in.vehicle_id,
        title=service_in.title,
        date=service_in.date,
        cost=Decimal(str(service_in.cost)),
        mileage=service_in.mileage,
        note=service_in.note,
    )
    db.add(new_service)
    db.commit()
    return {"success": True}


# ==========================================================================
# 📄 DOKLADY A STK API
# ==========================================================================
@app.get("/api/documents")
def get_documents(request: Request, db: Session = Depends(get_db)):
    user_session = request.session.get("user")
    if not user_session:
        raise HTTPException(status_code=401, detail="Nepřihlášený uživatel")

    documents = (
        db.query(models.Document)
        .join(models.Vehicle)
        .filter(models.Vehicle.owner_id == user_session["id"])
        .order_by(models.Document.expiry_date.asc())
        .all()
    )
    return {"success": True, "documents": [{"id": d.id, "doc_type": d.doc_type, "expiry_date": str(d.expiry_date), "note": d.note} for d in documents]}


@app.post("/api/documents/add")
def add_document(doc_in: schemas.DocumentCreate, request: Request, db: Session = Depends(get_db)):
    user_session = request.session.get("user")
    if not user_session:
        raise HTTPException(status_code=401, detail="Nepřihlášený uživatel")

    new_doc = models.Document(
        vehicle_id=doc_in.vehicle_id,
        doc_type=doc_in.doc_type,
        expiry_date=doc_in.expiry_date,
        note=doc_in.note,
    )
    db.add(new_doc)
    db.commit()
    return {"success": True}


# ==========================================================================
# 🌐 SERVÍROVÁNÍ REACT FRONTENDU (PROD / JEDNOTNÝ SERVER)
# ==========================================================================
frontend_dist = os.path.join("frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_react(full_path: str):
        if full_path.startswith("api"):
            raise HTTPException(status_code=404, detail="API endpoint nenalezen")
        
        target_file = os.path.join(frontend_dist, full_path)
        if os.path.exists(target_file) and os.path.isfile(target_file):
            return FileResponse(target_file)
        return FileResponse(os.path.join(frontend_dist, "index.html"))