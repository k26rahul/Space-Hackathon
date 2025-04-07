FROM ubuntu:22.04

# Set working directory
WORKDIR /app

# Install Python and pip
RUN apt-get update && \
    apt-get install -y python3 python3-pip && \
    apt-get clean

# Copy backend requirements and install dependencies
COPY backend/requirements.txt backend/
RUN pip3 install -r backend/requirements.txt

# Copy backend application files
COPY backend/ backend/

# Create upload directory
RUN mkdir -p /tmp/uploads

# Expose port 8000
EXPOSE 8000

# Change to backend directory and run the application
WORKDIR /app/backend
CMD ["python3", "app.py"]
