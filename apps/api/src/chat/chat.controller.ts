import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { sendMessageSchema, startConversationSchema, type SendMessageInput, type StartConversationInput } from '@shareride/validation'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import type { AuthenticatedUser } from '../auth/types/authenticated-user'
import { ZodValidationPipe } from '../common/validation/zod-validation.pipe'
import { ChatService } from './chat.service'

@ApiTags('chat')
@ApiBearerAuth()
@Controller('conversations')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Post()
  start(@Body(new ZodValidationPipe(startConversationSchema)) body: StartConversationInput, @CurrentUser() user: AuthenticatedUser) {
    return this.chat.start(user.id, body.otherUserId)
  }

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.chat.list(user.id)
  }

  @Get(':id/messages')
  listMessages(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.chat.listMessages(id, user.id)
  }

  @Post(':id/messages')
  sendMessage(@Param('id') id: string, @Body(new ZodValidationPipe(sendMessageSchema)) body: SendMessageInput, @CurrentUser() user: AuthenticatedUser) {
    return this.chat.sendMessage(id, user.id, body)
  }

  @Post(':id/read')
  markRead(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.chat.markRead(id, user.id)
  }
}
