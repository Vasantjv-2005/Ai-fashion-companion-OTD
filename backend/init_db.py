
from database import Base, engine
import models

Base.metadata.create_all(bind=engine)

print("Digital Closet database and tables created successfully!")
