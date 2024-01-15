import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LogInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    /**
     * 요청이 들어올 때 req 요청이 들어온 타임스탬프를 찍는다.
     * [req] {요청 path} {요청 시간}
     *
     * 요청이 끝날 때 (응답이 나갈때) 다시 타임스탬프를 찍는다.
     * [res] {요청 path} {응답 시간} {얼마나 걸렸는지 ms}
     */
    const now = new Date();
    const req = context.switchToHttp().getRequest();

    // /posts
    // /common/image
    const path = req.originalUrl;

    console.log(`[REQ] ${path} ${now.toLocaleString('kr')}`);

    // return next.handle()을 실행하는 순간
    // 라우터의 로직이 전부 실행되고 응답이 반환됨.
    // observable로
    return next.handle().pipe(
      //   tap((observable) => console.log(observable)),
      //   map((observable) => {
      //     return {
      //       message: '응답이 변경 되었습니다.',
      //       response: observable,
      //     };
      //   }),
      //   tap((observable) => console.log(observable)),
      tap(() =>
        console.log(
          `[RES] ${path} ${new Date().toLocaleDateString('kr')} ${
            new Date().getMilliseconds() - now.getMilliseconds()
          }ms`,
        ),
      ),
    );
  }
}
