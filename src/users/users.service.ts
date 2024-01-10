import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  async getUserByEmail(email: string) {
    return { id: 1, email, password: 'pass' };
  }
}
