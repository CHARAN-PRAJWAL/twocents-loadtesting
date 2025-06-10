import { check, group, sleep } from "k6";
import { SharedArray } from "k6/data";
import http from "k6/http";
const BASEURL = __ENV.BASEURL || "http://localhost:3000";

// Load and parse external JSON file (data.json)
const credentials = new SharedArray("credentials", function () {
  return JSON.parse(open("./credentials.json")).filter((entry) => entry.phone_number && entry.otp);
});

// Function to generate UUIDv7
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
    http_req_duration: ["p(95)<5000"], // 95% of requests should be < 5000ms
    "group_duration{group:::Anonymus login}": ["p(95)<5000"], 
    "group_duration{group:::SendPhone OTP API}": ["p(95)<5000"],
    "group_duration{group:::Verify OTP}": ["p(95)<5000"],
  },
};

export default function () {
  const index = __VU - 1;
  const credential = credentials[index]; // Assign unique credentials per vU
  const deviceId = generateUUIDv7();
  console.log(`\n==== Running test for phone number: ${credential.phone_number} ====`);

  let loginStatus = "Failed";
  let accessToken = null;

  const params = {
    headers: {
      "Content-Type": "application/json",
      "device-id": deviceId,
      Accept: "application/json",
    },
  };

  // Step 1: Anonymous Login
  group("Anonymus login API", () => {
    let res1 = http.get(`${BASEURL}/v2/auth/anonymous-login`, params);
    check(res1, { "Anonymous Login Success": (r) => r.status === 200 });

    let jsonResponse1 = res1.json();
    let anonymousAccessToken = jsonResponse1?.data?.access_token;
    console.log(`Anonymous Access Token: ${anonymousAccessToken}`);
  });
  // Step 2: Send OTP
  //group("SendPhone OTP API", () => {
  // const body1 = JSON.stringify({ phone_number: credential.phone_number });
  // let res2 = http.post(`${BASEURL}/v1/auth/sendPhoneOtp`, body1, params);
  // console.log("send otp respinse", res2.body);
  // check(res2, { "OTP Sent Successfully": (r) => r.status === 200 });

  // **Add sleep before OTP verification**
  //});
  sleep(1);
  // Step 3: Verify OTP
  group("Verify OTP API", () => {
    const body2 = JSON.stringify({
      phone_number: credential.phone_number,
      otp: credential.otp,
    });
  
    let res3 = http.post(`${BASEURL}/v2/auth/verifyPhoneOtp`, body2, params);

    if (check(res3, { "OTP Verified Successfully": (r) => r.status === 200 })) {
      let jsonResponse2 = res3.json();
      accessToken = jsonResponse2?.data?.access_token;
      console.log(`Patron Access Token for ${credential.phone_number}: ${accessToken}`);
      loginStatus = "Success";
    } else {
      console.log(`Login failed for phone number: ${credential.phone_number}`);
    }

    // Print test summary for this VU
    console.log(`Test Result: ${credential.phone_number} → ${loginStatus}`);

    sleep(1);
  });
}
/* Bypassed numbers
[
        "+919876543210", // Test number 1
        "+919876543211", // Test number 2
        "+919876543212", // Test number 3
        "+919876543213", // Test number 4
        "+919876543214", // Test number 5
      ];
  */

/* Run command - 
k6 run Anynomus_and_Phoneloginn.js
*/
