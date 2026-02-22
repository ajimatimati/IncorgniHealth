FROM node:22-bullseye

# Set up working directories
WORKDIR /app

# Copy the entire backend
COPY . /app

# The backend dependencies are in the server/ directory
WORKDIR /app/server
RUN npm install

# Generate Prisma client and Push the schema to the Database
# Note: Since this requires the DATABASE_URL to be present during build (depending on schema),
# it's usually better to run Prisma commands in the start script if the DATABASE_URL is only available at runtime.
# However, Hugging Face Spaces gives secrets at build time as well if configured correctly.
# To be perfectly safe, we'll run prisma commands on container start.

# Expose huggingface default port
EXPOSE 7860

# Give permissions to the standard huggingface user
RUN useradd -m -u 1000 user
RUN chown -R user:user /app
USER user

# Start the application. We use npx prisma db push here to ensure the latest 
# Supabase tables are created, then start the Node.js server.
CMD npx prisma generate && npx prisma db push && node index.js
