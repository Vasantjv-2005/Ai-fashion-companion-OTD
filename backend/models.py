from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime
)

from sqlalchemy.sql import func

from database import Base


class ClothingItem(Base):

    __tablename__ = "clothing_items"

    # Unique item ID
    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    # Clothing information
    category = Column(
        String,
        nullable=False
    )

    color = Column(
        String,
        nullable=False
    )

    fabric = Column(
        String,
        default="Unknown"
    )

    pattern = Column(
        String,
        default="Unknown"
    )

    # AI model confidence
    confidence = Column(
        Float,
        nullable=True
    )

    # Uploaded image location
    image_path = Column(
        String,
        nullable=True
    )

    # Item creation time
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )