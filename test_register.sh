#!/bin/bash
kill -9 $(lsof -t -i:8080) || true
./mvnw clean spring-boot:run > app.log 2>&1 &
APP_PID=$!
sleep 20
curl -v -X POST http://localhost:8080/auth/register \
-H "Content-Type: application/json" \
-d '{
  "name": "Test User",
  "email": "test5@test.com",
  "password": "password",
  "role": "FARMER",
  "phoneNumber": "1234567890",
  "address": {
    "addressLine": "123 Main St",
    "district": "Test District",
    "state": "Test State",
    "pinCode": "123456"
  }
}' > curl.log 2>&1
kill -9 $APP_PID
cat curl.log
echo "--- APP LOG ---"
tail -n 50 app.log
