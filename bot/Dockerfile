FROM node:20-slim

# Install Python + dependencies for USDZ → GLB conversion and optimization
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 python3-pip python3-venv libgl1-mesa-glx libglib2.0-0 && \
    rm -rf /var/lib/apt/lists/*

RUN pip3 install --break-system-packages trimesh numpy pygltflib

# Install gltf-transform CLI for GLB optimization/compression
RUN npm install -g @gltf-transform/cli

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

CMD ["npm", "start"]
