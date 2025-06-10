import http from "k6/http";
import { check, sleep, group } from "k6";
export const options = {
  thresholds: {
    http_req_duration: ["p(95)<1000"],
    "group_duration{group:::main page}": ["p(95)<1000"],
    "group_duration{group:::main page::Assets}": ["p(95)<1000"],
  },
};
export default function () {
  group("main page", () => {
    let res = http.get("https://test.k6.io/");
    check(res, { "status is 200": (r) => r.status === 200 });
    group("Assets", () => {
      http.get("https://test.k6.io/static/css/site.css");
      http.get("https://test.k6.io/static/js/prisms.js");
    });
    sleep(1);
  });
  group("News page", () => {
    http.get("https://test.k6.io/news.php");
    sleep(1);
  });
}
