import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 5   },  // baseline
    { duration: '10s', target: 200 },  // instant spike
    { duration: '2m',  target: 200 },  // hold spike
    { duration: '10s', target: 5   },  // instant drop
    { duration: '2m',  target: 5   },  // watch scale-down (5 min window)
  ],
};

const BASE_URL = 'http://172.17.118.152';

export default function () {
  const res = http.get(`${BASE_URL}/api/health`);
  check(res, { 'status ok': (r) => r.status === 200 });
  sleep(0.1);
}
