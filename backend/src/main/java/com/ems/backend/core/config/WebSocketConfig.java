package com.ems.backend.core.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Prefix for subscriptions (client receives messages from these topics)
        config.enableSimpleBroker("/topic");
        // Prefix for messages sent from client to server
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry){
        // Endpoint for WebSocket with SockJS fallback
        registry.addEndpoint("/ws")
            .setAllowedOriginPatterns("*")  // ✅ Ou configurar via application.properties
            .withSockJS();
    }
}
