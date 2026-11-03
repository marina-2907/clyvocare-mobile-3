FROM eclipse-temurin:25-jdk-noble AS build

WORKDIR /app
COPY . .

RUN sed -i 's/\r$//' gradlew && chmod +x gradlew && ./gradlew bootJar --no-daemon

FROM eclipse-temurin:25-jre-noble

WORKDIR /app

COPY --from=build /app/build/libs/*.jar app.jar

ENV SERVER_PORT=10000

EXPOSE 10000

CMD ["java", "-jar", "app.jar"]
