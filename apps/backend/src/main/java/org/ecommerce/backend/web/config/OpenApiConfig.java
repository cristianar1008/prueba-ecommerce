package org.ecommerce.backend.web.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("E-commerce API - Sistema de Descuentos Acumulativos")
                        .description("Motor de checkout con descuentos en cascada (categoria, volumen, cupon) y tope del 35%")
                        .version("v1.0"));
    }
}