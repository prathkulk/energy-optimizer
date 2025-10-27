# Energy Optimizer

A full-stack application for energy optimization, featuring a FastAPI backend and Next.js frontend.

## Features

- **Backend**: FastAPI-based REST API for energy optimization
- **Frontend**: Modern React/Next.js user interface
- **Optimization**: Power system optimization using PuLP
- **Data Integration**: ENTSO-E API integration for energy data

## Prerequisites

- Python 3.9+
- Node.js 18+
- PostgreSQL (for database)
- ENTSO-E API key (for energy data)

## Getting Started

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file in the backend directory with the following variables:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/energy_optimizer
   ENTSOE_API_KEY=your_entsoe_api_key
   ```

5. Initialize the database:
   ```bash
   python init_db.py
   ```

6. Run the backend server:
   ```bash
   uvicorn app.main:app --reload
   ```
   The API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the frontend directory:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:3000`

## Project Structure

```
preisenergie/
├── backend/               # FastAPI backend
│   ├── app/              # Application code
│   │   ├── api/          # API routes
│   │   ├── models/       # Database models
│   │   └── services/     # Business logic
│   ├── alembic.ini       # Database migration config
│   └── requirements.txt  # Python dependencies
├── frontend/             # Next.js frontend
│   ├── app/              # Next.js app directory
│   ├── components/       # React components
│   └── lib/              # Utility functions
└── data/                 # Data files
```

## API Documentation

Once the backend is running, you can access the interactive API documentation at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Environment Variables

### Backend
- `DATABASE_URL`: PostgreSQL connection string
- `ENTSOE_API_KEY`: API key for ENTSO-E data
- `ENVIRONMENT`: Environment (development/production)
- `SECRET_KEY`: Secret key for JWT token generation

### Frontend
- `NEXT_PUBLIC_API_URL`: URL of the backend API

## Development

### Running Tests

#### Backend Tests
```bash
cd backend
pytest
```

#### Frontend Tests
```bash
cd frontend
npm test
```

### Code Formatting

#### Backend
```bash
cd backend
black .
isort .
```

#### Frontend
```bash
cd frontend
npm run format
```

## Deployment

### Backend
Deploy the FastAPI application using a production ASGI server like Uvicorn with Gunicorn:

```bash
gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app
```

### Frontend
Build and export the Next.js application:

```bash
cd frontend
npm run build
npm run export
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/)
- [Next.js](https://nextjs.org/)
- [PuLP](https://www.coin-or.org/PuLP/)
- [ENTSO-E](https://transparency.entsoe.eu/)

## Support

For support, please open an issue in the repository.
