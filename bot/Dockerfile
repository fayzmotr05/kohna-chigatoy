FROM node:20-slim

# Runtime libs Blender headless needs + tools to install it
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        wget xz-utils ca-certificates \
        libxrender1 libxxf86vm1 libxfixes3 libxi6 libxkbcommon0 libsm6 \
        libgl1 libegl1 libglu1-mesa libgomp1 libxcb1 libx11-6 libxext6 \
    && rm -rf /var/lib/apt/lists/*

# Blender 4.2 LTS — reliable USDZ→GLB conversion via headless Python script
RUN wget -q -O /tmp/blender.tar.xz \
        https://download.blender.org/release/Blender4.2/blender-4.2.3-linux-x64.tar.xz && \
    mkdir -p /opt/blender && \
    tar -xf /tmp/blender.tar.xz -C /opt/blender --strip-components=1 && \
    rm /tmp/blender.tar.xz && \
    ln -s /opt/blender/blender /usr/local/bin/blender && \
    blender --version

# gltf-transform for GLB optimization/compression
RUN npm install -g @gltf-transform/cli

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

CMD ["npm", "start"]
