# ATC System Backend API

A Flask-based REST API for the ATC System with AI-powered conflict detection and resolution.

## Setup

1. Create and activate a virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the application:
```bash
python app.py
```

The API will be available at `http://localhost:5000`

## API Endpoints

- `GET /` - API information
- `GET /api/health` - Health check
- `GET /api/users` - Get all users
- `POST /api/users` - Create a new user
- `GET /api/services` - Get all services
- `POST /api/services` - Create a new service

## Example Usage

```bash
# Health check
curl http://localhost:5000/api/health

# Get users
curl http://localhost:5000/api/users

# Create a user
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com"}'
```
