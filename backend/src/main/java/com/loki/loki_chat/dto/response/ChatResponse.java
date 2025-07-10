package com.loki.loki_chat.dto.response;

import java.time.LocalDateTime;

public record ChatResponse(
        String conversationId,
        String title,
        String user,
        String assistant,
        LocalDateTime timestamp
) {
}
