@Get(':roomId/messages')
getMessages(
  @Param('roomId', ParseUUIDPipe) roomId: string,
  @Query() query: GetMessagesQueryDto,
  @Req() req: RequestWithUser,
) {
  return this.messagesService.getMessages({
    roomId,
    userId: req.user.id,
    limit: query.limit,
    cursor: query.cursor,
  });
}