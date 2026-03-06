from fastapi import APIRouter

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])

@router.post("/checkout")
def create_checkout_session():
    # Mock Viva Wallet checkout
    return {"checkoutUrl": "https://mock-viva-wallet.com/checkout/123"}

@router.post("/webhook")
def viva_wallet_webhook(payload: dict):
    # Mock webhook for subscription activation
    return {"status": "success"}
