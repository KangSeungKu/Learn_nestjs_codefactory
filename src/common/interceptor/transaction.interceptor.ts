import { DataSource } from 'typeorm';
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, catchError, tap } from 'rxjs';

@Injectable()
export class TransactionInterceptor implements NestInterceptor {
  constructor(private readonly dataSource: DataSource) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest();

    // 트랜젝션과 관련된 모든 쿼리를 담당할 '쿼리 러너'를 생성
    const qr = this.dataSource.createQueryRunner();

    // 쿼리 러너 연결
    await qr.connect();

    // 쿼리러너에서 트랜젝션을 시작
    // 이 시점부터 같은 쿼리 러너를 사용하면
    // 트랜젝션 안에서 데이터베이스 액션을 실행할 수 있다.
    await qr.startTransaction();

    req.queryRunner = qr;

    return next.handle().pipe(
      catchError(async () => {
        await qr.rollbackTransaction();
        await qr.release();
      }),
      tap(async () => {
        await qr.commitTransaction();
        await qr.release();
      }),
    );
  }
}
