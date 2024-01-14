import { DEFAULT_POST_FIND_OPTIONS } from './const/default-post-find-options.const';
import { CommonService } from './../common/common.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FindOptionsWhere,
  LessThan,
  MoreThan,
  QueryRunner,
  Repository,
} from 'typeorm';
import { PostModel } from './entities/posts.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreatePostDto } from './dto/createPost.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PaginatePostDto } from './dto/paginate-post.dto';
import { ConfigService } from '@nestjs/config';
import { ENV_HOST, ENV_PROTOCOL } from 'src/common/const/env-keys.const';
import { POST_IMAGE_PATH, TEMP_FOLDER_PATH } from 'src/common/const/path.const';
import { promises } from 'fs';
import { basename, join } from 'path';
import { CreatePostImageDto } from './image/dto/create-image.dto';
import { ImageModel } from 'src/common/entities/image.entity';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(PostModel)
    private readonly postsRepository: Repository<PostModel>,
    @InjectRepository(ImageModel)
    private readonly imageRepository: Repository<ImageModel>,
    private readonly commonService: CommonService,
    private readonly configService: ConfigService,
  ) {}

  async getAllPosts() {
    return this.postsRepository.find({
      ...DEFAULT_POST_FIND_OPTIONS,
    });
  }

  async paginatePosts(dto: PaginatePostDto) {
    return this.commonService.paginate(
      dto,
      this.postsRepository,
      {
        ...DEFAULT_POST_FIND_OPTIONS,
      },
      'posts',
    );
    // if (dto.page) {
    //   return this.pagePaginatePosts(dto);
    // } else {
    //   return this.cursorPaginatePosts(dto);
    // }
  }

  async pagePaginatePosts(dto: PaginatePostDto) {
    const [posts, count] = await this.postsRepository.findAndCount({
      skip: dto.take * (dto.page - 1),
      take: dto.take,
      order: {
        createdAt: dto.order__createdAt,
      },
    });

    return {
      data: posts,
      total: count,
    };
  }

  // 1) 오름차 순으로 정렬하는 pagination만 구현
  async cursorPaginatePosts(dto: PaginatePostDto) {
    const where: FindOptionsWhere<PostModel> = {};

    if (dto.where__id__less_than) {
      where.id = LessThan(dto.where__id__less_than);
    } else if (dto.where__id__more_than) {
      where.id = MoreThan(dto.where__id__more_than);
    }

    const posts = await this.postsRepository.find({
      where,
      order: {
        createdAt: dto.order__createdAt,
      },
      take: dto.take,
    });

    /**
     * 해당되는 포스트가 0개 이상이면
     * 마지막 포스트를 가져오고
     * 아니면 null을 반환한다.
     *
     * 결과의 수와 take의 값이 같지 않으면 더이상 불러올 데이터가 없는 것으로 간주하고
     * 다음 URL 및 cursor값을 생성하지 않도록 수정
     */
    const lastItem =
      posts.length > 0 && posts.length === dto.take
        ? posts[posts.length - 1]
        : null;

    const nextUrl =
      lastItem &&
      new URL(
        `${this.configService.get<string>(
          ENV_PROTOCOL,
        )}://${this.configService.get<string>(ENV_HOST)}/posts`,
      );

    if (nextUrl) {
      /**
       * dto의 키값들을 루핑하면서
       * 키값에 해당되는 value가 존재하면
       * param에 그대로 붙여넣는다.'
       *
       * 단, where__id_more_than 값만 lastItem의 마지막 값으로 넣어준다.
       */
      for (const key of Object.keys(dto)) {
        if (dto[key]) {
          if (
            key !== 'where__id__more_than' &&
            key !== 'where__id__less_than'
          ) {
            nextUrl.searchParams.append(key, dto[key]);
          }
        }
      }

      nextUrl.searchParams.append(
        dto.order__createdAt === 'ASC'
          ? 'where__id__more_than'
          : 'where__id__less_than',
        lastItem.id.toString(),
      );
    }

    /**
     * Response
     *
     * data: Data[],
     * cursor: {
     *  after: 마지막 Data의 ID
     * },
     * count: 응답한 데이터의 갯수
     * next: 다음 요청을 할 때 사용할 URL
     */
    return {
      data: posts,
      cursor: { after: lastItem?.id ?? null },
      count: posts.length,
      next: nextUrl?.toString() ?? null,
    };
  }

  async generatePosts(userId: number) {
    for (let i = 0; i < 100; i++) {
      await this.createPost(userId, {
        title: `임의로 생성된 포스트 제목 ${i}`,
        content: `임의로 생성된 포스트 내용 ${i}`,
        images: [],
      });
    }
  }

  async getPostById(id: number) {
    const post = await this.postsRepository.findOne({
      ...DEFAULT_POST_FIND_OPTIONS,
      where: {
        id,
      },
    });

    if (!post) {
      throw new NotFoundException();
    }

    return post;
  }

  getRepository(qr?: QueryRunner) {
    return qr
      ? qr.manager.getRepository<PostModel>(PostModel)
      : this.postsRepository;
  }

  async createPost(authorId: number, data: CreatePostDto, qr?: QueryRunner) {
    const repository = this.getRepository(qr);

    const post = repository.create({
      author: {
        id: authorId,
      },
      ...data,
      images: [],
      likeCount: 0,
      commentCount: 0,
    });

    const newPost = await repository.save(post);

    return newPost;
  }

  async updatePost(postId: number, data: UpdatePostDto) {
    const { title, content } = data;
    const post = await this.postsRepository.findOne({ where: { id: postId } });

    if (!post) {
      throw new NotFoundException();
    }

    if (title) {
      post.title = title;
    }

    if (content) {
      post.content = content;
    }

    const newPost = await this.postsRepository.save(post);

    return newPost;
  }

  async deletePost(postId: number) {
    const post = await this.postsRepository.findOne({ where: { id: postId } });

    if (!post) {
      throw new NotFoundException();
    }

    await this.postsRepository.delete(postId);

    return postId;
  }
}
