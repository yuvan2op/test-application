import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m',  target: 50  },
    { duration: '2m',  target: 100 },
    { duration: '2m',  target: 200 },
    { duration: '2m',  target: 300 },  // very likely breaks here
    { duration: '1m',  target: 0   },  // recovery
  ],
  thresholds: {
    http_req_duration: ['p(99)<2000'],
    http_req_failed:   ['rate<0.05'],
  },
};

const BASE_URL = 'http://<your-node-ip>';

export default function () {
  const res = http.get(`${BASE_URL}/api/health`);
  check(res, { 'status ok': (r) => r.status === 200 });
  sleep(0.3);
}
