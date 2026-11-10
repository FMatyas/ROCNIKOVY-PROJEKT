from sqlalchemy.orm import Session
from . import models, schemas


# --- VOZIDLA ---
def get_user_vehicles(db: Session, user_id: int):
  return (
      db.query(models.Vehicle)
      .filter(models.Vehicle.owner_id == user_id)
      .all()
  )


def create_vehicle(db: Session, vehicle: schemas.VehicleCreate, user_id: int):
  db_vehicle = models.Vehicle(**vehicle.dict(), owner_id=user_id)
  db.add(db_vehicle)
  db.commit()
  db.refresh(db_vehicle)
  return db_vehicle


# --- TANKOVÁNÍ A STATISTIKY (Naše "makro") ---
def create_refueling(db: Session, refueling: schemas.RefuelingCreate):
  db_refueling = models.Refueling(**refueling.dict())
  db.add(db_refueling)
  db.commit()
  db.refresh(db_refueling)
  return db_refueling


# --- UNIKÁTNÍ "MAKRO" FUNKCE PRO VÝPOČET STATISTIK VOZIDLA ---
def calculate_vehicle_statistics(db: Session, vehicle_id: int):
  """Hromadné 'makro' pro výpočet celkových nákladů,

  spotřeby a ujetých kilometrů pro dané vozidlo.
  """
  refuelings = (
      db.query(models.Refueling)
      .filter(models.Refueling.vehicle_id == vehicle_id)
      .all()
  )
  services = (
      db.query(models.ServiceRecord)
      .filter(models.ServiceRecord.vehicle_id == vehicle_id)
      .all()
  )
  trips = (
      db.query(models.Trip).filter(models.Trip.vehicle_id == vehicle_id).all()
  )

  total_fuel_cost = sum(r.price_total for r in refuelings)
  total_liters = sum(r.liters for r in refuelings)
  total_service_cost = sum(s.cost for s in services)
  total_km_trips = sum(t.distance_km for t in trips)

  # Výpočet průměrné spotřeby (pokud máme dostatek dat)
  avg_consumption = 0.0
  if len(refuelings) >= 2:
    sorted_ref = sorted(refuelings, key=lambda x: x.odometer)
    km_diff = sorted_ref[-1].odometer - sorted_ref[0].odometer
    sum_liters_middle = sum(r.liters for r in sorted_ref[1:])
    if km_diff > 0:
      avg_consumption = round((sum_liters_middle * 100) / km_diff, 2)

  return {
      "total_fuel_cost": float(total_fuel_cost),
      "total_service_cost": float(total_service_cost),
      "total_costs": float(total_fuel_cost + total_service_cost),
      "total_km": float(total_km_trips),
      "avg_consumption": avg_consumption,
  }