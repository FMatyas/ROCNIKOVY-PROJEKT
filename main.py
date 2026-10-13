<<<<<<< HEAD
import os
from authlib.integrations.starlette_client import OAuth
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Form, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from starlette.middleware.sessions import SessionMiddleware

import core.models as models
from database import Base, engine, get_db

# Načtení proměnných ze souboru .env
load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI(title="TrackMyRide")

# Načtení klíčů z prostředí (.env)
SECRET_KEY = os.getenv("SECRET_KEY", "default-fallback-secret-key")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

# Tajný klíč pro podepisování cookies / sessions
app.add_middleware(SessionMiddleware, secret_key=SECRET_KEY)

templates = Jinja2Templates(directory="core/templates/core")

# Konfigurace Google OAuth
oauth = OAuth()

oauth.register(
    name="google",
    client_id=GOOGLE_CLIENT_ID,
    client_secret=GOOGLE_CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)


# 1. LANDING PAGE
@app.get("/", response_class=HTMLResponse)
def landing_page(request: Request):
    user = request.session.get("user")
    if user:
        return RedirectResponse(url="/dashboard")
    return templates.TemplateResponse(request=request, name="landing.html")


# 2. GOOGLE OAUTH ROUTY
@app.get("/login/google")
async def login_google(request: Request):
    redirect_uri = request.url_for("auth_google_callback")
    return await oauth.google.authorize_redirect(request, redirect_uri)


@app.get("/auth/google/callback")
async def auth_google_callback(request: Request, db: Session = Depends(get_db)):
    try:
        token = await oauth.google.authorize_access_token(request)
    except Exception:
        return RedirectResponse(url="/?error=auth_failed")

    user_info = token.get("userinfo")
    if user_info:
        email = user_info.get("email")
        full_name = user_info.get("name")

        # Ověření, zda uživatel už existuje v databázi
        user = db.query(models.User).filter(models.User.email == email).first()
        if not user:
            user = models.User(email=email, full_name=full_name)
            db.add(user)
            db.commit()
            db.refresh(user)

        # Uložení údajů o uživateli do session
        request.session["user"] = {
            "id": user.id,
            "email": user.email,
            "name": user.full_name,
        }

    return RedirectResponse(url="/dashboard")


# 3. ODHLÁŠENÍ UŽIVATELE
@app.get("/logout")
def logout(request: Request):
    request.session.clear()
    return RedirectResponse(url="/")


# 4. DASHBOARD (CHRÁNĚNÝ)
@app.get("/dashboard", response_class=HTMLResponse)
def dashboard(request: Request, db: Session = Depends(get_db)):
    user_session = request.session.get("user")
    if not user_session:
        return RedirectResponse(url="/")

    # Načteme pouze auta patřící přihlášenému uživateli
    vehicles = (
        db.query(models.Vehicle)
        .filter(models.Vehicle.owner_id == user_session["id"])
        .all()
    )
    selected_vehicle = vehicles[0] if vehicles else None

    avg_consumption = 0.0
    total_cost = 0.0
    chart_dates = []
    chart_consumptions = []

    if selected_vehicle:
        refuelings = (
            db.query(models.Refueling)
            .filter(models.Refueling.vehicle_id == selected_vehicle.id)
            .order_by(models.Refueling.date.asc())
            .all()
        )

        chart_dates = [r.date.strftime("%d.%m.%Y") for r in refuelings]
        chart_consumptions = [
            r.calculated_consumption or 0.0 for r in refuelings
        ]

        valid_consumptions = [c for c in chart_consumptions if c > 0]
        if valid_consumptions:
            avg_consumption = round(
                sum(valid_consumptions) / len(valid_consumptions), 2
            )

        total_cost = sum(r.price_total for r in refuelings)

    return templates.TemplateResponse(
        request=request,
        name="dashboard.html",
        context={
            "user": user_session,
            "vehicles": vehicles,
            "selected_vehicle": selected_vehicle,
            "avg_consumption": avg_consumption,
            "total_cost": total_cost,
            "chart_dates": chart_dates,
            "chart_consumptions": chart_consumptions,
        },
    )


@app.post("/vehicle/add")
def add_vehicle(
    request: Request,
    name: str = Form(...),
    brand: str = Form(...),
    model: str = Form(...),
    year: int = Form(...),
    license_plate: str = Form(None),
    db: Session = Depends(get_db),
):
    user_session = request.session.get("user")
    if not user_session:
        return RedirectResponse(url="/")

    new_vehicle = models.Vehicle(
        owner_id=user_session["id"],
        name=name,
        brand=brand,
        model=model,
        year=year,
        license_plate=license_plate,
    )
    db.add(new_vehicle)
    db.commit()
=======
import os
from authlib.integrations.starlette_client import OAuth
from fastapi import Depends, FastAPI, Form, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from starlette.middleware.sessions import SessionMiddleware

