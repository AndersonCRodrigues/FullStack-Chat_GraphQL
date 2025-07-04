import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const nodeEnv = configService.get<string>('NODE_ENV');
        const isProduction = nodeEnv === 'production';

        if (isProduction) {
          return {
            type: 'postgres',
            host: configService.get<string>('PG_HOST'),
            port: configService.get<number>('PG_PORT'),
            username: configService.get<string>('PG_USERNAME'),
            password: configService.get<string>('PG_PASSWORD'),
            database: configService.get<string>('PG_DATABASE'),
            entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
            synchronize: false,
            logging: false,
          };
        }

        return {
          type: 'sqlite',
          database:
            configService.get<string>('DATABASE_PATH') ||
            './data/database.sqlite',
          entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
          synchronize: true,
          logging: true,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
