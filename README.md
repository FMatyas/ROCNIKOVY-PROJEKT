# 🚗 TrackMyRide
Chytrý správce tvého auta, spotřeby a provozních nákladů. Měj vše pod kontrolou – od nádrže až po servis.

## 📸 O projektu
**TrackMyRide** je moderní full-stack webová aplikace určená pro všechny řidiče, kteří chtějí mít dokonalý přehled o svém vozidle bez nutnosti psát si papírové deníky nebo se hrabat v nepřehledných Excel tabulkách. 

Aplikace kombinuje výkonný **FastAPI** backend s moderním a responzivním **React** rozhraním v jednotné architektuře. Po zadání údajů o tankování nebo jízdě automaticky vyhodnocuje provozní data, sleduje náklady a hlídá důležité termíny.

## ✨ Hlavní funkce
* **⛽ Evidence tankování:** Záznam litrů, ceny a tachometru s automatickým výpočtem spotřeby.
* **🗺️ Kniha jízd:** Správa tras, vzdáleností a účelů jednotlivých jízd.
* **🛠️ Servisní deník:** Přehledná historie oprav, údržby a nákladů na servis.
* **📄 Doklady a STK:** Sledování platnosti dokladů a termínů technické kontroly.
* **📊 Dashboard a statistiky:** Přehledné zobrazení celkových nákladů a průměrné spotřeby.
* **🚗 Multi-vehicle garáž:** Správa více vozidel pod jedním uživatelským účtem.

## 🛠️ Použité technologie (Tech Stack)

### Backend
* **Python & FastAPI** – RESTful API a produkční servírování statických souborů z jediné adresy.
* **SQLAlchemy & SQLite** – ORM a relační správa databáze.
* **Passlib & Starlette Sessions** – Bezpečné hashování hesel a správa uživatelských relací.
* **Requests** – Integrace s externími službami (např. veřejné VIN API).

### Frontend
* **React & Vite** – Moderní Single Page Application (SPA) s rychlým sestavením.
* **Custom CSS / Glassmorphism** – Vizuálně atraktivní tmavé uživatelské rozhraní s plynulými přechody a animacemi.

## 🚀 Spuštění projektu

### 1. Vývojový režim (Development)
Pro živý náhled s HMR spusť zvlášť backend a frontend:
* **Backend:** `uvicorn main:app --reload` (na portu `8000`)
* **Frontend:** `npm run dev` ve složce `frontend` (na portu `5173`)

### 2. Produkční sjednocený režim (Production / Obhajoba)
Aplikace je navržena tak, aby běžela jako jeden celistvý servis přímo z FastAPI:
1. Přejdi do složky frontend: `cd frontend`
2. Vytvoř build: `npm run build`
3. Vrať se do kořene a spusť server: `uvicorn main:app --reload`
4. Otevři v prohlížeči: `http://127.0.0.1:8000`