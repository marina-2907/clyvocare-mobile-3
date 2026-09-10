package com.fiap.clyvocaresc.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Configuração central da Security. Define os perfis exigidos pelo professor
 * (OWNER e VETERINARIAN, mais CLINIC_ADMIN como terceiro perfil já modelado) e
 * protege cada rota conforme quem deve poder acessá-la.
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final UserDetailsServiceImpl userDetailsService;
    private final JwtAuthenticationFilter jwtAuthFilter;

    /**
     * Algoritmo de hash de senha usado no cadastro (AuthService)
     * e na validação de login.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Liga o UserDetailsService e o PasswordEncoder
     * ao mecanismo de autenticação do Spring.
     */
    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider =
                new DaoAuthenticationProvider(userDetailsService);

        provider.setPasswordEncoder(passwordEncoder());

        return provider;
    }

    /**
     * Expõe o AuthenticationManager usado pelo AuthService.login()
     * para validar username/password.
     */
    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config
    ) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Endereços permitidos para o front-end.
        configuration.setAllowedOrigins(List.of(
                "http://localhost:5173",
                "http://localhost:19006",
                "http://localhost:8081"
        ));

        configuration.setAllowedMethods(List.of(
                "GET",
                "POST",
                "PUT",
                "PATCH",
                "DELETE",
                "OPTIONS"
        ));

        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", configuration);

        return source;
    }

    /**
     * Define a cadeia de filtros:
     * - JWT stateless
     * - regras de autorização por rota
     * - filtro JWT antes do filtro padrão do Spring
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http
                .cors(cors ->
                        cors.configurationSource(corsConfigurationSource())
                )
                .csrf(csrf ->
                        csrf.disable()
                )
                .sessionManagement(sm ->
                        sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authorizeHttpRequests(auth -> auth

                        // Cadastro e login.
                        .requestMatchers("/api/auth/**")
                        .permitAll()

                        // Cidades precisam estar disponíveis antes do login,
                        // pois são carregadas na tela de cadastro.
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/cities/**"
                        )
                        .permitAll()

                        // Consultas disponíveis apenas para usuários autenticados.
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/catalog-items/**",
                                "/api/species/**"
                        )
                        .authenticated()

                        // Catálogo.
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/catalog-items/**"
                        )
                        .hasAnyRole("VETERINARIAN", "CLINIC_ADMIN")

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/catalog-items/**"
                        )
                        .hasAnyRole("VETERINARIAN", "CLINIC_ADMIN")

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/catalog-items/**"
                        )
                        .hasAnyRole("VETERINARIAN", "CLINIC_ADMIN")

                        // Clínicas.
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/clinics/**"
                        )
                        .hasAnyRole("VETERINARIAN", "CLINIC_ADMIN")

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/clinics/**"
                        )
                        .hasAnyRole("VETERINARIAN", "CLINIC_ADMIN")

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/clinics/**"
                        )
                        .hasAnyRole("VETERINARIAN", "CLINIC_ADMIN")

                        // O tutor pode criar e cancelar o próprio agendamento.
                        // A conclusão clínica continua restrita ao profissional.
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/appointments"
                        )
                        .hasAnyRole(
                                "OWNER",
                                "VETERINARIAN",
                                "CLINIC_ADMIN"
                        )

                        .requestMatchers(
                                HttpMethod.PATCH,
                                "/api/appointments/*/cancel"
                        )
                        .hasAnyRole(
                                "OWNER",
                                "VETERINARIAN",
                                "CLINIC_ADMIN"
                        )

                        .requestMatchers(
                                HttpMethod.PATCH,
                                "/api/appointments/*/complete"
                        )
                        .hasAnyRole(
                                "VETERINARIAN",
                                "CLINIC_ADMIN"
                        )

                        // Exames.
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/exams/**"
                        )
                        .hasAnyRole(
                                "VETERINARIAN",
                                "CLINIC_ADMIN"
                        )

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/exams/**"
                        )
                        .hasAnyRole(
                                "VETERINARIAN",
                                "CLINIC_ADMIN"
                        )

                        // Tratamentos.
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/treatments/**"
                        )
                        .hasAnyRole(
                                "VETERINARIAN",
                                "CLINIC_ADMIN"
                        )

                        .requestMatchers(
                                HttpMethod.PATCH,
                                "/api/treatments/**"
                        )
                        .hasAnyRole(
                                "VETERINARIAN",
                                "CLINIC_ADMIN"
                        )

                        // Prescrições.
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/prescriptions/**"
                        )
                        .hasAnyRole(
                                "VETERINARIAN",
                                "CLINIC_ADMIN"
                        )

                        // Vacinações.
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/vaccinations/**"
                        )
                        .hasAnyRole(
                                "VETERINARIAN",
                                "CLINIC_ADMIN"
                        )

                        // Pets.
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/pets/**",
                                "/api/owners/*/pets"
                        )
                        .authenticated()

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/pets/**"
                        )
                        .hasRole("OWNER")

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/pets/**"
                        )
                        .hasRole("OWNER")

                        // Perfil do tutor.
                        .requestMatchers("/api/owners/me/**")
                        .hasRole("OWNER")

                        // Perfil veterinário.
                        .requestMatchers("/api/veterinarians/me/**")
                        .hasAnyRole(
                                "VETERINARIAN",
                                "CLINIC_ADMIN"
                        )

                        // O tutor pode confirmar uma pendência apresentada
                        // pelo aplicativo.
                        .requestMatchers(
                                HttpMethod.PATCH,
                                "/api/reminders/*/confirmed"
                        )
                        .hasAnyRole(
                                "OWNER",
                                "VETERINARIAN",
                                "CLINIC_ADMIN"
                        )

                        .requestMatchers(
                                HttpMethod.PATCH,
                                "/api/reminders/*/sent"
                        )
                        .hasAnyRole(
                                "VETERINARIAN",
                                "CLINIC_ADMIN"
                        )

                        // Qualquer outra rota exige autenticação.
                        .anyRequest()
                        .authenticated()
                )
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(
                        jwtAuthFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }
}