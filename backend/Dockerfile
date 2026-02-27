# Use Maven + JDK image to build
FROM maven:3.9.6-eclipse-temurin-21-alpine

WORKDIR /app

COPY . .

RUN mvn clean package -DskipTests

EXPOSE 8080

CMD ["java", "-jar", "target/party-tracker-1.0.0.jar"]