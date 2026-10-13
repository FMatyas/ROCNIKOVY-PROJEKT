<<<<<<< HEAD
from datetime import datetime
from sqlalchemy import Column, Date, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)
    full_name = Column(String, nullable=True)

    vehicles = relationship("Vehicle", back_populates="owner")


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    brand = Column(String, nullable=False)
    model = Column(String, nullable=False)
    year = Column(Integer)
    license_plate = Column(String, nullable=True)

    owner = relationship("User", back_populates="vehicles")
    refuelings = relationship(
        "Refueling", back_populates="vehicle", cascade="all, delete-orphan"
    )


class Refueling(Base):
    __tablename__ = "refuelings"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    date = Column(Date, nullable=False)
    odometer = Column(Integer, nullable=False)
    liters = Column(Float, nullable=False)
    price_total = Column(Float, nullable=False)
    calculated_consumption = Column(Float, nullable=True)

    vehicle = relationship("Vehicle", back_populates="refuelings")
=======
from django.db import models
from django.contrib.auth.models import User

class Vehicle(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='vehicles')
    name = models.CharField(max_length=100, verbose_name="Název auta (např. Moje Audi)")
    brand = models.CharField(max_length=50, verbose_name="Značka")
    model = models.CharField(max_length=50, verbose_name="Model")
    year = models.IntegerField(verbose_name="Rok výroby")
    license_plate = models.CharField(max_length=15, blank=True, verbose_name="SPZ")

    def __str__(self):
        return f"{self.name} ({self.license_plate})"

class Refueling(models.Model):
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='refuelings')
    date = models.DateField(verbose_name="Datum tankování")
    odometer = models.PositiveIntegerField(verbose_name="Stav tachometru (km)")
    liters = models.DecimalField(max_digits=6, decimal_places=2, verbose_name="Natankováno (l)")
    price_total = models.DecimalField(max_digits=8, decimal_places=2, verbose_name="Celková cena (Kč)")
    calculated_consumption = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True, verbose_name="Spočítaná spotřeba (l/100km)")

    class Meta:
        ordering = ['-odometer']

    def __str__(self):
        return f"{self.date} - {self.liters} l ({self.vehicle.name})"

class Ride(models.Model):
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='rides')
    date = models.DateField(verbose_name="Datum jízdy")
    distance_km = models.DecimalField(max_digits=6, decimal_places=1, verbose_name="Vzdálenost (km)")
    avg_consumption = models.DecimalField(max_digits=4, decimal_places=2, verbose_name="Průměrná spotřeba z PP (l/100km)")
    note = models.CharField(max_length=255, blank=True, verbose_name="Poznámka / Trasa")

    def __str__(self):
        return f"{self.date} - {self.distance_km} km"
>>>>>>> 08849c24b7c9c1475bfc83170e9d3382820f80d5
