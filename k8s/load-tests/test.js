import http from 'k6/http';
import { sleep } from 'k6';

export default function () {
  http.get('http://172.17.118.152');
  sleep(1);
}
