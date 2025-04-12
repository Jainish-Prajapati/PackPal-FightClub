package com.FightClub.PackPal.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.Customizer;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(Customizer.withDefaults())
                .csrf().disable()
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/auth/login", "/auth/logout", "/auth/signup").permitAll()
                        .anyRequest().authenticated()
                )
                .formLogin().disable() // since you're doing manual login via REST
                .httpBasic().disable() // not using HTTP basic auth
                .sessionManagement(session -> session
                        .maximumSessions(1)
                );

        return http.build();
    }
}
