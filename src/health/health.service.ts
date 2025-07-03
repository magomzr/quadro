import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  getHealth() {
    return { ok: true };
  }
}
