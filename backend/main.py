from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import users, simulations, subscriptions

# Force drop tables for dev environment to ensure new V2 schema applies correctly
Base.metadata.drop_all(bind=engine)

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="MomentumLab API",
    description="Quantitative Momentum Research Platform API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(simulations.router)
app.include_router(subscriptions.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to MomentumLab API"}
