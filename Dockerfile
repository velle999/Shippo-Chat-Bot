# Base image
FROM node:20

# Install Ollama dependencies
RUN apt-get update && apt-get install -y curl gnupg

# Set working directory
WORKDIR /app

# Copy app files
COPY . .

# Install dependencies
RUN npm install

# Ollama must run externally — don’t pull inside Docker!
# EXPOSE for GUI
EXPOSE 3000

CMD ["npm", "start"]
