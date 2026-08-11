import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

export const options = {
  stages: [
    { duration: '1m', target: 100 },   // ramp up
    { duration: '3m', target: 600 },   // hold
    { duration: '1m', target: 300 },   // sustain
    { duration: '1m', target: 0 },    // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests under 1000ms
    http_req_failed: ['rate<0.05'],    // less than 5% errors
  },
};

//const BASE_URL = __ENV.BASE_URL || "http://172.17.118.152";
//const BASE_URL = __ENV.BASE_URL || "http://backend-service:3000";
// For K8s: use service name http://backend-service:3000 (inside cluster)
// For local/ingress: use http://your-node-ip or http://localhost (port-forward)
const BASE_URL = __ENV.BASE_URL || "http://backend-service:3000";

function safeJsonParse(body) {
  try {
    return JSON.parse(body);
  } catch (error) {
    return null;
  }
}

// Load user credentials from shared array
const users = new SharedArray('users', function () {
  const data = [];
  for (let i = 1; i <= 1000; i++) {
    data.push({
      username: `user${i}`,
      password: `password${i}`
    });
  }
  return data;
});

export default function () {
  // Pick a random user
  const user = users[Math.floor(Math.random() * users.length)];

  // Login
  const loginPayload = JSON.stringify({
    username: user.username,
    password: user.password
  });

  const loginResponse = http.post(`${BASE_URL}/api/auth/login`, loginPayload, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const loginBody = safeJsonParse(loginResponse.body);

  check(loginResponse, {
    'login status 200': (r) => r.status === 200,
    'login returns json': (r) => loginBody !== null,
    'login has token': (r) => loginBody && loginBody.token !== undefined,
  });

  if (loginResponse.status !== 200 || !loginBody || !loginBody.token) {
    console.log(`Login failed for ${user.username}: ${loginResponse.status} ${loginResponse.body}`);
    sleep(1);
    return;
  }

  const token = loginBody.token;

  // Get user profile
  const profileResponse = http.get(`${BASE_URL}/api/auth/me`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  check(profileResponse, {
    'profile status 200': (r) => r.status === 200,
  });

  // Perform user action
  const actionPayload = JSON.stringify({
    action: 'load_test_action',
    data: { timestamp: new Date().toISOString() }
  });

  const actionResponse = http.post(`${BASE_URL}/api/user/action`, actionPayload, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  check(actionResponse, {
    'action status 200': (r) => r.status === 200,
  });

  sleep(0.5);
}