from sqlalchemy import (
    Column, Integer, String, Float, ForeignKey, DateTime, BigInteger, Enum, Text, ForeignKeyConstraint
)
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.sql import func

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    role = Column(Enum('user', 'admin'), default='user')
    two_fa_secret = Column(String(255), nullable=True)
    configurations = relationship("Configuration", back_populates="user")
    last_login = Column(DateTime, nullable=True)
    is_active = Column(Integer, default=1)

class RegisterLog(Base):
    __tablename__ = 'register_logs'
    id = Column(Integer, primary_key=True)
    email = Column(String(255))
    ip_address = Column(String(45))
    timestamp = Column(DateTime, server_default=func.now())

class FailedLogin(Base):
    __tablename__ = 'failed_logins'
    id = Column(Integer, primary_key=True)
    email = Column(String(255))
    ip_address = Column(String(45))
    reason = Column(Text)
    timestamp = Column(DateTime, server_default=func.now())

class Category(Base):
    __tablename__ = 'categories'
    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True, nullable=False)

    elements = relationship("Element", back_populates="category_rel")

class Element(Base):
    __tablename__ = 'elements'
    id = Column(BigInteger, primary_key=True)
    symbol = Column(String(5), nullable=False)
    name = Column(String(100), nullable=False)
    atomic_number = Column(Integer, nullable=False)
    category = Column(String(100), ForeignKey("categories.name", ondelete="SET NULL", onupdate="CASCADE"))
    model_url = Column(String(512))

    category_rel = relationship("Category", back_populates="elements")
    atoms = relationship("Atom", back_populates="element")

class Configuration(Base):
    __tablename__ = 'configurations'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String(100))
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="configurations")
    atoms = relationship("Atom", back_populates="configuration")

class Atom(Base):
    __tablename__ = 'atoms'
    id = Column(Integer, primary_key=True, autoincrement=True)
    configuration_id = Column(Integer, ForeignKey("configurations.id"))
    local_id = Column(Integer)
    element_id = Column(BigInteger, ForeignKey("elements.id"))
    position_x = Column(Float)
    position_y = Column(Float)
    position_z = Column(Float)

    configuration = relationship("Configuration", back_populates="atoms")
    element = relationship("Element", back_populates="atoms")
    links1 = relationship("AtomLink", foreign_keys='AtomLink.atom1_local_id', cascade="all, delete-orphan", overlaps="links2")
    links2 = relationship("AtomLink", foreign_keys='AtomLink.atom2_local_id', cascade="all, delete-orphan", overlaps="links1")

class AtomLink(Base):
    __tablename__ = 'atom_links'

    configuration_id = Column(Integer, primary_key=True)
    atom1_local_id = Column(Integer, primary_key=True)
    atom2_local_id = Column(Integer, primary_key=True)
    bond_type = Column(String(20))

    __table_args__ = (
        ForeignKeyConstraint(
            ['configuration_id', 'atom1_local_id'],
            ['atoms.configuration_id', 'atoms.local_id']
        ),
        ForeignKeyConstraint(
            ['configuration_id', 'atom2_local_id'],
            ['atoms.configuration_id', 'atoms.local_id']
        ),
    )

class PasswordReset(Base):
    __tablename__ = 'password_resets'
    id = Column(Integer, primary_key=True)
    email = Column(String(255), nullable=False)
    code_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
