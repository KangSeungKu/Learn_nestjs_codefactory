import {
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { AccessTokenGuard } from 'src/auth/guard/bearer-token.guard';
import { UserModel } from 'src/users/entities/users.entity';
import { User } from 'src/users/decorator/user.decorator';
import { CreatePostDto } from './dto/createPost.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PaginatePostDto } from './dto/paginate-post.dto';
import { ImageModelType } from 'src/common/entities/image.entity';
import { DataSource } from 'typeorm';
import { PostsImagesService } from './image/service/images.service';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly postsImagesService: PostsImagesService,
    private readonly dataSource: DataSource,
  ) {}

  @Get()
  getPosts(@Query() query: PaginatePostDto) {
    return this.postsService.paginatePosts(query);
  }

  @Post('random')
  @UseGuards(AccessTokenGuard)
  async postPostRandom(@User() user: UserModel) {
    await this.postsService.generatePosts(user.id);

    return true;
  }

  @Get(':id')
  getPost(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.getPostById(id);
  }

  @Post()
  @UseGuards(AccessTokenGuard)
  async postPost(
    @User() user: UserModel,
    @Body() data: CreatePostDto,
    // @Body('title') title: string,
    // @Body('content') content: string,
  ) {
    // 트랜젝션과 관련된 모든 쿼리를 담당할 '쿼리 러너'를 생성
    const qr = this.dataSource.createQueryRunner();

    // 쿼리 러너 연결
    await qr.connect();

    // 쿼리러너에서 트랜젝션을 시작
    // 이 시점부터 같은 쿼리 러너를 사용하면
    // 트랜젝션 안에서 데이터베이스 액션을 실행할 수 있다.
    await qr.startTransaction();

    // 로직 실행

    try {
      const post = await this.postsService.createPost(user.id, data, qr);

      // throw new InternalServerErrorException("에러가 발생했습니다!!!");

      for (let i = 0; i < data.images.length; i++) {
        await this.postsImagesService.createPostImage(
          {
            post,
            order: i,
            path: data.images[i],
            type: ImageModelType.POST_IMAGE,
          },
          qr,
        );
      }

      await qr.commitTransaction();
      await qr.release();

      return this.postsService.getPostById(post.id);
    } catch (e) {
      // 어떤 에러든 에러가 던져지면
      // 트랜젝션을 종료하고 원래 상태로 되돌린다.
      await qr.rollbackTransaction();
      await qr.release();
      throw new InternalServerErrorException('에러가 발생했습니다!!!');
    }
  }

  @Patch(':id')
  @UseGuards(AccessTokenGuard)
  patchPost(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdatePostDto,
    // @Body('title') title?: string,
    // @Body('content') content?: string,
  ) {
    return this.postsService.updatePost(id, data);
  }

  @Delete(':id')
  deletePost(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.deletePost(id);
  }
}
