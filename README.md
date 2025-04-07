# Space Hackathon Project

## Setup & Running

### Prerequisites

- Docker Desktop installed and running
- Git (to clone the repository)

### Steps to Run

1. Clone the repository

```bash
git clone [repository-url]
cd space-hackathon
```

2. Build Docker image

```bash
docker build -t space-hackathon .
```

3. Run the container

```bash
docker run -p 8000:8000 space-hackathon
```

The application will be available at http://localhost:8000
