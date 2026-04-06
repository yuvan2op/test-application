import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 2,
  duration: '30s',
};

const BASE_URL = 'http://172.17.118.152';  // replace with your k3s node IP

export default function () {
  // test frontend
  const frontend = http.get(`${BASE_URL}/`);
  check(frontend, {
    'frontend status 200': (r) => r.status === 200,
    'frontend fast':       (r) => r.timings.duration < 500,
  });

  // test backend health
  const backend = http.get(`${BASE_URL}/api/health`);
  check(backend, {
    'backend status 200': (r) => r.status === 200,
    'backend fast':       (r) => r.timings.duration < 300,
  });

  sleep(1);
}
