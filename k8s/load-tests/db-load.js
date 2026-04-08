import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m',  target: 100 },   // ramp up
    { duration: '3m',  target: 300 },   // hold — HPA should fire here
    { duration: '1m',  target: 600 },   // sustain
    { duration: '1m',  target: 0  },   // ramp down — watch scale-down delay
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],   // 95% of requests under 500ms
    http_req_failed:   ['rate<0.01'],   // less than 1% errors
  },
};

const BASE_URL = 'http://localhost:3456';

export default function () {
  const responses = http.batch([
    ['GET', `${BASE_URL}/users`],
  ]);

  check(responses[0], { 'users fetched': (r) => r.status === 200 && r.json().length > 0 });
  sleep(0.5);
}
