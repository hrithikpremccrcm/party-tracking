# Use official Java image
FROM eclipse-temurin:21-jdk-alpine

# Set working directory
WORKDIR /app

# Copy pom and source
COPY . .

# Build application
RUN ./mvnw clean package -DskipTests

# Expose port
EXPOSE 8080

# Run app
CMD ["java", "-jar", "target/party-tracker-1.0.0.jar"]