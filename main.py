from datetime import datetime
from decimal import Decimal
import os
import time
from typing import Optional

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from passlib.context import CryptContext
import requests
from sqlalchemy.orm import Session
from starlette.middleware.sessions import SessionMiddleware

import core.models as models
from core import crud, schemas
from database import Base, engine, get_db

# Načtení proměnných z .env souboru (pouze jako fallback)
load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI(title="TrackMyRide API")

# Konfigurace CORS pro React frontend (Vite dev server i lokální produkce)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = os.getenv("SECRET_KEY", "trackmyride-super-secret-key-2026")
app.add_middleware(
    SessionMiddleware, secret_key=SECRET_KEY, max_age=30 * 24 * 60 * 60
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Appwrite konfigurace
APPWRITE_ENDPOINT = os.getenv("APPWRITE_ENDPOINT", "http://localhost/v1").rstrip("/")
APPWRITE_PROJECT_ID = os.getenv("APPWRITE_PROJECT_ID", "6ad8a52c00186563c091").strip()
APPWRITE_DATABASE_ID = os.getenv("APPWRITE_DATABASE_ID", "6ad8ad050001934d73fb").strip()
APPWRITE_COLLECTION_ID = os.getenv(
    "APPWRITE_COLLECTION_ID", "6b05f96e002be9bb345a"
).strip()
APPWRITE_DOCUMENT_ID = os.getenv("APPWRITE_DOCUMENT_ID", "mdcr").strip()
APPWRITE_API_KEY = os.getenv(
    "APPWRITE_API_KEY",
    "46fb4787a4b51b5c48a3d707ce3110e46dc3710924c02f906e27fcb621b35c23f589f756671bc49deaedfadf712694db55b3776a4b3788c052f5108f745d6f7f9f0303e405fb1e2c078f0640910c9e94742bd726931df43c9e4366680148eac33c50ff2ea7d9e7331b668bff53eb5bd0e7f2ef07000e133d1d1a0eba6c001a60",
).strip()

DEFAULT_MDCR_API_KEY = "UL48f06jWdtL6rlTEcVx9Mgehx8DoGY5"

_CONFIG_CACHE: dict = {"expires_at": 0.0, "data": None}
CONFIG_TTL_SECONDS = 30.0


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def set_user_session(request: Request, db_user: models.User) -> dict:
    user_payload = {
        "id": db_user.id,
        "email": db_user.email,
        "name": db_user.full_name,
        "is_admin": db_user.is_admin,
    }
    request.session["user"] = user_payload
    return user_payload


def get_session_user(request: Request) -> dict:
    user_session = request.session.get("user")
    if not user_session:
        raise HTTPException(status_code=401, detail="Nepřihlášený uživatel")
    return user_session


def _load_mdcr_config(force_refresh: bool = False) -> dict:
    """Načte konfiguraci MDČR z Appwrite dokumentu; při chybě použije .env / fallback."""
    now = time.monotonic()
    if not force_refresh and _CONFIG_CACHE["data"] is not None and now < _CONFIG_CACHE["expires_at"]:
        return _CONFIG_CACHE["data"]

    fallback = {
        "mdcr_api_url": os.getenv("MDCR_API_URL", "").strip(),
        "mdcr_api_key": os.getenv("MDCR_API_KEY", DEFAULT_MDCR_API_KEY).strip(),
        "mdcr_api_header": os.getenv("MDCR_API_HEADER", "X-API-Key").strip() or "X-API-Key",
    }

    if (
        APPWRITE_ENDPOINT
        and APPWRITE_PROJECT_ID
        and APPWRITE_DATABASE_ID
        and APPWRITE_COLLECTION_ID
        and APPWRITE_DOCUMENT_ID
    ):
        url = (
            f"{APPWRITE_ENDPOINT}/databases/{APPWRITE_DATABASE_ID}"
            f"/collections/{APPWRITE_COLLECTION_ID}/documents/{APPWRITE_DOCUMENT_ID}"
        )
        headers = {
            "Accept": "application/json",
            "X-Appwrite-Project": APPWRITE_PROJECT_ID,
        }
        if APPWRITE_API_KEY:
            headers["X-Appwrite-Key"] = APPWRITE_API_KEY

        try:
            resp = requests.get(url, headers=headers, timeout=4)
            if resp.status_code == 200:
                doc = resp.json()
                cfg = {
                    "mdcr_api_url": str(doc.get("mdcr_api_url") or fallback["mdcr_api_url"]).strip(),
                    "mdcr_api_key": str(doc.get("mdcr_api_key") or fallback["mdcr_api_key"]).strip(),
                    "mdcr_api_header": str(
                        doc.get("mdcr_api_header") or fallback["mdcr_api_header"]
                    ).strip()
                    or "X-API-Key",
                }
                _CONFIG_CACHE["data"] = cfg
                _CONFIG_CACHE["expires_at"] = now + CONFIG_TTL_SECONDS
                return cfg
            print(f"Appwrite config vrátilo status {resp.status_code}: {resp.text[:200]}")
        except Exception as e:
            print(f"Chyba při čtení konfigurace z Appwrite: {e}")

    _CONFIG_CACHE["data"] = fallback
    _CONFIG_CACHE["expires_at"] = now + 5.0
    return fallback


def _extract_first(data: dict, keys: list[str], default=None):
    for key in keys:
        if key in data and data[key] not in (None, ""):
            return data[key]
    return default


def _fetch_mdcr_vin(vin: str) -> Optional[dict]:
    """Dotaz na Data o vozidlech (MDČR), pokud je nastavena URL a API klíč v Appwrite / env."""
    cfg = _load_mdcr_config()
    api_url = cfg["mdcr_api_url"]
    api_key = cfg["mdcr_api_key"]
    api_header = cfg["mdcr_api_header"]

    if not api_url or not api_key:
        return None

    headers = {
        "Accept": "application/json",
        api_header: api_key,
    }

    try:
        if "{vin}" in api_url:
            url = api_url.format(vin=vin)
            resp = requests.get(url, headers=headers, timeout=8)
        else:
            resp = requests.get(
                api_url, params={"vin": vin}, headers=headers, timeout=8
            )

        if resp.status_code != 200:
            print(f"MDČR API vrátilo status {resp.status_code}: {resp.text[:200]}")
            return None

        payload = resp.json()
        item = payload
        if isinstance(payload, dict):
            for container_key in ("data", "result", "vehicle", "vozidlo"):
                if isinstance(payload.get(container_key), dict):
                    item = payload[container_key]
                    break
                if (
                    isinstance(payload.get(container_key), list)
                    and payload[container_key]
                ):
                    item = payload[container_key][0]
                    break

        if not isinstance(item, dict):
            return None

        brand = _extract_first(
            item, ["brand", "make", "znacka", "tovarniZnacka", "vyrobce"], ""
        )
        model = _extract_first(
            item, ["model", "obchodniOznaceni", "typ"], ""
        )
        engine = _extract_first(
            item, ["engine", "motor", "palivo", "druhPaliva", "zdvihovyObjem"], ""
        )
        power_raw = _extract_first(
            item, ["power_kw", "vykonKw", "maxVykonKw", "kw"], None
        )
        year_raw = _extract_first(
            item, ["year", "rokVyroby", "datumPrvniRegistrace"], None
        )
        plate = _extract_first(
            item, ["license_plate", "spz", "rz", "registracniZnacka"], ""
        )
        stk_valid_to = _extract_first(
            item,
            [
                "stk_valid_to",
                "stkDo",
                "platnostStk",
                "platnostTechnickeProhlidky",
                "tpDo",
            ],
            None,
        )
        emissions_valid_to = _extract_first(
            item,
            ["emissions_valid_to", "emiseDo", "platnostEmisi", "smeDo"],
            None,
        )

        power_kw = None
        if power_raw is not None:
            try:
                power_kw = int(float(str(power_raw).replace(",", ".").split()[0]))
            except (ValueError, TypeError):
                power_kw = None

        year = None
        if year_raw is not None:
            digits = "".join(ch for ch in str(year_raw)[:4] if ch.isdigit())
            if len(digits) == 4:
                year = int(digits)

        has_any = any(
            [brand, model, engine, power_kw, year, plate, stk_valid_to, emissions_valid_to]
        )
        if not has_any:
            return None

        return {
            "success": True,
            "source": "mdcr",
            "brand": str(brand).title() if brand else "",
            "model": str(model),
            "engine": str(engine),
            "power_kw": power_kw,
            "year": year,
            "license_plate": str(plate).upper(),
            "stk_valid_to": str(stk_valid_to) if stk_valid_to else None,
            "emissions_valid_to": str(emissions_valid_to) if emissions_valid_to else None,
        }
    except Exception as e:
        print(f"Chyba při volání MDČR API: {e}")
        return None


def _fetch_nhtsa_vin(vin: str) -> dict:
    """Veřejný fallback přes NHTSA vPIC."""
    try:
        fallback_url = (
            f"https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/{vin}?format=json"
        )
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

                if brand or model:
                    return {
                        "success": True,
                        "source": "nhtsa",
                        "brand": brand.title() if brand else "",
                        "model": model or "",
                        "engine": engine_str.strip(),
                        "power_kw": None,
                        "year": int(year) if year and str(year).isdigit() else None,
                        "license_plate": "",
                        "stk_valid_to": None,
                        "emissions_valid_to": None,
                    }
    except Exception as e:
        print(f"Chyba při dekódování VIN přes NHTSA: {e}")

    return {
        "success": True,
        "source": "none",
        "brand": "",
        "model": "",
        "engine": "",
        "power_kw": None,
        "year": None,
        "license_plate": "",
        "stk_valid_to": None,
        "emissions_valid_to": None,
    }


@app.on_event("startup")
def create_admin_user():
    _load_mdcr_config(force_refresh=True)
    db = next(get_db())
    try:
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
    finally:
        db.close()


# ==========================================================================
# 🔍 DEKÓDOVÁNÍ VIN (MDČR + NHTSA FALLBACK)
# ==========================================================================
@app.get("/api/etechnicak/{vin}")
def fetch_vin_data(vin: str):
    clean_vin = vin.strip().upper()
    if len(clean_vin) != 17:
        raise HTTPException(
            status_code=400, detail="VIN kód musí mít přesně 17 znaků."
        )

    mdcr_result = _fetch_mdcr_vin(clean_vin)
    if mdcr_result:
        return mdcr_result

    return _fetch_nhtsa_vin(clean_vin)


# ==========================================================================
# 🔐 AUTENTIZACE API
# ==========================================================================
@app.get("/api/auth/me")
def get_current_user(request: Request):
    user = get_session_user(request)
    return {"success": True, "user": user}


@app.post("/api/register")
def register_user(
    user_in: schemas.UserRegister, request: Request, db: Session = Depends(get_db)
):
    if user_in.password != user_in.confirm_password:
        raise HTTPException(status_code=400, detail="Zadaná hesla se neshodují.")

    existing_user = (
        db.query(models.User).filter(models.User.email == user_in.email).first()
    )
    if existing_user:
        raise HTTPException(
            status_code=400, detail="Tento e-mail je již zaregistrován."
        )

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

    user_payload = set_user_session(request, new_user)
    return {"success": True, "user": user_payload}


@app.post("/api/login")
def login_user(
    credentials: schemas.UserLogin, request: Request, db: Session = Depends(get_db)
):
    user = (
        db.query(models.User).filter(models.User.email == credentials.email).first()
    )
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Nesprávný e-mail nebo heslo.")

    user_payload = set_user_session(request, user)
    return {"success": True, "user": user_payload}


@app.post("/api/auth/appwrite-google")
async def auth_appwrite_google(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    email = (data.get("email") or "").strip().lower()
    full_name = (data.get("full_name") or email or "Google User").strip()

    if not email:
        raise HTTPException(
            status_code=400, detail="Chybí e-mailová adresa z Appwrite účtu."
        )

    db_user = db.query(models.User).filter(models.User.email == email).first()
    if not db_user:
        db_user = models.User(
            email=email,
            full_name=full_name,
            hashed_password=get_password_hash(os.urandom(16).hex()),
            is_admin=False,
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
    elif not db_user.full_name and full_name:
        db_user.full_name = full_name
        db.commit()
        db.refresh(db_user)

    user_payload = set_user_session(request, db_user)
    return {"success": True, "user": user_payload}


@app.post("/api/auth/google-login")
def google_login_api(
    google_data: schemas.GoogleLogin, request: Request, db: Session = Depends(get_db)
):
    if not google_data.email:
        raise HTTPException(status_code=400, detail="Chybí e-mail.")

    display_name = (
        getattr(google_data, "name", None)
        or getattr(google_data, "full_name", None)
        or "Google User"
    )

    db_user = (
        db.query(models.User).filter(models.User.email == google_data.email).first()
    )
    if not db_user:
        db_user = models.User(
            email=google_data.email,
            full_name=display_name,
            hashed_password=get_password_hash(os.urandom(16).hex()),
            is_admin=False,
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

    user_payload = set_user_session(request, db_user)
    return {"success": True, "user": user_payload}


@app.post("/api/logout")
def logout(request: Request):
    request.session.clear()
    return {"success": True}


# ==========================================================================
# 📊 DASHBOARD & STATISTIKY API
# ==========================================================================
@app.get("/api/dashboard")
def dashboard_data(
    request: Request,
    vehicle_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    user_session = get_session_user(request)
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
        "vehicles": [
            {"id": v.id, "name": v.name, "brand": v.brand, "model": v.model}
            for v in vehicles
        ],
        "selected_vehicle": (
            {"id": selected_vehicle.id, "name": selected_vehicle.name}
            if selected_vehicle
            else None
        ),
        "avg_consumption": avg_consumption,
        "total_cost": total_cost,
        "chart_dates": chart_dates,
        "chart_consumptions": chart_consumptions,
    }


# ==========================================================================
# 🚗 VOZIDLA API
# ==========================================================================
@app.get("/api/vehicles")
def get_vehicles(request: Request, db: Session = Depends(get_db)):
    user_session = get_session_user(request)
    vehicles = crud.get_user_vehicles(db, user_id=user_session["id"])
    return {
        "success": True,
        "vehicles": [
            {
                "id": v.id,
                "name": v.name,
                "brand": v.brand,
                "model": v.model,
                "vin": getattr(v, "vin", None),
                "year": getattr(v, "year", None),
                "engine": getattr(v, "engine", None),
                "power_kw": getattr(v, "power_kw", None),
                "license_plate": getattr(v, "license_plate", None),
            }
            for v in vehicles
        ],
    }


@app.post("/api/vehicles/add")
def add_vehicle(
    vehicle_in: schemas.VehicleCreate,
    request: Request,
    db: Session = Depends(get_db),
):
    user_session = get_session_user(request)

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
    user_session = get_session_user(request)

    trips = (
        db.query(models.Trip)
        .join(models.Vehicle)
        .filter(models.Vehicle.owner_id == user_session["id"])
        .order_by(models.Trip.date.desc())
        .all()
    )
    return {
        "success": True,
        "trips": [
            {
                "id": t.id,
                "title": t.title,
                "date": str(t.date),
                "distance_km": float(t.distance_km),
            }
            for t in trips
        ],
    }


@app.post("/api/trips/add")
def add_trip(
    trip_in: schemas.TripCreate, request: Request, db: Session = Depends(get_db)
):
    user_session = get_session_user(request)

    new_trip = models.Trip(
        vehicle_id=trip_in.vehicle_id,
        title=trip_in.title,
        date=trip_in.date,
        start_location=trip_in.start_location,
        destination=trip_in.destination,
        distance_km=Decimal(str(trip_in.distance_km)),
        avg_consumption=(
            Decimal(str(trip_in.avg_consumption))
            if trip_in.avg_consumption
            else None
        ),
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
    user_session = get_session_user(request)

    refuelings = (
        db.query(models.Refueling)
        .join(models.Vehicle)
        .filter(models.Vehicle.owner_id == user_session["id"])
        .order_by(models.Refueling.date.desc())
        .all()
    )
    return {
        "success": True,
        "refuelings": [
            {
                "id": r.id,
                "date": str(r.date),
                "liters": float(r.liters),
                "price_total": float(r.price_total),
                "odometer": r.odometer,
            }
            for r in refuelings
        ],
    }


@app.post("/api/refuelings/add")
def add_refueling(
    refueling_in: schemas.RefuelingCreate,
    request: Request,
    db: Session = Depends(get_db),
):
    user_session = get_session_user(request)

    crud.create_refueling(db, refueling_in)
    return {"success": True}


# ==========================================================================
# 🛠️ SERVIS A ÚDRŽBA API
# ==========================================================================
@app.get("/api/services")
def get_services(request: Request, db: Session = Depends(get_db)):
    user_session = get_session_user(request)

    services = (
        db.query(models.ServiceRecord)
        .join(models.Vehicle)
        .filter(models.Vehicle.owner_id == user_session["id"])
        .order_by(models.ServiceRecord.date.desc())
        .all()
    )
    return {
        "success": True,
        "services": [
            {
                "id": s.id,
                "title": s.title,
                "date": str(s.date),
                "cost": float(s.cost),
                "mileage": s.mileage,
            }
            for s in services
        ],
    }


@app.post("/api/services/add")
def add_service(
    service_in: schemas.ServiceCreate,
    request: Request,
    db: Session = Depends(get_db),
):
    user_session = get_session_user(request)

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
    user_session = get_session_user(request)

    documents = (
        db.query(models.Document)
        .join(models.Vehicle)
        .filter(models.Vehicle.owner_id == user_session["id"])
        .order_by(models.Document.expiry_date.asc())
        .all()
    )
    return {
        "success": True,
        "documents": [
            {
                "id": d.id,
                "doc_type": d.doc_type,
                "expiry_date": str(d.expiry_date),
                "note": d.note,
            }
            for d in documents
        ],
    }


@app.post("/api/documents/add")
def add_document(
    doc_in: schemas.DocumentCreate,
    request: Request,
    db: Session = Depends(get_db),
):
    user_session = get_session_user(request)

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
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/")
    def serve_index():
        return FileResponse(os.path.join(frontend_dist, "index.html"))

    @app.get("/{full_path:path}")
    def serve_react(full_path: str):
        if full_path == "api" or full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API endpoint nenalezen")

        target_file = os.path.abspath(os.path.join(frontend_dist, full_path))
        dist_root = os.path.abspath(frontend_dist)
        if (
            target_file.startswith(dist_root + os.sep)
            and os.path.exists(target_file)
            and os.path.isfile(target_file)
        ):
            return FileResponse(target_file)

        return FileResponse(os.path.join(frontend_dist, "index.html"))