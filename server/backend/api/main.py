from datetime import datetime
import time

from fastapi import FastAPI, Depends, HTTPException, Query, Request
from fastapi.responses import RedirectResponse, HTMLResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, case

from ..core.config import settings
from ..db.init_db import init_db
from ..db.session import get_db
from ..db import models
from ..core.crypto import enc
from ..core.memory import new_state, put_state, pop_state
from ..clients.x_client import generate_pkce, build_auth_url, exchange_code_for_token
from ..core.schemas import AnalysisResponse, AnalysisItem
from ..core.normalize import x_tweets_to_posts
from ..clients.ibtikar_client import analyze_texts
from backend.db.models import Prediction  # keep as-is since it already works
from ..clients.x_api import get_me, get_my_recent_tweets, get_following_feed

from typing import List, Optional
from pydantic import BaseModel

# ---------- Analysis schemas ----------

class AnalysisPostItem(BaseModel):
    id: int
    user_id: int
    source: str
    post_id: str
    author_id: str
    lang: Optional[str] = None
    text: str
    label: str
    score: float
    post_created_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        orm_mode = True


class AnalysisPostsResponse(BaseModel):
    total: int
    items: List[AnalysisPostItem]


class AuthorSummaryItem(BaseModel):
    author_id: str
    post_count: int
    harmful_count: int
    safe_count: int
    unknown_count: int
    harmful_ratio: float


class AuthorSummaryResponse(BaseModel):
    total: int
    items: List[AuthorSummaryItem]

# ---------- FastAPI app and endpoints ----------

app = FastAPI(title="IbtikarAI Backend", version="0.2.0")
init_db()  # create tables on startup (local dev)

# ---------- Analysis read endpoints ----------

