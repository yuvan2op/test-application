import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m',  target: 10 },   // ramp up
    { duration: '3m',  target: 50 },   // hold — HPA should fire here
    { duration: '1m',  target: 50 },   // sustain
    { duration: '1m',  target: 0  },   // ramp down — watch scale-down delay
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],   // 95% of requests under 500ms
    http_req_failed:   ['rate<0.01'],   // less than 1% errors
  },
};

const BASE_URL = 'http://172.17.118.152';

export default function () {
  const responses = http.batch([
    ['GET', `${BASE_URL}/`],
    ['GET', `${BASE_URL}/api/health`],
  ]);

  check(responses[0], { 'frontend ok': (r) => r.status === 200 });
  check(responses[1], { 'backend ok':  (r) => r.status === 200 });

  sleep(0.5);
}