import core.models as models
from database import Base, engine, get_db

Base.metadata.create_all(bind=engine)

app = FastAPI(title="TrackMyRide")

# Tajný klíč pro podepisování cookies / sessions
app.add_middleware(SessionMiddleware, secret_key="94d5e75a55247070e286a22fb7ab59d243ce3736d9321004197b5183a3e9aaa0")

templates = Jinja2Templates(directory="core/templates/core")

# Konfigurace Google OAuth
oauth = OAuth()

# TODO: Sem vlož své údaje z Google Cloud Console
GOOGLE_CLIENT_ID = "165297578399-juhq7ns9tbq8blcm5vfevvo75amkf2ut.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET = "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"

oauth.register(
    name="google",
    client_id=GOOGLE_CLIENT_ID,
    client_secret=GOOGLE_CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)


# 1. LANDING PAGE
@app.get("/", response_class=HTMLResponse)
def landing_page(request: Request):
    user = request.session.get("user")
    if user:
        return RedirectResponse(url="/dashboard")
    return templates.TemplateResponse(request=request, name="landing.html")


# 2. GOOGLE OAUTH ROUTY
@app.get("/login/google")
async def login_google(request: Request):
    redirect_uri = request.url_for("auth_google_callback")
    return await oauth.google.authorize_redirect(request, redirect_uri)


@app.get("/auth/google/callback")
async def auth_google_callback(request: Request, db: Session = Depends(get_db)):
    try:
        token = await oauth.google.authorize_access_token(request)
    except Exception:
        return RedirectResponse(url="/?error=auth_failed")

    user_info = token.get("userinfo")
    if user_info:
        email = user_info.get("email")
        full_name = user_info.get("name")

        # Ověření, zda uživatel už existuje v PostgreSQL / SQLite databázi
        user = db.query(models.User).filter(models.User.email == email).first()
        if not user:
            user = models.User(email=email, full_name=full_name)
            db.add(user)
            db.commit()
            db.refresh(user)

        # Uložení údajů o uživateli do session
        request.session["user"] = {
            "id": user.id,
            "email": user.email,
            "name": user.full_name,
        }

    return RedirectResponse(url="/dashboard")


# 3. ODHLÁŠENÍ UŽIVATELE
@app.get("/logout")
def logout(request: Request):
    request.session.clear()
    return RedirectResponse(url="/")


# 4. DASHBOARD (CHRÁNĚNÝ)
@app.get("/dashboard", response_class=HTMLResponse)
def dashboard(request: Request, db: Session = Depends(get_db)):
    user_session = request.session.get("user")
    if not user_session:
        return RedirectResponse(url="/")

    # Načteme pouze auta patřící přihlášenému uživateli
    vehicles = (
        db.query(models.Vehicle)
        .filter(models.Vehicle.owner_id == user_session["id"])
        .all()
    )
    selected_vehicle = vehicles[0] if vehicles else None

    avg_consumption = 0.0
    total_cost = 0.0
    chart_dates = []
    chart_consumptions = []

    if selected_vehicle:
        refuelings = (
            db.query(models.Refueling)
            .filter(models.Refueling.vehicle_id == selected_vehicle.id)
            .order_by(models.Refueling.date.asc())
            .all()
        )

        chart_dates = [r.date.strftime("%d.%m.%Y") for r in refuelings]
        chart_consumptions = [
            r.calculated_consumption or 0.0 for r in refuelings
        ]

        valid_consumptions = [c for c in chart_consumptions if c > 0]
        if valid_consumptions:
            avg_consumption = round(
                sum(valid_consumptions) / len(valid_consumptions), 2
            )

        total_cost = sum(r.price_total for r in refuelings)

    return templates.TemplateResponse(
        request=request,
        name="dashboard.html",
        context={
            "user": user_session,
            "vehicles": vehicles,
            "selected_vehicle": selected_vehicle,
            "avg_consumption": avg_consumption,
            "total_cost": total_cost,
            "chart_dates": chart_dates,
            "chart_consumptions": chart_consumptions,
        },
    )


@app.post("/vehicle/add")
def add_vehicle(
    request: Request,
    name: str = Form(...),
    brand: str = Form(...),
    model: str = Form(...),
    year: int = Form(...),
    license_plate: str = Form(None),
    db: Session = Depends(get_db),
):
    user_session = request.session.get("user")
    if not user_session:
        return RedirectResponse(url="/")

    new_vehicle = models.Vehicle(
        owner_id=user_session["id"],
        name=name,
        brand=brand,
        model=model,
        year=year,
        license_plate=license_plate,
    )
    db.add(new_vehicle)
    db.commit()
>>>>>>> 08849c24b7c9c1475bfc83170e9d3382820f80d5
    return RedirectResponse(url="/dashboard", status_code=303)