@app.get("/v1/analysis/posts", response_model=AnalysisPostsResponse)
def list_analysis_posts(
    user_id: int,
    label: Optional[str] = None,
    author_id: Optional[str] = None,
    lang: Optional[str] = None,
    from_created_at: Optional[datetime] = None,
    to_created_at: Optional[datetime] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    """
    List analyzed posts for a given user, with optional filters.
    Results are ordered by predictions.created_at DESC.
    """
    # basic safety on limit
    if limit > 200:
        limit = 200
    if limit < 1:
        limit = 1
    if offset < 0:
        offset = 0

    query = db.query(models.Prediction).filter(models.Prediction.user_id == user_id)

    if label:
        query = query.filter(models.Prediction.label == label)
    if author_id:
        query = query.filter(models.Prediction.author_id == author_id)
    if lang:
        query = query.filter(models.Prediction.lang == lang)
    if from_created_at:
        query = query.filter(models.Prediction.created_at >= from_created_at)
    if to_created_at:
        query = query.filter(models.Prediction.created_at <= to_created_at)

    total = query.count()

    predictions = (
        query.order_by(models.Prediction.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    items = [
        AnalysisPostItem(
            id=p.id,
            user_id=p.user_id,
            source=p.source,
            post_id=p.post_id,
            author_id=p.author_id,
            lang=p.lang,
            text=p.text,
            label=p.label,
            score=float(p.score),
            post_created_at=p.post_created_at,
            created_at=p.created_at,
        )
        for p in predictions
    ]

    return AnalysisPostsResponse(total=total, items=items)


@app.get("/v1/analysis/authors", response_model=AuthorSummaryResponse)
def list_author_summaries(
    user_id: int,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    """
    Aggregate stats per author for a given user.
    Counts how many harmful/safe/unknown tweets each author has.
    """
    if limit > 200:
        limit = 200
    if limit < 1:
        limit = 1
    if offset < 0:
        offset = 0

    # Build aggregation query
    q = (
        db.query(
            models.Prediction.author_id.label("author_id"),
            func.count(models.Prediction.id).label("post_count"),
            func.sum(
                case((models.Prediction.label == "harmful", 1), else_=0)
            ).label("harmful_count"),
            func.sum(
                case((models.Prediction.label == "safe", 1), else_=0)
            ).label("safe_count"),
            func.sum(
                case(
                    (
                        models.Prediction.label.notin_(["harmful", "safe"]),
                        1,
                    ),
                    else_=0,
                )
            ).label("unknown_count"),
        )
        .filter(models.Prediction.user_id == user_id)
        .group_by(models.Prediction.author_id)
    )

    total = q.count()

    rows = (
        q.order_by(func.sum(case((models.Prediction.label == "harmful", 1), else_=0)).desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    items: List[AuthorSummaryItem] = []
    for row in rows:
        post_count = int(row.post_count or 0)
        harmful_count = int(row.harmful_count or 0)
        safe_count = int(row.safe_count or 0)
        unknown_count = int(row.unknown_count or 0)

        harmful_ratio = float(harmful_count / post_count) if post_count > 0 else 0.0

        items.append(
            AuthorSummaryItem(
                author_id=str(row.author_id),
                post_count=post_count,
                harmful_count=harmful_count,
                safe_count=safe_count,
                unknown_count=unknown_count,
                harmful_ratio=harmful_ratio,
            )
        )

    return AuthorSummaryResponse(total=total, items=items)

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "ibtikar-backend",
        "env": settings.ENV,
        "version": "0.2.0",
    }


def ensure_local_user(db: Session) -> int:
    u = db.query(models.User).filter(models.User.id == 1).first()
    if not u:
        u = models.User(id=1)
        db.add(u)
        db.commit()
    return 1


@app.get("/v1/oauth/x/start")
async def x_oauth_start(user_id: int = 1, db: Session = Depends(get_db)):
    print("=" * 80)
    print("🚀 OAuth Start Request")
    print(f"   User ID: {user_id}")
    print("=" * 80)
    
    # ensure user exists
    u = db.query(models.User).filter(models.User.id == user_id).first()
    if not u:
        print(f"👤 Creating new user: {user_id}")
        db.add(models.User(id=user_id))
        db.commit()
    else:
        print(f"👤 User exists: {user_id}")

    verifier, challenge = generate_pkce()
    state = new_state()
    # store BOTH verifier and user_id
    put_state(state, verifier, user_id)
    
    auth_url = build_auth_url(state, challenge)
    print(f"🔗 Generated OAuth URL (first 100 chars): {auth_url[:100]}...")
    print(f"🔗 Redirecting to Twitter OAuth")
    print("=" * 80)
    
    return RedirectResponse(auth_url)


@app.get("/v1/oauth/x/callback")
async def x_oauth_callback(
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    db: Session = Depends(get_db),
    request: Request = None,
):
    print("=" * 80)
    print("🔗 OAuth Callback Received")
    print(f"   Code: {'Present' if code else 'Missing'}")
    if code:
        print(f"   Code (first 20 chars): {code[:20]}...")
    print(f"   State: {state if state else 'Missing'}")
    print(f"   Error: {error if error else 'None'}")
    print("=" * 80)
    
    # Handle OAuth errors from Twitter
    if error:
        print(f"❌ OAuth error from Twitter: {error}")
        app_redirect_url = f"ibtikar://oauth/callback?error={error}"
        print(f"🔀 Redirecting to app (error): {app_redirect_url}")
        return RedirectResponse(url=app_redirect_url)
    
    if not code or not state:
        print("❌ Missing code or state")
        raise HTTPException(status_code=400, detail="Missing code/state")

    state_data = pop_state(state)
    if not state_data:
        print("❌ State expired or invalid")
        raise HTTPException(status_code=400, detail="State expired/invalid")

    code_verifier = state_data["verifier"]
    user_id = int(state_data["user_id"])

    print(f"✅ State validated, user_id: {user_id}")
    print("🔄 Exchanging code for token...")

    try:
        token = await exchange_code_for_token(code, code_verifier)
        print("✅ Token exchange successful")
    except Exception as e:
        print(f"❌ Token exchange failed: {e}")
        app_redirect_url = f"ibtikar://oauth/callback?error=token_exchange_failed"
        print(f"🔀 Redirecting to app (error): {app_redirect_url}")
        return RedirectResponse(url=app_redirect_url)

    # ensure this user exists
    u = db.query(models.User).filter(models.User.id == user_id).first()
    if not u:
        print(f"👤 Creating new user: {user_id}")
        db.add(models.User(id=user_id))
        db.commit()
    else:
        print(f"👤 User exists: {user_id}")

    existing = db.query(models.XToken).filter(models.XToken.user_id == user_id).first()
    if not existing:
        print("💾 Creating new XToken record")
        db.add(
            models.XToken(
                user_id=user_id,
                access_token=enc(token.get("access_token", "")),
                refresh_token=enc(token.get("refresh_token", ""))
                if token.get("refresh_token")
                else None,
                scope=token.get("scope"),
                token_type=token.get("token_type"),
                expires_in=token.get("expires_in"),
            )
        )
    else:
        print("💾 Updating existing XToken record")
        existing.access_token = enc(token.get("access_token", ""))
        existing.refresh_token = (
            enc(token.get("refresh_token", ""))
            if token.get("refresh_token")
            else None
        )
        existing.scope = token.get("scope")
        existing.token_type = token.get("token_type")
        existing.expires_in = token.get("expires_in")

    db.commit()
    print("✅ Database updated successfully")
    
    # Check if this is a web request (by checking Referer or User-Agent)
    is_web_request = False
    if request:
        referer = request.headers.get("referer", "")
        user_agent = request.headers.get("user-agent", "").lower()
        # Check if referer is a web URL or user-agent indicates browser
        if referer and ("http://" in referer or "https://" in referer):
            is_web_request = True
            print(f"🌐 Web request detected (Referer: {referer})")
        elif "mozilla" in user_agent or "chrome" in user_agent or "safari" in user_agent:
            is_web_request = True
            print(f"🌐 Web request detected (User-Agent: {user_agent[:50]}...)")
    
    # For web requests, redirect directly to the web URL with callback params
    if is_web_request:
        # Try to get the origin from Referer, or use a default
        web_origin = "http://localhost:8081"  # Default for local dev
        if request and request.headers.get("referer"):
            try:
                from urllib.parse import urlparse
                parsed = urlparse(request.headers.get("referer"))
                web_origin = f"{parsed.scheme}://{parsed.netloc}"
            except:
                pass
        web_redirect_url = f"{web_origin}?success=true&user_id={user_id}"
        print(f"🔀 Redirecting to web app: {web_redirect_url}")
        return RedirectResponse(url=web_redirect_url)
    
    # Return HTML page that tries to open app AND shows success message
    # This works even if deep links don't work
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Login Successful - Ibtikar</title>
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }}
            .container {{
                text-align: center;
                padding: 40px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 20px;
                max-width: 500px;
            }}
            .success-icon {{
                font-size: 80px;
                margin-bottom: 20px;
            }}
            h1 {{
                font-size: 32px;
                margin-bottom: 10px;
            }}
            p {{
                font-size: 18px;
                margin-bottom: 30px;
                opacity: 0.9;
            }}
            .status {{
                background: rgba(255, 255, 255, 0.2);
                padding: 20px;
                border-radius: 10px;
                margin: 20px 0;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="success-icon">✅</div>
            <h1>Login Successful!</h1>
            <p>Your Twitter account has been linked.</p>
            <div class="status">
                <p><strong>User ID:</strong> {user_id}</p>
                <p><strong>Status:</strong> Account Linked</p>
            </div>
            <p style="font-size: 14px; opacity: 0.8;">
                You can now close this page and return to the app.<br>
                The app will automatically detect your login.
            </p>
        </div>
        <script>
            // Try to open the app via deep link
            const deepLink = "ibtikar://oauth/callback?success=true&user_id={user_id}";
            
            // Try opening the deep link
            setTimeout(() => {{
                window.location.href = deepLink;
            }}, 500);
            
            // Also log for debugging
            console.log("Attempting to open:", deepLink);
        </script>
    </body>
    </html>
    """
    
    print(f"🔀 Returning success page for user_id: {user_id}")
    print("=" * 80)
    return HTMLResponse(content=html_content)


@app.get("/v1/me/link-status")
def link_status(user_id: int = 1, db: Session = Depends(get_db)):
    xt = db.query(models.XToken).filter(models.XToken.user_id == user_id).first()
    return {
        "user_id": user_id,
        "linked": bool(xt),
        "scopes": xt.scope if xt else None,
    }


@app.get("/v1/x/me")
async def x_me(user_id: int = Query(1), db: Session = Depends(get_db)):
    return await get_me(user_id, db)


@app.get("/v1/x/my-posts")
async def x_my_posts(
    user_id: int = Query(1),
    limit: int = Query(20),
    db: Session = Depends(get_db),
):
    return await get_my_recent_tweets(user_id, db, max_results=limit)


@app.get("/v1/x/feed")
async def x_feed(
    user_id: int = Query(1),
    authors_limit: int = Query(25),
    per_batch: int = Query(20),
    db: Session = Depends(get_db),
):
    """
    “Timeline-lite”: pulls recent posts from accounts the user follows.
    Good enough for Free/Basic tiers. For stricter limits, reduce authors_limit/per_batch.
    """
    return await get_following_feed(
        user_id, db, authors_limit=authors_limit, per_batch=per_batch
    )


@app.get("/v1/x/feed/normalized")
async def x_feed_normalized(
    user_id: int = Query(1),
    authors_limit: int = Query(15),
    per_batch: int = Query(15),
    db: Session = Depends(get_db),
):
    raw = await get_following_feed(
        user_id, db, authors_limit=authors_limit, per_batch=per_batch
    )
    if isinstance(raw, dict) and raw.get("rate_limited"):
        reset = raw.get("reset")
        try:
            reset_human = (
                time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(int(reset)))
                if reset
                else None
            )
        except Exception:
            reset_human = None
        raise HTTPException(
            status_code=429,
            detail={
                "error": "rate_limited",
                "resource": raw.get("resource"),
                "reset_epoch": reset,
                "reset_time": reset_human,
                "limit": raw.get("limit"),
                "remaining": raw.get("remaining"),
            },
        )

    return {"items": [p.dict() for p in x_tweets_to_posts(raw)]}


@app.post("/v1/analysis/preview", response_model=AnalysisResponse)
async def analysis_preview(
    user_id: int = Query(1),
    authors_limit: int = Query(15),
    per_batch: int = Query(15),
    db: Session = Depends(get_db),
):
    raw = await get_following_feed(
        user_id, db, authors_limit=authors_limit, per_batch=per_batch
    )
    if isinstance(raw, dict) and raw.get("rate_limited"):
        reset = raw.get("reset")
        try:
            reset_human = (
                time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(int(reset)))
                if reset
                else None
            )
        except Exception:
            reset_human = None
        raise HTTPException(
            status_code=429,
            detail={
                "error": "rate_limited",
                "resource": raw.get("resource"),
                "reset_epoch": reset,
                "reset_time": reset_human,
                "limit": raw.get("limit"),
                "remaining": raw.get("remaining"),
            },
        )

    posts = x_tweets_to_posts(raw)
    if not posts:
        return AnalysisResponse(
            items=[], harmful_count=0, safe_count=0, unknown_count=0
        )

    preds = await analyze_texts([p.text for p in posts])

    items: list[AnalysisItem] = []
    hc = sc = uc = 0

    for p, pr in zip(posts, preds):
        label = pr.get("label", "unknown")
        score = float(pr.get("score", 0.0))

        items.append(AnalysisItem(post=p, label=label, score=score))
        if label == "harmful":
            hc += 1
        elif label == "safe":
            sc += 1
        else:
            uc += 1

        # Key we use to avoid duplicates
        post_id_str = str(p.post_id) if getattr(p, "post_id", None) is not None else None

        # Check if a prediction for this (user, source, post_id) already exists
        existing_pred = (
            db.query(Prediction)
            .filter(
                Prediction.user_id == user_id,
                Prediction.source == "x",
                Prediction.post_id == post_id_str,
            )
            .first()
        )

        if existing_pred:
            # Update existing prediction instead of inserting a duplicate
            existing_pred.author_id = (
                str(p.author_id) if getattr(p, "author_id", None) else None
            )
            existing_pred.lang = getattr(p, "lang", None)
            existing_pred.text = p.text
            existing_pred.label = label
            existing_pred.score = score
            existing_pred.post_created_at = (
                p.created_at if isinstance(p.created_at, datetime) else None
            )
            existing_pred.created_at = datetime.utcnow()
        else:
            # Create a new prediction
            db_obj = Prediction(
                user_id=user_id,
                source="x",
                post_id=post_id_str,
                author_id=(
                    str(p.author_id) if getattr(p, "author_id", None) else None
                ),
                lang=getattr(p, "lang", None),
                text=p.text,
                label=label,
                score=score,
                post_created_at=(
                    p.created_at if isinstance(p.created_at, datetime) else None
                ),
            )
            db.add(db_obj)

    # Save all changes (new + updated) at once
    db.commit()

    return AnalysisResponse(
        items=items,
        harmful_count=hc,
        safe_count=sc,
        unknown_count=uc,
    )


# ---------- Account Deletion Endpoints ----------


@app.get("/delete-account", response_class=HTMLResponse)
def delete_account_page():
    """
    Account deletion request page for Google Play Store compliance.
    This page prominently displays how users can request account deletion.
    """
    html_content = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Delete Account - Ibtikar</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                background: linear-gradient(135deg, #F6DE55 0%, #00A3A3 50%, #000000 100%);
                min-height: 100vh;
                padding: 20px;
                line-height: 1.6;
            }
            .container {
                max-width: 800px;
                margin: 0 auto;
                background: white;
                border-radius: 20px;
                padding: 40px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            }
            h1 {
                color: #000000;
                font-size: 36px;
                margin-bottom: 10px;
                font-weight: 900;
            }
            .app-name {
                color: #00A3A3;
                font-size: 24px;
                margin-bottom: 30px;
                font-weight: 700;
            }
            h2 {
                color: #000000;
                font-size: 24px;
                margin-top: 30px;
                margin-bottom: 15px;
                font-weight: 700;
                border-bottom: 3px solid #F6DE55;
                padding-bottom: 10px;
            }
            .important {
                background: #FFF3CD;
                border-left: 5px solid #F6DE55;
                padding: 20px;
                margin: 20px 0;
                border-radius: 5px;
            }
            .important h3 {
                color: #856404;
                margin-bottom: 10px;
                font-size: 20px;
            }
            .steps {
                background: #E7F3FF;
                border-left: 5px solid #00A3A3;
                padding: 20px;
                margin: 20px 0;
                border-radius: 5px;
            }
            .steps ol {
                margin-left: 20px;
                margin-top: 10px;
            }
            .steps li {
                margin: 10px 0;
                font-size: 16px;
            }
            .data-section {
                background: #F8F9FA;
                padding: 20px;
                margin: 20px 0;
                border-radius: 5px;
                border: 2px solid #E0E0E0;
            }
            .data-section h3 {
                color: #000000;
                margin-bottom: 15px;
                font-size: 20px;
            }
            .data-list {
                list-style: none;
                margin-left: 0;
            }
            .data-list li {
                padding: 10px 0;
                border-bottom: 1px solid #E0E0E0;
            }
            .data-list li:last-child {
                border-bottom: none;
            }
            .deleted {
                color: #28A745;
                font-weight: 600;
            }
            .kept {
                color: #DC3545;
                font-weight: 600;
            }
            .contact {
                background: #000000;
                color: white;
                padding: 20px;
                margin: 30px 0;
                border-radius: 10px;
                text-align: center;
            }
            .contact a {
                color: #F6DE55;
                text-decoration: none;
                font-weight: 700;
                font-size: 18px;
            }
            .contact a:hover {
                text-decoration: underline;
            }
            p {
                margin: 15px 0;
                font-size: 16px;
                color: #333;
            }
            .warning {
                background: #F8D7DA;
                border-left: 5px solid #DC3545;
                padding: 15px;
                margin: 20px 0;
                border-radius: 5px;
                color: #721C24;
            }
            .note {
                background: #D1ECF1;
                border-left: 5px solid #00A3A3;
                padding: 15px;
                margin: 20px 0;
                border-radius: 5px;
                color: #0C5460;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Delete Your Account</h1>
            <p class="app-name">Ibtikar - AI-Powered Social Safety</p>
            
            <div class="important">
                <h3>⚠️ Important: Account Deletion Request</h3>
                <p>To request deletion of your Ibtikar account and associated data, please follow the steps below. 
                Your request will be processed within 30 days as required by Google Play Store policies.</p>
            </div>

            <h2>How to Request Account Deletion</h2>
            <div class="steps">
                <ol>
                    <li><strong>Open the Ibtikar app</strong> on your device</li>
                    <li><strong>Log in</strong> to your account if you haven't already</li>
                    <li><strong>Navigate to Settings</strong> (if available) or contact us directly using the method below</li>
                    <li><strong>Submit your deletion request</strong> with your user ID or Twitter/X handle</li>
                    <li><strong>Confirm your request</strong> - you will receive confirmation within 48 hours</li>
                    <li><strong>Account deletion</strong> will be completed within 30 days of your request</li>
                </ol>
            </div>

            <h2>Contact Us to Request Deletion</h2>
            <div class="contact">
                <p><strong>Email us at:</strong></p>
                <p><a href="mailto:privacy@ibtikar.app?subject=Account%20Deletion%20Request">privacy@ibtikar.app</a></p>
                <p style="margin-top: 15px; font-size: 14px; opacity: 0.9;">
                    Please include your user ID or Twitter/X handle in your request
                </p>
            </div>

            <h2>What Data Will Be Deleted</h2>
            <div class="data-section">
                <h3>Data That Will Be Deleted:</h3>
                <ul class="data-list">
                    <li class="deleted">✅ <strong>User Account Information</strong> - Your user profile and account details</li>
                    <li class="deleted">✅ <strong>OAuth Tokens</strong> - Encrypted Twitter/X authentication tokens</li>
                    <li class="deleted">✅ <strong>Analysis Predictions</strong> - All toxicity analysis results and predictions associated with your account</li>
                    <li class="deleted">✅ <strong>Post Data</strong> - All cached post content and metadata</li>
                    <li class="deleted">✅ <strong>Author Analytics</strong> - All author summaries and statistics</li>
                    <li class="deleted">✅ <strong>Account Settings</strong> - All app preferences and configurations</li>
                </ul>
            </div>

            <h2>Data Retention Period</h2>
            <div class="warning">
                <p><strong>Deletion Timeline:</strong></p>
                <ul style="margin-left: 20px; margin-top: 10px;">
                    <li>Account deletion requests are processed within <strong>30 days</strong> of receipt</li>
                    <li>All personal data associated with your account will be permanently deleted</li>
                    <li>You will receive email confirmation once deletion is complete</li>
                </ul>
            </div>

            <h2>Data That Cannot Be Deleted</h2>
            <div class="data-section">
                <h3>Please Note:</h3>
                <ul class="data-list">
                    <li class="kept">⚠️ <strong>Anonymized Analytics</strong> - Aggregated, anonymized usage statistics (no personal identifiers)</li>
                    <li class="kept">⚠️ <strong>Legal Records</strong> - Any data required to be retained by law or for legal compliance</li>
                </ul>
                <p style="margin-top: 15px; font-size: 14px;">
                    <em>Note: We do not collect or store personal information beyond what is necessary for app functionality. 
                    We do not track users across other apps or websites.</em>
                </p>
            </div>

            <h2>After Account Deletion</h2>
            <div class="note">
                <p><strong>What happens after deletion:</strong></p>
                <ul style="margin-left: 20px; margin-top: 10px;">
                    <li>You will no longer be able to log in to the Ibtikar app</li>
                    <li>All your data will be permanently removed from our systems</li>
                    <li>You can create a new account at any time by logging in again</li>
                    <li>Your Twitter/X account is not affected - only the connection to Ibtikar is removed</li>
                </ul>
            </div>

            <div class="note" style="margin-top: 40px; text-align: center;">
                <p><strong>Ibtikar App</strong></p>
                <p>Empowering users with digital safety and social entrepreneurship</p>
                <p style="margin-top: 10px; font-size: 12px; opacity: 0.8;">
                    For questions about this process, contact: <a href="mailto:privacy@ibtikar.app" style="color: #00A3A3;">privacy@ibtikar.app</a>
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)


@app.delete("/v1/account/delete")
async def delete_account(
    user_id: int = Query(..., description="User ID of the account to delete"),
    confirm: bool = Query(False, description="Confirmation flag - must be True to proceed"),
    db: Session = Depends(get_db),
):
    """
    Delete a user account and all associated data.
    
    This endpoint deletes:
    - User account record
    - OAuth tokens (cascade delete)
    - All predictions/analysis data (cascade delete)
    
    Args:
        user_id: The ID of the user account to delete
        confirm: Must be True to proceed with deletion (safety check)
        
    Returns:
        JSON response confirming deletion
    """
    if not confirm:
        raise HTTPException(
            status_code=400,
            detail="Deletion requires explicit confirmation. Set confirm=true in query parameters."
        )
    
    # Find the user
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"User with ID {user_id} not found")
    
    # Store user info for logging
    user_handle = user.handle or f"user_{user_id}"
    
    try:
        # Delete the user - cascade will handle tokens and predictions
        # Due to cascade="all, delete-orphan" in the relationships,
        # deleting the user will automatically delete:
        # - All XToken records
        # - All Prediction records
        db.delete(user)
        db.commit()
        
        print(f"✅ Account deleted successfully: user_id={user_id}, handle={user_handle}")
        
        return {
            "success": True,
            "message": f"Account {user_id} and all associated data have been deleted",
            "deleted_user_id": user_id,
            "deleted_at": datetime.utcnow().isoformat(),
            "deleted_data": {
                "user_account": True,
                "oauth_tokens": True,
                "predictions": True,
                "analytics": True
            }
        }
    except Exception as e:
        db.rollback()
        print(f"❌ Error deleting account {user_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting account: {str(e)}"
        )
