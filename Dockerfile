# Use the official Node.js base image
FROM mcr.microsoft.com/playwright:v1.43.1-jammy

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the app code
COPY . .

# (Optional) Set environment variables
ENV NODE_ENV=production

# Run your script (replace script.js with your entry point)
CMD ["node", "beehiiv.spec.js"]
