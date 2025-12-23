import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OrmModule } from '@app/common';
import { ConfigModule } from '@nestjs/config';
import { ContentModule } from './content/content.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'local'}`,
    }),
    OrmModule,
    ContentModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
