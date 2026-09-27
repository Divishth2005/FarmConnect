#!/bin/bash
echo "server.port=8081" > application-test.properties
./mvnw spring-boot:run -Dspring-boot.run.arguments="--spring.config.location=classpath:/,file:./application-test.properties" > app3.log 2>&1 &
APP_PID=$!
sleep 20
curl -v -X POST http://localhost:8081/auth/register \
-H "Content-Type: application/json" \
-d '{
  "name": "Test User",
  "email": "test9@test.com",
  "password": "password",
  "role": "FARMER",
  "phoneNumber": "1234567890",
  "address": {
    "addressLine": "123 Main St",
    "district": "Test District",
    "state": "Test State",
    "pinCode": "123456"
  },
  "panNo": "ABCDE1234F",
  "aadhaarNo": "123456789012"
}' > curl3.log 2>&1
kill -9 $APP_PID
echo "--- CURL ---"
cat curl3.log
echo "--- APP LOG ---"
tail -n 30 app3.log
