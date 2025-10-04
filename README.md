# Space Hackathon Project

A prototype cargo management system for the International Space Station.

It automates stowage operations—optimizing placement, retrieval, rearrangement, waste disposal, and cargo return—while logging all actions.

The system models cuboidal storage containers, uses algorithms to minimize retrieval steps, and handles priorities, expiry dates, and space constraints.

A [3D visualizer](https://k26rahul.github.io/Space-Hackathon/3d-visualizer/) built with Three.js is included to show the packing algorithm’s efficiency, visualizing the positions of items inside a fixed-size container.

Planned to include a RESTful API (on port 8000), Dockerized (Ubuntu 22.04 base), and a UI with time simulation for mission planning.

> **Note:** This project is incomplete—we’ve only implemented the placement and retrieval algorithm and a 3D visualizer. The hackathon is over, and no further work is being done.

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

The application will be available at [http://localhost:8000](http://localhost:8000)

> **Warning:** The backend is not implemented and most features may not work. Only the placement and retrieval algorithm and the 3D visualizer are partially functional, as the project was completed in a hurry.
