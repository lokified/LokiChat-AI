package com.loki.loki_chat.dto.request;

import jakarta.validation.constraints.NotBlank;

public record ChatRequest(
        @NotBlank(message = "Message content is required")
        String message,
        String conversationId
) {
}
