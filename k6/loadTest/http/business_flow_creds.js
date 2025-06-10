import { check, group } from "k6";
import { SharedArray } from "k6/data";
import http from "k6/http";
const BASEURL = __ENV.BASEURL || "http://localhost:3000";

const credentials = new SharedArray("credentials", function () {
  return JSON.parse(open('./credentials.json')); // Relative path to your JSON
});

// Function to generate a UUIDv7
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

// Array of test credentials
// const credentials = [
//   {
//     email: "ayushk+1@geekyants.com",
//     otp: "111111",
//     businessId: "da8b85b4-c59d-4de3-a52c-f1aa788d03cc",
//   },
//   {
//     email: "ayushk+2@geekyants.com",
//     otp: "222222",
//     businessId: "9b0f677d-970c-4d8f-84cc-885a76f12cb7",
//   },
//   {
//     email: "ayushk+3@geekyants.com",
//     otp: "333333",
//     businessId: "614272bb-3eb6-479b-805e-c85a876c0832",
//   },
//   {
//     email: "ayushk+4@geekyants.com",
//     otp: "444444",
//     businessId: "44d40e2d-f13a-4a15-9e00-7c4aaeb9e33a",
//   },
//   {
//     email: "ayushk+5@geekyants.com",
//     otp: "555555",
//     businessId: "cc8b84b9-6635-4bca-ac9e-e94d22f7559b",
//   },
// ];

// Store test results for later reporting
let results = [];

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
    "group_duration{group:::SendEmail OTP API}": ["p(95)<5000"], // Main page group duration
    "group_duration{group:::Verify Email OTP API}": ["p(95)<5000"], // Assets group duration
    "group_duration{group:::Business Stats API}": ["p(95)<5000"],
  },
};

export default function () {
  const index = (__VU - 1) % credentials.length;
  const credential = credentials[index];
  const deviceId = generateUUIDv7();

  console.log(`Running test for: ${credential.email}`);

  let accessToken = null;
  let testStatus = "Failed";

  const params = {
    headers: {
      "Content-Type": "application/json",
      "device-id": deviceId,
      Accept: "application/json",
    },
  };

  
  // group("SendEmail OTP API", () => {
  //   const body = JSON.stringify({ email: credential.email });

  //   let res1 = http.post(`${BASEURL}/v2/auth/send-email-otp`, body, params);
  //   check(res1, { "OTP Request Success": (r) => r.status === 201 });
  // });
  group("Verify Email OTP API", () => {
    const body2 = JSON.stringify({ otp: credential.otp, isBusinessInvite: false });

    let res2 = http.post(`${BASEURL}/v2/auth/verify-email-otp`, body2, params);

    if (check(res2, { "Login Success": (r) => r.status === 200 })) {
      accessToken = res2.json().data.access_token;
      console.log(`Access Token for ${credential.email}: ${accessToken}`);
    } else {
      console.log(`Login failed for ${credential.email}`);
      results.push({ email: credential.email, status: "Login Failed" });
      return; // Stop execution for this VU if login fails
    }
  });

  if (accessToken) {
    group("Business Stats API", () => {
      const params2 = {
        headers: {
          "Content-Type": "application/json",
          "device-id": deviceId,
          Authorization: `Bearer ${accessToken}`,
        },
      };

      const res3 = http.get(`${BASEURL}/v2/business/${credential.businessId}/stats`, params2);

      if (check(res3, { "Business health check chart Success": (r) => r.status === 200 })) {
        console.log(`Dashboard API passed for ${credential.email}`);
        testStatus = "Success";
      } else {
        console.log(`Dashboard API failed for ${credential.email}`);
      }
    });
  }

  results.push({ email: credential.email, status: testStatus });
}

/*
runn script = k6 run business_flow_creds.js
*/
