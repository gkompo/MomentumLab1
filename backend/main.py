from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import traceback
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import users, simulations, subscriptions

# Removed drop_all to prevent data loss on Railway reboots
# Create database tables if they don't exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="MomentumLab API",
    description="Quantitative Momentum Research Platform API",
    version="1.0.0"
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"message": "Internal Server Error", "details": str(exc), "traceback": traceback.format_exc()}
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow Vercel and local deployments
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
