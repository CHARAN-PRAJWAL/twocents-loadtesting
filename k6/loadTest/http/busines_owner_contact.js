import { check, group } from "k6";
import http from "k6/http";

function generateUUIDv7() {
  const now = Date.now().toString(16).padStart(12, "0");
  const randomHex = [...Array(10)]
    .map(() =>
      Math.floor(Math.random() * 256)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("");

  return `${now.slice(0, 8)}-${now.slice(8, 12)}-7${randomHex.slice(0, 3)}-${randomHex.slice(3, 7)}-${randomHex.slice(7, 15)}`;
}

export const options = {
  discardResponseBodies: false, // Keep response bodies for debugging
  scenarios: {
    contactRequests: {
      executor: "constant-arrival-rate",
      // Test duration
      duration: "5s",
      // Number of requests per time unit
      rate: 1, // 30 requests per second
      // Define the time unit
      timeUnit: "1s",
      // Pre-allocate VUs before the test starts
      preAllocatedVUs: 1,
      // Maximum VUs that can be allocated
      maxVUs: 15,
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<5000"], // 95% of requests should be < 1000ms
    "group_duration{group:::Business Sign UP API}": ["p(95)<5000"], // Main page group duration
  },
};

export default function () {
  const deviceId = generateUUIDv7();
  console.log("Generated UUIDv7:", deviceId);
  group("Business Sign UP API", () => {
    const params = {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": "0193ddef-3c0c-704c-b070-53d62e3bb8cb", //"0193ddef-3c0c-704c-b070-53d62e3bb8cb",
        "x-referer": "user",
        "device-id": deviceId,
        Accept: "application/json",
      },
    };

    const contactBody = JSON.stringify({
      name: "Rocky Test",
      business_name: "Test Builder",
      city: "Banglore ",
      email: "prashantg@geekyants.com",
    });

    const res = http.post(`${__ENV.BASEURL}/v1/business/contact`, contactBody, params);

    //console.log('body',res.body)
    console.log(`Response Status: ${res.status}`);

    //console.log("Response Status" + res.body);

    check(res, {
      "Status code is 201": (r) => r.status === 201,
    });
  });
}
//Navigate to file folder
//Run command - k6 run -e BASEURL=http://localhost:3000  busines_owner_contact.js
