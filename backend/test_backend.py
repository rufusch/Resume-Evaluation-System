import os
import io
import sys

# Ensure backend can be imported
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from backend.main import app
from backend.database import init_db

def test_full_pipeline():
    init_db()
    client = TestClient(app)
    
    print("--- 1. Testing Health Endpoint ---")
    res = client.get("/api/health")
    assert res.status_code == 200, res.text
    print("Health check OK:", res.json())

    print("\n--- 2. Testing User Signup ---")
    user1_email = f"user1_{os.urandom(4).hex()}@example.com"
    signup_payload = {
        "name": "Sarah Jenkins",
        "email": user1_email,
        "password": "Password123!"
    }
    res = client.post("/api/auth/signup", json=signup_payload)
    assert res.status_code == 200, res.text
    user1_data = res.json()
    token1 = user1_data["access_token"]
    user1_id = user1_data["user"]["id"]
    print("User 1 registered:", user1_id, user1_email)

    print("\n--- 3. Testing User Login ---")
    login_payload = {
        "email": user1_email,
        "password": "Password123!"
    }
    res = client.post("/api/auth/login", json=login_payload)
    assert res.status_code == 200, res.text
    print("User 1 login successful")

    print("\n--- 4. Testing Protected /me Route ---")
    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token1}"})
    assert res.status_code == 200
    assert res.json()["user"]["name"] == "Sarah Jenkins"
    print("User 1 /me OK")

    print("\n--- 5. Testing Resume Upload & Analysis ---")
    sample_resume = """
    Sarah Jenkins
    sarah.jenkins@example.com | (555) 234-5678 | San Francisco, CA

    SUMMARY
    Senior Software Engineer with 5+ years building scalable distributed backends and high-performance APIs.

    SKILLS
    Python, FastAPI, SQL, PostgreSQL, Docker, Redis, Git, Linux, System Design, REST APIs, Microservices

    EXPERIENCE
    Senior Backend Engineer | Apex Cloud Systems
    2021 - Present
    - Designed and implemented FastAPI microservices handling 25M daily requests with sub-50ms latency.
    - Optimized PostgreSQL query pipelines and Redis caching layers, cutting database compute costs by 35%.
    - Containerized application services using Docker and configured CI/CD automated deployments.

    Software Engineer | DataFlow Dynamics
    2019 - 2021
    - Developed backend business logic in Python and SQL for analytics streaming platforms.
    - Collaborated with frontend teams to define robust REST API contracts.

    PROJECTS
    Distributed Rate Limiter
    Technologies: Python, Redis, Docker
    Role: Lead Architect
    Problem: Prevent cascading API degradation during high-concurrency spikes.
    Solution: Built token-bucket rate limiter with Redis in-memory atomic decrement transactions.
    Outcome: Successfully mitigated peak loads of 40,000 req/sec with zero service downtime.

    EDUCATION
    B.S. in Computer Science | University of California, Berkeley (2019)
    """

    sample_jd = """
    Position: Senior Backend Engineer
    Company: NexaTech Global

    Requirements:
    - 4+ years of professional software engineering experience.
    - Strong proficiency in Python and modern frameworks (FastAPI or Django).
    - Deep knowledge of SQL and relational databases (PostgreSQL preferred).
    - Hands-on experience with Docker containerization and Microservices architecture.
    - Solid understanding of System Design and Redis caching.

    Preferred Qualifications:
    - Experience with AWS cloud infrastructure (EC2, S3, ECS).
    - Knowledge of Kubernetes and automated CI/CD pipelines.
    """

    files = {
        "resume_file": ("Sarah_Jenkins_Resume.txt", sample_resume.encode("utf-8"), "text/plain")
    }
    data = {
        "jd_text": sample_jd
    }

    res = client.post(
        "/api/analyses/upload",
        files=files,
        data=data,
        headers={"Authorization": f"Bearer {token1}"}
    )
    assert res.status_code == 200, res.text
    analysis_resp = res.json()
    analysis_id = analysis_resp["analysis_id"]
    print("Analysis created:", analysis_id)
    print("Assessment:", analysis_resp["assessment"])
    print("Required Coverage:", analysis_resp["required_coverage"], "%")
    print("Preferred Coverage:", analysis_resp["preferred_coverage"], "%")

    print("\n--- 6. Testing Analysis Status ---")
    res = client.get(f"/api/analyses/{analysis_id}/status", headers={"Authorization": f"Bearer {token1}"})
    assert res.status_code == 200
    assert len(res.json()["steps"]) == 6
    print("Status steps verified OK")

    print("\n--- 7. Testing Analysis Detail Retrieval ---")
    res = client.get(f"/api/analyses/{analysis_id}", headers={"Authorization": f"Bearer {token1}"})
    assert res.status_code == 200
    detail = res.json()
    assert detail["job_title"] == "Senior Backend Engineer"
    assert detail["company"] == "NexaTech Global"
    assert len(detail["requirements"]) > 0
    assert len(detail["radar_data"]) >= 5
    assert len(detail["interview_questions"]) >= 5
    print("Analysis detail verified. Requirements count:", len(detail["requirements"]))

    print("\n--- 8. Testing User Ownership Isolation (Security Check) ---")
    # Register User 2
    user2_email = f"user2_{os.urandom(4).hex()}@example.com"
    res = client.post("/api/auth/signup", json={"name": "Bob Smith", "email": user2_email, "password": "Password123!"})
    token2 = res.json()["access_token"]
    
    # User 2 tries to view User 1's analysis -> must be 403 Forbidden!
    res = client.get(f"/api/analyses/{analysis_id}", headers={"Authorization": f"Bearer {token2}"})
    assert res.status_code == 403, f"Expected 403 Forbidden, got {res.status_code}"
    print("Security check passed: User 2 is rejected with 403 Forbidden when accessing User 1's analysis.")

    print("\n--- 9. Testing Interview Answer Submission (Text & Speech) ---")
    ans_payload = {
        "question_id": 1,
        "answer_text": "In Apex Cloud Systems, I designed the microservices with FastAPI and PostgreSQL using an asynchronous repository pattern. We cached hot entities in Redis with a 5-minute TTL, resolving read degradation. We evaluated asynchronous workers versus blocking synchronous calls to maintain sub-50ms latency.",
        "speech_metrics": {
            "wpm": 135,
            "filler_count": 1,
            "duration_sec": 42
        }
    }
    res = client.post(
        f"/api/analyses/{analysis_id}/interview/answer",
        json=ans_payload,
        headers={"Authorization": f"Bearer {token1}"}
    )
    assert res.status_code == 200, res.text
    ans_eval = res.json()["evaluation"]
    print("Interview answer evaluated:", ans_eval["relevance"])
    print("Technical Depth:", ans_eval["technical_depth"])
    print("Speech Delivery Feedback:", ans_eval["speech_feedback"])

    print("\n--- 10. Testing Interview Summary ---")
    res = client.get(f"/api/analyses/{analysis_id}/interview/summary", headers={"Authorization": f"Bearer {token1}"})
    assert res.status_code == 200
    summary = res.json()
    assert summary["questions_attempted"] == 1
    print("Interview summary retrieved OK")

    print("\n--- 11. Testing What-If Simulator ---")
    what_if_payload = {
        "new_skill": "AWS",
        "new_certification": "AWS Certified Solutions Architect"
    }
    res = client.post(
        f"/api/analyses/{analysis_id}/what-if",
        json=what_if_payload,
        headers={"Authorization": f"Bearer {token1}"}
    )
    assert res.status_code == 200, res.text
    sim = res.json()
    print("What-If simulation result:")
    print("Current Coverage:", sim["current_required_coverage"], "% -> Simulated Coverage:", sim["simulated_required_coverage"], "%")
    print("Status Changes:", sim["status_changes"])

    print("\n--- 12. Testing My Analyses Listing ---")
    res = client.get("/api/analyses", headers={"Authorization": f"Bearer {token1}"})
    assert res.status_code == 200
    analyses = res.json()["analyses"]
    assert len(analyses) == 1
    print("My Analyses list contains 1 analysis for User 1")

    # User 2 list should be empty
    res = client.get("/api/analyses", headers={"Authorization": f"Bearer {token2}"})
    assert res.status_code == 200
    assert len(res.json()["analyses"]) == 0
    print("User 2 analyses list is empty as expected")

    print("\n--- 13. Testing Analysis Deletion ---")
    # User 2 attempts to delete User 1's analysis -> 403
    res = client.delete(f"/api/analyses/{analysis_id}", headers={"Authorization": f"Bearer {token2}"})
    assert res.status_code == 403
    print("User 2 delete attempt rejected with 403 Forbidden")

    # User 1 deletes their own analysis -> 200
    res = client.delete(f"/api/analyses/{analysis_id}", headers={"Authorization": f"Bearer {token1}"})
    assert res.status_code == 200
    print("Analysis deleted by owner successfully")

    # Verify deletion
    res = client.get(f"/api/analyses/{analysis_id}", headers={"Authorization": f"Bearer {token1}"})
    assert res.status_code == 404
    print("Deleted analysis verified 404 Not Found")

    print("\nALL BACKEND AUTOMATED TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_full_pipeline()
