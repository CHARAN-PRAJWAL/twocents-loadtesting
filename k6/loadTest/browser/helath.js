import { check, sleep } from "k6";
import http from "k6/http";

export let options = {
  vus: 10, // Number of virtual users
  iterations: 80, // Total requests (more than 60)
  duration: "10s", // Test duration (adjust as needed)
};

export default function () {
  let response = http.get("https://staging-be.mytwocents.io/v1/health");

  // Validate the response
  check(response, {
    "Response status is 200": (r) => r.status === 200,
  });

  sleep(1); // Adding a small delay to simulate real user behavior
}
