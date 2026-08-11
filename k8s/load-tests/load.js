import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 100 },
    { duration: '1m', target: 200 },
    { duration: '1m', target: 350 },
    { duration: '1m', target: 500 },
  ],

  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = 'https://uat2-lms.axesstechnology.in/login';

export default function () {

  const responses = http.batch([
    ['GET', `${BASE_URL}/`],
    ['GET', `${BASE_URL}/`],
    ['GET', `${BASE_URL}/`],
  ]);

  check(responses[0], {
    'homepage status 200': (r) => r.status === 200,
  });

  check(responses[1], {
    'women page status 200': (r) => r.status === 200,
  });

  check(responses[2], {
    'freshers page status 200': (r) => r.status === 200,
  });

  sleep(1);
}