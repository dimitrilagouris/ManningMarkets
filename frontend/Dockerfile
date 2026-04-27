# Use an official Node runtime as a parent image
FROM node:22-alpine

# Set the working directory
WORKDIR /app

# Copy package metadata
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the frontend code
COPY . .

# Expose the standard React development port
EXPOSE 3000

# Start the development server
CMD ["npm", "start"]