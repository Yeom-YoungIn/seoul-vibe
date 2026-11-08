import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OrmModule } from '@app/common';
import { AuthModule } from './auth/auth.module';
import { ContentModule } from './content/content.module';
import { PostModule } from './post/post.module';
import { UserModule } from './user/user.module';
import { UploadModule } from './upload/upload.module';
import { SeoModule } from './seo/seo.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'local'}`,
    }),
    OrmModule,
    AuthModule,
    ContentModule,
    PostModule,
    UserModule,
    UploadModule,
    SeoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
