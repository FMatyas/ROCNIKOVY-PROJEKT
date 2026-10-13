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