import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { GqlExceptionFilter } from '@nestjs/graphql';
import { ApolloError } from 'apollo-server-express';
import { QueryFailedError } from 'typeorm';

@Catch()
export class AllExceptionsFilter implements GqlExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): any {
    const isGraphql =
      !!host.getArgByIndex && typeof host.getArgByIndex === 'function';
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_SERVER_ERROR';
    let errors: string[] = [];
    const stacktrace =
      process.env.NODE_ENV !== 'production'
        ? exception instanceof Error
          ? exception.stack
          : undefined
        : undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();

      if (typeof response === 'string') {
        message = response;
      } else if (typeof response === 'object' && response !== null) {
        const errorResponse = response as Record<string, unknown>;
        message =
          typeof errorResponse.message === 'string'
            ? errorResponse.message
            : message;
        if (typeof errorResponse.statusCode === 'number') {
          status = errorResponse.statusCode;
        }
        if (typeof errorResponse.error === 'string') {
          code = errorResponse.error.replace(/\s/g, '_').toUpperCase();
        }

        if (
          Array.isArray(errorResponse.message) &&
          errorResponse.message.every((msg: any) => typeof msg === 'string')
        ) {
          errors = errorResponse.message;
          message = 'Validation Error';
          code = 'VALIDATION_ERROR';
        } else if (
          errorResponse.message &&
          typeof errorResponse.message === 'string'
        ) {
          errors = [errorResponse.message];
        }
      }
      this.logger.warn(
        `HTTP Exception Caught: Status ${status}, Message: "${message}", Code: ${code}`,
        stacktrace,
      );
    } else if (exception instanceof QueryFailedError) {
      interface DatabaseError extends Error {
        code?: string;
        detail?: string;
        message: string;
      }
      const dbError = exception as DatabaseError;
      status = HttpStatus.BAD_REQUEST;
      code = 'DATABASE_ERROR';
      if (
        dbError.code === 'SQLITE_CONSTRAINT_UNIQUE' ||
        dbError.code === '23505'
      ) {
        message = 'A unique constraint was violated.';
        code = 'UNIQUE_CONSTRAINT_VIOLATION';
        const match = dbError.detail?.match(
          /Key \((.+?)\)=\((.+?)\) already exists/,
        );
        if (match) {
          message = `Value "${match[2]}" for field "${match[1]}" already exists.`;
          errors.push(
            `Field ${match[1]} with value ${match[2]} already exists.`,
          );
        } else {
          const sqliteMatch = dbError.message?.match(
            /UNIQUE constraint failed: (.+?)\.(.+)/,
          );
          if (sqliteMatch) {
            message = `Value for field "${sqliteMatch[2]}" already exists.`;
            errors.push(`Field ${sqliteMatch[2]} already exists.`);
          }
        }
      } else {
        message = 'Database operation failed.';
        this.logger.error(
          `Database Query Failed: ${dbError.message}`,
          stacktrace,
        );
      }
    } else {
      this.logger.error(`Unhandled Exception:`, exception, stacktrace);
    }

    if (isGraphql) {
      return new ApolloError(message, code, {
        statusCode: status,
        errors: errors.length > 0 ? errors : undefined,
        stacktrace: stacktrace,
      });
    }
  }
}
