import http from 'k6/http';
import { sleep } from 'k6';

export default function () {
  http.get('http://backend-service:3000/api/health/');
  sleep(1);
}
