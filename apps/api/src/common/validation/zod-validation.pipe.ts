import { BadRequestException, Injectable, type PipeTransform } from '@nestjs/common'
import type { ZodSchema } from 'zod'

// Bridges the Zod schemas already scaffolded in packages/validation (built
// ahead of any endpoint using them — see docs/current-architecture.md's
// note on schema-first development in this repo) into NestJS's pipe
// pipeline, so request bodies are validated against the same schema the
// mobile app's forms are built around, without redeclaring each field as a
// class-validator DTO.
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value)
    if (!result.success) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Request body failed validation',
        issues: result.error.flatten(),
      })
    }
    return result.data
  }
}
