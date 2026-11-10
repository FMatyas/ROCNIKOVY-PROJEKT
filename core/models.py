from datetime import datetime
from database import Base
from sqlalchemy import (
    Boolean,
    Column,
    Date,
    Numeric,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_admin = Column(Boolean, nullable=False, default=False)

    vehicles = relationship(
        "Vehicle", back_populates="owner", cascade="all, delete-orphan"
    )


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=True)
    brand = Column(String, nullable=False)
    model = Column(String, nullable=False)
    generation = Column(String, nullable=True)
    engine = Column(String, nullable=True)
    power_kw = Column(Integer, nullable=True)
    year = Column(Integer, nullable=True)
    vin = Column(String(17), unique=True, nullable=True)
    license_plate = Column(String(20), nullable=True)

    owner = relationship("User", back_populates="vehicles")
    refuelings = relationship(
        "Refueling", back_populates="vehicle", cascade="all, delete-orphan"
    )
    trips = relationship(
        "Trip", back_populates="vehicle", cascade="all, delete-orphan"
    )
    services = relationship(
        "ServiceRecord", back_populates="vehicle", cascade="all, delete-orphan"
    )
    documents = relationship(
        "Document", back_populates="vehicle", cascade="all, delete-orphan"
    )


class Refueling(Base):
    __tablename__ = "refuelings"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    date = Column(Date, default=datetime.utcnow, nullable=False)
    liters = Column(Numeric(6, 2), nullable=False)
    price_total = Column(Numeric(10, 2), nullable=False)
    odometer = Column(Integer, nullable=False)
    calculated_consumption = Column(Numeric(4, 2), nullable=True)

    vehicle = relationship("Vehicle", back_populates="refuelings")


class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    title = Column(String, nullable=False)
    date = Column(Date, default=datetime.utcnow, nullable=False)
    start_location = Column(String, nullable=True)
    destination = Column(String, nullable=True)
    distance_km = Column(Numeric(8, 2), nullable=False)
    avg_consumption = Column(Numeric(4, 2), nullable=True)
    note = Column(Text, nullable=True)

    vehicle = relationship("Vehicle", back_populates="trips")


class ServiceRecord(Base):
    __tablename__ = "service_records"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    date = Column(Date, default=datetime.utcnow, nullable=False)
    title = Column(String, nullable=False)
    cost = Column(Numeric(10, 2), nullable=False)
    mileage = Column(Integer, nullable=False)
    note = Column(Text, nullable=True)

    vehicle = relationship("Vehicle", back_populates="services")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    doc_type = Column(String, nullable=False)
    expiry_date = Column(Date, nullable=False)
    note = Column(Text, nullable=True)

    vehicle = relationship("Vehicle", back_populates="documents")